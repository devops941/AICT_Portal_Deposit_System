import { AlertSeverity } from '../../models/MaturityAlert.model';

export { AlertSeverity };

export interface MaturityFilterParams {
  institutionId?: string;
  window?: '7_DAYS' | '15_DAYS' | '30_DAYS' | '60_DAYS' | '90_DAYS' | 'OVERDUE' | 'ALL';
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
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
  month: number; // 1-12
  monthName: string;
  count: number;
  totalAmount: string;
  instruments: Array<{
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
  }>;
}
