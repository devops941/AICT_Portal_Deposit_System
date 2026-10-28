import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldAlert,
  ArrowUpRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { ApprovalItem, ApprovalStatus, APPROVAL_STATUS_CONFIG } from './types';

export const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Metrics
  const [metrics, setMetrics] = useState({
    pending: 0,
    approved: 0,
    returned: 0,
    escalated: 0,
  });

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/v1/approvals', {
        params: {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          search: searchTerm.trim() || undefined,
        },
      });

      const items: ApprovalItem[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setApprovals(items);

      // Compute metrics
      const pendingCount = items.filter((a) => a.status === 'PENDING').length;
      const approvedCount = items.filter((a) => a.status === 'APPROVED').length;
      const returnedCount = items.filter((a) => a.status === 'RETURNED').length;
      const escalatedCount = items.filter((a) => a.status === 'ESCALATED').length;

      setMetrics({
        pending: pendingCount,
        approved: approvedCount,
        returned: returnedCount,
        escalated: escalatedCount,
      });
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApprovals();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Financial Approval Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-level statutory sanctioning hierarchy, separation of duties, and release concurrence
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Workflows
        </button>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 bg-white border border-amber-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending Sanction
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.pending}
          </p>
          <span className="text-xs text-amber-600 font-medium">Awaiting level concurrence</span>
        </div>

        <div className="p-5 bg-white border border-emerald-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Sanctioned / Approved
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.approved}
          </p>
          <span className="text-xs text-emerald-600 font-medium">Completed multi-level approvals</span>
        </div>

        <div className="p-5 bg-white border border-purple-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
              Returned for Revision
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.returned}
          </p>
          <span className="text-xs text-purple-600 font-medium">Returned to preliminary step</span>
        </div>

        <div className="p-5 bg-white border border-rose-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Escalated Stages
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.escalated}
          </p>
          <span className="text-xs text-rose-600 font-medium">Forwarded to senior authorities</span>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Approval ID, Instrument ID, Institution..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Sanction</option>
              <option value="APPROVED">Sanctioned & Approved</option>
              <option value="RETURNED">Returned for Revision</option>
              <option value="ESCALATED">Escalated</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Approvals Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">Approval ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Instrument ID</th>
                <th className="py-3.5 px-4 min-w-[220px]">Institution</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Workflow Type</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Sanction Amount</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">Current Stage</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">Status</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {approvals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No approval workflow records found matching current criteria.
                  </td>
                </tr>
              ) : (
                approvals.map((app) => {
                  const statusConfig =
                    APPROVAL_STATUS_CONFIG[app.status] || APPROVAL_STATUS_CONFIG.PENDING;
                  return (
                    <tr
                      key={app._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        #{app.approvalId}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {app.instrumentId}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 max-w-[280px] truncate" title={app.institutionName}>
                        {app.institutionName}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200/60 font-mono">
                          {app.workflowType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900 whitespace-nowrap">
                        {app.amountFormatted || `₹${app.amount}`}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span className="font-semibold text-slate-800">
                          Level {app.currentStep} of {app.totalSteps}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center justify-center whitespace-nowrap min-w-[150px] px-3.5 py-1 text-xs font-bold rounded-full border shadow-2xs ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/approvals/${app.approvalId || app._id}`)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors inline-flex items-center gap-1.5 ml-auto text-xs whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review Stage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
