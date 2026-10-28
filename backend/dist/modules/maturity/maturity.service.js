"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maturityService = exports.MaturityService = void 0;
const Fdr_model_1 = require("../../models/Fdr.model");
const MaturityAlert_model_1 = require("../../models/MaturityAlert.model");
const maturity_job_1 = require("./maturity.job");
const decimal_1 = require("../../utils/decimal");
class MaturityService {
    async getOverviewMetrics(user) {
        const now = new Date();
        const query = {
            lifecycleStatus: { $in: ['ACTIVE', 'MATURED'] },
        };
        if (user.institutionId) {
            query.institutionId = user.institutionId;
        }
        const instruments = await Fdr_model_1.Fdr.find(query);
        let approaching90 = 0;
        let approaching30 = 0;
        let approaching7 = 0;
        let maturedCount = 0;
        let overdueCount = 0;
        let atRiskDecimal = decimal_1.DecimalUtils.from(0);
        for (const fdr of instruments) {
            const maturityTime = new Date(fdr.maturityDate).getTime();
            const days = Math.ceil((maturityTime - now.getTime()) / (1000 * 60 * 60 * 24));
            if (days <= 0) {
                maturedCount++;
                if (fdr.lifecycleStatus === 'MATURED') {
                    overdueCount++;
                    atRiskDecimal = decimal_1.DecimalUtils.add(atRiskDecimal, fdr.depositAmount);
                }
            }
            else {
                if (days <= 7)
                    approaching7++;
                if (days <= 30)
                    approaching30++;
                if (days <= 90)
                    approaching90++;
                if (days <= 30) {
                    atRiskDecimal = decimal_1.DecimalUtils.add(atRiskDecimal, fdr.depositAmount);
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
            totalAtRiskAmount: decimal_1.DecimalUtils.formatCurrency(atRiskDecimal),
        };
    }
    async getMaturityList(params, user) {
        const now = new Date();
        const query = {};
        if (user.institutionId) {
            query.institutionId = user.institutionId;
        }
        else if (params.institutionId) {
            query.institutionId = params.institutionId;
        }
        if (params.window) {
            if (params.window === 'OVERDUE') {
                query.maturityDate = { $lt: now };
            }
            else if (params.window === '7_DAYS') {
                const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                query.maturityDate = { $gte: now, $lte: futureDate };
            }
            else if (params.window === '15_DAYS') {
                const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
                query.maturityDate = { $gte: now, $lte: futureDate };
            }
            else if (params.window === '30_DAYS') {
                const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                query.maturityDate = { $gte: now, $lte: futureDate };
            }
            else if (params.window === '60_DAYS') {
                const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
                query.maturityDate = { $gte: now, $lte: futureDate };
            }
            else if (params.window === '90_DAYS') {
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
            Fdr_model_1.Fdr.find(query).sort({ maturityDate: 1 }).skip(skip).limit(limit),
            Fdr_model_1.Fdr.countDocuments(query),
        ]);
        const enriched = instruments.map((fdr) => {
            const maturityTime = new Date(fdr.maturityDate).getTime();
            const daysRemaining = Math.ceil((maturityTime - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
                ...fdr.toObject(),
                depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
                daysRemaining,
                isOverdue: daysRemaining <= 0,
                urgencyLevel: daysRemaining <= 0
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
    async getMaturityCalendar(user) {
        const query = {
            lifecycleStatus: { $in: ['ACTIVE', 'MATURED'] },
        };
        if (user.institutionId) {
            query.institutionId = user.institutionId;
        }
        const now = new Date();
        const startRange = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const endRange = new Date(now.getFullYear(), now.getMonth() + 18, 0);
        query.maturityDate = { $gte: startRange, $lte: endRange };
        const instruments = await Fdr_model_1.Fdr.find(query).sort({ maturityDate: 1 });
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const groupMap = new Map();
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
            const group = groupMap.get(key);
            group.count++;
            const daysRemaining = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            group.instruments.push({
                fdrId: fdr.fdrId,
                fdrNumber: fdr.fdrNumber,
                institutionId: fdr.institutionId,
                institutionName: fdr.institutionName,
                bankName: fdr.bankName,
                depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(fdr.depositAmount, fdr.currency),
                maturityDate: fdr.maturityDate.toISOString(),
                daysRemaining,
                lifecycleStatus: fdr.lifecycleStatus,
                hasRenewalRequest: !!fdr.renewalRequestId,
            });
        }
        return Array.from(groupMap.values());
    }
    async getMaturityAlerts(user) {
        const query = {};
        if (user.institutionId) {
            query.institutionId = user.institutionId;
        }
        return MaturityAlert_model_1.MaturityAlert.find(query).sort({ createdAt: -1 }).limit(100);
    }
    async runJob() {
        return maturity_job_1.maturityMonitoringJob.runDailyMaturityCheck();
    }
}
exports.MaturityService = MaturityService;
exports.maturityService = new MaturityService();
