"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fdrService = exports.FdrService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fdr_repository_1 = require("./fdr.repository");
const Institution_model_1 = require("../../models/Institution.model");
const Requirement_model_1 = require("../../models/Requirement.model");
const requirement_service_1 = require("../requirements/requirement.service");
const decimal_1 = require("../../utils/decimal");
const appError_1 = require("../../utils/appError");
class FdrService {
    repo;
    constructor(repo = fdr_repository_1.fdrRepository) {
        this.repo = repo;
    }
    async createFdr(input, user) {
        const targetInstCode = input.institutionId || user.institutionId;
        if (!targetInstCode) {
            throw appError_1.AppError.badRequest('Institution ID is required for FDR registration');
        }
        if (user.institutionId && user.institutionId !== targetInstCode) {
            throw appError_1.AppError.forbidden('Access denied to create FDR for another institution');
        }
        const institution = await Institution_model_1.Institution.findOne({
            $or: [
                { code: targetInstCode.toUpperCase() },
                ...(mongoose_1.default.Types.ObjectId.isValid(targetInstCode) ? [{ _id: targetInstCode }] : []),
            ],
        });
        if (!institution) {
            throw appError_1.AppError.badRequest(`Target institution '${targetInstCode}' does not exist`);
        }
        const requirement = await Requirement_model_1.Requirement.findOne({
            $or: [
                { requirementId: input.requirementId.toUpperCase().trim() },
                ...(mongoose_1.default.Types.ObjectId.isValid(input.requirementId) ? [{ _id: input.requirementId }] : []),
            ],
        });
        if (!requirement) {
            throw appError_1.AppError.badRequest(`Linked requirement '${input.requirementId}' not found`);
        }
        const duplicates = await this.repo.findPotentialDuplicates(input.fdrNumber, input.bankName);
        const isDuplicateFlagged = duplicates.length > 0;
        const duplicateReviewNotes = isDuplicateFlagged
            ? `Flagged for scrutiny: Instrument #${input.fdrNumber} matches existing record #${duplicates[0].fdrId} at ${duplicates[0].bankName} (${duplicates[0].institutionName})`
            : undefined;
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const fdrId = `FDR-${year}-${institution.code}-${randomSuffix}`;
        const parsedAmount = decimal_1.DecimalUtils.toFixedString(input.depositAmount);
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
            depositAmount: mongoose_1.default.Types.Decimal128.fromString(parsedAmount),
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
                        ? `FDR registered as draft for ${decimal_1.DecimalUtils.formatCurrency(parsedAmount, input.currency || 'INR')}`
                        : `FDR submitted for official scrutiny. Amount: ${decimal_1.DecimalUtils.formatCurrency(parsedAmount, input.currency || 'INR')}`,
                    timestamp: now,
                },
            ],
        });
        if (!isDraft) {
            await this.syncWithRequirement(fdrDoc, user);
        }
        return fdrDoc;
    }
    async submitFdr(id, user) {
        const fdr = await this.repo.findByIdOrFdrId(id);
        if (!fdr) {
            throw appError_1.AppError.notFound(`FDR '${id}' not found`);
        }
        if (user.institutionId && fdr.institutionId !== user.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to submit FDR of another institution');
        }
        if (fdr.submissionStatus === 'SUBMITTED' || fdr.submissionStatus === 'APPROVED') {
            throw appError_1.AppError.badRequest(`FDR is already submitted (current status: ${fdr.submissionStatus})`);
        }
        const now = new Date();
        const updated = await this.repo.update(fdr._id.toString(), {
            submissionStatus: 'SUBMITTED',
            verificationStatus: 'PENDING',
            submittedAt: now,
        });
        if (!updated) {
            throw appError_1.AppError.internal('Failed to submit FDR');
        }
        await this.repo.appendActivityLog(fdr._id.toString(), {
            action: 'FDR_SUBMITTED',
            performedBy: user.fullName || user.email,
            performedByEmail: user.email,
            details: 'Draft FDR finalized and submitted for official scrutiny and compliance recalculation',
            timestamp: now,
        });
        await this.syncWithRequirement(updated, user);
        return updated;
    }
    async updateFdr(id, input, user) {
        const fdr = await this.repo.findByIdOrFdrId(id);
        if (!fdr) {
            throw appError_1.AppError.notFound(`FDR '${id}' not found`);
        }
        if (user.institutionId && fdr.institutionId !== user.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to update FDR of another institution');
        }
        const isCentralAdmin = user.userType === 'ADMIN' || user.roles.includes('SYSTEM_ADMINISTRATOR');
        const canEdit = fdr.submissionStatus === 'DRAFT' ||
            fdr.submissionStatus === 'RETURNED_FOR_CORRECTION' ||
            isCentralAdmin;
        if (!canEdit) {
            throw appError_1.AppError.forbidden(`Only draft records can be edited. Current status is '${fdr.submissionStatus}'. Use correction workflow.`);
        }
        const updates = {};
        if (input.bankName)
            updates.bankName = input.bankName.trim();
        if (input.bankBranch)
            updates.bankBranch = input.bankBranch.trim();
        if (input.fdrNumber)
            updates.fdrNumber = input.fdrNumber.trim();
        if (input.holderName)
            updates.holderName = input.holderName.trim();
        if (input.depositAmount) {
            const parsed = decimal_1.DecimalUtils.toFixedString(input.depositAmount);
            updates.depositAmount = mongoose_1.default.Types.Decimal128.fromString(parsed);
        }
        if (input.issueDate)
            updates.issueDate = new Date(input.issueDate);
        if (input.maturityDate)
            updates.maturityDate = new Date(input.maturityDate);
        if (input.currency)
            updates.currency = input.currency;
        if (input.isJointAccount !== undefined)
            updates.isJointAccount = input.isJointAccount;
        if (input.autoRenewal !== undefined)
            updates.autoRenewal = input.autoRenewal;
        if (input.interestRate !== undefined)
            updates.interestRate = input.interestRate;
        if (input.remarks !== undefined)
            updates.remarks = input.remarks;
        if (input.documentReferences)
            updates.documentReferences = input.documentReferences;
        if (input.duplicateReviewNotes !== undefined)
            updates.duplicateReviewNotes = input.duplicateReviewNotes;
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
            throw appError_1.AppError.internal('Failed to update FDR');
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
    async getFdrById(id, institutionScope) {
        const fdr = await this.repo.findByIdOrFdrId(id);
        if (!fdr) {
            throw appError_1.AppError.notFound(`FDR '${id}' not found`);
        }
        if (institutionScope && fdr.institutionId !== institutionScope) {
            throw appError_1.AppError.forbidden('Access denied to access FDR of another institution');
        }
        return fdr;
    }
    async getFdrs(params, institutionScope) {
        return this.repo.findWithPagination(params, institutionScope);
    }
    async getFdrHistory(id, institutionScope) {
        const fdr = await this.getFdrById(id, institutionScope);
        return fdr.history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    async getDashboardMetrics(institutionScope) {
        return this.repo.getMetrics(institutionScope);
    }
    async syncWithRequirement(fdr, user) {
        try {
            const requirement = await Requirement_model_1.Requirement.findOne({
                requirementId: fdr.requirementId.toUpperCase(),
            });
            if (!requirement)
                return;
            const existing = requirement.pledgedInstruments.find((p) => p.instrumentId === fdr.fdrNumber || p.instrumentId === fdr.fdrId);
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
            const compliance = requirement_service_1.requirementService.calculateCompliance(requirement);
            requirement.complianceStatus = compliance.complianceStatus;
            await requirement.save();
        }
        catch (e) {
            console.error('Failed to sync FDR with requirement:', e);
        }
    }
}
exports.FdrService = FdrService;
exports.fdrService = new FdrService();
