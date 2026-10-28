import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileSearch,
  Building2,
  Calendar,
  Eye,
  MessageSquareQuote,
  RefreshCw,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { FdrItem } from '../fdrs/types';
import { DiscrepancyItem, SEVERITY_CONFIG } from './types';
import { VerificationDetailsModal } from './VerificationDetailsModal';
import { ResolveDiscrepancyModal } from './ResolveDiscrepancyModal';

export const VerificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SCRUTINY' | 'DISCREPANCIES'>('PENDING');
  const [pendingFdrs, setPendingFdrs] = useState<FdrItem[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDuplicate, setFilterDuplicate] = useState<string>('ALL');

  // Selected for Scrutiny
  const [selectedFdrId, setSelectedFdrId] = useState<string | null>(null);
  const [resolveDisc, setResolveDisc] = useState<DiscrepancyItem | null>(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    pending: 0,
    underScrutiny: 0,
    openDiscrepancies: 0,
    flaggedDuplicates: 0,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filterDuplicate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'DISCREPANCIES') {
        const res: any = await api.get('/v1/discrepancies', {
          params: {
            search: searchTerm.trim() || undefined,
            resolutionStatus: 'OPEN',
          },
        });
        const discItems = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];
        setDiscrepancies(discItems);
      } else {
        const res: any = await api.get('/v1/verifications/pending', {
          params: {
            search: searchTerm.trim() || undefined,
            isDuplicateFlagged: filterDuplicate === 'DUPLICATES_ONLY' ? true : undefined,
          },
        });
        const items: FdrItem[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];
        setPendingFdrs(items);

        // Update metrics
        const pendingCount = items.filter((f) => f.verificationStatus === 'PENDING').length;
        const scrutinyCount = items.filter((f) => f.verificationStatus === 'UNDER_SCRUTINY').length;
        const dupCount = items.filter((f) => f.isDuplicateFlagged).length;

        setMetrics((prev) => ({
          ...prev,
          pending: pendingCount,
          underScrutiny: scrutinyCount,
          flaggedDuplicates: dupCount,
        }));
      }

      // Fetch open discrepancies count
      const discCountRes: any = await api.get('/v1/discrepancies', { params: { resolutionStatus: 'OPEN', limit: 1 } });
      setMetrics((prev) => ({
        ...prev,
        openDiscrepancies: discCountRes?.meta?.total || discCountRes?.data?.meta?.total || discCountRes?.data?.total || 0,
      }));
    } catch (err) {
      console.error('Failed to load verification desk data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Officer Verification Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Primary statutory scrutiny, 10-point checklist validation, and discrepancy management
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Desk
        </button>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Scrutiny
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.pending}
          </p>
          <span className="text-xs text-blue-600 font-medium">Awaiting primary officer review</span>
        </div>

        <div className="p-5 bg-white border border-purple-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
              Under Scrutiny / Returned
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-purple-700 mt-2">
            {metrics.underScrutiny}
          </p>
          <span className="text-xs text-purple-600 font-medium">Clarification issued to institution</span>
        </div>

        <div className="p-5 bg-white border border-red-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
              Active Discrepancies
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-red-700 mt-2">
            {metrics.openDiscrepancies}
          </p>
          <span className="text-xs text-red-600 font-medium">Unresolved deficiency flags</span>
        </div>

        <div className="p-5 bg-white border border-amber-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Duplicate Review Flags
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FileSearch className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-2">
            {metrics.flaggedDuplicates}
          </p>
          <span className="text-xs text-amber-600 font-medium">De-duplication alert matches</span>
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'PENDING'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pending Verification Queue
            </button>
            <button
              onClick={() => setActiveTab('DISCREPANCIES')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'DISCREPANCIES'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Discrepancy Desk ({metrics.openDiscrepancies})
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search FDR, Bank, Institution..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {activeTab === 'PENDING' && (
              <select
                value={filterDuplicate}
                onChange={(e) => setFilterDuplicate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Queue</option>
                <option value="DUPLICATES_ONLY">Duplicate Flags Only</option>
              </select>
            )}
          </form>
        </div>

        {/* Content Table */}
        {activeTab === 'DISCREPANCIES' ? (
          /* Discrepancies Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Discrepancy ID</th>
                  <th className="py-3 px-4">Instrument ID</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Category & Title</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {discrepancies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No open discrepancies found.
                    </td>
                  </tr>
                ) : (
                  discrepancies.map((disc) => {
                    const sev = SEVERITY_CONFIG[disc.severity] || SEVERITY_CONFIG.MEDIUM;
                    return (
                      <tr
                        key={disc._id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          #{disc.discrepancyId}
                        </td>
                        <td className="py-3 px-4 font-mono text-indigo-600 font-medium">
                          {disc.instrumentId}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {disc.institutionName || disc.institutionId}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{disc.title}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">{disc.description}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${sev.badgeClass}`}
                          >
                            {sev.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {disc.resolutionStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setResolveDisc(disc)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Pending Queue Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Instrument ID</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Bank & Branch</th>
                  <th className="py-3 px-4">FDR Number</th>
                  <th className="py-3 px-4">Deposit Amount</th>
                  <th className="py-3 px-4">Tenure</th>
                  <th className="py-3 px-4">Flags</th>
                  <th className="py-3 px-4 text-right">Scrutiny Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingFdrs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No instruments pending officer verification in this queue.
                    </td>
                  </tr>
                ) : (
                  pendingFdrs.map((fdr) => (
                    <tr
                      key={fdr._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {fdr.fdrId}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{fdr.institutionName}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{fdr.institutionId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-medium">{fdr.bankName}</p>
                        <p className="text-[10px] text-slate-400">{fdr.bankBranch}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {fdr.fdrNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {fdr.depositAmountFormatted || `₹${fdr.depositAmount}`}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(fdr.maturityDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {fdr.isDuplicateFlagged ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> Duplicate Suspect
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-600">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/verifications/${fdr.fdrId || fdr._id}`)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-1.5 ml-auto text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> Scrutinize
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Details Modal */}
      {selectedFdrId && (
        <VerificationDetailsModal
          isOpen={!!selectedFdrId}
          onClose={() => setSelectedFdrId(null)}
          fdrId={selectedFdrId}
          onSuccess={fetchData}
        />
      )}

      {/* Resolve Discrepancy Modal */}
      {resolveDisc && (
        <ResolveDiscrepancyModal
          isOpen={!!resolveDisc}
          onClose={() => setResolveDisc(null)}
          discrepancy={resolveDisc}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
