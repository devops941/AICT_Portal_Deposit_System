import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  Filter,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  RefreshCw,
  GitCommit,
  FileCheck,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { RenewalItem, RenewalStatus } from './types';
import { CreateRenewalModal } from './CreateRenewalModal';
import { RenewalDetailsModal } from './RenewalDetailsModal';

export const RenewalsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRenewalId, setSelectedRenewalId] = useState<string | null>(null);

  // URL prefill params from Maturity Dashboard
  const initialInstrumentId = searchParams.get('previousInstrumentId') || '';
  const initialFdrNumber = searchParams.get('fdrNumber') || '';

  // Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    drafts: 0,
    submitted: 0,
    approved: 0,
  });

  useEffect(() => {
    // If navigated from Maturity Dashboard with instrument params, open create modal automatically
    if (initialInstrumentId) {
      setIsCreateModalOpen(true);
    }
  }, [initialInstrumentId]);

  useEffect(() => {
    fetchRenewals();
  }, [statusFilter]);

  const fetchRenewals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/renewals', {
        params: {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          search: searchTerm.trim() || undefined,
        },
      });

      const items: RenewalItem[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      setRenewals(items);

      setMetrics({
        total: items.length,
        drafts: items.filter((r) => r.status === 'DRAFT').length,
        submitted: items.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length,
        approved: items.filter((r) => r.status === 'APPROVED').length,
      });
    } catch (err) {
      console.error('Failed to load renewals', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: RenewalStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Under Review
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Draft
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
            Renewal & Replacement Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Statutory instrument renewals, replacement linking, and immutable historical lineage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Renewal</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Renewals
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{metrics.total}</p>
          <span className="text-xs text-slate-500 font-medium">Lifecycle Actions</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Draft Requests
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-700 mt-2">{metrics.drafts}</p>
          <span className="text-xs text-slate-500 font-medium">Pending Replacement FDR</span>
        </div>

        <div className="bg-white border border-amber-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Under Scrutiny
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-2">{metrics.submitted}</p>
          <span className="text-xs text-amber-600 font-medium">Awaiting Officer Decision</span>
        </div>

        <div className="bg-white border border-emerald-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Approved & Active
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-2">{metrics.approved}</p>
          <span className="text-xs text-emerald-600 font-medium">Replacements Activated</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Requests' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Renewal ID, FDR #, Institution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRenewals()}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Renewals Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Renewal ID</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Predecessor Instrument</th>
                <th className="py-3 px-4">Replacement FDR</th>
                <th className="py-3 px-4">Deposit Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading renewal requests...
                  </td>
                </tr>
              ) : renewals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No renewal requests found. Click "Initiate Renewal" to register a replacement
                    instrument.
                  </td>
                </tr>
              ) : (
                renewals.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <div className="text-indigo-600 font-bold">{item.renewalId}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.institutionName}</div>
                      <div className="text-[10px] text-slate-400">{item.institutionId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 font-medium">
                        {item.originalFdrNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.originalBankName}</div>
                    </td>
                    <td className="py-3 px-4">
                      {item.replacementDetails ? (
                        <div>
                          <div className="font-mono text-indigo-600 font-bold">
                            {item.replacementDetails.fdrNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.replacementDetails.bankName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Pending details</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{item.originalAmountFormatted}</div>
                      {item.replacementAmountFormatted && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          New: {item.replacementAmountFormatted}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRenewalId(item.renewalId)}
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

      {/* Create Renewal Modal */}
      <CreateRenewalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchRenewals();
        }}
        initialInstrumentId={initialInstrumentId}
        initialFdrNumber={initialFdrNumber}
      />

      {/* Renewal Details Modal */}
      <RenewalDetailsModal
        renewalId={selectedRenewalId}
        onClose={() => setSelectedRenewalId(null)}
        onUpdated={() => {
          fetchRenewals();
        }}
      />
    </div>
  );
};
