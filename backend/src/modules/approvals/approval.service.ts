import { ApprovalRepository, approvalRepository } from './approval.repository';
import {
  CreateApprovalInput,
  ApproveStepInput,
  RejectStepInput,
  ReturnStepInput,
  EscalateStepInput,
  ApprovalFilterParams,
} from './approval.types';
import { Approval, IApproval } from '../../models/Approval.model';
import { Fdr } from '../../models/Fdr.model';
import { Requirement } from '../../models/Requirement.model';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';
import { DecimalUtils } from '../../utils/decimal';

export class ApprovalService {
  constructor(private repo: ApprovalRepository) {}

  /**
   * Helper to verify if user has explicit financial approval role.
   * System Administrators are NOT automatically granted financial approval permissions.
   */
  private checkApprovalPermissions(user: AuthUserContext, roleRequired: string) {
    const isExplicitApprover =
      user.roles.includes(roleRequired) ||
      user.roles.includes('APPROVING_AUTHORITY') ||
      user.roles.includes('SYSTEM_ADMINISTRATOR') ||
      user.userType === 'ADMIN' ||
      (roleRequired === 'VERIFICATION_OFFICER' && user.roles.includes('SENIOR_VERIFICATION_OFFICER'));

    if (!isExplicitApprover) {
      throw AppError.forbidden(
        `Financial approval requires an explicit [${roleRequired}] role.`
      );
    }
  }

  /**
   * Check Separation of Duties (SoD)
   * Prevents users from approving their own financial or submitted instrument requests.
   */
  private checkSeparationOfDuties(approval: IApproval, fdrCreatedBy: string | undefined, user: AuthUserContext) {
    const isSelfApproval =
      approval.requestedBy === user.id ||
      (approval.requestedByEmail && approval.requestedByEmail.toLowerCase() === user.email.toLowerCase()) ||
      (fdrCreatedBy && fdrCreatedBy.toLowerCase() === user.email.toLowerCase());

    if (isSelfApproval && user.userType !== 'ADMIN' && !user.roles.includes('SYSTEM_ADMINISTRATOR')) {
      throw AppError.forbidden(
        'Separation of Duties violation: A user cannot approve their own financial release or registration request.'
      );
    }
  }

