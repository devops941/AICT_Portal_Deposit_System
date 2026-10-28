import {
  RequirementType,
  InstrumentType,
  RequirementStatus,
  ComplianceStatus,
  IPledgedInstrument,
  IRequirementActivityLog,
  IRequirement,
} from '../../models/Requirement.model';

export {
  RequirementType,
  InstrumentType,
  RequirementStatus,
  ComplianceStatus,
  IPledgedInstrument,
  IRequirementActivityLog,
  IRequirement,
};

export interface CreateRequirementInput {
  requirementId?: string;
  institutionId: string;
  title: string;
  requirementType: RequirementType;
  requiredAmount: string | number;
  currency?: string;
  effectiveDate?: string | Date;
  submissionDeadline: string | Date;
  applicableRuleReference: string;
  acceptableInstrumentTypes: InstrumentType[];
  supportingDocumentRequirements?: string[];
  applicableBusinessRules?: string[];
}

export interface UpdateRequirementInput {
  title?: string;
  requirementType?: RequirementType;
  requiredAmount?: string | number;
  currency?: string;
  effectiveDate?: string | Date;
  submissionDeadline?: string | Date;
  applicableRuleReference?: string;
  acceptableInstrumentTypes?: InstrumentType[];
  supportingDocumentRequirements?: string[];
  applicableBusinessRules?: string[];
  requirementStatus?: RequirementStatus;
  complianceStatus?: ComplianceStatus;
}

export interface PledgeInstrumentInput {
  instrumentId: string;
  instrumentType: InstrumentType;
  bankName: string;
  branchName: string;
  amount: string | number;
  maturityDate: string | Date;
  isJointAccount?: boolean;
  remarks?: string;
}

export interface VerifyInstrumentInput {
  verificationStatus: 'VERIFIED' | 'REJECTED';
  remarks?: string;
}

export interface RequirementQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  institutionId?: string;
  requirementType?: RequirementType;
  requirementStatus?: RequirementStatus;
  complianceStatus?: ComplianceStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InstrumentComplianceBreakdownItem {
  instrumentId: string;
  instrumentType: InstrumentType;
  amount: string;
  amountFormatted: string;
  bankName: string;
  branchName: string;
  maturityDate: Date;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isJointAccount: boolean;
  isEligible: boolean;
  ineligibilityReasons: string[];
}

export interface ComplianceCalculationResult {
  requirementId: string;
  institutionId: string;
  institutionName: string;
  requiredAmount: string;
  requiredAmountFormatted: string;
  eligibleVerifiedDeposit: string;
  eligibleVerifiedDepositFormatted: string;
  outstandingShortfall: string;
  outstandingShortfallFormatted: string;
  complianceStatus: ComplianceStatus;
  isCompliant: boolean;
  isOverdue: boolean;
  daysRemainingOrOverdue: number;
  deadline: Date;
  breakdown: {
    totalPledgedAmount: string;
    totalPledgedFormatted: string;
    verifiedEligibleAmount: string;
    verifiedEligibleFormatted: string;
    pendingVerificationAmount: string;
    rejectedAmount: string;
    ineligibleTypeAmount: string;
    instruments: InstrumentComplianceBreakdownItem[];
  };
  calculatedAt: Date;
}

export interface InstitutionComplianceSummary {
  institutionId: string;
  institutionName: string;
  totalRequirements: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  notSubmittedCount: number;
  overdueCount: number;
  underReviewCount: number;
  totalRequiredAmount: string;
  totalRequiredFormatted: string;
  totalEligibleDeposit: string;
  totalEligibleFormatted: string;
  totalShortfall: string;
  totalShortfallFormatted: string;
  overallComplianceRate: number; // percentage
  requirements: ComplianceCalculationResult[];
}
