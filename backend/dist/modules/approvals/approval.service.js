"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvalService = exports.ApprovalService = void 0;
const approval_repository_1 = require("./approval.repository");
const Approval_model_1 = require("../../models/Approval.model");
const Fdr_model_1 = require("../../models/Fdr.model");
const Requirement_model_1 = require("../../models/Requirement.model");
const appError_1 = require("../../utils/appError");
const decimal_1 = require("../../utils/decimal");
class ApprovalService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    checkApprovalPermissions(user, roleRequired) {
        const isExplicitApprover = user.roles.includes(roleRequired) ||
            user.roles.includes('APPROVING_AUTHORITY') ||
            user.roles.includes('SYSTEM_ADMINISTRATOR') ||
            user.userType === 'ADMIN' ||
            (roleRequired === 'VERIFICATION_OFFICER' && user.roles.includes('SENIOR_VERIFICATION_OFFICER'));
        if (!isExplicitApprover) {
            throw appError_1.AppError.forbidden(`Financial approval requires an explicit [${roleRequired}] role.`);
        }
    }
    checkSeparationOfDuties(approval, fdrCreatedBy, user) {
        const isSelfApproval = approval.requestedBy === user.id ||
            (approval.requestedByEmail && approval.requestedByEmail.toLowerCase() === user.email.toLowerCase()) ||
            (fdrCreatedBy && fdrCreatedBy.toLowerCase() === user.email.toLowerCase());
        if (isSelfApproval && user.userType !== 'ADMIN' && !user.roles.includes('SYSTEM_ADMINISTRATOR')) {
            throw appError_1.AppError.forbidden('Separation of Duties violation: A user cannot approve their own financial release or registration request.');
        }
    }
    async createApprovalRequest(input, user) {
        const fdr = await Fdr_model_1.Fdr.findOne({
            $or: [
                { fdrId: input.instrumentId },
                ...(input.instrumentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: input.instrumentId }] : []),
            ],
        });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Financial instrument #${input.instrumentId} not found`);
        }
        const existingActive = await Approval_model_1.Approval.findOne({
            instrumentId: fdr.fdrId,
            status: { $in: ['PENDING', 'ESCALATED'] },
        });
        if (existingActive) {
            return existingActive;
        }
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const approvalId = `APP-${year}-${randomSuffix}`;
        const defaultSteps = [
            {
                stepNumber: 1,
                title: 'Level 1: Verification Officer Scrutiny',
                roleRequired: 'VERIFICATION_OFFICER',
                status: 'PENDING',
            },
            {
                stepNumber: 2,
                title: 'Level 2: Approving Authority Final Sanction',
                roleRequired: 'APPROVING_AUTHORITY',
                status: 'PENDING',
            },
        ];
        const steps = input.configuredSteps && input.configuredSteps.length > 0
            ? input.configuredSteps.map((s, idx) => ({
                stepNumber: s.stepNumber || idx + 1,
                title: s.title,
                roleRequired: s.roleRequired,
                assignedApproverEmail: s.assignedApproverEmail,
                status: 'PENDING',
            }))
            : defaultSteps;
        const approval = await this.repo.create({
            approvalId,
            instrumentId: fdr.fdrId,
            institutionId: fdr.institutionId,
            institutionName: fdr.institutionName,
            requirementId: fdr.requirementId,
            requirementTitle: fdr.requirementTitle,
            workflowType: input.workflowType || 'FDR_REGISTRATION',
            requestedBy: user.id,
            requestedByEmail: user.email,
            requestedByName: user.fullName,
            amount: fdr.depositAmount,
            currentStep: 1,
            totalSteps: steps.length,
            status: 'PENDING',
            steps,
            approvalHistory: [
                {
                    action: 'SUBMITTED',
                    stepNumber: 1,
                    performedBy: user.fullName,
                    performedByEmail: user.email,
                    remarks: 'Approval workflow request initiated for financial instrument.',
                    timestamp: new Date(),
                },
            ],
            isCompleted: false,
        });
        fdr.approvalId = approval.approvalId;
        fdr.history.push({
            action: 'APPROVAL_REQUESTED',
            performedBy: user.fullName,
            performedByEmail: user.email,
            details: `Initiated multi-level approval workflow #${approval.approvalId} (${steps.length} levels).`,
            timestamp: new Date(),
        });
        await fdr.save();
        return approval;
    }
    async approveStep(id, input, user) {
        const approval = await this.repo.findById(id);
        if (!approval) {
            throw appError_1.AppError.notFound(`Approval request #${id} not found`);
        }
        if (approval.isCompleted || approval.status === 'APPROVED' || approval.status === 'REJECTED') {
            throw appError_1.AppError.badRequest(`Cannot approve finalized workflow (${approval.status})`);
        }
        const currentStepIndex = approval.steps.findIndex((s) => s.stepNumber === approval.currentStep);
        if (currentStepIndex === -1) {
            throw appError_1.AppError.badRequest(`Invalid current step number ${approval.currentStep}`);
        }
        const currentStep = approval.steps[currentStepIndex];
        const fdr = await Fdr_model_1.Fdr.findOne({ fdrId: approval.instrumentId });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Linked FDR #${approval.instrumentId} not found`);
        }
        this.checkSeparationOfDuties(approval, fdr.createdBy, user);
        this.checkApprovalPermissions(user, currentStep.roleRequired);
        currentStep.status = 'APPROVED';
        currentStep.actionBy = user.fullName;
        currentStep.actionByEmail = user.email;
        currentStep.actionDate = new Date();
        currentStep.remarks = input.remarks;
        approval.approvalHistory.push({
            action: 'APPROVED',
            stepNumber: currentStep.stepNumber,
            performedBy: user.fullName,
            performedByEmail: user.email,
            remarks: input.remarks,
            timestamp: new Date(),
        });
        if (approval.currentStep < approval.totalSteps) {
            approval.currentStep += 1;
            approval.status = 'PENDING';
            fdr.history.push({
                action: 'APPROVAL_STEP_CONCURRED',
                performedBy: user.fullName,
                performedByEmail: user.email,
                details: `Step ${currentStep.stepNumber} (${currentStep.title}) approved. Advanced to Step ${approval.currentStep}. Remarks: ${input.remarks}`,
                timestamp: new Date(),
            });
        }
        else {
            approval.isCompleted = true;
            approval.status = 'APPROVED';
            approval.completedAt = new Date();
            approval.finalDecision = 'APPROVED';
            fdr.submissionStatus = 'APPROVED';
            fdr.verificationStatus = 'VERIFIED';
            fdr.verifiedAt = new Date();
            fdr.verifiedBy = user.email;
            fdr.history.push({
                action: 'FINAL_APPROVAL_GRANTED',
                performedBy: user.fullName,
                performedByEmail: user.email,
                details: `Final approval granted across all ${approval.totalSteps} steps. Sanction completed. Remarks: ${input.remarks}`,
                timestamp: new Date(),
            });
            const reqDoc = await Requirement_model_1.Requirement.findOne({ requirementId: fdr.requirementId });
            if (reqDoc) {
                const pledged = reqDoc.pledgedInstruments.find((p) => p.instrumentId === fdr.fdrId);
                if (pledged) {
                    pledged.verificationStatus = 'VERIFIED';
                    pledged.remarks = `Verified and approved via workflow #${approval.approvalId} by ${user.fullName}`;
                    await reqDoc.save();
                }
            }
        }
        await Promise.all([this.repo.save(approval), fdr.save()]);
        return approval;
    }
    async rejectStep(id, input, user) {
        const approval = await this.repo.findById(id);
        if (!approval) {
            throw appError_1.AppError.notFound(`Approval request #${id} not found`);
        }
        if (approval.isCompleted || approval.status === 'APPROVED' || approval.status === 'REJECTED') {
            throw appError_1.AppError.badRequest(`Cannot reject finalized workflow (${approval.status})`);
        }
        const currentStepIndex = approval.steps.findIndex((s) => s.stepNumber === approval.currentStep);
        if (currentStepIndex === -1) {
            throw appError_1.AppError.badRequest(`Invalid current step number ${approval.currentStep}`);
        }
        const currentStep = approval.steps[currentStepIndex];
        const fdr = await Fdr_model_1.Fdr.findOne({ fdrId: approval.instrumentId });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Linked FDR #${approval.instrumentId} not found`);
        }
        this.checkSeparationOfDuties(approval, fdr.createdBy, user);
        this.checkApprovalPermissions(user, currentStep.roleRequired);
        currentStep.status = 'REJECTED';
        currentStep.actionBy = user.fullName;
        currentStep.actionByEmail = user.email;
        currentStep.actionDate = new Date();
        currentStep.remarks = input.remarks;
        approval.isCompleted = true;
        approval.status = 'REJECTED';
        approval.completedAt = new Date();
        approval.finalDecision = 'REJECTED';
        approval.approvalHistory.push({
            action: 'REJECTED',
            stepNumber: currentStep.stepNumber,
            performedBy: user.fullName,
            performedByEmail: user.email,
            remarks: input.remarks,
            timestamp: new Date(),
        });
        fdr.submissionStatus = 'RETURNED_FOR_CORRECTION';
        fdr.verificationStatus = 'REJECTED';
        fdr.history.push({
            action: 'APPROVAL_REJECTED',
            performedBy: user.fullName,
            performedByEmail: user.email,
            details: `Approval rejected at Step ${currentStep.stepNumber} (${currentStep.title}). Remarks: ${input.remarks}`,
            timestamp: new Date(),
        });
        await Promise.all([this.repo.save(approval), fdr.save()]);
        return approval;
    }
    async returnStep(id, input, user) {
        const approval = await this.repo.findById(id);
        if (!approval) {
            throw appError_1.AppError.notFound(`Approval request #${id} not found`);
        }
        if (approval.isCompleted) {
            throw appError_1.AppError.badRequest('Cannot return completed approval request');
        }
        const currentStepIndex = approval.steps.findIndex((s) => s.stepNumber === approval.currentStep);
        const currentStep = approval.steps[currentStepIndex];
        const fdr = await Fdr_model_1.Fdr.findOne({ fdrId: approval.instrumentId });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Linked FDR #${approval.instrumentId} not found`);
        }
        this.checkApprovalPermissions(user, currentStep.roleRequired);
        currentStep.status = 'RETURNED';
        currentStep.actionBy = user.fullName;
        currentStep.actionByEmail = user.email;
        currentStep.actionDate = new Date();
        currentStep.remarks = input.remarks;
        approval.status = 'RETURNED';
        approval.currentStep = input.returnToStep || 1;
        approval.approvalHistory.push({
            action: 'RETURNED',
            stepNumber: currentStep.stepNumber,
            performedBy: user.fullName,
            performedByEmail: user.email,
            remarks: input.remarks,
            timestamp: new Date(),
        });
        fdr.submissionStatus = 'RETURNED_FOR_CORRECTION';
        fdr.verificationStatus = 'UNDER_SCRUTINY';
        fdr.history.push({
            action: 'RETURNED_FOR_CLARIFICATION',
            performedBy: user.fullName,
            performedByEmail: user.email,
            details: `Returned from Step ${currentStep.stepNumber} for clarification. Remarks: ${input.remarks}`,
            timestamp: new Date(),
        });
        await Promise.all([this.repo.save(approval), fdr.save()]);
        return approval;
    }
    async escalateStep(id, input, user) {
        const approval = await this.repo.findById(id);
        if (!approval) {
            throw appError_1.AppError.notFound(`Approval request #${id} not found`);
        }
        if (approval.isCompleted) {
            throw appError_1.AppError.badRequest('Cannot escalate completed approval request');
        }
        const currentStepIndex = approval.steps.findIndex((s) => s.stepNumber === approval.currentStep);
        const currentStep = approval.steps[currentStepIndex];
        currentStep.status = 'ESCALATED';
        currentStep.actionBy = user.fullName;
        currentStep.actionByEmail = user.email;
        currentStep.actionDate = new Date();
        currentStep.remarks = input.remarks;
        approval.status = 'ESCALATED';
        if (input.escalateToRole) {
            currentStep.roleRequired = input.escalateToRole;
        }
        if (input.assignedApproverEmail) {
            currentStep.assignedApproverEmail = input.assignedApproverEmail;
        }
        approval.approvalHistory.push({
            action: 'ESCALATED',
            stepNumber: currentStep.stepNumber,
            performedBy: user.fullName,
            performedByEmail: user.email,
            remarks: input.remarks,
            timestamp: new Date(),
        });
        const fdr = await Fdr_model_1.Fdr.findOne({ fdrId: approval.instrumentId });
        if (fdr) {
            fdr.history.push({
                action: 'APPROVAL_ESCALATED',
                performedBy: user.fullName,
                performedByEmail: user.email,
                details: `Step ${currentStep.stepNumber} escalated to ${input.escalateToRole || 'higher authority'}. Remarks: ${input.remarks}`,
                timestamp: new Date(),
            });
            await fdr.save();
        }
        await this.repo.save(approval);
        return approval;
    }
    async getApprovals(params, user) {
        const tenantId = user.institutionId;
        const result = await this.repo.findWithFilters(params, tenantId);
        const formattedData = result.data.map((item) => ({
            ...item.toObject(),
            amountFormatted: decimal_1.DecimalUtils.formatCurrency(item.amount),
        }));
        return {
            ...result,
            data: formattedData,
        };
    }
    async getById(id) {
        const approval = await this.repo.findById(id);
        if (!approval) {
            throw appError_1.AppError.notFound(`Approval request #${id} not found`);
        }
        return {
            ...approval.toObject(),
            amountFormatted: decimal_1.DecimalUtils.formatCurrency(approval.amount),
        };
    }
}
exports.ApprovalService = ApprovalService;
exports.approvalService = new ApprovalService(approval_repository_1.approvalRepository);
