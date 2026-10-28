import mongoose from 'mongoose';
import { fdrRepository, FdrRepository } from './fdr.repository';
import { Institution } from '../../models/Institution.model';
import { Requirement } from '../../models/Requirement.model';
import { requirementService } from '../requirements/requirement.service';
import { DecimalUtils } from '../../utils/decimal';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';
import {
  CreateFdrInput,
  UpdateFdrInput,
  FdrQueryParams,
  IFdr,
  DuplicateCheckResult,
} from './fdr.types';

export class FdrService {
  constructor(private repo: FdrRepository = fdrRepository) {}

  /**
   * Register a new FDR (Save as Draft or Submit directly)
   */
  async createFdr(input: CreateFdrInput, user: AuthUserContext): Promise<IFdr> {
    // 1. Resolve target institution
    const targetInstCode = input.institutionId || user.institutionId;
    if (!targetInstCode) {
      throw AppError.badRequest('Institution ID is required for FDR registration');
    }

    if (user.institutionId && user.institutionId !== targetInstCode) {
      throw AppError.forbidden('Access denied to create FDR for another institution');
    }

    const institution = await Institution.findOne({
      $or: [
        { code: targetInstCode.toUpperCase() },
        ...(mongoose.Types.ObjectId.isValid(targetInstCode) ? [{ _id: targetInstCode }] : []),
      ],
    });

    if (!institution) {
      throw AppError.badRequest(`Target institution '${targetInstCode}' does not exist`);
    }

    // 2. Validate linked requirement
    const requirement = await Requirement.findOne({
      $or: [
        { requirementId: input.requirementId.toUpperCase().trim() },
        ...(mongoose.Types.ObjectId.isValid(input.requirementId) ? [{ _id: input.requirementId }] : []),
      ],
    });

    if (!requirement) {
      throw AppError.badRequest(`Linked requirement '${input.requirementId}' not found`);
    }

    // 3. Duplicate Detection: Check for duplicate-looking instruments
    // Rule: Duplicate detection must create a review flag rather than automatically reject a record.
    const duplicates = await this.repo.findPotentialDuplicates(input.fdrNumber, input.bankName);
    const isDuplicateFlagged = duplicates.length > 0;
    const duplicateReviewNotes = isDuplicateFlagged
      ? `Flagged for scrutiny: Instrument #${input.fdrNumber} matches existing record #${duplicates[0].fdrId} at ${duplicates[0].bankName} (${duplicates[0].institutionName})`
      : undefined;

    // 4. Generate unique FDR ID
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const fdrId = `FDR-${year}-${institution.code}-${randomSuffix}`;

    const parsedAmount = DecimalUtils.toFixedString(input.depositAmount);
    const isDraft = input.saveAsDraft ?? false;
    const submissionStatus = isDraft ? 'DRAFT' : 'SUBMITTED';
    const now = new Date();

    const fdrDoc = await this.repo.create({
      fdrId,
      institutionId: institution.code,
      institutionName: institution.name,
      requirementId: requirement.requirementId,
      requirementTitle: requirement.title,
      instrumentType: input.instrumentType || 'FDR',
      bankName: input.bankName.trim(),
      bankBranch: input.bankBranch.trim(),
      fdrNumber: input.fdrNumber.trim(),
      holderName: input.holderName.trim(),
      depositAmount: mongoose.Types.Decimal128.fromString(parsedAmount),
      issueDate: new Date(input.issueDate),
      maturityDate: new Date(input.maturityDate),
      currency: input.currency || 'INR',
      isJointAccount: input.isJointAccount ?? true,
      documentReferences: input.documentReferences || [],
      submissionStatus,
      verificationStatus: 'PENDING',
      lifecycleStatus: 'ACTIVE',
      isDuplicateFlagged,
      duplicateReviewNotes,
      autoRenewal: input.autoRenewal ?? true,
      interestRate: input.interestRate,
      remarks: input.remarks,
      createdBy: user.email,
      submittedAt: isDraft ? undefined : now,
      history: [
        {
          action: isDraft ? 'DRAFT_CREATED' : 'FDR_SUBMITTED',
          performedBy: user.fullName || user.email,
          performedByEmail: user.email,
          details: isDraft
            ? `FDR registered as draft for ${DecimalUtils.formatCurrency(parsedAmount, input.currency || 'INR')}`
            : `FDR submitted for official scrutiny. Amount: ${DecimalUtils.formatCurrency(parsedAmount, input.currency || 'INR')}`,
          timestamp: now,
        },
      ],
    });

    // 5. If directly submitted, sync with deposit requirement
    if (!isDraft) {
      await this.syncWithRequirement(fdrDoc, user);
    }

    return fdrDoc;
  }

  /**
   * Submit an existing draft FDR for official verification
   */
  async submitFdr(id: string, user: AuthUserContext): Promise<IFdr> {
    const fdr = await this.repo.findByIdOrFdrId(id);
    if (!fdr) {
      throw AppError.notFound(`FDR '${id}' not found`);
    }

    // Tenant check
    if (user.institutionId && fdr.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied to submit FDR of another institution');
    }

    if (fdr.submissionStatus === 'SUBMITTED' || fdr.submissionStatus === 'APPROVED') {
      throw AppError.badRequest(`FDR is already submitted (current status: ${fdr.submissionStatus})`);
    }

    const now = new Date();
    const updated = await this.repo.update(fdr._id.toString(), {
      submissionStatus: 'SUBMITTED',
      verificationStatus: 'PENDING',
      submittedAt: now,
    });

    if (!updated) {
      throw AppError.internal('Failed to submit FDR');
    }

    await this.repo.appendActivityLog(fdr._id.toString(), {
      action: 'FDR_SUBMITTED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      details: 'Draft FDR finalized and submitted for official scrutiny and compliance recalculation',
      timestamp: now,
    });

    // Link/Pledge to requirement and recompute compliance
    await this.syncWithRequirement(updated, user);

    return updated;
  }

