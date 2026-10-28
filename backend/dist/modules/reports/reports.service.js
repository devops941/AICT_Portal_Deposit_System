"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.ReportsService = void 0;
const Fdr_model_1 = require("../../models/Fdr.model");
const Requirement_model_1 = require("../../models/Requirement.model");
const Renewal_model_1 = require("../../models/Renewal.model");
const Release_model_1 = require("../../models/Release.model");
const Discrepancy_model_1 = require("../../models/Discrepancy.model");
const csvExport_1 = require("../../utils/csvExport");
class ReportsService {
    isTenantRestricted(user) {
        const roles = user.roles || [];
        const isGlobal = user.userType === 'ADMIN' ||
            roles.includes('SYSTEM_ADMINISTRATOR') ||
            roles.includes('SUPER_ADMIN') ||
            roles.includes('AUDITOR') ||
            roles.includes('APPROVING_AUTHORITY') ||
            roles.includes('VERIFICATION_OFFICER') ||
            roles.includes('SENIOR_VERIFICATION_OFFICER');
        return !isGlobal && Boolean(user.institutionId);
    }
    async getFdrsReport(user, query) {
        const conditions = [];
        if (this.isTenantRestricted(user)) {
            conditions.push({ institutionId: user.institutionId.toUpperCase() });
        }
        else if (query.institutionId) {
            conditions.push({ institutionId: query.institutionId.toUpperCase() });
        }
        if (query.bankName) {
            conditions.push({ bankName: { $regex: query.bankName, $options: 'i' } });
        }
        if (query.status) {
            const st = query.status.toUpperCase();
            conditions.push({
                $or: [
                    { lifecycleStatus: st },
                    { verificationStatus: st },
                    { submissionStatus: st },
                ],
            });
        }
        if (query.search) {
            const s = query.search.trim();
            conditions.push({
                $or: [
                    { fdrId: { $regex: s, $options: 'i' } },
                    { fdrNumber: { $regex: s, $options: 'i' } },
                    { bankName: { $regex: s, $options: 'i' } },
                    { institutionName: { $regex: s, $options: 'i' } },
                    { holderName: { $regex: s, $options: 'i' } },
                ],
            });
        }
        if (query.startDate || query.endDate) {
            const dateCond = {};
            if (query.startDate)
                dateCond.$gte = new Date(query.startDate);
            if (query.endDate)
                dateCond.$lte = new Date(query.endDate);
            conditions.push({ issueDate: dateCond });
        }
        const filter = conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };
        const sortField = query.sortBy || 'createdAt';
        const sortDir = query.sortOrder === 'asc' ? 1 : -1;
        const isExport = query.format === 'csv' || query.format === 'excel' || query.format === 'pdf';
        const page = Math.max(1, parseInt(query.page?.toString() || '1', 10));
        const limit = isExport ? 5000 : Math.max(1, Math.min(100, parseInt(query.limit?.toString() || '20', 10)));
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            Fdr_model_1.Fdr.find(filter)
                .sort({ [sortField]: sortDir })
                .skip(skip)
                .limit(limit)
                .lean(),
            Fdr_model_1.Fdr.countDocuments(filter),
        ]);
        const formattedRows = records.map((r) => ({
            fdrId: r.fdrId,
            institutionId: r.institutionId,
            institutionName: r.institutionName || '—',
            fdrNumber: r.fdrNumber,
            bankName: r.bankName,
            bankBranch: r.bankBranch || '—',
            depositAmount: r.depositAmount ? parseFloat(r.depositAmount.toString()) : 0,
            issueDate: r.issueDate ? new Date(r.issueDate).toISOString().split('T')[0] : '—',
            maturityDate: r.maturityDate ? new Date(r.maturityDate).toISOString().split('T')[0] : '—',
            verificationStatus: r.verificationStatus,
            lifecycleStatus: r.lifecycleStatus,
            isDuplicateFlagged: r.isDuplicateFlagged ? 'YES' : 'NO',
            autoRenewal: r.autoRenewal ? 'YES' : 'NO',
        }));
        if (query.format === 'csv' || query.format === 'excel') {
            const headers = [
                { key: 'fdrId', label: 'Instrument ID' },
                { key: 'institutionId', label: 'Institution ID' },
                { key: 'institutionName', label: 'Institution Name' },
                { key: 'fdrNumber', label: 'FDR Number' },
                { key: 'bankName', label: 'Issuing Bank' },
                { key: 'bankBranch', label: 'Branch' },
                { key: 'depositAmount', label: 'Deposit Amount (INR)' },
                { key: 'issueDate', label: 'Issue Date' },
                { key: 'maturityDate', label: 'Maturity Date' },
                { key: 'verificationStatus', label: 'Verification Status' },
                { key: 'lifecycleStatus', label: 'Lifecycle Status' },
                { key: 'isDuplicateFlagged', label: 'Duplicate Flagged' },
            ];
            return {
                isExport: true,
                csv: (0, csvExport_1.generateCsv)(headers, formattedRows),
                fileName: `FDR_Report_${Date.now()}.csv`,
            };
        }
        const totalDepositAmount = formattedRows.reduce((acc, r) => acc + r.depositAmount, 0);
        return {
            isExport: false,
            data: formattedRows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            summary: {
                totalInstruments: total,
                totalDepositAmount,
            },
        };
    }
    async getMaturityReport(user, query) {
        const conditions = [];
        if (this.isTenantRestricted(user))
            conditions.push({ institutionId: user.institutionId.toUpperCase() });
        else if (query.institutionId)
            conditions.push({ institutionId: query.institutionId.toUpperCase() });
        const now = new Date();
        const days = parseInt(query.daysAhead?.toString() || '365', 10);
        const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        if (query.status === 'MATURED') {
            conditions.push({ lifecycleStatus: 'MATURED' });
        }
        else if (query.status === 'ACTIVE') {
            conditions.push({ lifecycleStatus: 'ACTIVE', maturityDate: { $lte: targetDate } });
        }
        else {
            conditions.push({
                $or: [
                    { lifecycleStatus: 'ACTIVE', maturityDate: { $lte: targetDate } },
                    { lifecycleStatus: 'MATURED' },
                ],
            });
        }
        if (query.search) {
            conditions.push({
                $or: [
                    { fdrId: { $regex: query.search, $options: 'i' } },
                    { fdrNumber: { $regex: query.search, $options: 'i' } },
                    { institutionName: { $regex: query.search, $options: 'i' } },
                ],
            });
        }
        const filter = conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };
        const isExport = query.format === 'csv' || query.format === 'excel';
        const page = Math.max(1, parseInt(query.page?.toString() || '1', 10));
        const limit = isExport ? 5000 : Math.max(1, Math.min(100, parseInt(query.limit?.toString() || '20', 10)));
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            Fdr_model_1.Fdr.find(filter)
                .sort({ maturityDate: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Fdr_model_1.Fdr.countDocuments(filter),
        ]);
        const formattedRows = records.map((r) => {
            const mat = new Date(r.maturityDate);
            const daysRemaining = Math.ceil((mat.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
                fdrId: r.fdrId,
                institutionId: r.institutionId,
                institutionName: r.institutionName || '—',
                fdrNumber: r.fdrNumber,
                bankName: r.bankName,
                depositAmount: r.depositAmount ? parseFloat(r.depositAmount.toString()) : 0,
                maturityDate: mat.toISOString().split('T')[0],
                daysRemaining: daysRemaining < 0 ? 0 : daysRemaining,
                lifecycleStatus: r.lifecycleStatus,
                renewalStatus: r.autoRenewal ? 'AUTO_RENEW_ENABLED' : 'MANUAL_RENEWAL_REQUIRED',
            };
        });
        if (isExport) {
            const headers = [
                { key: 'fdrId', label: 'Instrument ID' },
                { key: 'institutionId', label: 'Institution ID' },
                { key: 'institutionName', label: 'Institution Name' },
                { key: 'fdrNumber', label: 'FDR Number' },
                { key: 'bankName', label: 'Bank' },
                { key: 'depositAmount', label: 'Amount (INR)' },
                { key: 'maturityDate', label: 'Maturity Date' },
                { key: 'daysRemaining', label: 'Days Remaining' },
                { key: 'lifecycleStatus', label: 'Status' },
                { key: 'renewalStatus', label: 'Renewal Protocol' },
            ];
            return {
                isExport: true,
                csv: (0, csvExport_1.generateCsv)(headers, formattedRows),
                fileName: `Maturity_Report_${Date.now()}.csv`,
            };
        }
        return {
            isExport: false,
            data: formattedRows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getRenewalsReport(user, query) {
        const filter = {};
        if (this.isTenantRestricted(user))
            filter.institutionId = user.institutionId.toUpperCase();
        else if (query.institutionId)
            filter.institutionId = query.institutionId.toUpperCase();
        if (query.status)
            filter.status = query.status.toUpperCase();
        if (query.search) {
            filter.$or = [
                { renewalId: { $regex: query.search, $options: 'i' } },
                { previousInstrumentId: { $regex: query.search, $options: 'i' } },
                { institutionName: { $regex: query.search, $options: 'i' } },
            ];
        }
        const isExport = query.format === 'csv' || query.format === 'excel';
        const page = Math.max(1, parseInt(query.page?.toString() || '1', 10));
        const limit = isExport ? 5000 : Math.max(1, Math.min(100, parseInt(query.limit?.toString() || '20', 10)));
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            Renewal_model_1.Renewal.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Renewal_model_1.Renewal.countDocuments(filter),
        ]);
        const formattedRows = records.map((r) => ({
            renewalRequestId: r.renewalId,
            instrumentId: r.previousInstrumentId,
            institutionId: r.institutionId,
            institutionName: r.institutionName || '—',
            originalAmount: r.originalAmount ? parseFloat(r.originalAmount.toString()) : 0,
            newDepositAmount: r.replacementDetails?.depositAmount ? parseFloat(r.replacementDetails.depositAmount.toString()) : 0,
            replacementInstrumentId: r.replacementInstrumentId || '—',
            status: r.status,
            renewalReason: r.renewalReason || 'Term Rollover',
            requestedAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '—',
        }));
        if (isExport) {
            const headers = [
                { key: 'renewalRequestId', label: 'Renewal ID' },
                { key: 'instrumentId', label: 'Original Instrument ID' },
                { key: 'institutionId', label: 'Institution ID' },
                { key: 'institutionName', label: 'Institution Name' },
                { key: 'originalAmount', label: 'Original Amount (INR)' },
                { key: 'newDepositAmount', label: 'Renewed Amount (INR)' },
                { key: 'replacementInstrumentId', label: 'Replacement Instrument ID' },
                { key: 'status', label: 'Status' },
                { key: 'requestedAt', label: 'Requested Date' },
            ];
            return {
                isExport: true,
                csv: (0, csvExport_1.generateCsv)(headers, formattedRows),
                fileName: `Renewals_Report_${Date.now()}.csv`,
            };
        }
        return {
            isExport: false,
            data: formattedRows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getReleasesReport(user, query) {
        const filter = {};
        if (this.isTenantRestricted(user))
            filter.institutionId = user.institutionId.toUpperCase();
        else if (query.institutionId)
            filter.institutionId = query.institutionId.toUpperCase();
        if (query.status)
            filter.status = query.status.toUpperCase();
        if (query.search) {
            filter.$or = [
                { releaseId: { $regex: query.search, $options: 'i' } },
                { instrumentId: { $regex: query.search, $options: 'i' } },
                { institutionName: { $regex: query.search, $options: 'i' } },
            ];
        }
        const isExport = query.format === 'csv' || query.format === 'excel';
        const page = Math.max(1, parseInt(query.page?.toString() || '1', 10));
        const limit = isExport ? 5000 : Math.max(1, Math.min(100, parseInt(query.limit?.toString() || '20', 10)));
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            Release_model_1.Release.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Release_model_1.Release.countDocuments(filter),
        ]);
        const formattedRows = records.map((r) => ({
            releaseRequestId: r.releaseId,
            instrumentId: r.instrumentId,
            institutionId: r.institutionId,
            institutionName: r.institutionName || '—',
            requestedAmount: r.requestedAmount ? parseFloat(r.requestedAmount.toString()) : 0,
            approvedAmount: r.releasedAmount ? parseFloat(r.releasedAmount.toString()) : 0,
            status: r.status,
            approvalStatus: r.approvalStatus,
            requestReason: r.requestReason,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '—',
            closedAt: r.closedAt ? new Date(r.closedAt).toISOString().split('T')[0] : '—',
        }));
        if (isExport) {
            const headers = [
                { key: 'releaseRequestId', label: 'Release ID' },
                { key: 'instrumentId', label: 'Instrument ID' },
                { key: 'institutionId', label: 'Institution ID' },
                { key: 'institutionName', label: 'Institution Name' },
                { key: 'requestedAmount', label: 'Requested Amount (INR)' },
                { key: 'approvedAmount', label: 'Approved Amount (INR)' },
                { key: 'status', label: 'Release Status' },
                { key: 'approvalStatus', label: 'Approval Status' },
                { key: 'requestReason', label: 'Reason' },
                { key: 'createdAt', label: 'Date Requested' },
            ];
            return {
                isExport: true,
                csv: (0, csvExport_1.generateCsv)(headers, formattedRows),
                fileName: `Releases_Report_${Date.now()}.csv`,
            };
        }
        return {
            isExport: false,
            data: formattedRows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getComplianceReport(user, query) {
        const filter = {};
        if (this.isTenantRestricted(user))
            filter.institutionId = user.institutionId.toUpperCase();
        else if (query.institutionId)
            filter.institutionId = query.institutionId.toUpperCase();
        if (query.status)
            filter.complianceStatus = query.status.toUpperCase();
        if (query.search) {
            filter.$or = [
                { requirementId: { $regex: query.search, $options: 'i' } },
                { title: { $regex: query.search, $options: 'i' } },
                { institutionName: { $regex: query.search, $options: 'i' } },
            ];
        }
        const isExport = query.format === 'csv' || query.format === 'excel';
        const page = Math.max(1, parseInt(query.page?.toString() || '1', 10));
        const limit = isExport ? 5000 : Math.max(1, Math.min(100, parseInt(query.limit?.toString() || '20', 10)));
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            Requirement_model_1.Requirement.find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Requirement_model_1.Requirement.countDocuments(filter),
        ]);
        const formattedRows = records.map((r) => {
            const reqAmt = r.requiredAmount ? parseFloat(r.requiredAmount.toString()) : 0;
            const verAmt = (r.pledgedInstruments || [])
                .filter((p) => p.verificationStatus === 'VERIFIED')
                .reduce((s, p) => s + (parseFloat(p.amount?.toString() || '0') || 0), 0);
            const shortfall = Math.max(0, reqAmt - verAmt);
            const complianceRatio = reqAmt > 0 ? Math.min(100, Math.round((verAmt / reqAmt) * 100)) : 100;
            return {
                requirementId: r.requirementId,
                institutionId: r.institutionId,
                institutionName: r.institutionName || '—',
                requirementTitle: r.title || 'Statutory Requirement',
                requiredAmount: reqAmt,
                eligibleVerifiedDeposit: verAmt,
                shortfall,
                complianceRatio: `${complianceRatio}%`,
                complianceStatus: r.complianceStatus,
                submissionDeadline: r.submissionDeadline ? new Date(r.submissionDeadline).toISOString().split('T')[0] : '—',
            };
        });
        if (isExport) {
            const headers = [
                { key: 'requirementId', label: 'Requirement ID' },
                { key: 'institutionId', label: 'Institution ID' },
                { key: 'institutionName', label: 'Institution Name' },
                { key: 'requirementTitle', label: 'Requirement Title' },
                { key: 'requiredAmount', label: 'Required (INR)' },
                { key: 'eligibleVerifiedDeposit', label: 'Verified Deposit (INR)' },
                { key: 'shortfall', label: 'Shortfall (INR)' },
                { key: 'complianceRatio', label: 'Compliance %' },
                { key: 'complianceStatus', label: 'Status' },
                { key: 'submissionDeadline', label: 'Deadline' },
            ];
            return {
                isExport: true,
                csv: (0, csvExport_1.generateCsv)(headers, formattedRows),
                fileName: `Compliance_Report_${Date.now()}.csv`,
            };
        }
        return {
            isExport: false,
            data: formattedRows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getDiscrepanciesReport(user, query) {
        const filter = {};
        if (this.isTenantRestricted(user))
            filter.institutionId = user.institutionId.toUpperCase();
        if (query.status)
            filter.resolutionStatus = query.status.toUpperCase();
        const isExport = query.format === 'csv' || query.format === 'excel';
        const page = Math.max(1, parseInt(query.page?.toString() || '1', 10));
        const limit = isExport ? 5000 : 20;
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            Discrepancy_model_1.Discrepancy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Discrepancy_model_1.Discrepancy.countDocuments(filter),
        ]);
        const formattedRows = records.map((d) => ({
            discrepancyId: d.discrepancyId,
            instrumentId: d.instrumentId,
            institutionId: d.institutionId,
            discrepancyType: d.discrepancyType,
            title: d.title,
            severity: d.severity,
            resolutionStatus: d.resolutionStatus,
            createdAt: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '—',
        }));
        if (isExport) {
            const headers = [
                { key: 'discrepancyId', label: 'Discrepancy ID' },
                { key: 'instrumentId', label: 'Instrument ID' },
                { key: 'institutionId', label: 'Institution ID' },
                { key: 'discrepancyType', label: 'Type' },
                { key: 'title', label: 'Description' },
                { key: 'severity', label: 'Severity' },
                { key: 'resolutionStatus', label: 'Resolution Status' },
                { key: 'createdAt', label: 'Detected Date' },
            ];
            return {
                isExport: true,
                csv: (0, csvExport_1.generateCsv)(headers, formattedRows),
                fileName: `Discrepancies_Report_${Date.now()}.csv`,
            };
        }
        return {
            isExport: false,
            data: formattedRows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getAuditActivityReport(user, query) {
        const filter = {};
        if (this.isTenantRestricted(user))
            filter.institutionId = user.institutionId.toUpperCase();
        const isExport = query.format === 'csv' || query.format === 'excel';
        const page = Math.max(1, parseInt(query.page?.toString() || '1', 10));
        const limit = isExport ? 5000 : 20;
        const fdrs = await Fdr_model_1.Fdr.find(filter)
            .select('fdrId institutionId history')
            .lean();
        const allEvents = [];
        for (const f of fdrs) {
            const hist = f.history;
            if (Array.isArray(hist)) {
                for (const ev of hist) {
                    allEvents.push({
                        instrumentId: f.fdrId,
                        institutionId: f.institutionId,
                        action: ev.action,
                        performedBy: ev.performedByEmail || ev.performedBy || 'System',
                        details: ev.details,
                        timestamp: ev.timestamp ? new Date(ev.timestamp).toISOString() : '—',
                    });
                }
            }
        }
        allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const total = allEvents.length;
        const paginated = allEvents.slice((page - 1) * limit, page * limit);
        if (isExport) {
            const headers = [
                { key: 'instrumentId', label: 'Instrument ID' },
                { key: 'institutionId', label: 'Institution ID' },
                { key: 'action', label: 'Event Action' },
                { key: 'performedBy', label: 'User / Identity' },
                { key: 'details', label: 'Audit Trail Details' },
                { key: 'timestamp', label: 'Timestamp (UTC)' },
            ];
            return {
                isExport: true,
                csv: (0, csvExport_1.generateCsv)(headers, allEvents),
                fileName: `Audit_Activity_Report_${Date.now()}.csv`,
            };
        }
        return {
            isExport: false,
            data: paginated,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}
exports.ReportsService = ReportsService;
exports.reportsService = new ReportsService();
