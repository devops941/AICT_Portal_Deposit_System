"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseService = exports.ReleaseService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Release_model_1 = require("../../models/Release.model");
const Fdr_model_1 = require("../../models/Fdr.model");
const Requirement_model_1 = require("../../models/Requirement.model");
const requirement_service_1 = require("../requirements/requirement.service");
const release_repository_1 = require("./release.repository");
const release_eligibility_1 = require("./release.eligibility");
const decimal_1 = require("../../utils/decimal");
const appError_1 = require("../../utils/appError");
class ReleaseService {
    repo;
    constructor(repo = release_repository_1.releaseRepository) {
        this.repo = repo;
    }
    async assessEligibility(instrumentId, user) {
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
            throw appError_1.AppError.forbidden('Access denied to instrument belonging to another institution');
        }
        return release_eligibility_1.eligibilityAssessmentEngine.assessEligibility(instrument.fdrId);
    }
    async createRelease(input, user) {
        const instrument = await Fdr_model_1.Fdr.findOne({
            $or: [
                { fdrId: input.instrumentId.toUpperCase().trim() },
                ...(mongoose_1.default.Types.ObjectId.isValid(input.instrumentId) ? [{ _id: input.instrumentId }] : []),
            ],
        });
        if (!instrument) {
            throw appError_1.AppError.notFound(`Target instrument '${input.instrumentId}' not found`);
        }
        if (user.institutionId && instrument.institutionId !== user.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to create release request for another institution');
        }
        const assessment = await release_eligibility_1.eligibilityAssessmentEngine.assessEligibility(instrument.fdrId, input.requestedAmount, input.supportingDocuments);
        if (!assessment.isEligible && assessment.blockingReasons.length > 0) {
            throw appError_1.AppError.badRequest(`Ineligible for release: ${assessment.blockingReasons.join('; ')}`);
        }
        const parsedAmount = input.requestedAmount
            ? decimal_1.DecimalUtils.toFixedString(input.requestedAmount)
            : decimal_1.DecimalUtils.toFixedString(instrument.depositAmount);
        const year = new Date().getFullYear();
        const suffix = Math.floor(10000 + Math.random() * 90000);
        const releaseId = `REL-${year}-${instrument.institutionId}-${suffix}`;
        const now = new Date();
        const approvalLevels = [
            {
                levelNumber: 1,
                title: 'Level 1: Verification Officer Scrutiny',
                roleRequired: 'VERIFICATION_OFFICER',
                status: 'PENDING',
            },
            {
                levelNumber: 2,
                title: 'Level 2: Approving Authority Final Sanction',
                roleRequired: 'APPROVING_AUTHORITY',
                status: 'PENDING',
            },
        ];
        const release = await this.repo.create({
            releaseId,
            institutionId: instrument.institutionId,
            institutionName: instrument.institutionName,
            requirementId: instrument.requirementId,
            requirementTitle: instrument.requirementTitle,
            instrumentId: instrument.fdrId,
            fdrNumber: instrument.fdrNumber,
            bankName: instrument.bankName,
            requestedAmount: mongoose_1.default.Types.Decimal128.fromString(parsedAmount),
            requestReason: input.requestReason.trim(),
            supportingDocuments: input.supportingDocuments || [],
            requestDate: now,
            status: 'SUBMITTED',
            approvalStatus: 'PENDING',
            isEligible: assessment.isEligible,
            eligibilityScore: assessment.eligibilityScore,
            eligibilityChecks: assessment.checks,
            blockingReasons: assessment.blockingReasons,
            currentLevel: 1,
            totalLevels: approvalLevels.length,
            approvalLevels,
            requestedBy: user.fullName || user.email,
            requestedByEmail: user.email,
            history: [
                {
                    action: 'RELEASE_REQUEST_SUBMITTED',
                    performedBy: user.fullName || user.email,
                    performedByEmail: user.email,
                    role: user.roles?.[0] || 'INSTITUTION_USER',
                    details: `Release request initiated for FDR #${instrument.fdrNumber} (${instrument.bankName}) for amount ₹${parsedAmount}`,
                    timestamp: now,
                },
            ],
        });
        instrument.releaseRequestId = release.releaseId;
        await instrument.save();
        return release;
    }
    async reviewRelease(id, input, user) {
        const isOfficer = user.userType === 'ADMIN' ||
            user.roles.includes('SYSTEM_ADMINISTRATOR') ||
            user.roles.includes('VERIFICATION_OFFICER') ||
            user.roles.includes('SENIOR_VERIFICATION_OFFICER') ||
            user.roles.includes('AICTE_OFFICER') ||
            user.roles.includes('APPROVING_AUTHORITY');
        if (!isOfficer) {
            throw appError_1.AppError.forbidden('Only authorized scrutiny officers can review release requests');
        }
        const release = await this.repo.findByIdOrReleaseId(id);
        if (!release) {
            throw appError_1.AppError.notFound(`Release request '${id}' not found`);
        }
        if (release.status === 'APPROVED' || release.status === 'REJECTED' || release.status === 'CLOSED') {
            throw appError_1.AppError.badRequest(`Cannot modify release request in '${release.status}' status`);
        }
        const now = new Date();
        if (input.action === 'CLARIFICATION_REQUIRED') {
            if (!input.clarificationQuery?.trim()) {
                throw appError_1.AppError.badRequest('Clarification query is required when requesting clarification');
            }
            release.status = 'CLARIFICATION_REQUIRED';
            release.approvalStatus = 'UNDER_SCRUTINY';
            release.clarificationQuery = input.clarificationQuery.trim();
            release.history.push({
                action: 'CLARIFICATION_REQUESTED',
                performedBy: user.fullName || user.email,
                performedByEmail: user.email,
                role: user.roles?.[0],
                details: `Clarification requested: "${input.clarificationQuery.trim()}"`,
                timestamp: now,
            });
        }
        else {
            release.status = 'UNDER_REVIEW';
            release.approvalStatus = 'UNDER_SCRUTINY';
            if (input.decisionRemarks) {
                release.decisionRemarks = input.decisionRemarks.trim();
            }
            release.history.push({
                action: 'MOVED_TO_SCRUTINY',
                performedBy: user.fullName || user.email,
                performedByEmail: user.email,
                role: user.roles?.[0],
                details: input.decisionRemarks || 'Release request taken under active scrutiny',
                timestamp: now,
            });
        }
        await release.save();
        return release;
    }
    async respondClarification(id, input, user) {
        const release = await this.repo.findByIdOrReleaseId(id);
        if (!release) {
            throw appError_1.AppError.notFound(`Release request '${id}' not found`);
        }
        if (user.institutionId && release.institutionId !== user.institutionId) {
            throw appError_1.AppError.forbidden('Access denied');
        }
        if (release.status !== 'CLARIFICATION_REQUIRED') {
            throw appError_1.AppError.badRequest(`Cannot respond to clarification when status is '${release.status}'`);
        }
        const now = new Date();
        release.clarificationResponse = input.response.trim();
        if (input.supportingDocuments && input.supportingDocuments.length > 0) {
            release.supportingDocuments = [
                ...new Set([...release.supportingDocuments, ...input.supportingDocuments]),
            ];
        }
        release.status = 'UNDER_REVIEW';
        release.history.push({
            action: 'CLARIFICATION_SUBMITTED',
            performedBy: user.fullName || user.email,
            performedByEmail: user.email,
            role: 'INSTITUTION_USER',
            details: `Clarification response provided: "${input.response.trim()}"`,
            timestamp: now,
        });
        await release.save();
        return release;
    }
    async approveRelease(id, input, user) {
        const release = await this.repo.findByIdOrReleaseId(id);
        if (!release) {
            throw appError_1.AppError.notFound(`Release request '${id}' not found`);
        }
        if (release.status === 'APPROVED' || release.status === 'AUTHORIZED_RELEASE' || release.status === 'CLOSED') {
            throw appError_1.AppError.badRequest(`Release request has already been approved (Current status: ${release.status})`);
        }
        if (release.status === 'REJECTED') {
            throw appError_1.AppError.badRequest('Cannot approve a rejected release request');
        }
        if (user.email === release.requestedByEmail) {
            throw appError_1.AppError.forbidden('Separation of Duties violation: A user cannot approve their own release request');
        }
        const currentLevelIdx = release.currentLevel - 1;
        const currentStep = release.approvalLevels[currentLevelIdx];
        if (!currentStep) {
            throw appError_1.AppError.badRequest('No pending approval levels remaining');
        }
        const isSuperAdmin = user.userType === 'ADMIN' || user.roles.includes('SYSTEM_ADMINISTRATOR');
        const hasRole = user.roles.includes(currentStep.roleRequired) ||
            (currentStep.roleRequired === 'VERIFICATION_OFFICER' &&
                (user.roles.includes('SENIOR_VERIFICATION_OFFICER') || user.roles.includes('AICTE_OFFICER'))) ||
            isSuperAdmin;
        if (!hasRole) {
            throw appError_1.AppError.forbidden(`Access denied: Current level (${currentStep.title}) requires role '${currentStep.roleRequired}'`);
        }
        const now = new Date();
        currentStep.status = 'APPROVED';
        currentStep.actionBy = user.fullName || user.email;
        currentStep.actionByEmail = user.email;
        currentStep.actionDate = now;
        currentStep.remarks = input.decisionRemarks.trim();
        release.history.push({
            action: `LEVEL_${release.currentLevel}_APPROVED`,
            performedBy: user.fullName || user.email,
            performedByEmail: user.email,
            role: user.roles?.[0],
            details: `${currentStep.title} approved. Remarks: ${input.decisionRemarks.trim()}`,
            timestamp: now,
        });
        if (release.currentLevel < release.totalLevels) {
            release.currentLevel++;
            release.status = 'UNDER_REVIEW';
            release.approvalStatus = 'UNDER_SCRUTINY';
        }
        else {
            release.status = 'APPROVED';
            release.approvalStatus = 'APPROVED';
            release.decisionRemarks = input.decisionRemarks.trim();
        }
        await release.save();
        return release;
    }
    async rejectRelease(id, input, user) {
        const isOfficer = user.userType === 'ADMIN' ||
            user.roles.includes('SYSTEM_ADMINISTRATOR') ||
            user.roles.includes('VERIFICATION_OFFICER') ||
            user.roles.includes('SENIOR_VERIFICATION_OFFICER') ||
            user.roles.includes('AICTE_OFFICER') ||
            user.roles.includes('APPROVING_AUTHORITY');
        if (!isOfficer) {
            throw appError_1.AppError.forbidden('Only authorized officers can reject release requests');
        }
        const release = await this.repo.findByIdOrReleaseId(id);
        if (!release) {
            throw appError_1.AppError.notFound(`Release request '${id}' not found`);
        }
        if (release.status === 'APPROVED' || release.status === 'AUTHORIZED_RELEASE' || release.status === 'CLOSED') {
            throw appError_1.AppError.badRequest(`Cannot reject release request in finalized '${release.status}' status`);
        }
        if (release.status === 'REJECTED') {
            throw appError_1.AppError.badRequest('Release request is already rejected');
        }
        const now = new Date();
        release.status = 'REJECTED';
        release.approvalStatus = 'REJECTED';
        release.rejectionReason = input.rejectionReason.trim();
        release.history.push({
            action: 'RELEASE_REJECTED',
            performedBy: user.fullName || user.email,
            performedByEmail: user.email,
            role: user.roles?.[0],
            details: `Release request rejected. Reason: ${input.rejectionReason.trim()}`,
            timestamp: now,
        });
        await release.save();
        return release;
    }
    async authorizeRelease(id, user) {
        const isAuthorizedApprover = user.userType === 'ADMIN' ||
            user.roles.includes('APPROVING_AUTHORITY') ||
            user.roles.includes('FINANCE_OFFICER');
        if (!isAuthorizedApprover) {
            throw appError_1.AppError.forbidden('Only Approving Authority or Finance Officer can issue final Release Authorization');
        }
        const release = await this.repo.findByIdOrReleaseId(id);
        if (!release) {
            throw appError_1.AppError.notFound(`Release request '${id}' not found`);
        }
        if (release.status !== 'APPROVED') {
            throw appError_1.AppError.badRequest(`Cannot authorize release: Current status is '${release.status}'. Workflow must be fully APPROVED first.`);
        }
        const now = new Date();
        release.status = 'AUTHORIZED_RELEASE';
        release.releasedAmount = release.requestedAmount;
        release.authorizedReleaseAt = now;
        release.authorizedReleaseBy = user.email;
        release.history.push({
            action: 'RELEASE_AUTHORIZED',
            performedBy: user.fullName || user.email,
            performedByEmail: user.email,
            role: user.roles?.[0],
            details: `Statutory release authorized by council authority. Release amount: ₹${decimal_1.DecimalUtils.toFixedString(release.requestedAmount)}`,
            timestamp: now,
        });
        await release.save();
        const instrument = await Fdr_model_1.Fdr.findOne({ fdrId: release.instrumentId });
        if (instrument) {
            instrument.lifecycleStatus = 'RELEASED';
            instrument.releasedAt = now;
            instrument.releasedBy = user.email;
            instrument.history.push({
                action: 'DEPOSIT_RELEASED',
                performedBy: user.fullName || user.email,
                performedByEmail: user.email,
                details: `Statutory security deposit discharged under Release Request #${release.releaseId}`,
                timestamp: now,
            });
            await instrument.save();
        }
        try {
            const requirement = await Requirement_model_1.Requirement.findOne({ requirementId: release.requirementId });
            if (requirement) {
                requirement.pledgedInstruments = (requirement.pledgedInstruments || []).filter((p) => p.instrumentId !== instrument?.fdrNumber && p.instrumentId !== instrument?.fdrId);
                const comp = requirement_service_1.requirementService.calculateCompliance(requirement);
                requirement.complianceStatus = comp.complianceStatus;
                await requirement.save();
            }
        }
        catch (err) {
            console.error('Failed to sync requirement after release authorization:', err);
        }
        return release;
    }
    async closeRelease(id, input, user) {
        const isOfficer = user.userType === 'ADMIN' ||
            user.roles.includes('SYSTEM_ADMINISTRATOR') ||
            user.roles.includes('VERIFICATION_OFFICER') ||
            user.roles.includes('SENIOR_VERIFICATION_OFFICER') ||
            user.roles.includes('AICTE_OFFICER') ||
            user.roles.includes('APPROVING_AUTHORITY');
        if (!isOfficer) {
            throw appError_1.AppError.forbidden('Only authorized officers can close release records');
        }
        const release = await this.repo.findByIdOrReleaseId(id);
        if (!release) {
            throw appError_1.AppError.notFound(`Release request '${id}' not found`);
        }
        if (release.status === 'CLOSED') {
            throw appError_1.AppError.badRequest('Release request is already closed');
        }
        if (release.status !== 'AUTHORIZED_RELEASE' && release.status !== 'APPROVED') {
            throw appError_1.AppError.badRequest(`Cannot close release: Current status is '${release.status}'. Must be AUTHORIZED_RELEASE or APPROVED.`);
        }
        const now = new Date();
        release.status = 'CLOSED';
        release.closedAt = now;
        release.closedBy = user.email;
        release.decisionRemarks = input.closureRemarks.trim();
        release.history.push({
            action: 'RELEASE_RECORD_CLOSED',
            performedBy: user.fullName || user.email,
            performedByEmail: user.email,
            role: user.roles?.[0],
            details: `Release record closed and archived. Remarks: ${input.closureRemarks.trim()}${input.settlementReference ? ` (Ref: ${input.settlementReference.trim()})` : ''}`,
            timestamp: now,
        });
        await release.save();
        return release;
    }
    async getReleaseById(id, user) {
        const release = await this.repo.findByIdOrReleaseId(id);
        if (!release) {
            throw appError_1.AppError.notFound(`Release request '${id}' not found`);
        }
        if (user.institutionId && release.institutionId !== user.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to release details of another institution');
        }
        const instrument = await Fdr_model_1.Fdr.findOne({ fdrId: release.instrumentId });
        const requirement = await Requirement_model_1.Requirement.findOne({ requirementId: release.requirementId });
        return {
            release: {
                ...release.toObject(),
                requestedAmountFormatted: decimal_1.DecimalUtils.formatCurrency(release.requestedAmount),
                releasedAmountFormatted: release.releasedAmount
                    ? decimal_1.DecimalUtils.formatCurrency(release.releasedAmount)
                    : undefined,
            },
            instrument: instrument
                ? {
                    ...instrument.toObject(),
                    depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(instrument.depositAmount, instrument.currency),
                }
                : null,
            requirement: requirement
                ? {
                    ...requirement.toObject(),
                    requiredAmountFormatted: decimal_1.DecimalUtils.formatCurrency(requirement.requiredAmount, requirement.currency),
                }
                : null,
        };
    }
    async listReleases(params, user) {
        const query = {};
        if (user.institutionId) {
            query.institutionId = user.institutionId;
        }
        else if (params.institutionId) {
            query.institutionId = params.institutionId;
        }
        if (params.status && params.status !== 'ALL') {
            query.status = params.status;
        }
        if (params.requirementId) {
            query.requirementId = params.requirementId;
        }
        if (params.search) {
            const regex = new RegExp(params.search.trim(), 'i');
            query.$or = [
                { releaseId: regex },
                { instrumentId: regex },
                { fdrNumber: regex },
                { institutionName: regex },
                { bankName: regex },
            ];
        }
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
        const skip = (page - 1) * limit;
        const { releases, total } = await this.repo.find(query, skip, limit);
        const enriched = releases.map((r) => ({
            ...r.toObject(),
            requestedAmountFormatted: decimal_1.DecimalUtils.formatCurrency(r.requestedAmount),
            releasedAmountFormatted: r.releasedAmount
                ? decimal_1.DecimalUtils.formatCurrency(r.releasedAmount)
                : undefined,
        }));
        return { data: enriched, total, page, limit };
    }
    async getDashboardMetrics(user) {
        const query = {};
        if (user.institutionId) {
            query.institutionId = user.institutionId;
        }
        const allReleases = await Release_model_1.Release.find(query);
        let totalReleasedDec = decimal_1.DecimalUtils.from(0);
        let pendingCount = 0;
        let underReviewCount = 0;
        let clarificationCount = 0;
        let approvedCount = 0;
        let authorizedCount = 0;
        let closedCount = 0;
        let rejectedCount = 0;
        for (const r of allReleases) {
            if (r.status === 'SUBMITTED')
                pendingCount++;
            else if (r.status === 'UNDER_REVIEW')
                underReviewCount++;
            else if (r.status === 'CLARIFICATION_REQUIRED')
                clarificationCount++;
            else if (r.status === 'APPROVED')
                approvedCount++;
            else if (r.status === 'AUTHORIZED_RELEASE') {
                authorizedCount++;
                totalReleasedDec = decimal_1.DecimalUtils.add(totalReleasedDec, r.requestedAmount);
            }
            else if (r.status === 'CLOSED') {
                closedCount++;
                totalReleasedDec = decimal_1.DecimalUtils.add(totalReleasedDec, r.requestedAmount);
            }
            else if (r.status === 'REJECTED')
                rejectedCount++;
        }
        return {
            totalRequests: allReleases.length,
            pending: pendingCount,
            underReview: underReviewCount,
            clarificationRequired: clarificationCount,
            approved: approvedCount,
            authorizedRelease: authorizedCount,
            closed: closedCount,
            rejected: rejectedCount,
            totalReleasedAmount: decimal_1.DecimalUtils.formatCurrency(totalReleasedDec),
        };
    }
}
exports.ReleaseService = ReleaseService;
exports.releaseService = new ReleaseService();
