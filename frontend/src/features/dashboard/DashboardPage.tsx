import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  FileCheck2,
  Users,
  Activity,
  TrendingUp,
  Landmark,
  Scale,
  RefreshCw,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { apiClient as api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  RoleDashboardSummary,
  MaturityAnalytics,
  ComplianceAnalytics,
  VerificationAnalytics,
  DashboardKpis,
} from './types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<RoleDashboardSummary | null>(null);
  const [maturity, setMaturity] = useState<MaturityAnalytics | null>(null);
  const [compliance, setCompliance] = useState<ComplianceAnalytics | null>(null);
  const [verification, setVerification] = useState<VerificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, matRes, compRes, verRes] = await Promise.all([
        api.get('/v1/dashboard/summary'),
        api.get('/v1/dashboard/maturity'),
        api.get('/v1/dashboard/compliance'),
        api.get('/v1/dashboard/verification'),
      ]);

      const unwrap = (res: any) => {
        if (!res) return null;
        if (res.data !== undefined) {
          if (res.data?.data !== undefined) return res.data.data;
          return res.data;
        }
        return res;
      };

      setSummary(unwrap(sumRes));
      setMaturity(unwrap(matRes));
      setCompliance(unwrap(compRes));
      setVerification(unwrap(verRes));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load executive dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpis: DashboardKpis = summary?.kpis || {
    totalDepositAmount: 0,
    activeInstruments: 0,
    pendingVerification: 0,
    approachingMaturity: 0,
    maturedInstruments: 0,
    renewalRequests: 0,
    releaseRequests: 0,
    compliancePercentage: 100,
  };

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Role Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AICTE Central Financial & Instrument Life-Cycle Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Executive Command Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <span className="font-bold text-slate-800">{user?.fullName || user?.email}</span> •{' '}
           
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-sm transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 8 Universal Professional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Deposit Amount */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-indigo-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-200">Total Deposit Pledged</span>
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">
            ₹{kpis.totalDepositAmount.toLocaleString('en-IN')}
          </div>
          <span className="mt-1 block text-[11px] text-indigo-300/80">Active escrowed security deposits</span>
        </div>

        {/* 2. Active Instruments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Instruments</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{kpis.activeInstruments}</div>
          <span className="mt-1 text-[11px] text-slate-400">Valid FDR certificates</span>
        </div>

        {/* 3. Pending Verification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Scrutiny</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">{kpis.pendingVerification}</div>
          <span className="mt-1 text-[11px] text-slate-400">Awaiting officer checklist</span>
        </div>

        {/* 4. Approaching Maturity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Approaching Maturity</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-600">{kpis.approachingMaturity}</div>
          <span className="mt-1 text-[11px] text-slate-400">Maturing in next 30 days</span>
        </div>

        {/* 5. Matured Instruments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Matured Deposits</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-purple-700">{kpis.maturedInstruments}</div>
          <span className="mt-1 text-[11px] text-slate-400">Elapsed tenure instruments</span>
        </div>

        {/* 6. Renewal Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Renewal Requests</span>
            <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-cyan-700">{kpis.renewalRequests}</div>
          <span className="mt-1 text-[11px] text-slate-400">Replacement instruments in flight</span>
        </div>

        {/* 7. Release Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Release Disbursements</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-blue-700">{kpis.releaseRequests}</div>
          <span className="mt-1 text-[11px] text-slate-400">Active refund petitions</span>
        </div>

        {/* 8. Compliance Percentage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Compliance Ratio</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">{kpis.compliancePercentage}%</div>
          <span className="mt-1 text-[11px] text-slate-400">Verified vs Required Amount</span>
        </div>
      </div>

      {/* Role-Specific Executive Highlights */}
      {summary?.role === 'INSTITUTION_ADMIN' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-700" />
              <h3 className="text-base font-bold text-blue-950">
                Institutional Profile & Statutory Standing
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-blue-800 border border-blue-300">
              Status: {summary.complianceStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
              <span className="text-slate-500 block">Total Required Escrow:</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                ₹{summary.depositRequirementSummary?.totalRequiredAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
              <span className="text-slate-500 block">Verified Active Escrow:</span>
              <span className="text-base font-bold text-emerald-600 mt-1 block">
                ₹{summary.depositRequirementSummary?.totalVerifiedDeposit.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
              <span className="text-slate-500 block">Outstanding Compliance Shortfall:</span>
              <span className="text-base font-bold text-rose-600 mt-1 block">
                ₹{summary.depositRequirementSummary?.outstandingShortfall.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {summary?.role === 'VERIFICATION_OFFICER' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-700" />
              <h3 className="text-base font-bold text-amber-950">
                Verification Desk Workload & SLA Performance
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-amber-800 border border-amber-300">
              SLA Adherence: {summary.verificationSlaRate}%
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-amber-100">
              <span className="text-slate-500 block">Pending Queue:</span>
              <span className="text-lg font-bold text-amber-700 mt-1 block">
                {summary.pendingVerificationCount} instruments
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-100">
              <span className="text-slate-500 block">7-Day Backlog:</span>
              <span className="text-lg font-bold text-rose-600 mt-1 block">
                {summary.verificationBacklogCount} instruments
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-100">
              <span className="text-slate-500 block">Clarifications Open:</span>
              <span className="text-lg font-bold text-slate-800 mt-1 block">
                {summary.clarificationRequestsCount} requests
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-100">
              <span className="text-slate-500 block">Recently Verified (7d):</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block">
                {summary.recentlyVerifiedCount} instruments
              </span>
            </div>
          </div>
        </div>
      )}

      {summary?.role === 'APPROVING_AUTHORITY' && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-700" />
              <h3 className="text-base font-bold text-purple-950">
                Approvals & Sanctions Dispatch Queue
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-purple-800 border border-purple-300">
              Pending Decisions: {summary.pendingApprovalsCount}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-purple-100">
              <span className="text-slate-500 block">Release Sanctions:</span>
              <span className="text-lg font-bold text-purple-700 mt-1 block">
                {summary.releaseRequestsCount} requests
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-100">
              <span className="text-slate-500 block">Renewal Approvals:</span>
              <span className="text-lg font-bold text-indigo-700 mt-1 block">
                {summary.renewalApprovalsCount} requests
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-100">
              <span className="text-slate-500 block">Escalated (&gt;₹50L):</span>
              <span className="text-lg font-bold text-rose-600 mt-1 block">
                {summary.escalatedRequestsCount} high-value
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-100">
              <span className="text-slate-500 block">Approval History:</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block">
                {summary.approvalHistoryCount} sanitized
              </span>
            </div>
          </div>
        </div>
      )}



      {/* Analytics Visual Charts via Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly FDR Submissions Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly FDR Submissions & Flow</h3>
              <p className="text-xs text-slate-500">Volume and pledged value over the past 6 months</p>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={verification?.monthlyTrends || []}>
                <defs>
                  <linearGradient id="submissionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    name === 'amount' ? `₹${parseFloat(val).toLocaleString('en-IN')}` : val,
                    name === 'amount' ? 'Total Pledged' : 'Submissions',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="submissions" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#submissionsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Issuing Bank Deposit Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Deposit Distribution by Bank</h3>
              <p className="text-xs text-slate-500">Top commercial banks holding active escrows</p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            {verification?.bankDistribution && verification.bankDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verification.bankDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {verification.bankDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${parseFloat(val).toLocaleString('en-IN')}`, 'Pledged Escrow']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">No bank distribution data available</span>
            )}
          </div>
        </div>

        {/* Chart 3: Maturity Forecast Radar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Maturity Radar Proximity Brackets</h3>
              <p className="text-xs text-slate-500">Scheduled expirations across statutory intervals</p>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maturity?.upcomingMaturityBrackets || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bracket" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [val, 'Instruments']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Institutional Compliance Status Analytics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Statutory Compliance Standing</h3>
              <p className="text-xs text-slate-500">Institutional fulfillment breakdown</p>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            {compliance?.statusBreakdown && compliance.statusBreakdown.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compliance.statusBreakdown.filter((s) => s.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {compliance.statusBreakdown
                      .filter((s) => s.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-comp-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [val, 'Requirements']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">No compliance data available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
