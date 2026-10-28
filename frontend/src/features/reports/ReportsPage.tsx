import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Search,
  Calendar,
  RefreshCw,
  Landmark,
  RotateCcw,
  CreditCard,
  ShieldAlert,
  Scale,
  History,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';

type ReportCategory =
  | 'FDRS'
  | 'MATURITY'
  | 'RENEWALS'
  | 'RELEASES'
  | 'COMPLIANCE'
  | 'DISCREPANCIES'
  | 'AUDIT';

export const ReportsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('FDRS');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [bankName, setBankName] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [summary, setSummary] = useState<any>(null);

  const reportEndpoints: Record<ReportCategory, string> = {
    FDRS: '/reports/fdrs',
    MATURITY: '/reports/maturity',
    RENEWALS: '/reports/renewals',
    RELEASES: '/reports/releases',
    COMPLIANCE: '/reports/compliance',
    DISCREPANCIES: '/reports/discrepancies',
    AUDIT: '/reports/audit',
  };

  const statusOptions: Record<ReportCategory, string[]> = {
    FDRS: ['ACTIVE', 'MATURED', 'PENDING', 'VERIFIED'],
    MATURITY: ['ACTIVE', 'MATURED'],
    RENEWALS: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'],
    RELEASES: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'],
    COMPLIANCE: ['COMPLIANT', 'PARTIAL', 'DEFICIT', 'PENDING'],
    DISCREPANCIES: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'WAIVED'],
    AUDIT: [],
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint = reportEndpoints[activeCategory];
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
        ...(bankName ? { bankName } : {}),
      });

      const res: any = await api.get(`${endpoint}?${params.toString()}`);

      let rows: any[] = [];
      let pag = { total: 0, totalPages: 1 };
      let sum: any = null;

      if (Array.isArray(res)) {
        rows = res;
        pag = { total: rows.length, totalPages: 1 };
      } else if (res && typeof res === 'object') {
        if (Array.isArray(res.data)) {
          rows = res.data;
          pag = res.pagination || {
            total: rows.length,
            totalPages: Math.ceil(rows.length / limit) || 1,
          };
          sum = res.summary || null;
        } else if (res.data && Array.isArray(res.data.data)) {
          rows = res.data.data;
          pag = res.data.pagination || {
            total: rows.length,
            totalPages: Math.ceil(rows.length / limit) || 1,
          };
          sum = res.data.summary || null;
        } else if (Array.isArray(res.records)) {
          rows = res.records;
          pag = res.pagination || { total: rows.length, totalPages: 1 };
        }
      }

      setReportData(rows);
      setPagination(pag);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      setReportData([]);
      setPagination({ total: 0, totalPages: 1 });
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeCategory, page, status, bankName]);

  const handleCategoryChange = (category: ReportCategory) => {
    setActiveCategory(category);
    setStatus('');
    setSearch('');
    setBankName('');
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReport();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setBankName('');
    setPage(1);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    setExporting(true);
    try {
      const endpoint = reportEndpoints[activeCategory];
      const params = new URLSearchParams({
        format: 'csv',
        ...(search ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
        ...(bankName ? { bankName } : {}),
      });

      const res: any = await api.get(`${endpoint}?${params.toString()}`, {
        responseType: 'blob',
      });

      const rawData = res?.data !== undefined ? res.data : res;
      const blob =
        rawData instanceof Blob
          ? rawData
          : new Blob([rawData], { type: 'text/csv;charset=utf-8;' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'excel' ? 'csv' : 'csv';
      link.setAttribute(
        'download',
        `${activeCategory.toLowerCase()}_report_${Date.now()}.${extension}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderStatusBadge = (value: string) => {
    const v = value.toUpperCase();
    if (['ACTIVE', 'VERIFIED', 'APPROVED', 'COMPLIANT', 'RESOLVED', 'CLOSED', 'YES'].includes(v)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {value}
        </span>
      );
    }
    if (
      ['UNDER_REVIEW', 'SUBMITTED', 'PENDING', 'IN_REVIEW', 'PARTIAL', 'AUTO_RENEW_ENABLED'].includes(
        v
      )
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <Clock className="w-3 h-3 text-amber-600" />
          {value}
        </span>
      );
    }
    if (['REJECTED', 'DEFICIT', 'OVERDUE', 'OPEN', 'NO'].includes(v)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          {value}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
        {value}
      </span>
    );
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Central Reporting Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Statutory Reports & Exports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate, filter, and export official financial registers, maturity radars, and compliance summaries.
          </p>
        </div>

        {/* Export Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-sm transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Report Categories Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold print:hidden">
        <button
          onClick={() => handleCategoryChange('FDRS')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'FDRS'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>FDR Registry Report</span>
        </button>

        <button
          onClick={() => handleCategoryChange('MATURITY')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'MATURITY'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Maturity Proximity</span>
        </button>

        <button
          onClick={() => handleCategoryChange('RENEWALS')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'RENEWALS'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Renewals Lineage</span>
        </button>

        <button
          onClick={() => handleCategoryChange('RELEASES')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'RELEASES'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Releases & Refunds</span>
        </button>

        <button
          onClick={() => handleCategoryChange('COMPLIANCE')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'COMPLIANCE'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Compliance Shortfall</span>
        </button>

        <button
          onClick={() => handleCategoryChange('DISCREPANCIES')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'DISCREPANCIES'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Discrepancy Log</span>
        </button>

        <button
          onClick={() => handleCategoryChange('AUDIT')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'AUDIT'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Activity Trail</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3 print:hidden">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, FDR number, Bank, or Institution..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['FDRS', 'MATURITY'].includes(activeCategory) && (
            <select
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                setPage(1);
              }}
              className="text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              <option value="">All Banks</option>
              <option value="State Bank of India">State Bank of India</option>
              <option value="Punjab National Bank">Punjab National Bank</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="Canara Bank">Canara Bank</option>
              <option value="Indian Overseas Bank">Indian Overseas Bank</option>
            </select>
          )}

          {statusOptions[activeCategory]?.length > 0 && (
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              <option value="">All Statuses</option>
              {statusOptions[activeCategory].map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleResetFilters}
            className="p-2.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Records Count
            </span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">
              {pagination.total}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            {pagination.totalPages}p
          </div>
        </div>

        {summary?.totalDepositAmount !== undefined && (
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Aggregated Pledged Deposit
              </span>
              <span className="text-lg font-black text-emerald-600 mt-0.5 block">
                ₹{Number(summary.totalDepositAmount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
        )}

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Category
            </span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">
              {activeCategory.replace(/_/g, ' ')}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {status ? `Status: ${status}` : 'All Records'}
          </span>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="font-medium text-slate-700">Loading statutory report records...</span>
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-20 px-4 text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-300" />
            <span className="font-semibold text-slate-700 text-sm">
              No records found matching current report criteria.
            </span>
            <p className="text-slate-400 max-w-sm">
              Try adjusting your search query, bank filter, or status filter to view statutory data.
            </p>
            {(search || status || bankName) && (
              <button
                onClick={handleResetFilters}
                className="mt-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                  {Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="py-3.5 px-4 whitespace-nowrap">
                      {key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {Object.entries(row).map(([k, val]: any, cIdx) => {
                      const isAmount =
                        k.toLowerCase().includes('amount') ||
                        k.toLowerCase().includes('shortfall') ||
                        k.toLowerCase().includes('deposit');
                      const isId = k.toLowerCase().includes('id');
                      const isStatus =
                        k.toLowerCase().includes('status') ||
                        k.toLowerCase().includes('flag') ||
                        k.toLowerCase().includes('auto');

                      return (
                        <td key={cIdx} className="py-3.5 px-4 text-slate-800 whitespace-nowrap">
                          {isAmount && typeof val === 'number' ? (
                            <span className="font-bold text-slate-900 font-mono">
                              ₹{val.toLocaleString('en-IN')}
                            </span>
                          ) : isStatus && typeof val === 'string' ? (
                            renderStatusBadge(val)
                          ) : isId && val ? (
                            <span className="font-mono font-semibold text-indigo-600 bg-indigo-50/60 px-1.5 py-0.5 rounded text-[11px]">
                              {val}
                            </span>
                          ) : (
                            <span className="text-slate-700">{val?.toString() || '—'}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>
            Showing page <span className="font-bold text-slate-800">{page}</span> of{' '}
            <span className="font-bold text-slate-800">{pagination.totalPages}</span> (
            <span className="font-bold text-slate-800">{pagination.total}</span> records total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="px-2 font-bold text-slate-800 text-xs">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
