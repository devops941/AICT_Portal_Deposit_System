import { Fdr, IFdr } from '../../models/Fdr.model';
import { Institution } from '../../models/Institution.model';
import { Requirement } from '../../models/Requirement.model';
import { DocumentRecord } from '../../models/Document.model';
import { Discrepancy } from '../../models/Discrepancy.model';
import { Approval } from '../../models/Approval.model';
import { approvalService } from '../approvals/approval.service';
import {
  VerifyFdrInput,
  RejectVerificationInput,
  RequestClarificationInput,
  PendingVerificationFilterParams,
} from './verification.types';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';
import { DecimalUtils } from '../../utils/decimal';

export const DEFAULT_VERIFICATION_CHECKLIST = [
  {
    itemKey: 'INSTITUTION_INFO',
    label: 'Institution identity and AICTE affiliation code validity',
    status: 'PENDING' as const,
  },
  {
    itemKey: 'BANK_INFO',
    label: 'Recognized Scheduled Commercial Bank & branch authenticity',
    status: 'PENDING' as const,
  },
  {
    itemKey: 'FDR_NUMBER',
    label: 'Legible FDR certificate number and matching bank ledger pattern',
    status: 'PENDING' as const,
  },
  {
    itemKey: 'DEPOSIT_AMOUNT',
    label: 'Principal deposit amount matches or exceeds mandated requirement',
    status: 'PENDING' as const,
  },
  {
    itemKey: 'ISSUE_DATE',
    label: 'Issue date conforms to stipulated academic registration period',
    status: 'PENDING' as const,
  },
  {
    itemKey: 'MATURITY_DATE',
    label: 'Maturity tenure satisfies minimum non-liquidation duration',
    status: 'PENDING' as const,
  },
  {
    itemKey: 'HOLDER_NAME',
    label: 'Joint account mandate explicitly designates Regional Officer AICTE',
    status: 'PENDING' as const,
  },
  {
    itemKey: 'DOCUMENT_READABILITY',
    label: 'Scanned instrument receipts and seals are clear and legible',
    status: 'PENDING' as const,
  },
  {
    itemKey: 'SUPPORTING_DOCS',
    label: 'All mandatory supporting letters (Bank Undertaking, SFMS) attached',
    status: 'PENDING' as const,
  },
  {
    itemKey: 'DUPLICATE_REVIEW',
    label: 'De-duplication scan reviewed; no identical active instruments',
    status: 'PENDING' as const,
  },
];

export class VerificationService {
  private ensureOfficer(user: AuthUserContext) {
    const isOfficer =
      user.userType === 'ADMIN' ||
      user.roles.some((r) =>
        [
          'SYSTEM_ADMINISTRATOR',
          'VERIFICATION_OFFICER',
          'SENIOR_VERIFICATION_OFFICER',
          'APPROVING_AUTHORITY',
        ].includes(r)
      );

    if (!isOfficer) {
      throw AppError.forbidden('Only authorized AICTE verification officers can access verification desk');
    }
  }

