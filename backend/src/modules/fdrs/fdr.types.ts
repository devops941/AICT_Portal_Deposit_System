import {
  IFdr,
  FdrSubmissionStatus,
  FdrVerificationStatus,
  FdrLifecycleStatus,
  IFdrActivityLog,
} from '../../models/Fdr.model';
import { InstrumentType } from '../../models/Requirement.model';

export {
  IFdr,
  FdrSubmissionStatus,
  FdrVerificationStatus,
  FdrLifecycleStatus,
  IFdrActivityLog,
  InstrumentType,
};

export interface CreateFdrInput {
  institutionId?: string;
  requirementId: string;
  instrumentType?: InstrumentType;
  bankName: string;
  bankBranch: string;
  fdrNumber: string;
  holderName: string;
  depositAmount: string | number;
  issueDate: string | Date;
  maturityDate: string | Date;
  currency?: string;
  isJointAccount?: boolean;
  autoRenewal?: boolean;
  interestRate?: number;
  remarks?: string;
  documentReferences?: string[];
  saveAsDraft?: boolean;
}

export interface UpdateFdrInput {
  bankName?: string;
  bankBranch?: string;
  fdrNumber?: string;
  holderName?: string;
  depositAmount?: string | number;
  issueDate?: string | Date;
  maturityDate?: string | Date;
  currency?: string;
  isJointAccount?: boolean;
  autoRenewal?: boolean;
  interestRate?: number;
  remarks?: string;
  documentReferences?: string[];
  duplicateReviewNotes?: string;
}

export interface FdrQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  institutionId?: string;
  requirementId?: string;
  bankName?: string;
  submissionStatus?: FdrSubmissionStatus;
  verificationStatus?: FdrVerificationStatus;
  lifecycleStatus?: FdrLifecycleStatus;
  isDuplicateFlagged?: boolean | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchReason?: string;
  existingFdr?: {
    fdrId: string;
    fdrNumber: string;
    bankName: string;
    depositAmount: string;
    institutionName: string;
  };
}

export interface FdrDashboardMetrics {
  totalFdrs: number;
  draftCount: number;
  submittedCount: number;
  verifiedCount: number;
  duplicateFlaggedCount: number;
  totalDepositAmount: string;
  totalDepositFormatted: string;
}