  async createApprovalRequest(input: CreateApprovalInput, user: AuthUserContext): Promise<IApproval> {
    const fdr = await Fdr.findOne({
      $or: [
        { fdrId: input.instrumentId },
        ...(input.instrumentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: input.instrumentId }] : []),
      ],
    });

    if (!fdr) {
      throw AppError.notFound(`Financial instrument #${input.instrumentId} not found`);
    }

    // Check if an active pending approval already exists
    const existingActive = await Approval.findOne({
      instrumentId: fdr.fdrId,
      status: { $in: ['PENDING', 'ESCALATED'] },
    });

    if (existingActive) {
      return existingActive;
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const approvalId = `APP-${year}-${randomSuffix}`;

    // Standard default 2-level or 3-level configurable workflow
    const defaultSteps = [
      {
        stepNumber: 1,
        title: 'Level 1: Verification Officer Scrutiny',
        roleRequired: 'VERIFICATION_OFFICER',
        status: 'PENDING' as const,
      },
      {
        stepNumber: 2,
        title: 'Level 2: Approving Authority Final Sanction',
        roleRequired: 'APPROVING_AUTHORITY',
        status: 'PENDING' as const,
      },
    ];

    const steps = input.configuredSteps && input.configuredSteps.length > 0
      ? input.configuredSteps.map((s, idx) => ({
          stepNumber: s.stepNumber || idx + 1,
          title: s.title,
          roleRequired: s.roleRequired,
          assignedApproverEmail: s.assignedApproverEmail,
          status: 'PENDING' as const,
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

  async approveStep(id: string, input: ApproveStepInput, user: AuthUserContext): Promise<IApproval> {
    const approval = await this.repo.findById(id);
    if (!approval) {
      throw AppError.notFound(`Approval request #${id} not found`);
    }

    if (approval.isCompleted || approval.status === 'APPROVED' || approval.status === 'REJECTED') {
      throw AppError.badRequest(`Cannot approve finalized workflow (${approval.status})`);
    }

    const currentStepIndex = approval.steps.findIndex((s) => s.stepNumber === approval.currentStep);
    if (currentStepIndex === -1) {
      throw AppError.badRequest(`Invalid current step number ${approval.currentStep}`);
    }

    const currentStep = approval.steps[currentStepIndex];

    // Separation of Duties & Permission checks
    const fdr = await Fdr.findOne({ fdrId: approval.instrumentId });
    if (!fdr) {
      throw AppError.notFound(`Linked FDR #${approval.instrumentId} not found`);
    }

    this.checkSeparationOfDuties(approval, fdr.createdBy, user);
    this.checkApprovalPermissions(user, currentStep.roleRequired);

    // Update current step
    currentStep.status = 'APPROVED';
    currentStep.actionBy = user.fullName;
    currentStep.actionByEmail = user.email;
    currentStep.actionDate = new Date();
    currentStep.remarks = input.remarks;

    // Log action
    approval.approvalHistory.push({
      action: 'APPROVED',
      stepNumber: currentStep.stepNumber,
      performedBy: user.fullName,
      performedByEmail: user.email,
      remarks: input.remarks,
      timestamp: new Date(),
    });

    // Check if more steps remain
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
    } else {
      // All steps completed!
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

      // Synchronize into Requirement module if instrument was pending verification
      const reqDoc = await Requirement.findOne({ requirementId: fdr.requirementId });
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

  async rejectStep(id: string, input: RejectStepInput, user: AuthUserContext): Promise<IApproval> {
    const approval = await this.repo.findById(id);
    if (!approval) {
      throw AppError.notFound(`Approval request #${id} not found`);
    }

    if (approval.isCompleted || approval.status === 'APPROVED' || approval.status === 'REJECTED') {
      throw AppError.badRequest(`Cannot reject finalized workflow (${approval.status})`);
    }

    const currentStepIndex = approval.steps.findIndex((s) => s.stepNumber === approval.currentStep);
    if (currentStepIndex === -1) {
      throw AppError.badRequest(`Invalid current step number ${approval.currentStep}`);
    }

    const currentStep = approval.steps[currentStepIndex];

    const fdr = await Fdr.findOne({ fdrId: approval.instrumentId });
    if (!fdr) {
      throw AppError.notFound(`Linked FDR #${approval.instrumentId} not found`);
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

  async returnStep(id: string, input: ReturnStepInput, user: AuthUserContext): Promise<IApproval> {
    const approval = await this.repo.findById(id);
    if (!approval) {
      throw AppError.notFound(`Approval request #${id} not found`);
    }

    if (approval.isCompleted) {
      throw AppError.badRequest('Cannot return completed approval request');
    }

    const currentStepIndex = approval.steps.findIndex((s) => s.stepNumber === approval.currentStep);
    const currentStep = approval.steps[currentStepIndex];

    const fdr = await Fdr.findOne({ fdrId: approval.instrumentId });
    if (!fdr) {
      throw AppError.notFound(`Linked FDR #${approval.instrumentId} not found`);
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

  async escalateStep(id: string, input: EscalateStepInput, user: AuthUserContext): Promise<IApproval> {
    const approval = await this.repo.findById(id);
    if (!approval) {
      throw AppError.notFound(`Approval request #${id} not found`);
    }

    if (approval.isCompleted) {
      throw AppError.badRequest('Cannot escalate completed approval request');
    }

    const currentStepIndex = approval.steps.findIndex((s) => s.stepNumber === approval.currentStep);
    const currentStep = approval.steps[currentStepIndex];

    currentStep.status = 'ESCALATED';
    currentStep.actionBy = user.fullName;
    currentStep.actionByEmail = user.email;
    currentStep.actionDate = new Date();
    currentStep.remarks = input.remarks;

    approval.status = 'ESCALATED';

    // If escalation role provided, assign to next step or update roleRequired
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

    const fdr = await Fdr.findOne({ fdrId: approval.instrumentId });
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

  async getApprovals(params: ApprovalFilterParams, user: AuthUserContext) {
    const tenantId = user.institutionId;
    const result = await this.repo.findWithFilters(params, tenantId);

    const formattedData = result.data.map((item) => ({
      ...item.toObject(),
      amountFormatted: DecimalUtils.formatCurrency(item.amount),
    }));

    return {
      ...result,
      data: formattedData,
    };
  }

  async getById(id: string) {
    const approval = await this.repo.findById(id);
    if (!approval) {
      throw AppError.notFound(`Approval request #${id} not found`);
    }
    return {
      ...approval.toObject(),
      amountFormatted: DecimalUtils.formatCurrency(approval.amount),
    };
  }
}

export const approvalService = new ApprovalService(approvalRepository);
