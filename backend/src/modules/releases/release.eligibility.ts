import mongoose from 'mongoose';
import { Fdr, IFdr } from '../../models/Fdr.model';
import { Requirement, IRequirement } from '../../models/Requirement.model';
import { Discrepancy } from '../../models/Discrepancy.model';
import { Release, IEligibilityCheckResult } from '../../models/Release.model';
import { EligibilityAssessmentResult } from './release.types';
import { DecimalUtils } from '../../utils/decimal';
import { AppError } from '../../utils/appError';

export class EligibilityAssessmentEngine {
  /**
   * Run full, multi-criteria eligibility assessment for releasing a deposit instrument.
   * Rule: Maturity alone does not automatically make an instrument eligible for release.
   */
  async assessEligibility(
    instrumentId: string,
    requestedAmount?: string,
    supportingDocuments: string[] = []
  ): Promise<EligibilityAssessmentResult> {
    const instrument = await Fdr.findOne({
      $or: [
        { fdrId: instrumentId.toUpperCase().trim() },
        ...(mongoose.Types.ObjectId.isValid(instrumentId) ? [{ _id: instrumentId }] : []),
      ],
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument '${instrumentId}' not found`);
    }

    const requirement = await Requirement.findOne({
      requirementId: instrument.requirementId.toUpperCase().trim(),
    });

    if (!requirement) {
      throw AppError.notFound(`Linked deposit requirement '${instrument.requirementId}' not found`);
    }

    const checks: IEligibilityCheckResult[] = [];
    const blockingReasons: string[] = [];
    let scorePoints = 0;
    const maxScore = 100;

    // 1. Check Instrument Status & Lifecycle
    // Must be ACTIVE or MATURED; cannot be RELEASED, CLAIMED, or CANCELLED
    const validLifecycle = ['ACTIVE', 'MATURED'].includes(instrument.lifecycleStatus);
    if (!validLifecycle) {
      checks.push({
        checkKey: 'INSTRUMENT_LIFECYCLE',
        label: 'Instrument Lifecycle Status',
        passed: false,
        severity: 'BLOCKER',
        message: `Instrument is in '${instrument.lifecycleStatus}' state. Only ACTIVE or MATURED instruments are eligible for release.`,
      });
      blockingReasons.push(`Instrument state is ${instrument.lifecycleStatus}`);
    } else {
      scorePoints += 20;
      checks.push({
        checkKey: 'INSTRUMENT_LIFECYCLE',
        label: 'Instrument Lifecycle Status',
        passed: true,
        severity: 'INFO',
        message: `Instrument is currently ${instrument.lifecycleStatus} and eligible for consideration.`,
      });
    }

    // 2. Check Previous / Active Release Requests (Prevent duplicate requests)
    const existingActiveRelease = await Release.findOne({
      instrumentId: instrument.fdrId,
      status: {
        $in: [
          'SUBMITTED',
          'UNDER_REVIEW',
          'CLARIFICATION_REQUIRED',
          'APPROVED',
          'AUTHORIZED_RELEASE',
        ],
      },
    });

    if (existingActiveRelease) {
      checks.push({
        checkKey: 'DUPLICATE_RELEASE_CHECK',
        label: 'Previous / Active Release Requests',
        passed: false,
        severity: 'BLOCKER',
        message: `Active release request #${existingActiveRelease.releaseId} (${existingActiveRelease.status}) is already in progress for this instrument.`,
      });
      blockingReasons.push(`Active release request already exists (${existingActiveRelease.releaseId})`);
    } else {
      scorePoints += 15;
      checks.push({
        checkKey: 'DUPLICATE_RELEASE_CHECK',
        label: 'Previous / Active Release Requests',
        passed: true,
        severity: 'INFO',
        message: 'No conflicting active release requests on record for this instrument.',
      });
    }

    // 3. Check Unresolved Discrepancies (Discrepancy and Legal Clearance)
    const openDiscrepancies = await Discrepancy.find({
      instrumentId: instrument.fdrId,
      status: { $in: ['OPEN', 'INVESTIGATING'] },
    });

    if (openDiscrepancies.length > 0) {
      const highOrCritical = openDiscrepancies.filter(
        (d) => d.severity === 'HIGH' || d.severity === 'CRITICAL'
      );
      const isBlocker = highOrCritical.length > 0;
      checks.push({
        checkKey: 'DISCREPANCY_CLEARANCE',
        label: 'Discrepancy & Scrutiny Clearance',
        passed: !isBlocker,
        severity: isBlocker ? 'BLOCKER' : 'WARNING',
        message: `Found ${openDiscrepancies.length} open discrepancy records against this instrument (${highOrCritical.length} High/Critical).`,
        details: openDiscrepancies.map((d) => `[${d.discrepancyId}] ${d.title}`).join('; '),
      });
      if (isBlocker) {
        blockingReasons.push(`${highOrCritical.length} unresolved high-severity discrepancies`);
      }
    } else {
      scorePoints += 15;
      checks.push({
        checkKey: 'DISCREPANCY_CLEARANCE',
        label: 'Discrepancy & Scrutiny Clearance',
        passed: true,
        severity: 'INFO',
        message: 'No active discrepancies or scrutiny flags pending against this instrument.',
      });
    }

