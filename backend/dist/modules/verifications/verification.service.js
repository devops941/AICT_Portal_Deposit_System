"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationService = exports.VerificationService = exports.DEFAULT_VERIFICATION_CHECKLIST = void 0;
const Fdr_model_1 = require("../../models/Fdr.model");
const Institution_model_1 = require("../../models/Institution.model");
const Requirement_model_1 = require("../../models/Requirement.model");
const Document_model_1 = require("../../models/Document.model");
const Discrepancy_model_1 = require("../../models/Discrepancy.model");
const Approval_model_1 = require("../../models/Approval.model");
const approval_service_1 = require("../approvals/approval.service");
const appError_1 = require("../../utils/appError");
const decimal_1 = require("../../utils/decimal");
exports.DEFAULT_VERIFICATION_CHECKLIST = [
    {
        itemKey: 'INSTITUTION_INFO',
        label: 'Institution identity and AICTE affiliation code validity',
        status: 'PENDING',
    },
    {
        itemKey: 'BANK_INFO',
        label: 'Recognized Scheduled Commercial Bank & branch authenticity',
        status: 'PENDING',
    },
    {
        itemKey: 'FDR_NUMBER',
        label: 'Legible FDR certificate number and matching bank ledger pattern',
        status: 'PENDING',
    },
    {
        itemKey: 'DEPOSIT_AMOUNT',
        label: 'Principal deposit amount matches or exceeds mandated requirement',
        status: 'PENDING',
    },
    {
        itemKey: 'ISSUE_DATE',
        label: 'Issue date conforms to stipulated academic registration period',
        status: 'PENDING',
    },
    {
        itemKey: 'MATURITY_DATE',
        label: 'Maturity tenure satisfies minimum non-liquidation duration',
        status: 'PENDING',
    },
    {
        itemKey: 'HOLDER_NAME',
        label: 'Joint account mandate explicitly designates Regional Officer AICTE',
        status: 'PENDING',
    },
    {
        itemKey: 'DOCUMENT_READABILITY',
        label: 'Scanned instrument receipts and seals are clear and legible',
        status: 'PENDING',
    },
    {
        itemKey: 'SUPPORTING_DOCS',
        label: 'All mandatory supporting letters (Bank Undertaking, SFMS) attached',
        status: 'PENDING',
    },
    {
        itemKey: 'DUPLICATE_REVIEW',
        label: 'De-duplication scan reviewed; no identical active instruments',
        status: 'PENDING',
    },
];
class VerificationService {
    ensureOfficer(user) {
        const isOfficer = user.userType === 'ADMIN' ||
            user.roles.some((r) => [
                'SYSTEM_ADMINISTRATOR',
                'VERIFICATION_OFFICER',
                'SENIOR_VERIFICATION_OFFICER',
                'APPROVING_AUTHORITY',
            ].includes(r));
        if (!isOfficer) {
            throw appError_1.AppError.forbidden('Only authorized AICTE verification officers can access verification desk');
        }
    }
    async getPendingVerifications(params, user) {
        this.ensureOfficer(user);
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
        const skip = (page - 1) * limit;
        const query = {
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
            Fdr_model_1.Fdr.find(query).sort({ submittedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
            Fdr_model_1.Fdr.countDocuments(query),
        ]);
        const data = rawItems.map((item) => ({
            ...item.toObject(),
            depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(item.depositAmount, item.currency),
        }));
        return { data, total, page, limit };
    }
    async getVerificationPacket(id, user) {
        this.ensureOfficer(user);
        const fdr = await Fdr_model_1.Fdr.findOne({
            $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
        });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Financial instrument #${id} not found`);
        }
        const [institution, requirement, documents, discrepancies, activeApproval] = await Promise.all([
            Institution_model_1.Institution.findOne({ code: fdr.institutionId }),
            Requirement_model_1.Requirement.findOne({ requirementId: fdr.requirementId }),
            Document_model_1.DocumentRecord.find({ instrumentId: fdr.fdrId }),
            Discrepancy_model_1.Discrepancy.find({ instrumentId: fdr.fdrId }).sort({ createdAt: -1 }),
            Approval_model_1.Approval.findOne({ instrumentId: fdr.fdrId, status: { $in: ['PENDING', 'ESCALATED'] } }),
        ]);
        const savedChecklist = fdr.verificationChecklist || [];
        const checklist = exports.DEFAULT_VERIFICATION_CHECKLIST.map((item) => {
            const existing = savedChecklist.find((s) => s.itemKey === item.itemKey);
            return existing || item;
        });
        return {
            fdr: {
                ...fdr.toObject(),
                depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
            },
            institution,
            requirement: requirement
                ? {
                    ...requirement.toObject(),
                    requiredAmountFormatted: decimal_1.DecimalUtils.formatCurrency(requirement.requiredAmount, requirement.currency),
                }
                : null,
            documents,
            discrepancies,
            checklist,
            activeApproval,
        };
    }
    async verifyFdr(id, input, user) {
        this.ensureOfficer(user);
        const fdr = await Fdr_model_1.Fdr.findOne({
            $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
        });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Financial instrument #${id} not found`);
        }
        if (fdr.submissionStatus === 'DRAFT') {
            throw appError_1.AppError.badRequest('Draft records cannot be verified until officially submitted by the institution');
        }
        const failedItem = input.checklist?.find((c) => c.status === 'FAIL');
        if (failedItem) {
            throw appError_1.AppError.badRequest(`Cannot verify FDR because checklist item "${failedItem.itemKey}" failed. Please raise a discrepancy or request clarification instead.`);
        }
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
        const reqDoc = await Requirement_model_1.Requirement.findOne({ requirementId: fdr.requirementId });
        if (reqDoc) {
            const pledged = reqDoc.pledgedInstruments.find((p) => p.instrumentId === fdr.fdrId);
            if (pledged) {
                pledged.verificationStatus = 'VERIFIED';
                pledged.remarks = `Verified by officer ${user.fullName}`;
                await reqDoc.save();
            }
        }
        await fdr.save();
        let approvalRecord = null;
        if (input.initiateApprovalWorkflow !== false) {
            approvalRecord = await approval_service_1.approvalService.createApprovalRequest({
                instrumentId: fdr.fdrId,
                workflowType: 'FDR_REGISTRATION',
            }, user);
        }
        return {
            fdr: {
                ...fdr.toObject(),
                depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
            },
            approval: approvalRecord,
        };
    }
    async rejectVerification(id, input, user) {
        this.ensureOfficer(user);
        const fdr = await Fdr_model_1.Fdr.findOne({
            $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
        });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Financial instrument #${id} not found`);
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
        const reqDoc = await Requirement_model_1.Requirement.findOne({ requirementId: fdr.requirementId });
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
            depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
        };
    }
    async requestClarification(id, input, user) {
        this.ensureOfficer(user);
        const fdr = await Fdr_model_1.Fdr.findOne({
            $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
        });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Financial instrument #${id} not found`);
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
            depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
        };
    }
    async getVerificationHistory(id, user) {
        this.ensureOfficer(user);
        const fdr = await Fdr_model_1.Fdr.findOne({
            $or: [{ fdrId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
        });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Financial instrument #${id} not found`);
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
exports.VerificationService = VerificationService;
exports.verificationService = new VerificationService();
