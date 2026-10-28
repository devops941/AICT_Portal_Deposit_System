import { AuthUserContext } from '../../middleware/auth.middleware';
import { Fdr } from '../../models/Fdr.model';
import { Requirement } from '../../models/Requirement.model';
import { Renewal } from '../../models/Renewal.model';
import { Release } from '../../models/Release.model';
import { Discrepancy } from '../../models/Discrepancy.model';
import { generateCsv } from '../../utils/csvExport';
import { logger } from '../../config/logger';

export interface ReportQueryParams {
  page?: string | number;
  limit?: string | number;
  search?: string;
  institutionId?: string;
  bankName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  format?: 'json' | 'csv' | 'excel' | 'pdf';
  daysAhead?: string | number;
}

export class ReportsService {
  private isTenantRestricted(user: AuthUserContext): boolean {
    const roles = user.roles || [];
    const isGlobal =
      user.userType === 'ADMIN' ||
      roles.includes('SYSTEM_ADMINISTRATOR') ||
      roles.includes('SUPER_ADMIN') ||
      roles.includes('AUDITOR') ||
      roles.includes('APPROVING_AUTHORITY') ||
      roles.includes('VERIFICATION_OFFICER') ||
      roles.includes('SENIOR_VERIFICATION_OFFICER');

    return !isGlobal && Boolean(user.institutionId);
  }

  /**
   * 1. Institution-wise & Active FDR Report
   */
  async getFdrsReport(user: AuthUserContext, query: ReportQueryParams): Promise<any> {
    const conditions: any[] = [];

    // Tenant Isolation
    if (this.isTenantRestricted(user)) {
      conditions.push({ institutionId: user.institutionId!.toUpperCase() });
    } else if (query.institutionId) {
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
      const dateCond: any = {};
      if (query.startDate) dateCond.$gte = new Date(query.startDate);
      if (query.endDate) dateCond.$lte = new Date(query.endDate);
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
      Fdr.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      Fdr.countDocuments(filter),
    ]);

    const formattedRows = records.map((r: any) => ({
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
        csv: generateCsv(headers, formattedRows),
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

  /**
   * 2. Maturity Radar & Proximity Report
   */
  async getMaturityReport(user: AuthUserContext, query: ReportQueryParams): Promise<any> {
    const conditions: any[] = [];
    if (this.isTenantRestricted(user)) conditions.push({ institutionId: user.institutionId!.toUpperCase() });
    else if (query.institutionId) conditions.push({ institutionId: query.institutionId.toUpperCase() });

    const now = new Date();
    const days = parseInt(query.daysAhead?.toString() || '365', 10);
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    if (query.status === 'MATURED') {
      conditions.push({ lifecycleStatus: 'MATURED' });
    } else if (query.status === 'ACTIVE') {
      conditions.push({ lifecycleStatus: 'ACTIVE', maturityDate: { $lte: targetDate } });
    } else {
      // Default: show any instruments nearing maturity or active
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
      Fdr.find(filter)
        .sort({ maturityDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Fdr.countDocuments(filter),
    ]);

    const formattedRows = records.map((r: any) => {
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
        csv: generateCsv(headers, formattedRows),
        fileName: `Maturity_Report_${Date.now()}.csv`,
      };
    }

    return {
      isExport: false,
      data: formattedRows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * 3. Renewal Requests & Replacement Lineage Report
   */
  async getRenewalsReport(user: AuthUserContext, query: ReportQueryParams): Promise<any> {
    const filter: any = {};
    if (this.isTenantRestricted(user)) filter.institutionId = user.institutionId!.toUpperCase();
    else if (query.institutionId) filter.institutionId = query.institutionId.toUpperCase();

    if (query.status) filter.status = query.status.toUpperCase();
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
      Renewal.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Renewal.countDocuments(filter),
    ]);

    const formattedRows = records.map((r: any) => ({
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
        csv: generateCsv(headers, formattedRows),
        fileName: `Renewals_Report_${Date.now()}.csv`,
      };
    }

    return {
      isExport: false,
      data: formattedRows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * 4. Releases & Refunds Report
   */
  async getReleasesReport(user: AuthUserContext, query: ReportQueryParams): Promise<any> {
    const filter: any = {};
    if (this.isTenantRestricted(user)) filter.institutionId = user.institutionId!.toUpperCase();
    else if (query.institutionId) filter.institutionId = query.institutionId.toUpperCase();

    if (query.status) filter.status = query.status.toUpperCase();
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
      Release.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Release.countDocuments(filter),
    ]);

    const formattedRows = records.map((r: any) => ({
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
        csv: generateCsv(headers, formattedRows),
        fileName: `Releases_Report_${Date.now()}.csv`,
      };
    }

    return {
      isExport: false,
      data: formattedRows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * 5. Institutional Compliance & Deficit Report
   */
  async getComplianceReport(user: AuthUserContext, query: ReportQueryParams): Promise<any> {
    const filter: any = {};
    if (this.isTenantRestricted(user)) filter.institutionId = user.institutionId!.toUpperCase();
    else if (query.institutionId) filter.institutionId = query.institutionId.toUpperCase();

    if (query.status) filter.complianceStatus = query.status.toUpperCase();
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
      Requirement.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Requirement.countDocuments(filter),
    ]);

    const formattedRows = records.map((r: any) => {
      const reqAmt = r.requiredAmount ? parseFloat(r.requiredAmount.toString()) : 0;
      const verAmt = (r.pledgedInstruments || [])
        .filter((p: any) => p.verificationStatus === 'VERIFIED')
        .reduce((s: number, p: any) => s + (parseFloat(p.amount?.toString() || '0') || 0), 0);
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
        csv: generateCsv(headers, formattedRows),
        fileName: `Compliance_Report_${Date.now()}.csv`,
      };
    }

    return {
      isExport: false,
      data: formattedRows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * 6. Discrepancy & AI Flag Audit Report
   */
  async getDiscrepanciesReport(user: AuthUserContext, query: ReportQueryParams): Promise<any> {
    const filter: any = {};
    if (this.isTenantRestricted(user)) filter.institutionId = user.institutionId!.toUpperCase();
    if (query.status) filter.resolutionStatus = query.status.toUpperCase();

    const isExport = query.format === 'csv' || query.format === 'excel';
    const page = Math.max(1, parseInt(query.page?.toString() || '1', 10));
    const limit = isExport ? 5000 : 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Discrepancy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Discrepancy.countDocuments(filter),
    ]);

    const formattedRows = records.map((d: any) => ({
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
        csv: generateCsv(headers, formattedRows),
        fileName: `Discrepancies_Report_${Date.now()}.csv`,
      };
    }

    return {
      isExport: false,
      data: formattedRows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * 7. Audit Activity Report
   */
  async getAuditActivityReport(user: AuthUserContext, query: ReportQueryParams): Promise<any> {
    const filter: any = {};
    if (this.isTenantRestricted(user)) filter.institutionId = user.institutionId!.toUpperCase();

    const isExport = query.format === 'csv' || query.format === 'excel';
    const page = Math.max(1, parseInt(query.page?.toString() || '1', 10));
    const limit = isExport ? 5000 : 20;

    const fdrs = await Fdr.find(filter)
      .select('fdrId institutionId history')
      .lean();

    const allEvents: any[] = [];
    for (const f of fdrs) {
      const hist = (f as any).history;
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
        csv: generateCsv(headers, allEvents),
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

export const reportsService = new ReportsService();
