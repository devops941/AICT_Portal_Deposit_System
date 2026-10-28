import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Play,
  RotateCcw,
  Search,
  CheckCircle2,
  Calendar as CalendarIcon,
  Bell,
  Building2,
  ChevronRight,
  TrendingDown,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import {
  MaturityItem,
  MaturityOverviewMetrics,
  CalendarMonthGroup,
  MaturityAlert,
} from './types';

export const MaturityDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'CALENDAR' | 'ALERTS'>('UPCOMING');
  const [windowFilter, setWindowFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<MaturityOverviewMetrics>({
    totalActive: 0,
    approachingMaturity90: 0,
    approachingMaturity30: 0,
    approachingMaturity7: 0,
    maturedCount: 0,
    overdueCount: 0,
    totalAtRiskAmount: '₹0.00',
  });
  const [instruments, setInstruments] = useState<MaturityItem[]>([]);
  const [calendarGroups, setCalendarGroups] = useState<CalendarMonthGroup[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<CalendarMonthGroup | null>(null);
  const [alerts, setAlerts] = useState<MaturityAlert[]>([]);

  useEffect(() => {
    fetchMetrics();
    if (activeTab === 'UPCOMING') {
      fetchInstruments();
    } else if (activeTab === 'CALENDAR') {
      fetchCalendar();
    } else if (activeTab === 'ALERTS') {
      fetchAlerts();
    }
  }, [activeTab, windowFilter]);

  const fetchMetrics = async () => {
    try {
      const res: any = await api.get('/maturity/metrics');
      const data = res.data?.data || res.data || res;
      if (data && typeof data === 'object') {
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch maturity metrics', err);
    }
  };

  const fetchInstruments = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/maturity', {
        params: {
          window: windowFilter === 'ALL' ? undefined : windowFilter,
          search: searchTerm.trim() || undefined,
        },
      });
      const items = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      setInstruments(items);
    } catch (err) {
      console.error('Failed to fetch maturity instruments', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendar = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/maturity/calendar');
      const groups: CalendarMonthGroup[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      setCalendarGroups(groups);
      if (groups.length > 0 && !selectedMonth) {
        setSelectedMonth(groups[0]);
      }
    } catch (err) {
      console.error('Failed to fetch maturity calendar', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/maturity/alerts');
      const alertsList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      setAlerts(alertsList);
    } catch (err) {
      console.error('Failed to fetch maturity alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunJob = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await api.post('/maturity/run-job');
      const result = res.data?.data;
      setScanMessage(
        `Job Completed: Scanned ${result.instrumentsScanned} instruments. ${result.alertsCreated} alerts created, ${result.duplicatesSkipped} duplicates skipped.`
      );
      // Refresh active view
      await fetchMetrics();
      if (activeTab === 'UPCOMING') fetchInstruments();
      if (activeTab === 'CALENDAR') fetchCalendar();
      if (activeTab === 'ALERTS') fetchAlerts();
    } catch (err: any) {
      setScanMessage(`Scan error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse whitespace-nowrap shadow-2xs">
          <ShieldAlert className="w-3.5 h-3.5" />
          Matured ({Math.abs(days)}d ago)
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          Critical ({days}d left)
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shadow-2xs">
          <Clock className="w-3.5 h-3.5" />
          {days} days left
        </span>
      );
    }
    if (days <= 60) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shadow-2xs">
          {days} days left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
        {days} days left
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Maturity Monitoring & Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated statutory scrutiny, reminder escalation intervals & maturity timeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunJob}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{isScanning ? 'Running Scrutiny Job...' : 'Run Maturity Scan'}</span>
          </button>
        </div>
      </div>

      {/* Scan notification banner */}
      {scanMessage && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>{scanMessage}</span>
          </div>
          <button
            onClick={() => setScanMessage(null)}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Instruments
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">{metrics.totalActive}</div>
          <div className="text-[10px] text-slate-400 mt-1">Currently Pledged</div>
        </div>

        <div className="bg-white border border-blue-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Within 90 Days
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1.5">{metrics.approachingMaturity90}</div>
          <div className="text-[10px] text-blue-600/70 mt-1">First Reminder Phase</div>
        </div>

        <div className="bg-white border border-amber-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Within 30 Days
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1.5">{metrics.approachingMaturity30}</div>
          <div className="text-[10px] text-amber-600/70 mt-1">Escalated Warning</div>
        </div>

        <div className="bg-white border border-rose-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            Within 7 Days
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1.5">{metrics.approachingMaturity7}</div>
          <div className="text-[10px] text-rose-600/70 mt-1">Critical Notice</div>
        </div>

        <div className="bg-white border border-red-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
            Matured / Overdue
          </div>
          <div className="text-2xl font-bold font-mono text-red-700 mt-1.5">{metrics.maturedCount}</div>
          <div className="text-[10px] text-red-600/70 mt-1">Statutory Action Needed</div>
        </div>

        <div className="bg-white border border-emerald-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            At-Risk Exposure
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-2 truncate">
            {metrics.totalAtRiskAmount}
          </div>
          <div className="text-[10px] text-emerald-600/70 mt-1">Total Pledged Capital</div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'UPCOMING'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Maturity Radar & Windows</span>
        </button>

        <button
          onClick={() => setActiveTab('CALENDAR')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'CALENDAR'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Maturity Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'ALERTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Maturity Alerts & Logs</span>
        </button>
      </div>

      {/* TAB 1: UPCOMING MATURITIES */}
      {activeTab === 'UPCOMING' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'All Instruments', val: 'ALL' },
                { label: '90 Days', val: '90_DAYS' },
                { label: '60 Days', val: '60_DAYS' },
                { label: '30 Days', val: '30_DAYS' },
                { label: '15 Days', val: '15_DAYS' },
                { label: '7 Days', val: '7_DAYS' },
                { label: 'Overdue / Matured', val: 'OVERDUE' },
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => setWindowFilter(btn.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    windowFilter === btn.val
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search FDR, Bank, Institution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInstruments()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">Instrument ID / FDR #</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Institution</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Bank & Branch</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Deposit Amount</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Maturity Date</th>
                    <th className="py-3.5 px-4 whitespace-nowrap text-center">Status / Countdown</th>
                    <th className="py-3.5 px-4 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading maturity status...
                      </td>
                    </tr>
                  ) : instruments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No instruments found matching the specified maturity criteria.
                      </td>
                    </tr>
                  ) : (
                    instruments.map((fdr) => (
                      <tr key={fdr._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                          <div className="text-indigo-600 font-bold">{fdr.fdrNumber}</div>
                          <div className="text-[10px] text-slate-400">{fdr.fdrId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 max-w-[240px] truncate" title={fdr.institutionName}>
                            {fdr.institutionName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{fdr.institutionId}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">{fdr.bankName}</div>
                          <div className="text-[10px] text-slate-400">{fdr.bankBranch}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold font-mono text-slate-900 whitespace-nowrap">
                          {fdr.depositAmountFormatted}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {new Date(fdr.maturityDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          {getUrgencyBadge(fdr.daysRemaining)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() =>
                              navigate(`/renewals?previousInstrumentId=${fdr.fdrId}&fdrNumber=${fdr.fdrNumber}`)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-semibold transition-all border border-indigo-200 shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Renew</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATURITY CALENDAR */}
      {activeTab === 'CALENDAR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Months Grid */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Maturity Schedule by Calendar Month
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {calendarGroups.map((group) => {
                const isSelected =
                  selectedMonth?.year === group.year && selectedMonth?.month === group.month;
                return (
                  <div
                    key={`${group.year}-${group.month}`}
                    onClick={() => setSelectedMonth(group)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{group.monthName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                        {group.count}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 font-medium">Maturing Volume:</div>
                    <div className="text-sm font-bold text-emerald-700 font-mono">{group.totalAmount}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Month Drawer */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedMonth?.monthName || 'Select a Month'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {selectedMonth?.count || 0} instrument(s) maturing
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Capital</div>
                <div className="font-bold text-emerald-700 text-sm font-mono">
                  {selectedMonth?.totalAmount || '₹0.00'}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {selectedMonth?.instruments.map((inst) => (
                <div
                  key={inst.fdrId}
                  className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-indigo-600 text-xs font-semibold">
                      {inst.fdrNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(inst.maturityDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium truncate">
                    {inst.institutionName}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {inst.depositAmountFormatted}
                    </span>
                    <button
                      onClick={() =>
                        navigate(
                          `/renewals?previousInstrumentId=${inst.fdrId}&fdrNumber=${inst.fdrNumber}`
                        )
                      }
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Renew <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MATURITY ALERTS */}
      {activeTab === 'ALERTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Alert ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Severity</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Institution</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Alert Details</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Notification Channel</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Escalated</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading statutory alerts...
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No statutory alerts or overdue notices currently recorded. Click "Run Maturity Scan" to analyze active instruments.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alt) => (
                    <tr key={alt._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        {alt.alertId}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            alt.severity === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : alt.severity === 'WARNING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {alt.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 max-w-[200px] truncate" title={alt.institutionName}>{alt.institutionName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{alt.institutionId}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-sm">
                        {alt.alertMessage}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <span>📧 Email Dispatched</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[200px]" title={alt.sentToEmails?.join(', ')}>
                          {alt.sentToEmails?.join(', ') || 'officer@aicte-india.org'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {alt.isEscalated ? (
                          <span className="text-rose-600 font-bold inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 rounded-md border border-rose-200 text-[10px]">
                            <ShieldAlert className="w-3.5 h-3.5" /> ESCALATED
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {new Date(alt.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
