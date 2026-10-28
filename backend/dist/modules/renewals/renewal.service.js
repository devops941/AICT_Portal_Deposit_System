"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewalService = exports.RenewalService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Renewal_model_1 = require("../../models/Renewal.model");
const Fdr_model_1 = require("../../models/Fdr.model");
const Requirement_model_1 = require("../../models/Requirement.model");
const requirement_service_1 = require("../requirements/requirement.service");
const renewal_repository_1 = require("./renewal.repository");
const decimal_1 = require("../../utils/decimal");
const appError_1 = require("../../utils/appError");
class RenewalService {
    repo;
    constructor(repo = renewal_repository_1.renewalRepository) {
        this.repo = repo;
    }
    async createRenewal(input, user) {
        const previousFdr = await Fdr_model_1.Fdr.findOne({
            $or: [
                { fdrId: input.previousInstrumentId.toUpperCase().trim() },
                ...(mongoose_1.default.Types.ObjectId.isValid(input.previousInstrumentId)
                    ? [{ _id: input.previousInstrumentId }]
                    : []),
            ],
        });
        if (!previousFdr) {
            throw appError_1.AppError.notFound(`Previous instrument '${input.previousInstrumentId}' not found`);
        }
        if (user.institutionId && previousFdr.institutionId !== user.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to create renewal request for another institution');
        }
        const activeRenewal = await Renewal_model_1.Renewal.findOne({
            previousInstrumentId: previousFdr.fdrId,
            status: { $in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] },
        });
        if (activeRenewal) {
            throw appError_1.AppError.badRequest(`Active renewal request '${activeRenewal.renewalId}' is already in progress for instrument #${previousFdr.fdrNumber}`);
        }
        const year = new Date().getFullYear();
        const suffix = Math.floor(10000 + Math.random() * 90000);
        const renewalId = `REN-${year}-${previousFdr.institutionId}-${suffix}`;
        const now = new Date();
        let replacementDetailsData = undefined;
        let initialStatus = 'DRAFT';
        if (input.replacementDetails) {
            const rep = input.replacementDetails;
            replacementDetailsData = {
                instrumentType: rep.instrumentType || 'FDR',
                bankName: rep.bankName.trim(),
                bankBranch: rep.bankBranch.trim(),
                fdrNumber: rep.fdrNumber.trim(),
                holderName: rep.holderName.trim(),
                depositAmount: mongoose_1.default.Types.Decimal128.fromString(decimal_1.DecimalUtils.toFixedString(rep.depositAmount)),
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
        previousFdr.renewalRequestId = renewalId;
        await previousFdr.save();
        return renewal;
    }
    async submitRenewal(id, input, user) {
        const renewal = await this.repo.findByRenewalId(id) || await this.repo.findById(id);
        if (!renewal) {
            throw appError_1.AppError.notFound(`Renewal request '${id}' not found`);
        }
        if (user.institutionId && renewal.institutionId !== user.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to update renewal of another institution');
        }
        if (renewal.status === 'APPROVED' || renewal.status === 'REJECTED') {
            throw appError_1.AppError.badRequest(`Cannot submit details for renewal in '${renewal.status}' status`);
        }
        const rep = input.replacementDetails;
        const replacementDetails = {
            instrumentType: rep.instrumentType || 'FDR',
            bankName: rep.bankName.trim(),
            bankBranch: rep.bankBranch.trim(),
            fdrNumber: rep.fdrNumber.trim(),
            holderName: rep.holderName.trim(),
            depositAmount: mongoose_1.default.Types.Decimal128.fromString(decimal_1.DecimalUtils.toFixedString(rep.depositAmount)),
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
    async approveRenewal(id, input, user) {
        const isOfficer = user.userType === 'ADMIN' ||
            user.roles.includes('SYSTEM_ADMINISTRATOR') ||
            user.roles.includes('AICTE_OFFICER') ||
            user.roles.includes('FINANCE_OFFICER') ||
            user.roles.includes('APPROVING_AUTHORITY');
        if (!isOfficer) {
            throw appError_1.AppError.forbidden('Only authorized AICTE officers can approve renewals');
        }
        const renewal = await this.repo.findByRenewalId(id) || await this.repo.findById(id);
        if (!renewal) {
            throw appError_1.AppError.notFound(`Renewal request '${id}' not found`);
        }
        if (renewal.status === 'APPROVED') {
            throw appError_1.AppError.badRequest('Renewal request has already been approved');
        }
        if (!renewal.replacementDetails) {
            throw appError_1.AppError.badRequest('Cannot approve renewal without replacement FDR details');
        }
        const previousFdr = await Fdr_model_1.Fdr.findOne({ fdrId: renewal.previousInstrumentId });
        if (!previousFdr) {
            throw appError_1.AppError.notFound(`Original FDR '${renewal.previousInstrumentId}' not found`);
        }
        const now = new Date();
        const rep = renewal.replacementDetails;
        const year = now.getFullYear();
        const suffix = Math.floor(10000 + Math.random() * 90000);
        const replacementFdrId = `FDR-${year}-${renewal.institutionId}-${suffix}`;
        const replacementFdr = new Fdr_model_1.Fdr({
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
        try {
            const requirement = await Requirement_model_1.Requirement.findOne({ requirementId: previousFdr.requirementId });
            if (requirement) {
                const pledged = requirement.pledgedInstruments || [];
                const filteredPledged = pledged.filter((p) => p.instrumentId !== previousFdr.fdrNumber && p.instrumentId !== previousFdr.fdrId);
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
                const compliance = requirement_service_1.requirementService.calculateCompliance(requirement);
                requirement.complianceStatus = compliance.complianceStatus;
                await requirement.save();
            }
        }
        catch (err) {
            console.error('Error recalculating requirement compliance after renewal approval:', err);
        }
        return renewal;
    }
    async getRenewalById(id, user) {
        const renewal = await this.repo.findByRenewalId(id) || await this.repo.findById(id);
        if (!renewal) {
            throw appError_1.AppError.notFound(`Renewal request '${id}' not found`);
        }
        if (user.institutionId && renewal.institutionId !== user.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to renewal details of another institution');
        }
        const previousFdr = await Fdr_model_1.Fdr.findOne({ fdrId: renewal.previousInstrumentId });
        const replacementFdr = renewal.replacementInstrumentId
            ? await Fdr_model_1.Fdr.findOne({ fdrId: renewal.replacementInstrumentId })
            : null;
        return {
            renewal,
            previousFdr: previousFdr
                ? {
                    ...previousFdr.toObject(),
                    depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(previousFdr.depositAmount, previousFdr.currency),
                }
                : null,
            replacementFdr: replacementFdr
                ? {
                    ...replacementFdr.toObject(),
                    depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(replacementFdr.depositAmount, replacementFdr.currency),
                }
                : null,
        };
    }
    async listRenewals(params, user) {
        const query = {};
        if (user.institutionId) {
            query.institutionId = user.institutionId;
        }
        else if (params.institutionId) {
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
                originalAmountFormatted: decimal_1.DecimalUtils.formatCurrency(r.originalAmount),
                replacementAmountFormatted: r.replacementDetails
                    ? decimal_1.DecimalUtils.formatCurrency(r.replacementDetails.depositAmount)
                    : undefined,
            };
        });
        return { data: enriched, total, page, limit };
    }
    async getReplacementHistory(instrumentId, user) {
        const instrument = await Fdr_model_1.Fdr.findOne({
            $or: [
                { fdrId: instrumentId.toUpperCase().trim() },
                ...(mongoose_1.default.Types.ObjectId.isValid(instrumentId) ? [{ _id: instrumentId }] : []),
            ],
        });
        if (!instrument) {
            throw appError_1.AppError.notFound(`Instrument '${instrumentId}' not found`);
        }
        if (user.institutionId && instrument.institutionId !== user.institutionId) {
            throw appError_1.AppError.forbidden('Access denied');
        }
        const ancestors = [];
        let currentPrevId = instrument.previousInstrumentId;
        while (currentPrevId) {
            const prev = await Fdr_model_1.Fdr.findOne({ fdrId: currentPrevId });
            if (!prev)
                break;
            ancestors.unshift({
                ...prev.toObject(),
                depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(prev.depositAmount, prev.currency),
                relation: 'PREDECESSOR',
            });
            currentPrevId = prev.previousInstrumentId;
        }
        const successors = [];
        let currentNextId = instrument.replacementInstrumentId;
        while (currentNextId) {
            const next = await Fdr_model_1.Fdr.findOne({ fdrId: currentNextId });
            if (!next)
                break;
            successors.push({
                ...next.toObject(),
                depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(next.depositAmount, next.currency),
                relation: 'REPLACEMENT',
            });
            currentNextId = next.replacementInstrumentId;
        }
        return {
            currentInstrument: {
                ...instrument.toObject(),
                depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(instrument.depositAmount, instrument.currency),
            },
            ancestors,
            successors,
            totalLineageCount: ancestors.length + 1 + successors.length,
        };
    }
}
exports.RenewalService = RenewalService;
exports.renewalService = new RenewalService();