  /**
   * Edit FDR details
   * Rule: Only draft records can be edited without additional authorization.
   */
  async updateFdr(id: string, input: UpdateFdrInput, user: AuthUserContext): Promise<IFdr> {
    const fdr = await this.repo.findByIdOrFdrId(id);
    if (!fdr) {
      throw AppError.notFound(`FDR '${id}' not found`);
    }

    // Tenant check
    if (user.institutionId && fdr.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied to update FDR of another institution');
    }

    // Check draft restriction
    const isCentralAdmin = user.userType === 'ADMIN' || user.roles.includes('SYSTEM_ADMINISTRATOR');
    const canEdit =
      fdr.submissionStatus === 'DRAFT' ||
      fdr.submissionStatus === 'RETURNED_FOR_CORRECTION' ||
      isCentralAdmin;

    if (!canEdit) {
      throw AppError.forbidden(
        `Only draft records can be edited. Current status is '${fdr.submissionStatus}'. Use correction workflow.`
      );
    }

    const updates: Partial<IFdr> = {};
    if (input.bankName) updates.bankName = input.bankName.trim();
    if (input.bankBranch) updates.bankBranch = input.bankBranch.trim();
    if (input.fdrNumber) updates.fdrNumber = input.fdrNumber.trim();
    if (input.holderName) updates.holderName = input.holderName.trim();
    if (input.depositAmount) {
      const parsed = DecimalUtils.toFixedString(input.depositAmount);
      updates.depositAmount = mongoose.Types.Decimal128.fromString(parsed);
    }
    if (input.issueDate) updates.issueDate = new Date(input.issueDate);
    if (input.maturityDate) updates.maturityDate = new Date(input.maturityDate);
    if (input.currency) updates.currency = input.currency;
    if (input.isJointAccount !== undefined) updates.isJointAccount = input.isJointAccount;
    if (input.autoRenewal !== undefined) updates.autoRenewal = input.autoRenewal;
    if (input.interestRate !== undefined) updates.interestRate = input.interestRate;
    if (input.remarks !== undefined) updates.remarks = input.remarks;
    if (input.documentReferences) updates.documentReferences = input.documentReferences;
    if (input.duplicateReviewNotes !== undefined) updates.duplicateReviewNotes = input.duplicateReviewNotes;

    // Re-check duplicate if certificate number or bank was updated
    if (input.fdrNumber || input.bankName) {
      const fdrNum = input.fdrNumber || fdr.fdrNumber;
      const bnk = input.bankName || fdr.bankName;
      const duplicates = await this.repo.findPotentialDuplicates(fdrNum, bnk, fdr._id.toString());
      updates.isDuplicateFlagged = duplicates.length > 0;
      if (duplicates.length > 0) {
        updates.duplicateReviewNotes = `Flagged for scrutiny: Instrument #${fdrNum} matches existing record #${duplicates[0].fdrId}`;
      }
    }

    const updated = await this.repo.update(fdr._id.toString(), updates);
    if (!updated) {
      throw AppError.internal('Failed to update FDR');
    }

    await this.repo.appendActivityLog(fdr._id.toString(), {
      action: 'FDR_UPDATED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      details: 'FDR details updated',
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Get FDR details with live audit trail
   */
  async getFdrById(id: string, institutionScope?: string): Promise<IFdr> {
    const fdr = await this.repo.findByIdOrFdrId(id);
    if (!fdr) {
      throw AppError.notFound(`FDR '${id}' not found`);
    }

    if (institutionScope && fdr.institutionId !== institutionScope) {
      throw AppError.forbidden('Access denied to access FDR of another institution');
    }

    return fdr;
  }

  /**
   * List FDRs with pagination and filters
   */
  async getFdrs(params: FdrQueryParams, institutionScope?: string): Promise<{ fdrs: IFdr[]; total: number }> {
    return this.repo.findWithPagination(params, institutionScope);
  }

  /**
   * Get FDR Activity / Audit History
   */
  async getFdrHistory(id: string, institutionScope?: string) {
    const fdr = await this.getFdrById(id, institutionScope);
    return fdr.history.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get Dashboard Metrics
   */
  async getDashboardMetrics(institutionScope?: string) {
    return this.repo.getMetrics(institutionScope);
  }

  /**
   * Internal helper: Sync submitted FDR into requirement's pledged instruments
   */
  private async syncWithRequirement(fdr: IFdr, user: AuthUserContext) {
    try {
      const requirement = await Requirement.findOne({
        requirementId: fdr.requirementId.toUpperCase(),
      });
      if (!requirement) return;

      // Check if already pledged in requirement
      const existing = requirement.pledgedInstruments.find(
        (p) => p.instrumentId === fdr.fdrNumber || p.instrumentId === fdr.fdrId
      );

      if (!existing) {
        requirement.pledgedInstruments.push({
          instrumentId: fdr.fdrNumber,
          instrumentType: fdr.instrumentType,
          bankName: fdr.bankName,
          branchName: fdr.bankBranch,
          amount: fdr.depositAmount,
          maturityDate: fdr.maturityDate,
          verificationStatus: fdr.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
          isJointAccount: fdr.isJointAccount,
          pledgedAt: new Date(),
          remarks: `Submitted from FDR Registry #${fdr.fdrId}`,
        });
      }

      // Recompute compliance on requirement
      const compliance = requirementService.calculateCompliance(requirement);
      requirement.complianceStatus = compliance.complianceStatus;
      await requirement.save();
    } catch (e) {
      console.error('Failed to sync FDR with requirement:', e);
    }
  }
}

export const fdrService = new FdrService();
