import mongoose from 'mongoose';
import { Renewal, IRenewal } from '../../models/Renewal.model';
import { Fdr, IFdr } from '../../models/Fdr.model';
import { Requirement } from '../../models/Requirement.model';
import { requirementService } from '../requirements/requirement.service';
import { renewalRepository, RenewalRepository } from './renewal.repository';
import { DecimalUtils } from '../../utils/decimal';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';
import {
  CreateRenewalInput,
  SubmitRenewalInput,
  ApproveRenewalInput,
  RenewalFilterParams,
} from './renewal.types';

export class RenewalService {
  constructor(private repo: RenewalRepository = renewalRepository) {}

  /**
   * Create a new renewal request for an existing FDR
   */
  async createRenewal(input: CreateRenewalInput, user: AuthUserContext): Promise<IRenewal> {
    const previousFdr = await Fdr.findOne({
      $or: [
        { fdrId: input.previousInstrumentId.toUpperCase().trim() },
        ...(mongoose.Types.ObjectId.isValid(input.previousInstrumentId)
          ? [{ _id: input.previousInstrumentId }]
          : []),
      ],
    });

    if (!previousFdr) {
      throw AppError.notFound(`Previous instrument '${input.previousInstrumentId}' not found`);
    }

    // Tenant check
    if (user.institutionId && previousFdr.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied to create renewal request for another institution');
    }

    // Check if an active renewal is already in progress
    const activeRenewal = await Renewal.findOne({
      previousInstrumentId: previousFdr.fdrId,
      status: { $in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] },
    });

    if (activeRenewal) {
      throw AppError.badRequest(
        `Active renewal request '${activeRenewal.renewalId}' is already in progress for instrument #${previousFdr.fdrNumber}`
      );
    }

    const year = new Date().getFullYear();
    const suffix = Math.floor(10000 + Math.random() * 90000);
    const renewalId = `REN-${year}-${previousFdr.institutionId}-${suffix}`;
    const now = new Date();

    let replacementDetailsData: any = undefined;
    let initialStatus: any = 'DRAFT';

    if (input.replacementDetails) {
      const rep = input.replacementDetails;
      replacementDetailsData = {
        instrumentType: rep.instrumentType || 'FDR',
        bankName: rep.bankName.trim(),
        bankBranch: rep.bankBranch.trim(),
        fdrNumber: rep.fdrNumber.trim(),
        holderName: rep.holderName.trim(),
        depositAmount: mongoose.Types.Decimal128.fromString(
          DecimalUtils.toFixedString(rep.depositAmount)
        ),
        issueDate: new Date(rep.issueDate),
        maturityDate: new Date(rep.maturityDate),
        documentReferences: rep.documentReferences || [],
        isJointAccount: rep.isJointAccount ?? true,
        autoRenewal: rep.autoRenewal ?? true,
        interestRate: rep.interestRate,
        remarks: rep.remarks,
      };
      initialStatus = 'SUBMITTED';
    }

    const renewal = await this.repo.create({
      renewalId,
      previousInstrumentId: previousFdr.fdrId,
      institutionId: previousFdr.institutionId,
      institutionName: previousFdr.institutionName,
      requirementId: previousFdr.requirementId,
      requirementTitle: previousFdr.requirementTitle,
      status: initialStatus,
      renewalReason: input.renewalReason.trim(),
      originalAmount: previousFdr.depositAmount,
      originalMaturityDate: previousFdr.maturityDate,
      originalFdrNumber: previousFdr.fdrNumber,
      originalBankName: previousFdr.bankName,
      requestedBy: user.fullName || user.email,
      requestedByEmail: user.email,
      replacementDetails: replacementDetailsData,
      history: [
        {
          action: 'RENEWAL_REQUEST_CREATED',
          performedBy: user.fullName || user.email,
          performedByEmail: user.email,
          details: `Renewal request initiated for FDR #${previousFdr.fdrNumber} (${previousFdr.bankName}) with status ${initialStatus}`,
          timestamp: now,
        },
      ],
    });

    // Link renewal request ID on previous FDR
    previousFdr.renewalRequestId = renewalId;
    await previousFdr.save();

