import { IVerificationChecklistItem, IClarificationRecord } from '../../models/Fdr.model';

export { IVerificationChecklistItem, IClarificationRecord };

export interface VerifyFdrInput {
  remarks: string;
  checklist?: Array<{
    itemKey: string;
    label?: string;
    status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
    comments?: string;
  }>;
  initiateApprovalWorkflow?: boolean;
}

export interface RejectVerificationInput {
  remarks: string;
}

export interface RequestClarificationInput {
  query: string;
}

export interface PendingVerificationFilterParams {
  institutionId?: string;
  bankName?: string;
  isDuplicateFlagged?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}
