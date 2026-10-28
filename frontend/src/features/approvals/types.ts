export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED';
export type ApprovalStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED' | 'SKIPPED';
export type ApprovalWorkflowType = 'FDR_REGISTRATION' | 'FINANCIAL_RELEASE' | 'CORRECTION_OVERRIDE';

export interface ApprovalStepItem {
  stepNumber: number;
  title: string;
  roleRequired: string;
  assignedApproverEmail?: string;
  status: ApprovalStepStatus;
  actionBy?: string;
  actionByEmail?: string;
  actionDate?: string;
  remarks?: string;
}

export interface ApprovalActionLog {
  _id?: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED';
  stepNumber: number;
  performedBy: string;
  performedByEmail: string;
  remarks: string;
  timestamp: string;
}

export interface ApprovalItem {
  _id: string;
  approvalId: string;
  instrumentId: string;
  institutionId: string;
  institutionName: string;
  requirementId: string;
  requirementTitle?: string;
  workflowType: ApprovalWorkflowType;
  requestedBy: string;
  requestedByEmail: string;
  requestedByName: string;
  amount: any;
  amountFormatted: string;
  currentStep: number;
  totalSteps: number;
  status: ApprovalStatus;
  steps: ApprovalStepItem[];
  approvalHistory: ApprovalActionLog[];
  isCompleted: boolean;
  completedAt?: string;
  finalDecision?: 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export const APPROVAL_STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PENDING: {
    label: 'Pending Approval',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Sanctioned & Approved',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  RETURNED: {
    label: 'Returned for Revision',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
  ESCALATED: {
    label: 'Escalated to Authority',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
};
