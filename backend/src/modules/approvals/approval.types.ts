import {
  ApprovalWorkflowType,
  ApprovalStatus,
  ApprovalStepStatus,
  IApprovalStep,
  IApprovalActionLog,
} from '../../models/Approval.model';

export { ApprovalWorkflowType, ApprovalStatus, ApprovalStepStatus, IApprovalStep, IApprovalActionLog };

export interface CreateApprovalInput {
  instrumentId: string;
  workflowType?: ApprovalWorkflowType;
  configuredSteps?: Array<{
    stepNumber: number;
    title: string;
    roleRequired: string;
    assignedApproverEmail?: string;
  }>;
}

export interface ApproveStepInput {
  remarks: string;
}

export interface RejectStepInput {
  remarks: string;
}

export interface ReturnStepInput {
  remarks: string;
  returnToStep?: number;
}

export interface EscalateStepInput {
  remarks: string;
  escalateToRole?: string;
  assignedApproverEmail?: string;
}

export interface ApprovalFilterParams {
  instrumentId?: string;
  institutionId?: string;
  status?: string;
  currentStep?: number;
  workflowType?: string;
  page?: number;
  limit?: number;
  search?: string;
}
