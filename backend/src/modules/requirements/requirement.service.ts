import mongoose from 'mongoose';
import BigNumber from 'bignumber.js';
import { requirementRepository, RequirementRepository } from './requirement.repository';
import { Institution } from '../../models/Institution.model';
import { DecimalUtils } from '../../utils/decimal';
import { AppError } from '../../utils/appError';
import {
  CreateRequirementInput,
  UpdateRequirementInput,
  PledgeInstrumentInput,
  VerifyInstrumentInput,
  RequirementQueryParams,
  ComplianceCalculationResult,
  InstitutionComplianceSummary,
  InstrumentComplianceBreakdownItem,
  IRequirement,
  ComplianceStatus,
} from './requirement.types';

export class RequirementService {
  constructor(private repo: RequirementRepository = requirementRepository) {}

  /**
   * Pure Financial Compliance Calculation Engine
   * Strictly uses BigNumber / DecimalUtils to avoid floating-point errors.
   */
  calculateCompliance(requirement: IRequirement): ComplianceCalculationResult {
    const requiredAmount = DecimalUtils.from(requirement.requiredAmount);
    const acceptableTypes = new Set(requirement.acceptableInstrumentTypes);
    const now = new Date();

    let totalPledged = DecimalUtils.from(0);
    let verifiedEligible = DecimalUtils.from(0);
    let verifiedIneligible = DecimalUtils.from(0);
    let pendingVerification = DecimalUtils.from(0);
    let rejectedAmount = DecimalUtils.from(0);
    let ineligibleTypeAmount = DecimalUtils.from(0);

    const breakdownItems: InstrumentComplianceBreakdownItem[] = [];

    const pledgedList = requirement.pledgedInstruments || [];

    for (const inst of pledgedList) {
      const instAmount = DecimalUtils.from(inst.amount);
      totalPledged = DecimalUtils.add(totalPledged, instAmount);

      const ineligibilityReasons: string[] = [];

      // 1. Check instrument type acceptability
      const isAcceptableType = acceptableTypes.has(inst.instrumentType);
      if (!isAcceptableType) {
        ineligibilityReasons.push(
          `Instrument type '${inst.instrumentType}' is not in acceptable types: [${Array.from(acceptableTypes).join(', ')}]`
        );
        ineligibleTypeAmount = DecimalUtils.add(ineligibleTypeAmount, instAmount);
      }

      // 2. Check maturity validity
      const maturity = new Date(inst.maturityDate);
      if (maturity.getTime() < requirement.effectiveDate.getTime()) {
        ineligibilityReasons.push(
          `Instrument maturity (${maturity.toISOString().split('T')[0]}) precedes requirement effective date (${requirement.effectiveDate.toISOString().split('T')[0]})`
        );
      }

      // 3. Check verification status
      if (inst.verificationStatus === 'REJECTED') {
        ineligibilityReasons.push(`Instrument was rejected during scrutiny: ${inst.remarks || 'No remarks'}`);
        rejectedAmount = DecimalUtils.add(rejectedAmount, instAmount);
      } else if (inst.verificationStatus === 'PENDING') {
        ineligibilityReasons.push('Instrument verification is currently pending official scrutiny');
        pendingVerification = DecimalUtils.add(pendingVerification, instAmount);
      }

      const isEligible = isAcceptableType && ineligibilityReasons.length === 0 && inst.verificationStatus === 'VERIFIED';

      if (isEligible) {
        verifiedEligible = DecimalUtils.add(verifiedEligible, instAmount);
      } else if (inst.verificationStatus === 'VERIFIED') {
        verifiedIneligible = DecimalUtils.add(verifiedIneligible, instAmount);
      }

      breakdownItems.push({
        instrumentId: inst.instrumentId,
        instrumentType: inst.instrumentType,
        amount: DecimalUtils.toFixedString(instAmount),
        amountFormatted: DecimalUtils.formatCurrency(instAmount, requirement.currency),
        bankName: inst.bankName,
        branchName: inst.branchName,
        maturityDate: inst.maturityDate,
        verificationStatus: inst.verificationStatus,
        isJointAccount: inst.isJointAccount,
        isEligible,
        ineligibilityReasons,
      });
    }

    // Shortfall = max(0, Required Amount - Eligible Verified Deposit)
    const shortfall = DecimalUtils.calculateShortfall(requiredAmount, verifiedEligible);
    const isCompliant = DecimalUtils.isZero(shortfall);

    const deadline = new Date(requirement.submissionDeadline);
    const isOverdue = !isCompliant && now.getTime() > deadline.getTime();
    const diffMs = deadline.getTime() - now.getTime();
    const daysRemainingOrOverdue = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24)) * (diffMs < 0 ? -1 : 1);

    // Dynamic Compliance Status Determination
    let complianceStatus: ComplianceStatus = 'NOT_SUBMITTED';

    if (isCompliant) {
      complianceStatus = 'COMPLIANT';
    } else if (DecimalUtils.isGreaterThanOrEqualTo(DecimalUtils.add(verifiedEligible, pendingVerification), requiredAmount) && !DecimalUtils.isZero(pendingVerification)) {
      complianceStatus = 'UNDER_REVIEW';
    } else if (!DecimalUtils.isZero(verifiedEligible)) {
      complianceStatus = isOverdue ? 'OVERDUE' : 'PARTIALLY_COMPLIANT';
    } else if (!DecimalUtils.isZero(pendingVerification)) {
      complianceStatus = 'UNDER_REVIEW';
    } else {
      complianceStatus = isOverdue ? 'OVERDUE' : 'NOT_SUBMITTED';
    }

    return {
      requirementId: requirement.requirementId,
      institutionId: requirement.institutionId,
      institutionName: requirement.institutionName,
      requiredAmount: DecimalUtils.toFixedString(requiredAmount),
      requiredAmountFormatted: DecimalUtils.formatCurrency(requiredAmount, requirement.currency),
      eligibleVerifiedDeposit: DecimalUtils.toFixedString(verifiedEligible),
      eligibleVerifiedDepositFormatted: DecimalUtils.formatCurrency(verifiedEligible, requirement.currency),
      outstandingShortfall: DecimalUtils.toFixedString(shortfall),
      outstandingShortfallFormatted: DecimalUtils.formatCurrency(shortfall, requirement.currency),
      complianceStatus,
      isCompliant,
      isOverdue,
      daysRemainingOrOverdue,
      deadline,
      breakdown: {
        totalPledgedAmount: DecimalUtils.toFixedString(totalPledged),
        totalPledgedFormatted: DecimalUtils.formatCurrency(totalPledged, requirement.currency),
        verifiedEligibleAmount: DecimalUtils.toFixedString(verifiedEligible),
        verifiedEligibleFormatted: DecimalUtils.formatCurrency(verifiedEligible, requirement.currency),
        pendingVerificationAmount: DecimalUtils.toFixedString(pendingVerification),
        rejectedAmount: DecimalUtils.toFixedString(rejectedAmount),
        ineligibleTypeAmount: DecimalUtils.toFixedString(ineligibleTypeAmount),
        instruments: breakdownItems,
      },
      calculatedAt: now,
    };
  }

  /**
   * List requirements with pagination, filtering, and compliance recalculation
   */
  async getRequirements(
    params: RequirementQueryParams,
    institutionScope?: string
  ): Promise<{ requirements: any[]; total: number }> {
    const { requirements, total } = await this.repo.findWithPagination(params, institutionScope);

    // Compute live compliance status and shortfall for each requirement
    const enriched = requirements.map((req) => {
      const compliance = this.calculateCompliance(req);
      return {
        ...req,
        calculatedCompliance: compliance,
        shortfall: compliance.outstandingShortfall,
        shortfallFormatted: compliance.outstandingShortfallFormatted,
        eligibleDeposit: compliance.eligibleVerifiedDeposit,
        eligibleDepositFormatted: compliance.eligibleVerifiedDepositFormatted,
      };
    });

    return { requirements: enriched, total };
  }

  /**
   * Get requirement by ID with full details and live compliance calculation
   */
  async getRequirementById(id: string, institutionScope?: string): Promise<{ requirement: IRequirement; compliance: ComplianceCalculationResult }> {
    const requirement = await this.repo.findByIdOrRequirementId(id);
    if (!requirement) {
      throw AppError.notFound(`Requirement with identifier '${id}' not found`);
    }

    // Enforce tenant isolation
    if (institutionScope && requirement.institutionId !== institutionScope) {
      throw AppError.forbidden('Access denied to security deposit requirement of another institution');
    }

    const compliance = this.calculateCompliance(requirement);

    return { requirement, compliance };
  }

  /**
   * Create a new deposit requirement and assign to an institution
   */
  async createRequirement(
    input: CreateRequirementInput,
    user: { id: string; email: string; fullName: string }
  ): Promise<IRequirement> {
    // 1. Verify target institution exists
    const institution = await Institution.findOne({
      $or: [
        { code: input.institutionId.toUpperCase() },
        ...(mongoose.Types.ObjectId.isValid(input.institutionId)
          ? [{ _id: input.institutionId }]
          : []),
      ],
    });

    if (!institution) {
      throw AppError.badRequest(`Target institution '${input.institutionId}' does not exist`);
    }

    // 2. Generate unique Requirement ID if not supplied
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const requirementId = input.requirementId || `REQ-${year}-${institution.code}-${randomSuffix}`;

    // Check duplicate
    const existing = await this.repo.findByIdOrRequirementId(requirementId);
    if (existing) {
      throw AppError.conflict(`Requirement ID '${requirementId}' already exists`);
    }

    // 3. Format decimal amount
    const parsedAmount = DecimalUtils.toFixedString(input.requiredAmount);

    const requirementDoc = await this.repo.create({
      requirementId: requirementId.toUpperCase(),
      institutionId: institution.code,
      institutionName: institution.name,
      title: input.title,
      requirementType: input.requirementType,
      requiredAmount: mongoose.Types.Decimal128.fromString(parsedAmount),
      currency: input.currency || 'INR',
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : new Date(),
      submissionDeadline: new Date(input.submissionDeadline),
      applicableRuleReference: input.applicableRuleReference,
      acceptableInstrumentTypes: input.acceptableInstrumentTypes,
      supportingDocumentRequirements: input.supportingDocumentRequirements || [],
      applicableBusinessRules: input.applicableBusinessRules || [],
      requirementStatus: 'ACTIVE',
      complianceStatus: 'NOT_SUBMITTED',
      createdBy: user.email,
      pledgedInstruments: [],
      activityHistory: [
        {
          action: 'REQUIREMENT_CREATED',
          performedBy: user.fullName || user.email,
          performedByEmail: user.email,
          details: `Security Deposit requirement created for ${DecimalUtils.formatCurrency(parsedAmount, input.currency || 'INR')} under rule '${input.applicableRuleReference}'`,
          timestamp: new Date(),
        },
      ],
    });

    return requirementDoc;
  }

  /**
   * Update requirement details and recalculate compliance
   */
  async updateRequirement(
    id: string,
    input: UpdateRequirementInput,
    user: { id: string; email: string; fullName: string },
    institutionScope?: string
  ): Promise<{ requirement: IRequirement; compliance: ComplianceCalculationResult }> {
    const existing = await this.repo.findByIdOrRequirementId(id);
    if (!existing) {
      throw AppError.notFound(`Requirement '${id}' not found`);
    }

    if (institutionScope && existing.institutionId !== institutionScope) {
      throw AppError.forbidden('Access denied to update requirement of another institution');
    }

    const updates: Partial<IRequirement> = {};
    if (input.title) updates.title = input.title;
    if (input.requirementType) updates.requirementType = input.requirementType;
    if (input.requiredAmount) {
      const parsed = DecimalUtils.toFixedString(input.requiredAmount);
      updates.requiredAmount = mongoose.Types.Decimal128.fromString(parsed);
    }
    if (input.currency) updates.currency = input.currency;
    if (input.effectiveDate) updates.effectiveDate = new Date(input.effectiveDate);
    if (input.submissionDeadline) updates.submissionDeadline = new Date(input.submissionDeadline);
    if (input.applicableRuleReference) updates.applicableRuleReference = input.applicableRuleReference;
    if (input.acceptableInstrumentTypes) updates.acceptableInstrumentTypes = input.acceptableInstrumentTypes;
    if (input.supportingDocumentRequirements) updates.supportingDocumentRequirements = input.supportingDocumentRequirements;
    if (input.applicableBusinessRules) updates.applicableBusinessRules = input.applicableBusinessRules;
    if (input.requirementStatus) updates.requirementStatus = input.requirementStatus;

    // Apply updates
    const updated = await this.repo.update(existing._id.toString(), updates);
    if (!updated) {
      throw AppError.internal('Failed to update requirement');
    }

    // Recalculate compliance and update complianceStatus
    const compliance = this.calculateCompliance(updated);
    if (updated.complianceStatus !== compliance.complianceStatus) {
      await this.repo.update(updated._id.toString(), { complianceStatus: compliance.complianceStatus });
      updated.complianceStatus = compliance.complianceStatus;
    }

    // Append audit log
    await this.repo.appendActivityLog(updated._id.toString(), {
      action: 'REQUIREMENT_UPDATED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      details: `Requirement updated. New compliance status: ${compliance.complianceStatus}. Shortfall: ${compliance.outstandingShortfallFormatted}`,
      timestamp: new Date(),
    });

    return { requirement: updated, compliance };
  }

  /**
   * Pledge an instrument (FDR, Bank Guarantee, etc.) against a requirement
   */
  async pledgeInstrument(
    id: string,
    input: PledgeInstrumentInput,
    user: { id: string; email: string; fullName: string },
    institutionScope?: string
  ): Promise<{ requirement: IRequirement; compliance: ComplianceCalculationResult }> {
    const existing = await this.repo.findByIdOrRequirementId(id);
    if (!existing) {
      throw AppError.notFound(`Requirement '${id}' not found`);
    }

    if (institutionScope && existing.institutionId !== institutionScope) {
      throw AppError.forbidden('Access denied to pledge against requirement of another institution');
    }

    // Check duplicate instrument ID in requirement
    const duplicate = existing.pledgedInstruments.find(
      (p) => p.instrumentId.toUpperCase() === input.instrumentId.toUpperCase()
    );
    if (duplicate) {
      throw AppError.conflict(`Instrument '${input.instrumentId}' has already been pledged to this requirement`);
    }

    const parsedAmount = DecimalUtils.toFixedString(input.amount);

    const instrumentData = {
      instrumentId: input.instrumentId.toUpperCase(),
      instrumentType: input.instrumentType,
      bankName: input.bankName,
      branchName: input.branchName,
      amount: mongoose.Types.Decimal128.fromString(parsedAmount),
      maturityDate: new Date(input.maturityDate),
      verificationStatus: 'PENDING' as const,
      isJointAccount: input.isJointAccount ?? true,
      pledgedAt: new Date(),
      remarks: input.remarks,
    };

    const updated = await this.repo.addPledgedInstrument(existing._id.toString(), instrumentData);
    if (!updated) {
      throw AppError.internal('Failed to pledge instrument');
    }

    // Recalculate compliance
    const compliance = this.calculateCompliance(updated);
    await this.repo.update(updated._id.toString(), { complianceStatus: compliance.complianceStatus });
    updated.complianceStatus = compliance.complianceStatus;

    // Log activity
    await this.repo.appendActivityLog(updated._id.toString(), {
      action: 'INSTRUMENT_PLEDGED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      details: `Pledged ${input.instrumentType} #${input.instrumentId} of ${DecimalUtils.formatCurrency(parsedAmount, existing.currency)} from ${input.bankName}. Status: PENDING verification.`,
      timestamp: new Date(),
    });

    return { requirement: updated, compliance };
  }

  /**
   * Verify or reject a pledged instrument (Authorized official action)
   */
  async verifyInstrument(
    requirementId: string,
    instrumentId: string,
    input: VerifyInstrumentInput,
    user: { id: string; email: string; fullName: string }
  ): Promise<{ requirement: IRequirement; compliance: ComplianceCalculationResult }> {
    const existing = await this.repo.findByIdOrRequirementId(requirementId);
    if (!existing) {
      throw AppError.notFound(`Requirement '${requirementId}' not found`);
    }

    const instrument = existing.pledgedInstruments.find(
      (p) => p.instrumentId.toUpperCase() === instrumentId.toUpperCase()
    );
    if (!instrument) {
      throw AppError.notFound(`Instrument '${instrumentId}' not found in this requirement`);
    }

    const updated = await this.repo.updateInstrumentVerification(
      existing._id.toString(),
      instrument.instrumentId,
      input.verificationStatus,
      input.remarks
    );

    if (!updated) {
      throw AppError.internal('Failed to update instrument verification');
    }

    // Recalculate compliance with newly verified instrument
    const compliance = this.calculateCompliance(updated);
    await this.repo.update(updated._id.toString(), { complianceStatus: compliance.complianceStatus });
    updated.complianceStatus = compliance.complianceStatus;

    // Log activity
    await this.repo.appendActivityLog(updated._id.toString(), {
      action: `INSTRUMENT_${input.verificationStatus}`,
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      details: `Instrument #${instrument.instrumentId} (${instrument.instrumentType}) was ${input.verificationStatus}. Remarks: ${input.remarks || 'None'}. New Shortfall: ${compliance.outstandingShortfallFormatted}`,
      timestamp: new Date(),
    });

    return { requirement: updated, compliance };
  }

  /**
   * Get compliance summary for an entire institution
   */
  async getInstitutionComplianceSummary(institutionId: string): Promise<InstitutionComplianceSummary> {
    const institution = await Institution.findOne({
      $or: [
        { code: institutionId.toUpperCase() },
        ...(mongoose.Types.ObjectId.isValid(institutionId) ? [{ _id: institutionId }] : []),
      ],
    });

    if (!institution) {
      throw AppError.notFound(`Institution '${institutionId}' not found`);
    }

    const requirements = await this.repo.findByInstitution(institution.code);

    let totalRequired = DecimalUtils.from(0);
    let totalEligible = DecimalUtils.from(0);
    let totalShortfall = DecimalUtils.from(0);

    let compliantCount = 0;
    let partiallyCompliantCount = 0;
    let notSubmittedCount = 0;
    let overdueCount = 0;
    let underReviewCount = 0;

    const complianceResults: ComplianceCalculationResult[] = [];

    for (const req of requirements) {
      const comp = this.calculateCompliance(req);
      complianceResults.push(comp);

      totalRequired = DecimalUtils.add(totalRequired, comp.requiredAmount);
      totalEligible = DecimalUtils.add(totalEligible, comp.eligibleVerifiedDeposit);
      totalShortfall = DecimalUtils.add(totalShortfall, comp.outstandingShortfall);

      switch (comp.complianceStatus) {
        case 'COMPLIANT':
          compliantCount++;
          break;
        case 'PARTIALLY_COMPLIANT':
          partiallyCompliantCount++;
          break;
        case 'NOT_SUBMITTED':
          notSubmittedCount++;
          break;
        case 'OVERDUE':
          overdueCount++;
          break;
        case 'UNDER_REVIEW':
          underReviewCount++;
          break;
      }
    }

    const overallRate =
      complianceResults.length > 0
        ? Math.round((compliantCount / complianceResults.length) * 100)
        : 100;

    return {
      institutionId: institution.code,
      institutionName: institution.name,
      totalRequirements: complianceResults.length,
      compliantCount,
      partiallyCompliantCount,
      notSubmittedCount,
      overdueCount,
      underReviewCount,
      totalRequiredAmount: DecimalUtils.toFixedString(totalRequired),
      totalRequiredFormatted: DecimalUtils.formatCurrency(totalRequired),
      totalEligibleDeposit: DecimalUtils.toFixedString(totalEligible),
      totalEligibleFormatted: DecimalUtils.formatCurrency(totalEligible),
      totalShortfall: DecimalUtils.toFixedString(totalShortfall),
      totalShortfallFormatted: DecimalUtils.formatCurrency(totalShortfall),
      overallComplianceRate: overallRate,
      requirements: complianceResults,
    };
  }

  /**
   * Get compliance dashboard metrics
   */
  async getDashboardMetrics(institutionScope?: string) {
    return this.repo.getDashboardMetrics(institutionScope);
  }
}

export const requirementService = new RequirementService();
