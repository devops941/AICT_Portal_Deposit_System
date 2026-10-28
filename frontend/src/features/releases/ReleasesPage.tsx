import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  RefreshCw,
  AlertCircle,
  Archive,
  Lock,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { ReleaseItem, ReleaseMetrics } from './types';
import { CreateReleaseModal } from './CreateReleaseModal';
import { ReleaseDetailsModal } from './ReleaseDetailsModal';

export const ReleasesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);

  // URL prefill params
  const initialInstrumentId = searchParams.get('instrumentId') || '';
  const initialFdrNumber = searchParams.get('fdrNumber') || '';

  // Metrics
  const [metrics, setMetrics] = useState<ReleaseMetrics>({
    totalRequests: 0,
    pending: 0,
    underReview: 0,
    clarificationRequired: 0,
    approved: 0,
    authorizedRelease: 0,
    closed: 0,
    rejected: 0,
    totalReleasedAmount: '₹0.00',
  });

  useEffect(() => {
    if (initialInstrumentId) {
      setIsCreateModalOpen(true);
    }
  }, [initialInstrumentId]);

  useEffect(() => {
    fetchReleases();
    fetchMetrics();
  }, [statusFilter]);

  const fetchMetrics = async () => {
    try {
      const res: any = await api.get('/releases/metrics');
      const data = res.data?.data || res.data || res;
      if (data && typeof data === 'object') {
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch release metrics', err);
    }
  };

  const fetchReleases = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/releases', {
        params: {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
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
      setReleases(items);
    } catch (err) {
      console.error('Failed to fetch releases', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            Closed
          </span>
        );
      case 'AUTHORIZED_RELEASE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Authorized
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'CLARIFICATION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Clarification
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            Under Scrutiny
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Submitted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Release & Refund Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Statutory deposit discharge assessment, multi-level sanctioning & refund authorization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create Release Request</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Requests
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">{metrics.totalRequests}</div>
          <div className="text-[10px] text-slate-400 mt-1">Discharge Filings</div>
        </div>

        <div className="bg-white border border-blue-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Under Scrutiny
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1.5">
            {metrics.pending + metrics.underReview}
          </div>
          <div className="text-[10px] text-blue-600/70 mt-1">Pending Decisions</div>
        </div>

        <div className="bg-white border border-amber-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Clarification
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1.5">
            {metrics.clarificationRequired}
          </div>
          <div className="text-[10px] text-amber-600/70 mt-1">Awaiting Response</div>
        </div>

        <div className="bg-white border border-emerald-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Approved / Discharged
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1.5">
            {metrics.approved + metrics.authorizedRelease}
          </div>
          <div className="text-[10px] text-emerald-600/70 mt-1">Statutory Sanctions</div>
        </div>

        <div className="bg-white border border-teal-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
            Released Capital
          </div>
          <div className="text-lg font-bold font-mono text-teal-700 mt-2 truncate">
            {metrics.totalReleasedAmount}
          </div>
          <div className="text-[10px] text-teal-600/70 mt-1">Discharged Volume</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'All Requests', val: 'ALL' },
            { label: 'Pending / Review', val: 'UNDER_REVIEW' },
            { label: 'Clarification', val: 'CLARIFICATION_REQUIRED' },
            { label: 'Approved', val: 'APPROVED' },
            { label: 'Authorized', val: 'AUTHORIZED_RELEASE' },
            { label: 'Closed', val: 'CLOSED' },
          ].map((st) => (
            <button
              key={st.val}
              onClick={() => setStatusFilter(st.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === st.val
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Release ID, FDR #, Bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReleases()}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Release ID</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Certificate # / Depository</th>
                <th className="py-3 px-4">Requested Amount</th>
                <th className="py-3 px-4">Approval Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading release requests...
                  </td>
                </tr>
              ) : releases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No release requests found matching the specified criteria.
                  </td>
                </tr>
              ) : (
                releases.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <div className="text-indigo-600 font-bold">{item.releaseId}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.requestDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.institutionName}</div>
                      <div className="text-[10px] text-slate-400">{item.institutionId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 font-medium">{item.fdrNumber}</div>
                      <div className="text-[10px] text-slate-400">{item.bankName}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.requestedAmountFormatted}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">
                        Level {item.currentLevel} of {item.totalLevels}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Score: {item.eligibilityScore}%
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReleaseId(item.releaseId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-semibold transition-all border border-indigo-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Release Modal */}
      <CreateReleaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchReleases();
          fetchMetrics();
        }}
        initialInstrumentId={initialInstrumentId}
        initialFdrNumber={initialFdrNumber}
      />

      {/* Release Details Modal */}
      <ReleaseDetailsModal
        releaseId={selectedReleaseId}
        onClose={() => setSelectedReleaseId(null)}
        onUpdated={() => {
          fetchReleases();
          fetchMetrics();
        }}
      />
    </div>
  );
};
