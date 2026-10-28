export type RequirementType =
  | 'NEW_INSTITUTION_ESTABLISHMENT'
  | 'PROGRAM_EXPANSION'
  | 'ANNUAL_COMPLIANCE'
  | 'PENALTY_ESCROW'
  | 'ADDITIONAL_COURSE_INSPECTION'
  | 'LAND_DEFICIENCY_ESCROW';

export type InstrumentType = 'FDR' | 'BANK_GUARANTEE' | 'DEMAND_DRAFT' | 'GOVERNMENT_BOND';

export type RequirementStatus = 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED' | 'WAIVED';

export type ComplianceStatus =
  | 'NOT_SUBMITTED'
  | 'PARTIALLY_COMPLIANT'
  | 'COMPLIANT'
  | 'OVERDUE'
  | 'UNDER_REVIEW';

export interface IPledgedInstrument {
  id?: string;
  _id?: string;
  instrumentId: string;
  instrumentType: InstrumentType;
  bankName: string;
  branchName: string;
  amount: string | number;
  maturityDate: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isJointAccount: boolean;
  pledgedAt: string;
  remarks?: string;
}

export interface IRequirementActivityLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: string;
}

export interface InstrumentComplianceBreakdownItem {
  instrumentId: string;
  instrumentType: InstrumentType;
  amount: string;
  amountFormatted: string;
  bankName: string;
  branchName: string;
  maturityDate: string;
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
  deadline: string;
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
  calculatedAt: string;
}

export interface RequirementItem {
  _id: string;
  requirementId: string;
  institutionId: string;
  institutionName: string;
  title: string;
  requirementType: RequirementType;
  requiredAmount: string | number | { $numberDecimal?: string };
  currency: string;
  effectiveDate: string;
  submissionDeadline: string;
  applicableRuleReference: string;
  acceptableInstrumentTypes: InstrumentType[];
  supportingDocumentRequirements: string[];
  applicableBusinessRules: string[];
  requirementStatus: RequirementStatus;
  complianceStatus: ComplianceStatus;
  createdBy: string;
  approvedBy?: string;
  pledgedInstruments: IPledgedInstrument[];
  activityHistory: IRequirementActivityLog[];
  calculatedCompliance?: ComplianceCalculationResult;
  shortfall?: string;
  shortfallFormatted?: string;
  eligibleDeposit?: string;
  eligibleDepositFormatted?: string;
  createdAt: string;
  updatedAt: string;
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
  overallComplianceRate: number;
  requirements: ComplianceCalculationResult[];
}

export interface DashboardMetrics {
  totalRequirements: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  notSubmittedCount: number;
  overdueCount: number;
  underReviewCount: number;
}

export const REQUIREMENT_TYPE_LABELS: Record<RequirementType, string> = {
  NEW_INSTITUTION_ESTABLISHMENT: 'New Institution Escrow',
  PROGRAM_EXPANSION: 'Program Expansion Deposit',
  ANNUAL_COMPLIANCE: 'Annual Affiliation Compliance',
  PENALTY_ESCROW: 'Penalty Escrow Mandate',
  ADDITIONAL_COURSE_INSPECTION: 'Course Inspection Deposit',
  LAND_DEFICIENCY_ESCROW: 'Land Deficiency Escrow',
};

export const INSTRUMENT_TYPE_LABELS: Record<InstrumentType, string> = {
  FDR: 'Fixed Deposit Receipt (FDR)',
  BANK_GUARANTEE: 'Bank Guarantee (BG)',
  DEMAND_DRAFT: 'Demand Draft (DD)',
  GOVERNMENT_BOND: 'Government Bond (SGB/TB)',
};

export const COMPLIANCE_STATUS_CONFIG: Record<
  ComplianceStatus,
  { label: string; bg: string; text: string; border: string; badgeVariant: 'high' | 'medium' | 'low' | 'primary' | 'success' | 'outline' | 'slate' }
> = {
  COMPLIANT: {
    label: 'Compliant',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badgeVariant: 'success',
  },
  PARTIALLY_COMPLIANT: {
    label: 'Partially Compliant',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badgeVariant: 'medium',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    badgeVariant: 'primary',
  },
  NOT_SUBMITTED: {
    label: 'Not Submitted',
    bg: 'bg-slate-500/10',
    text: 'text-slate-600',
    border: 'border-slate-200',
    badgeVariant: 'slate',
  },
  OVERDUE: {
    label: 'Overdue',
    bg: 'bg-rose-500/10',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badgeVariant: 'high',
  },
};