  async getPendingVerifications(params: PendingVerificationFilterParams, user: AuthUserContext) {
    this.ensureOfficer(user);

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {
      submissionStatus: { $in: ['SUBMITTED', 'RETURNED_FOR_CORRECTION'] },
      verificationStatus: { $in: ['PENDING', 'UNDER_SCRUTINY'] },
    };

    if (params.institutionId) {
      query.institutionId = params.institutionId;
    }
    if (params.bankName) {
      query.bankName = params.bankName;
    }
    if (params.isDuplicateFlagged !== undefined) {
      query.isDuplicateFlagged = String(params.isDuplicateFlagged) === 'true';
    }
    if (params.search) {
      const regex = new RegExp(params.search.trim(), 'i');
      query.$or = [
        { fdrId: regex },
        { fdrNumber: regex },
        { institutionName: regex },
        { bankName: regex },
        { holderName: regex },
      ];
    }

    const [rawItems, total] = await Promise.all([
      Fdr.find(query).sort({ submittedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
      Fdr.countDocuments(query),
    ]);

    const data = rawItems.map((item) => ({
      ...item.toObject(),
      depositAmountFormatted: DecimalUtils.formatCurrency(item.depositAmount, item.currency),
    }));

    return { data, total, page, limit };
  }

  async getVerificationPacket(id: string, user: AuthUserContext) {
    this.ensureOfficer(user);

    const fdr = await Fdr.findOne({
      $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!fdr) {
      throw AppError.notFound(`Financial instrument #${id} not found`);
    }

    const [institution, requirement, documents, discrepancies, activeApproval] = await Promise.all([
      Institution.findOne({ code: fdr.institutionId }),
      Requirement.findOne({ requirementId: fdr.requirementId }),
      DocumentRecord.find({ instrumentId: fdr.fdrId }),
      Discrepancy.find({ instrumentId: fdr.fdrId }).sort({ createdAt: -1 }),
      Approval.findOne({ instrumentId: fdr.fdrId, status: { $in: ['PENDING', 'ESCALATED'] } }),
    ]);

    // Build complete checklist merging saved state or defaults
    const savedChecklist = fdr.verificationChecklist || [];
    const checklist = DEFAULT_VERIFICATION_CHECKLIST.map((item) => {
      const existing = savedChecklist.find((s) => s.itemKey === item.itemKey);
      return existing || item;
    });

    return {
      fdr: {
        ...fdr.toObject(),
        depositAmountFormatted: DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
      },
      institution,
      requirement: requirement
        ? {
            ...requirement.toObject(),
            requiredAmountFormatted: DecimalUtils.formatCurrency(requirement.requiredAmount, requirement.currency),
          }
        : null,
      documents,
      discrepancies,
      checklist,
      activeApproval,
    };
  }

  async verifyFdr(id: string, input: VerifyFdrInput, user: AuthUserContext) {
    this.ensureOfficer(user);

    const fdr = await Fdr.findOne({
      $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!fdr) {
      throw AppError.notFound(`Financial instrument #${id} not found`);
    }

    if (fdr.submissionStatus === 'DRAFT') {
      throw AppError.badRequest('Draft records cannot be verified until officially submitted by the institution');
    }

    // Validate checklist items: if any mandatory item is explicitly marked FAIL, block verification
    const failedItem = input.checklist?.find((c) => c.status === 'FAIL');
    if (failedItem) {
      throw AppError.badRequest(
        `Cannot verify FDR because checklist item "${failedItem.itemKey}" failed. Please raise a discrepancy or request clarification instead.`
      );
    }

    // Update checklist on FDR
    if (input.checklist && input.checklist.length > 0) {
      fdr.verificationChecklist = input.checklist.map((item) => ({
        itemKey: item.itemKey,
        label: item.label || item.itemKey,
        status: item.status,
        comments: item.comments,
        verifiedAt: new Date(),
        verifiedBy: user.email,
      }));
    }

    fdr.verificationStatus = 'VERIFIED';
    fdr.verifiedAt = new Date();
    fdr.verifiedBy = user.email;
    fdr.verificationRemarks = input.remarks;

    fdr.history.push({
      action: 'FDR_VERIFIED',
      performedBy: user.fullName,
      performedByEmail: user.email,
      details: `FDR scrutinized and verified successfully. Checklist validated. Remarks: ${input.remarks}`,
      timestamp: new Date(),
    });

    // Update linked requirement pledged status
    const reqDoc = await Requirement.findOne({ requirementId: fdr.requirementId });
    if (reqDoc) {
      const pledged = reqDoc.pledgedInstruments.find((p) => p.instrumentId === fdr.fdrId);
      if (pledged) {
        pledged.verificationStatus = 'VERIFIED';
        pledged.remarks = `Verified by officer ${user.fullName}`;
        await reqDoc.save();
      }
    }

    // Save FDR
    await fdr.save();

    // Initiate approval workflow if requested (default: true)
    let approvalRecord = null;
    if (input.initiateApprovalWorkflow !== false) {
      approvalRecord = await approvalService.createApprovalRequest(
        {
          instrumentId: fdr.fdrId,
          workflowType: 'FDR_REGISTRATION',
        },
        user
      );
    }

    return {
      fdr: {
        ...fdr.toObject(),
        depositAmountFormatted: DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
      },
      approval: approvalRecord,
    };
  }

  async rejectVerification(id: string, input: RejectVerificationInput, user: AuthUserContext) {
    this.ensureOfficer(user);

    const fdr = await Fdr.findOne({
      $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!fdr) {
      throw AppError.notFound(`Financial instrument #${id} not found`);
    }

    fdr.verificationStatus = 'REJECTED';
    fdr.submissionStatus = 'RETURNED_FOR_CORRECTION';
    fdr.verificationRemarks = input.remarks;

    fdr.history.push({
      action: 'FDR_REJECTED',
      performedBy: user.fullName,
      performedByEmail: user.email,
      details: `Verification rejected. Status set to RETURNED_FOR_CORRECTION. Reason: ${input.remarks}`,
      timestamp: new Date(),
    });

    // Synchronize into requirement
    const reqDoc = await Requirement.findOne({ requirementId: fdr.requirementId });
    if (reqDoc) {
      const pledged = reqDoc.pledgedInstruments.find((p) => p.instrumentId === fdr.fdrId);
      if (pledged) {
        pledged.verificationStatus = 'REJECTED';
        pledged.remarks = `Rejected: ${input.remarks}`;
        await reqDoc.save();
      }
    }

    await fdr.save();

    return {
      ...fdr.toObject(),
      depositAmountFormatted: DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
    };
  }

  async requestClarification(id: string, input: RequestClarificationInput, user: AuthUserContext) {
    this.ensureOfficer(user);

    const fdr = await Fdr.findOne({
      $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!fdr) {
      throw AppError.notFound(`Financial instrument #${id} not found`);
    }

    fdr.verificationStatus = 'UNDER_SCRUTINY';
    fdr.submissionStatus = 'RETURNED_FOR_CORRECTION';

    if (!fdr.clarificationHistory) {
      fdr.clarificationHistory = [];
    }

    fdr.clarificationHistory.push({
      query: input.query,
      requestedBy: user.fullName,
      requestedByEmail: user.email,
      requestedAt: new Date(),
    });

    fdr.history.push({
      action: 'CLARIFICATION_REQUESTED',
      performedBy: user.fullName,
      performedByEmail: user.email,
      details: `Official clarification requested: "${input.query}". Record returned to institution for rectification.`,
      timestamp: new Date(),
    });

    await fdr.save();

    return {
      ...fdr.toObject(),
      depositAmountFormatted: DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
    };
  }

  async getVerificationHistory(id: string, user: AuthUserContext) {
    this.ensureOfficer(user);

    const fdr = await Fdr.findOne({
      $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!fdr) {
      throw AppError.notFound(`Financial instrument #${id} not found`);
    }

    return {
      fdrId: fdr.fdrId,
      institutionId: fdr.institutionId,
      history: fdr.history,
      clarificationHistory: fdr.clarificationHistory || [],
      checklist: fdr.verificationChecklist || [],
    };
  }
}

export const verificationService = new VerificationService();