    return renewal;
  }

  /**
   * Submit replacement instrument details for a draft renewal request
   */
  async submitRenewal(id: string, input: SubmitRenewalInput, user: AuthUserContext): Promise<IRenewal> {
    const renewal = await this.repo.findByRenewalId(id) || await this.repo.findById(id);
    if (!renewal) {
      throw AppError.notFound(`Renewal request '${id}' not found`);
    }

    if (user.institutionId && renewal.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied to update renewal of another institution');
    }

    if (renewal.status === 'APPROVED' || renewal.status === 'REJECTED') {
      throw AppError.badRequest(`Cannot submit details for renewal in '${renewal.status}' status`);
    }

    const rep = input.replacementDetails;
    const replacementDetails = {
      instrumentType: rep.instrumentType || 'FDR',
      bankName: rep.bankName.trim(),
      bankBranch: rep.bankBranch.trim(),
      fdrNumber: rep.fdrNumber.trim(),
      holderName: rep.holderName.trim(),
      depositAmount: mongoose.Types.Decimal128.fromString(
        DecimalUtils.toFixedString(rep.depositAmount)
      ),
      issueDate: new Date(rep.issueDate),
      maturityDate: new Date(rep.maturityDate),
      documentReferences: rep.documentReferences || [],
      isJointAccount: rep.isJointAccount ?? true,
      autoRenewal: rep.autoRenewal ?? true,
      interestRate: rep.interestRate,
      remarks: rep.remarks,
    };

    const now = new Date();
    renewal.replacementDetails = replacementDetails;
    renewal.status = 'SUBMITTED';
    renewal.history.push({
      action: 'REPLACEMENT_SUBMITTED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      details: `Replacement FDR #${rep.fdrNumber} (${rep.bankName}) submitted for scrutiny and approval`,
      timestamp: now,
    });

    await renewal.save();
    return renewal;
  }

  /**
   * Approve a renewal request:
   * 1. Creates new Replacement FDR (with previousInstrumentId and renewalRequestId).
   * 2. Preserves previous FDR original amount, issue date, maturity date; marks it MATURED with replacementInstrumentId.
   * 3. Updates renewal status to APPROVED with replacementInstrumentId.
   * 4. Updates deposit requirement pledged instruments and recomputes compliance.
   */
  async approveRenewal(id: string, input: ApproveRenewalInput, user: AuthUserContext): Promise<IRenewal> {
    // Only administrative / scrutiny officers can approve
    const isOfficer =
      user.userType === 'ADMIN' ||
      user.roles.includes('SYSTEM_ADMINISTRATOR') ||
      user.roles.includes('AICTE_OFFICER') ||
      user.roles.includes('FINANCE_OFFICER') ||
      user.roles.includes('APPROVING_AUTHORITY');

    if (!isOfficer) {
      throw AppError.forbidden('Only authorized AICTE officers can approve renewals');
    }

    const renewal = await this.repo.findByRenewalId(id) || await this.repo.findById(id);
    if (!renewal) {
      throw AppError.notFound(`Renewal request '${id}' not found`);
    }

    if (renewal.status === 'APPROVED') {
      throw AppError.badRequest('Renewal request has already been approved');
    }

    if (!renewal.replacementDetails) {
      throw AppError.badRequest('Cannot approve renewal without replacement FDR details');
    }

    const previousFdr = await Fdr.findOne({ fdrId: renewal.previousInstrumentId });
    if (!previousFdr) {
      throw AppError.notFound(`Original FDR '${renewal.previousInstrumentId}' not found`);
    }

    const now = new Date();
    const rep = renewal.replacementDetails;
    const year = now.getFullYear();
    const suffix = Math.floor(10000 + Math.random() * 90000);
    const replacementFdrId = `FDR-${year}-${renewal.institutionId}-${suffix}`;

    // 1. Create the new Replacement Instrument
    const replacementFdr = new Fdr({
      fdrId: replacementFdrId,
      institutionId: previousFdr.institutionId,
      institutionName: previousFdr.institutionName,
      requirementId: previousFdr.requirementId,
      requirementTitle: previousFdr.requirementTitle,
      instrumentType: rep.instrumentType || 'FDR',
      bankName: rep.bankName,
      bankBranch: rep.bankBranch,
      fdrNumber: rep.fdrNumber,
      holderName: rep.holderName,
      depositAmount: rep.depositAmount,
      issueDate: rep.issueDate,
      maturityDate: rep.maturityDate,
      currency: previousFdr.currency || 'INR',
      isJointAccount: rep.isJointAccount,
      documentReferences: rep.documentReferences,
      submissionStatus: 'APPROVED',
      verificationStatus: 'VERIFIED',
      lifecycleStatus: 'ACTIVE',
      autoRenewal: rep.autoRenewal,
      interestRate: rep.interestRate,
      remarks: rep.remarks,
      previousInstrumentId: previousFdr.fdrId,
      renewalRequestId: renewal.renewalId,
      createdBy: user.email,
      submittedAt: now,
      verifiedAt: now,
      verifiedBy: user.email,
      history: [
        {
          action: 'REPLACEMENT_INSTRUMENT_CREATED',
          performedBy: user.fullName || user.email,
          performedByEmail: user.email,
          details: `Statutory replacement FDR registered under Renewal #${renewal.renewalId}. Linked to predecessor instrument #${previousFdr.fdrId}.`,
          timestamp: now,
        },
      ],
    });

    await replacementFdr.save();

    // 2. Update Previous Instrument (STRICT RULE: Never overwrite original amount, issue date, or maturity date)
    previousFdr.lifecycleStatus = 'MATURED';
    previousFdr.replacementInstrumentId = replacementFdr.fdrId;
    previousFdr.renewalRequestId = renewal.renewalId;
    previousFdr.history.push({
      action: 'INSTRUMENT_SUPERSEDED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      details: `Instrument replaced and superseded by Renewal #${renewal.renewalId} (New FDR #${replacementFdr.fdrNumber} / ${replacementFdr.fdrId}). Historical data preserved unchanged.`,
      timestamp: now,
    });
    await previousFdr.save();

    // 3. Update Renewal Request
    renewal.replacementInstrumentId = replacementFdr.fdrId;
    renewal.status = 'APPROVED';
    renewal.reviewedBy = user.email;
    renewal.reviewedAt = now;
    renewal.reviewRemarks = input.remarks;
    renewal.history.push({
      action: 'RENEWAL_APPROVED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      details: `Renewal approved. Replacement Instrument #${replacementFdr.fdrNumber} (${replacementFdr.fdrId}) activated. Remarks: ${input.remarks}`,
      timestamp: now,
    });
    await renewal.save();

    // 4. Update Compliance Calculation on Deposit Requirement
    try {
      const requirement = await Requirement.findOne({ requirementId: previousFdr.requirementId });
      if (requirement) {
        // Remove old instrument from active pledged list or replace with new
        const pledged = requirement.pledgedInstruments || [];
        const filteredPledged = pledged.filter(
          (p) => p.instrumentId !== previousFdr.fdrNumber && p.instrumentId !== previousFdr.fdrId
        );

        filteredPledged.push({
          instrumentId: replacementFdr.fdrNumber,
          instrumentType: replacementFdr.instrumentType,
          bankName: replacementFdr.bankName,
          branchName: replacementFdr.bankBranch,
          amount: replacementFdr.depositAmount,
          maturityDate: replacementFdr.maturityDate,
          verificationStatus: 'VERIFIED',
          isJointAccount: replacementFdr.isJointAccount,
          pledgedAt: now,
          remarks: `Replacement FDR #${replacementFdr.fdrId} via Renewal #${renewal.renewalId}`,
        });

        requirement.pledgedInstruments = filteredPledged;
        const compliance = requirementService.calculateCompliance(requirement);
        requirement.complianceStatus = compliance.complianceStatus;
        await requirement.save();
      }
    } catch (err) {
      console.error('Error recalculating requirement compliance after renewal approval:', err);
    }

    return renewal;
  }

  /**
   * Get single renewal request with complete side-by-side comparison
   */
  async getRenewalById(id: string, user: AuthUserContext) {
    const renewal = await this.repo.findByRenewalId(id) || await this.repo.findById(id);
    if (!renewal) {
      throw AppError.notFound(`Renewal request '${id}' not found`);
    }

    if (user.institutionId && renewal.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied to renewal details of another institution');
    }

    const previousFdr = await Fdr.findOne({ fdrId: renewal.previousInstrumentId });
    const replacementFdr = renewal.replacementInstrumentId
      ? await Fdr.findOne({ fdrId: renewal.replacementInstrumentId })
      : null;

    return {
      renewal,
      previousFdr: previousFdr
        ? {
            ...previousFdr.toObject(),
            depositAmountFormatted: DecimalUtils.formatCurrency(previousFdr.depositAmount, previousFdr.currency),
          }
        : null,
      replacementFdr: replacementFdr
        ? {
            ...replacementFdr.toObject(),
            depositAmountFormatted: DecimalUtils.formatCurrency(replacementFdr.depositAmount, replacementFdr.currency),
          }
        : null,
    };
  }

  /**
   * List renewal requests with pagination and filters
   */
  async listRenewals(params: RenewalFilterParams, user: AuthUserContext) {
    const query: any = {};

    if (user.institutionId) {
      query.institutionId = user.institutionId;
    } else if (params.institutionId) {
      query.institutionId = params.institutionId;
    }

    if (params.status) {
      query.status = params.status;
    }

    if (params.search) {
      const regex = new RegExp(params.search.trim(), 'i');
      query.$or = [
        { renewalId: regex },
        { previousInstrumentId: regex },
        { replacementInstrumentId: regex },
        { institutionName: regex },
        { originalFdrNumber: regex },
      ];
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const { renewals, total } = await this.repo.find(query, skip, limit);

    const enriched = renewals.map((r) => {
      const obj = r.toObject();
      return {
        ...obj,
        originalAmountFormatted: DecimalUtils.formatCurrency(r.originalAmount),
        replacementAmountFormatted: r.replacementDetails
          ? DecimalUtils.formatCurrency(r.replacementDetails.depositAmount)
          : undefined,
      };
    });

    return { data: enriched, total, page, limit };
  }

  /**
   * Full replacement lineage tree for an instrument
   */
  async getReplacementHistory(instrumentId: string, user: AuthUserContext) {
    const instrument = await Fdr.findOne({
      $or: [
        { fdrId: instrumentId.toUpperCase().trim() },
        ...(mongoose.Types.ObjectId.isValid(instrumentId) ? [{ _id: instrumentId }] : []),
      ],
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument '${instrumentId}' not found`);
    }

    if (user.institutionId && instrument.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied');
    }

    // Traverse upwards (ancestors)
    const ancestors: any[] = [];
    let currentPrevId = instrument.previousInstrumentId;
    while (currentPrevId) {
      const prev = await Fdr.findOne({ fdrId: currentPrevId });
      if (!prev) break;
      ancestors.unshift({
        ...prev.toObject(),
        depositAmountFormatted: DecimalUtils.formatCurrency(prev.depositAmount, prev.currency),
        relation: 'PREDECESSOR',
      });
      currentPrevId = prev.previousInstrumentId;
    }

    // Traverse downwards (successors)
    const successors: any[] = [];
    let currentNextId = instrument.replacementInstrumentId;
    while (currentNextId) {
      const next = await Fdr.findOne({ fdrId: currentNextId });
      if (!next) break;
      successors.push({
        ...next.toObject(),
        depositAmountFormatted: DecimalUtils.formatCurrency(next.depositAmount, next.currency),
        relation: 'REPLACEMENT',
      });
      currentNextId = next.replacementInstrumentId;
    }

    return {
      currentInstrument: {
        ...instrument.toObject(),
        depositAmountFormatted: DecimalUtils.formatCurrency(instrument.depositAmount, instrument.currency),
      },
      ancestors,
      successors,
      totalLineageCount: ancestors.length + 1 + successors.length,
    };
  }
}

export const renewalService = new RenewalService();
