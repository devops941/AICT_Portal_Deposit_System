import { InstrumentType } from '../requirements/types';

export type { InstrumentType };

export type FdrSubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'RETURNED_FOR_CORRECTION' | 'APPROVED';
export type FdrVerificationStatus = 'PENDING' | 'UNDER_SCRUTINY' | 'VERIFIED' | 'REJECTED';
export type FdrLifecycleStatus = 'ACTIVE' | 'MATURED' | 'RELEASED' | 'CLAIMED' | 'CANCELLED';

export interface IFdrActivityLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: string;
}

export interface FdrItem {
  _id: string;
  fdrId: string;
  institutionId: string;
  institutionName: string;
  requirementId: string;
  requirementTitle?: string;
  instrumentType: InstrumentType;
  bankName: string;
  bankBranch: string;
  fdrNumber: string;
  holderName: string;
  depositAmount: string | number | { $numberDecimal?: string };
  depositAmountFormatted?: string;
  issueDate: string;
  maturityDate: string;
  currency: string;
  isJointAccount: boolean;
  documentReferences: string[];
  submissionStatus: FdrSubmissionStatus;
  verificationStatus: FdrVerificationStatus;
  lifecycleStatus: FdrLifecycleStatus;
  isDuplicateFlagged: boolean;
  duplicateReviewNotes?: string;
  autoRenewal: boolean;
  interestRate?: number;
  remarks?: string;
  verificationRemarks?: string;
  createdBy: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  history: IFdrActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  _id: string;
  documentId: string;
  instrumentId: string;
  institutionId: string;
  documentType: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  uploadedBy: string;
  uploadedByEmail: string;
  uploadedAt: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  remarks?: string;
  cloudinaryUrl?: string;
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

export const SUBMISSION_STATUS_CONFIG: Record<
  FdrSubmissionStatus,
  { label: string; badgeVariant: 'high' | 'medium' | 'low' | 'primary' | 'success' | 'outline' | 'slate' }
> = {
  DRAFT: { label: 'Draft', badgeVariant: 'slate' },
  SUBMITTED: { label: 'Submitted for Scrutiny', badgeVariant: 'primary' },
  RETURNED_FOR_CORRECTION: { label: 'Returned for Correction', badgeVariant: 'medium' },
  APPROVED: { label: 'Approved & Lien Marked', badgeVariant: 'success' },
};

export const VERIFICATION_STATUS_CONFIG: Record<
  FdrVerificationStatus,
  { label: string; badgeVariant: 'high' | 'medium' | 'low' | 'primary' | 'success' | 'outline' | 'slate' }
> = {
  PENDING: { label: 'Pending Scrutiny', badgeVariant: 'slate' },
  UNDER_SCRUTINY: { label: 'Under Scrutiny', badgeVariant: 'medium' },
  VERIFIED: { label: 'Verified', badgeVariant: 'success' },
  REJECTED: { label: 'Rejected', badgeVariant: 'high' },
};