    // 4. Requirement Status & Compliance Conditions
    // Rule: Do not assume that maturity automatically makes an instrument eligible for release.
    // Check if the overall requirement condition allows release (e.g. FULFILLED, or remaining deposit covers requirement)
    const instrumentAmount = DecimalUtils.from(instrument.depositAmount);
    const requiredAmount = DecimalUtils.from(requirement.requiredAmount);

    // Sum other verified deposits on this requirement
    const otherPledged = (requirement.pledgedInstruments || []).filter(
      (p) =>
        p.instrumentId !== instrument.fdrNumber &&
        p.instrumentId !== instrument.fdrId &&
        p.verificationStatus === 'VERIFIED'
    );

    let otherVerifiedTotal = DecimalUtils.from(0);
    for (const p of otherPledged) {
      otherVerifiedTotal = DecimalUtils.add(otherVerifiedTotal, p.amount);
    }

    const requirementFulfilled =
      requirement.requirementStatus === 'FULFILLED' ||
      requirement.complianceStatus === 'COMPLIANT' ||
      otherVerifiedTotal.gte(requiredAmount);

    if (requirementFulfilled) {
      scorePoints += 25;
      checks.push({
        checkKey: 'COMPLIANCE_COVERAGE',
        label: 'Statutory Deposit Coverage',
        passed: true,
        severity: 'INFO',
        message:
          'Requirement compliance satisfied. Remaining pledged capital or fulfilled status permits deposit discharge.',
      });
    } else {
      // Check if maturity has passed
      const now = new Date();
      const isMatured = new Date(instrument.maturityDate) <= now;

      // Notice: If requirement is not satisfied and instrument is matured, statutory replacement might be required rather than unconditional release!
      checks.push({
        checkKey: 'COMPLIANCE_COVERAGE',
        label: 'Statutory Deposit Coverage',
        passed: false,
        severity: isMatured ? 'WARNING' : 'BLOCKER',
        message: isMatured
          ? 'Instrument has matured, but deposit requirement is not yet fulfilled by replacement instruments. Release subject to statutory council sanction.'
          : 'Underlying deposit requirement is active and unfulfilled. Release without statutory replacement would cause compliance shortfall.',
      });

      if (!isMatured) {
        blockingReasons.push('Underlying deposit requirement is not fulfilled');
      } else {
        scorePoints += 10;
      }
    }

    // 5. Holding Tenure & Rule Reference Check
    const issueDate = new Date(instrument.issueDate);
    const maturityDate = new Date(instrument.maturityDate);
    const totalTenureDays = Math.ceil(
      (maturityDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const elapsedDays = Math.ceil(
      (new Date().getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (elapsedDays >= totalTenureDays || totalTenureDays <= 0) {
      scorePoints += 15;
      checks.push({
        checkKey: 'TENURE_COMPLETION',
        label: 'Statutory Holding Tenure',
        passed: true,
        severity: 'INFO',
        message: `Maturity tenure of ${totalTenureDays} days has been reached or exceeded.`,
      });
    } else {
      scorePoints += 10;
      checks.push({
        checkKey: 'TENURE_COMPLETION',
        label: 'Statutory Holding Tenure',
        passed: true,
        severity: 'INFO',
        message: `Instrument is in ${elapsedDays}th day of ${totalTenureDays} days lock-in tenure. Early release assessment applied.`,
      });
    }

    // 6. Supporting Documents Verification
    const hasDocs = supportingDocuments && supportingDocuments.length > 0;
    if (hasDocs) {
      scorePoints += 10;
      checks.push({
        checkKey: 'DOCUMENTATION_COMPLETENESS',
        label: 'Statutory Supporting Documents',
        passed: true,
        severity: 'INFO',
        message: `${supportingDocuments.length} supporting clearance document(s) attached.`,
      });
    } else {
      checks.push({
        checkKey: 'DOCUMENTATION_COMPLETENESS',
        label: 'Statutory Supporting Documents',
        passed: false,
        severity: 'WARNING',
        message: 'No supporting clearance documents attached (e.g. No-Dues Certificate, Council Discharge Letter). Required before final authorization.',
      });
    }

    const isEligible = blockingReasons.length === 0;
    const eligibilityScore = Math.min(100, Math.max(0, scorePoints));

    const maturityTime = new Date(instrument.maturityDate).getTime();
    const daysRemaining = Math.ceil((maturityTime - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
      isEligible,
      eligibilityScore,
      checks,
      blockingReasons,
      instrumentSummary: {
        fdrId: instrument.fdrId,
        fdrNumber: instrument.fdrNumber,
        bankName: instrument.bankName,
        depositAmountFormatted: DecimalUtils.formatCurrency(
          instrument.depositAmount,
          instrument.currency
        ),
        lifecycleStatus: instrument.lifecycleStatus,
        maturityDate: instrument.maturityDate.toISOString(),
        daysRemaining,
      },
      requirementSummary: {
        requirementId: requirement.requirementId,
        title: requirement.title,
        requiredAmountFormatted: DecimalUtils.formatCurrency(
          requirement.requiredAmount,
          requirement.currency
        ),
        complianceStatus: requirement.complianceStatus,
      },
    };
  }
}

export const eligibilityAssessmentEngine = new EligibilityAssessmentEngine();
