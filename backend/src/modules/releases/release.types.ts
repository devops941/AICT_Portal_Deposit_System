import {
  ReleaseStatus,
  ReleaseApprovalStatus,
  IEligibilityCheckResult,
  IReleaseApprovalLevel,
  IReleaseActivityLog,
} from '../../models/Release.model';

export {
  ReleaseStatus,
  ReleaseApprovalStatus,
  IEligibilityCheckResult,
  IReleaseApprovalLevel,
  IReleaseActivityLog,
};

export interface CreateReleaseInput {
  instrumentId: string;
  requestReason: string;
  requestedAmount?: string;
  supportingDocuments?: string[];
}

export interface ReviewReleaseInput {
  action: 'UNDER_REVIEW' | 'CLARIFICATION_REQUIRED';
  clarificationQuery?: string;
  decisionRemarks?: string;
}

export interface ClarificationResponseInput {
  response: string;
  supportingDocuments?: string[];
}

export interface ApproveReleaseInput {
  decisionRemarks: string;
  approvalLevel?: number;
}

export interface RejectReleaseInput {
  rejectionReason: string;
}

export interface CloseReleaseInput {
  closureRemarks: string;
  settlementReference?: string;
}

export interface ReleaseFilterParams {
  institutionId?: string;
  status?: string;
  requirementId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EligibilityAssessmentResult {
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
