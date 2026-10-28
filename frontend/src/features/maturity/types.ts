export interface MaturityItem {
  _id: string;
  fdrId: string;
  institutionId: string;
  institutionName: string;
  requirementId: string;
  requirementTitle?: string;
  bankName: string;
  bankBranch: string;
  fdrNumber: string;
  holderName: string;
  depositAmount: any;
  depositAmountFormatted: string;
  issueDate: string;
  maturityDate: string;
  currency: string;
  daysRemaining: number;
  isOverdue: boolean;
  urgencyLevel: 'OVERDUE' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL';
  lifecycleStatus: string;
  renewalRequestId?: string;
}

export interface MaturityOverviewMetrics {
  totalActive: number;
  approachingMaturity90: number;
  approachingMaturity30: number;
  approachingMaturity7: number;
  maturedCount: number;
  overdueCount: number;
  totalAtRiskAmount: string;
}

export interface CalendarMonthGroup {
  year: number;
  month: number;
  monthName: string;
  count: number;
  totalAmount: string;
  instruments: {
    fdrId: string;
    fdrNumber: string;
    institutionId: string;
    institutionName: string;
    bankName: string;
    depositAmountFormatted: string;
    maturityDate: string;
    daysRemaining: number;
    lifecycleStatus: string;
    hasRenewalRequest: boolean;
  }[];
}

export interface MaturityAlert {
  _id: string;
  alertId: string;
  instrumentId: string;
  institutionId: string;
  institutionName: string;
  intervalDays: number;
  maturityDate: string;
  daysRemaining: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  alertMessage: string;
  isResolved: boolean;
  isEscalated: boolean;
  sentToEmails: string[];
  createdAt: string;
}
