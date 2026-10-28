export interface DashboardKpis {
  totalDepositAmount: number;
  activeInstruments: number;
  pendingVerification: number;
  approachingMaturity: number;
  maturedInstruments: number;
  renewalRequests: number;
  releaseRequests: number;
  compliancePercentage: number;
}

export interface InstitutionDashboardData {
  role: 'INSTITUTION_ADMIN' | 'INSTITUTION';
  institutionProfile: {
    institutionId: string;
    institutionName: string;
    verificationStatus: string;
    registrationStatus: string;
  };
  depositRequirementSummary: {
    totalRequiredAmount: number;
    totalVerifiedDeposit: number;
    outstandingShortfall: number;
    complianceStatus: string;
  };
  submittedFdrsCount: number;
  activeFdrsCount: number;
  pendingVerificationCount: number;
  upcomingMaturitiesCount: number;
  renewalRequestsCount: number;
  releaseRequestsCount: number;
  complianceStatus: string;
  kpis: DashboardKpis;
}

export interface VerificationOfficerDashboardData {
  role: 'VERIFICATION_OFFICER' | 'SENIOR_VERIFICATION_OFFICER';
  pendingVerificationCount: number;
  verificationBacklogCount: number;
  clarificationRequestsCount: number;
  verificationSlaRate: number;
  recentlyVerifiedCount: number;
  upcomingMaturitiesCount: number;
  kpis: DashboardKpis;
}

export interface ApprovingAuthorityDashboardData {
  role: 'APPROVING_AUTHORITY';
  pendingApprovalsCount: number;
  releaseRequestsCount: number;
  renewalApprovalsCount: number;
  approvalHistoryCount: number;
  escalatedRequestsCount: number;
  kpis: DashboardKpis;
}

export interface SystemAdminDashboardData {
  role: 'SYSTEM_ADMINISTRATOR' | 'ADMIN';
  totalUsersCount: number;
  activeInstitutionsCount: number;
  systemActivityCount: number;
  failedJobsCount: number;
  notificationsCount: number;
  systemHealth: {
    status: 'HEALTHY' | 'DEGRADED';
    uptimeSeconds: number;
    memoryUsageMb: number;
    database: string;
  };
  kpis: DashboardKpis;
}

export interface AuditorDashboardData {
  role: 'AUDITOR';
  financialInstrumentRegisterCount: number;
  verificationHistoryCount: number;
  approvalHistoryCount: number;
  releaseHistoryCount: number;
  auditReportsCount: number;
  totalDepositValue: number;
  kpis: DashboardKpis;
}

export type RoleDashboardSummary =
  | InstitutionDashboardData
  | VerificationOfficerDashboardData
  | ApprovingAuthorityDashboardData
  | SystemAdminDashboardData
  | AuditorDashboardData;

export interface MaturityAnalytics {
  upcomingMaturityBrackets: { bracket: string; count: number; amount: number }[];
  maturedSummary: { count: number; amount: number };
}

export interface ComplianceAnalytics {
  statusBreakdown: { name: string; value: number; color: string }[];
  financials: {
    totalRequired: number;
    totalVerified: number;
    totalShortfall: number;
    overallRatio: number;
  };
}

export interface VerificationAnalytics {
  verificationDistribution: { name: string; count: number; color: string }[];
  monthlyTrends: { month: string; submissions: number; amount: number }[];
  bankDistribution: { name: string; value: number; count: number }[];
  renewalCompletionRate: number;
}
