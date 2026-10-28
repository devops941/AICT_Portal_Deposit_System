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
  verificationBacklogCount: number; // pending > 7 days
  clarificationRequestsCount: number;
  verificationSlaRate: number; // percentage
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

export interface MonthlyTrendData {
  month: string;
  submissions: number;
  amount: number;
}

export interface DepositDistributionItem {
  name: string;
  value: number;
  count: number;
  color?: string;
}

export interface MaturityForecastBracket {
  bracket: string; // "0-15 days", "16-30 days", "31-60 days", "61-90 days", "90+ days"
  count: number;
  amount: number;
}
