import { Fdr, IFdr } from '../../models/Fdr.model';
import { MaturityAlert } from '../../models/MaturityAlert.model';
import { Renewal } from '../../models/Renewal.model';
import { MaturityFilterParams, MaturityOverviewMetrics, CalendarMonthGroup } from './maturity.types';
import { maturityMonitoringJob } from './maturity.job';
import { DecimalUtils } from '../../utils/decimal';
import { AuthUserContext } from '../../middleware/auth.middleware';

export class MaturityService {
  async getOverviewMetrics(user: AuthUserContext): Promise<MaturityOverviewMetrics> {
    const now = new Date();
    const query: any = {
      lifecycleStatus: { $in: ['ACTIVE', 'MATURED'] },
    };

    if (user.institutionId) {
      query.institutionId = user.institutionId;
    }

    const instruments = await Fdr.find(query);

    let approaching90 = 0;
    let approaching30 = 0;
    let approaching7 = 0;
    let maturedCount = 0;
    let overdueCount = 0;
    let atRiskDecimal = DecimalUtils.from(0);

    for (const fdr of instruments) {
      const maturityTime = new Date(fdr.maturityDate).getTime();
      const days = Math.ceil((maturityTime - now.getTime()) / (1000 * 60 * 60 * 24));

      if (days <= 0) {
        maturedCount++;
        // Check if overdue without renewal
        if (fdr.lifecycleStatus === 'MATURED') {
          overdueCount++;
          atRiskDecimal = DecimalUtils.add(atRiskDecimal, fdr.depositAmount);
        }
      } else {
        if (days <= 7) approaching7++;
        if (days <= 30) approaching30++;
        if (days <= 90) approaching90++;
        if (days <= 30) {
          atRiskDecimal = DecimalUtils.add(atRiskDecimal, fdr.depositAmount);
        }
      }
    }

    return {
      totalActive: instruments.filter((f) => f.lifecycleStatus === 'ACTIVE').length,
      approachingMaturity90: approaching90,
      approachingMaturity30: approaching30,
      approachingMaturity7: approaching7,
      maturedCount,
      overdueCount,
      totalAtRiskAmount: DecimalUtils.formatCurrency(atRiskDecimal),
    };
  }

  async getMaturityList(params: MaturityFilterParams, user: AuthUserContext) {
    const now = new Date();
    const query: any = {};

    if (user.institutionId) {
      query.institutionId = user.institutionId;
    } else if (params.institutionId) {
      query.institutionId = params.institutionId;
    }

    // Window filters
    if (params.window) {
      if (params.window === 'OVERDUE') {
        query.maturityDate = { $lt: now };
      } else if (params.window === '7_DAYS') {
        const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        query.maturityDate = { $gte: now, $lte: futureDate };
      } else if (params.window === '15_DAYS') {
        const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
        query.maturityDate = { $gte: now, $lte: futureDate };
      } else if (params.window === '30_DAYS') {
        const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        query.maturityDate = { $gte: now, $lte: futureDate };
      } else if (params.window === '60_DAYS') {
        const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        query.maturityDate = { $gte: now, $lte: futureDate };
      } else if (params.window === '90_DAYS') {
        const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        query.maturityDate = { $gte: now, $lte: futureDate };
      }
    }

    if (params.from && params.to) {
      query.maturityDate = {
        $gte: new Date(params.from),
        $lte: new Date(params.to),
      };
    }

    if (params.search) {
      const regex = new RegExp(params.search.trim(), 'i');
      query.$or = [
        { fdrId: regex },
        { fdrNumber: regex },
        { institutionName: regex },
        { bankName: regex },
      ];
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const [instruments, total] = await Promise.all([
      Fdr.find(query).sort({ maturityDate: 1 }).skip(skip).limit(limit),
      Fdr.countDocuments(query),
    ]);

    const enriched = instruments.map((fdr) => {
      const maturityTime = new Date(fdr.maturityDate).getTime();
      const daysRemaining = Math.ceil((maturityTime - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...fdr.toObject(),
        depositAmountFormatted: DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
        daysRemaining,
        isOverdue: daysRemaining <= 0,
        urgencyLevel:
          daysRemaining <= 0
            ? 'OVERDUE'
            : daysRemaining <= 7
            ? 'CRITICAL'
            : daysRemaining <= 30
            ? 'HIGH'
            : daysRemaining <= 60
            ? 'MEDIUM'
            : 'NORMAL',
      };
    });

    return { data: enriched, total, page, limit };
  }

  async getMaturityCalendar(user: AuthUserContext): Promise<CalendarMonthGroup[]> {
    const query: any = {
      lifecycleStatus: { $in: ['ACTIVE', 'MATURED'] },
    };

    if (user.institutionId) {
      query.institutionId = user.institutionId;
    }

    const now = new Date();
    // Look ahead 18 months and look back 3 months
    const startRange = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endRange = new Date(now.getFullYear(), now.getMonth() + 18, 0);

    query.maturityDate = { $gte: startRange, $lte: endRange };

    const instruments = await Fdr.find(query).sort({ maturityDate: 1 });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const groupMap = new Map<string, CalendarMonthGroup>();

    for (const fdr of instruments) {
      const d = new Date(fdr.maturityDate);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          year,
          month,
          monthName: `${monthNames[d.getMonth()]} ${year}`,
          count: 0,
          totalAmount: '₹0.00',
          instruments: [],
        });
      }

      const group = groupMap.get(key)!;
      group.count++;

      const daysRemaining = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      group.instruments.push({
        fdrId: fdr.fdrId,
        fdrNumber: fdr.fdrNumber,
        institutionId: fdr.institutionId,
        institutionName: fdr.institutionName,
        bankName: fdr.bankName,
        depositAmountFormatted: DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
        maturityDate: fdr.maturityDate.toISOString(),
        daysRemaining,
        lifecycleStatus: fdr.lifecycleStatus,
        hasRenewalRequest: !!fdr.renewalRequestId,
      });
    }

    return Array.from(groupMap.values());
  }

  async getMaturityAlerts(user: AuthUserContext) {
    const query: any = {};
    if (user.institutionId) {
      query.institutionId = user.institutionId;
    }
    return MaturityAlert.find(query).sort({ createdAt: -1 }).limit(100);
  }

  async runJob() {
    return maturityMonitoringJob.runDailyMaturityCheck();
  }
}

export const maturityService = new MaturityService();
