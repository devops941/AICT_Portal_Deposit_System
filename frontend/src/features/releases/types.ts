export type ReleaseStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'AUTHORIZED_RELEASE'
  | 'CLOSED';

export type ReleaseApprovalStatus = 'PENDING' | 'UNDER_SCRUTINY' | 'APPROVED' | 'REJECTED';

export interface IEligibilityCheckResult {
  checkKey: string;
  label: string;
  passed: boolean;
  severity: 'BLOCKER' | 'WARNING' | 'INFO';
  message: string;
  details?: string;
}

export interface IReleaseApprovalLevel {
  levelNumber: number;
  title: string;
  roleRequired: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionBy?: string;
  actionByEmail?: string;
  actionDate?: string;
  remarks?: string;
}

export interface IReleaseActivityLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  role?: string;
  details: string;
  timestamp: string;
}

export interface ReleaseItem {
  _id: string;
  releaseId: string;
  institutionId: string;
  institutionName: string;
  requirementId: string;
  requirementTitle?: string;
  instrumentId: string;
  fdrNumber: string;
  bankName: string;
  requestedAmount: any;
  requestedAmountFormatted: string;
  releasedAmount?: any;
  releasedAmountFormatted?: string;
  requestReason: string;
  supportingDocuments: string[];
  requestDate: string;
  status: ReleaseStatus;
  approvalStatus: ReleaseApprovalStatus;
  isEligible: boolean;
  eligibilityScore: number;
  eligibilityChecks: IEligibilityCheckResult[];
  blockingReasons: string[];
  currentLevel: number;
  totalLevels: number;
  approvalLevels: IReleaseApprovalLevel[];
  decisionRemarks?: string;
  rejectionReason?: string;
  clarificationQuery?: string;
  clarificationResponse?: string;
  authorizedReleaseAt?: string;
  authorizedReleaseBy?: string;
  closedAt?: string;
  closedBy?: string;
  requestedBy: string;
  requestedByEmail: string;
  history: IReleaseActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseMetrics {
  totalRequests: number;
  pending: number;
  underReview: number;
  clarificationRequired: number;
  approved: number;
  authorizedRelease: number;
  closed: number;
  rejected: number;
  totalReleasedAmount: string;
}

export interface EligibilityAssessmentData {
  isEligible: boolean;
  eligibilityScore: number;
  checks: IEligibilityCheckResult[];
  blockingReasons: string[];
  instrumentSummary: {
    fdrId: string;
    fdrNumber: string;
    bankName: string;
    depositAmountFormatted: string;
    lifecycleStatus: string;
    maturityDate: string;
    daysRemaining: number;
  };
  requirementSummary: {
    requirementId: string;
    title: string;
    requiredAmountFormatted: string;
    complianceStatus: string;
  };
}
