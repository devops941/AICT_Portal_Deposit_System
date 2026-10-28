export type RenewalStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface IReplacementDetails {
  instrumentType: string;
  bankName: string;
  bankBranch: string;
  fdrNumber: string;
  holderName: string;
  depositAmount: any;
  issueDate: string;
  maturityDate: string;
  documentReferences: string[];
  isJointAccount: boolean;
  autoRenewal: boolean;
  interestRate?: number;
  remarks?: string;
}

export interface IRenewalActivityLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: string;
}

export interface RenewalItem {
  _id: string;
  renewalId: string;
  previousInstrumentId: string;
  replacementInstrumentId?: string;
  institutionId: string;
  institutionName: string;
  requirementId: string;
  requirementTitle?: string;
  status: RenewalStatus;
  renewalReason: string;
  originalAmount: any;
  originalAmountFormatted: string;
  originalMaturityDate: string;
  originalFdrNumber: string;
  originalBankName: string;
  requestedBy: string;
  requestedByEmail: string;
  replacementDetails?: IReplacementDetails;
  replacementAmountFormatted?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
  history: IRenewalActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface LineageNode {
  fdrId: string;
  fdrNumber: string;
  bankName: string;
  bankBranch: string;
  depositAmountFormatted: string;
  issueDate: string;
  maturityDate: string;
  lifecycleStatus: string;
  previousInstrumentId?: string;
  replacementInstrumentId?: string;
  renewalRequestId?: string;
  relation?: string;
}

export interface ReplacementLineageResponse {
  currentInstrument: LineageNode;
  ancestors: LineageNode[];
  successors: LineageNode[];
  totalLineageCount: number;
}
