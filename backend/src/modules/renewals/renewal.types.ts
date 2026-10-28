import { RenewalStatus, IReplacementDetails, IRenewalActivityLog } from '../../models/Renewal.model';

export { RenewalStatus, IReplacementDetails, IRenewalActivityLog };

export interface CreateRenewalInput {
  previousInstrumentId: string;
  renewalReason: string;
  replacementDetails?: {
    instrumentType?: string;
    bankName: string;
    bankBranch: string;
    fdrNumber: string;
    holderName: string;
    depositAmount: string;
    issueDate: string;
    maturityDate: string;
    documentReferences?: string[];
    isJointAccount?: boolean;
    autoRenewal?: boolean;
    interestRate?: number;
    remarks?: string;
  };
}

export interface SubmitRenewalInput {
  replacementDetails: {
    instrumentType?: string;
    bankName: string;
    bankBranch: string;
    fdrNumber: string;
    holderName: string;
    depositAmount: string;
    issueDate: string;
    maturityDate: string;
    documentReferences?: string[];
    isJointAccount?: boolean;
    autoRenewal?: boolean;
    interestRate?: number;
    remarks?: string;
  };
}

export interface ApproveRenewalInput {
  remarks: string;
}

export interface RenewalFilterParams {
  institutionId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
