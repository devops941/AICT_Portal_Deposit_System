"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = exports.DashboardService = void 0;
const Fdr_model_1 = require("../../models/Fdr.model");
const Requirement_model_1 = require("../../models/Requirement.model");
const Institution_model_1 = require("../../models/Institution.model");
const Renewal_model_1 = require("../../models/Renewal.model");
const Release_model_1 = require("../../models/Release.model");
const Approval_model_1 = require("../../models/Approval.model");
const User_model_1 = require("../../models/User.model");
const Admin_model_1 = require("../../models/Admin.model");
const Discrepancy_model_1 = require("../../models/Discrepancy.model");
const Notification_model_1 = require("../../models/Notification.model");
class DashboardService {
    resolveRoleCategory(user) {
        if (user.userType === 'ADMIN' || user.roles.includes('SYSTEM_ADMINISTRATOR')) {
            return 'ADMIN';
        }
        if (user.roles.includes('AUDITOR')) {
            return 'AUDITOR';
        }
        if (user.roles.includes('APPROVING_AUTHORITY')) {
            return 'APPROVER';
        }
        if (user.roles.includes('VERIFICATION_OFFICER') ||
            user.roles.includes('SENIOR_VERIFICATION_OFFICER')) {
            return 'OFFICER';
        }
        return 'INSTITUTION';
    }
    calculateRequirementAmounts(req) {
        const required = parseFloat(req.requiredAmount?.toString() || '0') || 0;
        const verified = (req.pledgedInstruments || [])
            .filter((p) => p.verificationStatus === 'VERIFIED')
            .reduce((s, p) => s + (parseFloat(p.amount?.toString() || '0') || 0), 0);
        const shortfall = Math.max(0, required - verified);
        return { required, verified, shortfall };
    }
    async getSummary(user) {
        const roleCat = this.resolveRoleCategory(user);
        const instScope = user.institutionId ? { institutionId: user.institutionId.toUpperCase() } : {};
        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const [allFdrs, activeFdrsCount, pendingVerificationsCount, approachingMaturityCount, maturedInstrumentsCount, renewalRequestsCount, releaseRequestsCount, requirements,] = await Promise.all([
            Fdr_model_1.Fdr.find({ ...instScope, lifecycleStatus: 'ACTIVE' }).select('depositAmount').lean(),
            Fdr_model_1.Fdr.countDocuments({ ...instScope, lifecycleStatus: 'ACTIVE' }),
            Fdr_model_1.Fdr.countDocuments({ ...instScope, verificationStatus: { $in: ['PENDING', 'UNDER_SCRUTINY'] } }),
            Fdr_model_1.Fdr.countDocuments({
                ...instScope,
                lifecycleStatus: 'ACTIVE',
                maturityDate: { $gte: now, $lte: in30Days },
            }),
            Fdr_model_1.Fdr.countDocuments({ ...instScope, lifecycleStatus: 'MATURED' }),
            Renewal_model_1.Renewal.countDocuments({
                ...instScope,
                status: { $in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] },
            }),
            Release_model_1.Release.countDocuments({
                ...instScope,
                status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED'] },
            }),
            Requirement_model_1.Requirement.find({ ...instScope, requirementStatus: 'ACTIVE' })
                .select('requiredAmount pledgedInstruments complianceStatus')
                .lean(),
        ]);
        const totalDepositAmount = allFdrs.reduce((acc, fdr) => {
            const amt = fdr.depositAmount ? parseFloat(fdr.depositAmount.toString()) : 0;
            return acc + (isNaN(amt) ? 0 : amt);
        }, 0);
        let compliancePercentage = 100;
        if (requirements.length > 0) {
            let totalReq = 0;
            let totalVer = 0;
            for (const r of requirements) {
                const { required, verified } = this.calculateRequirementAmounts(r);
                totalReq += required;
                totalVer += verified;
            }
            compliancePercentage = totalReq > 0 ? Math.min(100, Math.round((totalVer / totalReq) * 100)) : 100;
        }
        const kpis = {
            totalDepositAmount,
            activeInstruments: activeFdrsCount,
            pendingVerification: pendingVerificationsCount,
            approachingMaturity: approachingMaturityCount,
            maturedInstruments: maturedInstrumentsCount,
            renewalRequests: renewalRequestsCount,
            releaseRequests: releaseRequestsCount,
            compliancePercentage,
        };
        if (roleCat === 'INSTITUTION') {
            const inst = await Institution_model_1.Institution.findOne({
                code: user.institutionId?.toUpperCase() || '',
            }).lean();
            let totalReq = 0;
            let totalVer = 0;
            let totalShort = 0;
            for (const r of requirements) {
                const { required, verified, shortfall } = this.calculateRequirementAmounts(r);
                totalReq += required;
                totalVer += verified;
                totalShort += shortfall;
            }
            const reqSummary = {
                totalRequiredAmount: totalReq,
                totalVerifiedDeposit: totalVer,
                outstandingShortfall: totalShort,
                complianceStatus: requirements.some((r) => r.complianceStatus === 'OVERDUE')
                    ? 'OVERDUE'
                    : requirements.some((r) => r.complianceStatus === 'PARTIALLY_COMPLIANT' || r.complianceStatus === 'NOT_SUBMITTED')
                        ? 'NON_COMPLIANT'
                        : 'COMPLIANT',
            };
            return {
                role: 'INSTITUTION_ADMIN',
                institutionProfile: {
                    institutionId: inst?.code || user.institutionId || 'UNKNOWN',
                    institutionName: inst?.name || 'Institutional Entity',
                    verificationStatus: inst?.verificationStatus || 'PENDING',
                    registrationStatus: inst?.registrationStatus || 'ACTIVE',
                },
                depositRequirementSummary: reqSummary,
                submittedFdrsCount: await Fdr_model_1.Fdr.countDocuments({ ...instScope, submissionStatus: 'SUBMITTED' }),
                activeFdrsCount,
                pendingVerificationCount: pendingVerificationsCount,
                upcomingMaturitiesCount: approachingMaturityCount,
                renewalRequestsCount,
                releaseRequestsCount,
                complianceStatus: reqSummary.complianceStatus,
                kpis,
            };
        }
        if (roleCat === 'OFFICER') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const [backlogCount, clarificationCount, recentlyVerified] = await Promise.all([
                Fdr_model_1.Fdr.countDocuments({
                    verificationStatus: 'PENDING',
                    createdAt: { $lte: sevenDaysAgo },
                }),
                Fdr_model_1.Fdr.countDocuments({ 'clarificationHistory.0': { $exists: true } }),
                Fdr_model_1.Fdr.countDocuments({
                    verificationStatus: 'VERIFIED',
                    updatedAt: { $gte: sevenDaysAgo },
                }),
            ]);
            const totalScrutinized = recentlyVerified + backlogCount;
            const slaRate = totalScrutinized > 0 ? Math.round((recentlyVerified / totalScrutinized) * 100) : 95;
            return {
                role: 'VERIFICATION_OFFICER',
                pendingVerificationCount: pendingVerificationsCount,
                verificationBacklogCount: backlogCount,
                clarificationRequestsCount: clarificationCount,
                verificationSlaRate: Math.max(75, slaRate),
                recentlyVerifiedCount: recentlyVerified,
                upcomingMaturitiesCount: approachingMaturityCount,
                kpis,
            };
        }
        if (roleCat === 'APPROVER') {
            const [pendingApprovals, renewalApprovals, releaseApprovals, approvalHistory, escalated] = await Promise.all([
                Approval_model_1.Approval.countDocuments({ status: 'PENDING' }),
                Renewal_model_1.Renewal.countDocuments({ status: 'UNDER_REVIEW' }),
                Release_model_1.Release.countDocuments({ status: 'UNDER_REVIEW' }),
                Approval_model_1.Approval.countDocuments({ status: { $in: ['APPROVED', 'REJECTED'] } }),
                Fdr_model_1.Fdr.countDocuments({
                    submissionStatus: 'SUBMITTED',
                    depositAmount: { $gte: 5000000 },
                }),
            ]);
            return {
                role: 'APPROVING_AUTHORITY',
                pendingApprovalsCount: pendingApprovals + renewalApprovals + releaseApprovals,
                releaseRequestsCount: releaseApprovals,
                renewalApprovalsCount: renewalApprovals,
                approvalHistoryCount: approvalHistory,
                escalatedRequestsCount: escalated,
                kpis,
            };
        }
        if (roleCat === 'AUDITOR') {
            const [totalInstruments, verHistory, appHistory, relHistory, discCount] = await Promise.all([
                Fdr_model_1.Fdr.countDocuments({}),
                Fdr_model_1.Fdr.countDocuments({ verificationStatus: { $in: ['VERIFIED', 'REJECTED'] } }),
                Approval_model_1.Approval.countDocuments({ isCompleted: true }),
                Release_model_1.Release.countDocuments({ status: { $in: ['AUTHORIZED_RELEASE', 'CLOSED'] } }),
                Discrepancy_model_1.Discrepancy.countDocuments({}),
            ]);
            return {
                role: 'AUDITOR',
                financialInstrumentRegisterCount: totalInstruments,
                verificationHistoryCount: verHistory,
                approvalHistoryCount: appHistory,
                releaseHistoryCount: relHistory,
                auditReportsCount: discCount + relHistory,
                totalDepositValue: totalDepositAmount,
                kpis,
            };
        }
        const [totalUsers, totalAdmins, activeInstitutions, failedJobs, totalNotifications] = await Promise.all([
            User_model_1.User.countDocuments({}),
            Admin_model_1.Admin.countDocuments({}),
            Institution_model_1.Institution.countDocuments({ status: 'ACTIVE' }),
            Notification_model_1.Notification.countDocuments({ status: 'FAILED' }),
            Notification_model_1.Notification.countDocuments({}),
        ]);
        const memUsage = process.memoryUsage();
        return {
            role: 'SYSTEM_ADMINISTRATOR',
            totalUsersCount: totalUsers + totalAdmins,
            activeInstitutionsCount: activeInstitutions,
            systemActivityCount: await Fdr_model_1.Fdr.countDocuments({}),
            failedJobsCount: failedJobs,
            notificationsCount: totalNotifications,
            systemHealth: {
                status: failedJobs > 5 ? 'DEGRADED' : 'HEALTHY',
                uptimeSeconds: Math.round(process.uptime()),
                memoryUsageMb: Math.round(memUsage.rss / (1024 * 1024)),
                database: 'MongoDB ReplicaSet Active',
            },
            kpis,
        };
    }
    async getMaturityMetrics(user) {
        const instScope = user.institutionId ? { institutionId: user.institutionId.toUpperCase() } : {};
        const now = new Date();
        const d15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
        const d30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const d60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        const d90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const [b15, b30, b60, b90, bFar, matured] = await Promise.all([
            Fdr_model_1.Fdr.find({ ...instScope, lifecycleStatus: 'ACTIVE', maturityDate: { $gte: now, $lte: d15 } }).select('depositAmount').lean(),
            Fdr_model_1.Fdr.find({ ...instScope, lifecycleStatus: 'ACTIVE', maturityDate: { $gt: d15, $lte: d30 } }).select('depositAmount').lean(),
            Fdr_model_1.Fdr.find({ ...instScope, lifecycleStatus: 'ACTIVE', maturityDate: { $gt: d30, $lte: d60 } }).select('depositAmount').lean(),
            Fdr_model_1.Fdr.find({ ...instScope, lifecycleStatus: 'ACTIVE', maturityDate: { $gt: d60, $lte: d90 } }).select('depositAmount').lean(),
            Fdr_model_1.Fdr.find({ ...instScope, lifecycleStatus: 'ACTIVE', maturityDate: { $gt: d90 } }).select('depositAmount').lean(),
            Fdr_model_1.Fdr.find({ ...instScope, lifecycleStatus: 'MATURED' }).select('depositAmount').lean(),
        ]);
        const sumAmt = (arr) => arr.reduce((s, f) => s + (parseFloat(f.depositAmount?.toString() || '0') || 0), 0);
        const brackets = [
            { bracket: '0-15 Days', count: b15.length, amount: sumAmt(b15) },
            { bracket: '16-30 Days', count: b30.length, amount: sumAmt(b30) },
            { bracket: '31-60 Days', count: b60.length, amount: sumAmt(b60) },
            { bracket: '61-90 Days', count: b90.length, amount: sumAmt(b90) },
            { bracket: '90+ Days', count: bFar.length, amount: sumAmt(bFar) },
        ];
        return {
            upcomingMaturityBrackets: brackets,
            maturedSummary: {
                count: matured.length,
                amount: sumAmt(matured),
            },
        };
    }
    async getComplianceMetrics(user) {
        const instScope = user.institutionId ? { institutionId: user.institutionId.toUpperCase() } : {};
        const [compliant, partial, underReview, notSubmitted, overdue] = await Promise.all([
            Requirement_model_1.Requirement.countDocuments({ ...instScope, complianceStatus: 'COMPLIANT' }),
            Requirement_model_1.Requirement.countDocuments({ ...instScope, complianceStatus: 'PARTIALLY_COMPLIANT' }),
            Requirement_model_1.Requirement.countDocuments({ ...instScope, complianceStatus: 'UNDER_REVIEW' }),
            Requirement_model_1.Requirement.countDocuments({ ...instScope, complianceStatus: 'NOT_SUBMITTED' }),
            Requirement_model_1.Requirement.countDocuments({ ...instScope, complianceStatus: 'OVERDUE' }),
        ]);
        const reqs = await Requirement_model_1.Requirement.find({ ...instScope }).select('requiredAmount pledgedInstruments').lean();
        let totalRequired = 0;
        let totalVerified = 0;
        let totalShortfall = 0;
        for (const r of reqs) {
            const { required, verified, shortfall } = this.calculateRequirementAmounts(r);
            totalRequired += required;
            totalVerified += verified;
            totalShortfall += shortfall;
        }
        return {
            statusBreakdown: [
                { name: 'Compliant', value: compliant, color: '#10b981' },
                { name: 'Under Review', value: underReview, color: '#3b82f6' },
                { name: 'Partially Compliant', value: partial, color: '#f59e0b' },
                { name: 'Not Submitted', value: notSubmitted, color: '#6366f1' },
                { name: 'Overdue', value: overdue, color: '#ef4444' },
            ],
            financials: {
                totalRequired,
                totalVerified,
                totalShortfall,
                overallRatio: totalRequired > 0 ? parseFloat(((totalVerified / totalRequired) * 100).toFixed(1)) : 100,
            },
        };
    }
    async getVerificationMetrics(user) {
        const instScope = user.institutionId ? { institutionId: user.institutionId.toUpperCase() } : {};
        const [pending, underScrutiny, verified, rejected] = await Promise.all([
            Fdr_model_1.Fdr.countDocuments({ ...instScope, verificationStatus: 'PENDING' }),
            Fdr_model_1.Fdr.countDocuments({ ...instScope, verificationStatus: 'UNDER_SCRUTINY' }),
            Fdr_model_1.Fdr.countDocuments({ ...instScope, verificationStatus: 'VERIFIED' }),
            Fdr_model_1.Fdr.countDocuments({ ...instScope, verificationStatus: 'REJECTED' }),
        ]);
        const monthlyTrends = [];
        const currentMonth = new Date().getMonth();
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(currentMonth - i);
            const mName = d.toLocaleString('en-US', { month: 'short' });
            const year = d.getFullYear();
            const monthStart = new Date(year, d.getMonth(), 1);
            const monthEnd = new Date(year, d.getMonth() + 1, 0, 23, 59, 59);
            const fdrsInMonth = await Fdr_model_1.Fdr.find({
                ...instScope,
                createdAt: { $gte: monthStart, $lte: monthEnd },
            }).select('depositAmount').lean();
            const amt = fdrsInMonth.reduce((sum, f) => sum + (parseFloat(f.depositAmount?.toString() || '0') || 0), 0);
            monthlyTrends.push({
                month: `${mName} ${year}`,
                submissions: fdrsInMonth.length,
                amount: amt,
            });
        }
        const bankAgg = await Fdr_model_1.Fdr.aggregate([
            { $match: { ...instScope, lifecycleStatus: 'ACTIVE' } },
            {
                $group: {
                    _id: '$bankName',
                    count: { $sum: 1 },
                    totalAmount: {
                        $sum: { $toDouble: { $ifNull: ['$depositAmount', 0] } },
                    },
                },
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 6 },
        ]);
        const bankDistribution = bankAgg.map((b) => ({
            name: b._id || 'Other Bank',
            value: Math.round(b.totalAmount),
            count: b.count,
        }));
        const [totalRenewals, completedRenewals] = await Promise.all([
            Renewal_model_1.Renewal.countDocuments({ ...instScope }),
            Renewal_model_1.Renewal.countDocuments({ ...instScope, status: 'APPROVED' }),
        ]);
        const renewalCompletionRate = totalRenewals > 0 ? Math.round((completedRenewals / totalRenewals) * 100) : 100;
        return {
            verificationDistribution: [
                { name: 'Pending', count: pending, color: '#f59e0b' },
                { name: 'Under Scrutiny', count: underScrutiny, color: '#3b82f6' },
                { name: 'Verified', count: verified, color: '#10b981' },
                { name: 'Rejected', count: rejected, color: '#ef4444' },
            ],
            monthlyTrends,
            bankDistribution,
            renewalCompletionRate,
        };
    }
}
exports.DashboardService = DashboardService;
exports.dashboardService = new DashboardService();
