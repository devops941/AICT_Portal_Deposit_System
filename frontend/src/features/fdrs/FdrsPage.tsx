import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Search,
  Plus,
  RefreshCw,
  Building,
  Landmark,
  Eye,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  FdrItem,
  FdrDashboardMetrics,
  SUBMISSION_STATUS_CONFIG,
  VERIFICATION_STATUS_CONFIG,
} from './types';
import { AddFdrModal } from './AddFdrModal';
import { EditFdrModal } from './EditFdrModal';
import { FdrDetailsModal } from './FdrDetailsModal';

export const FdrsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('FDR:CREATE');
  const canUpdate = hasPermission('FDR:UPDATE');
  const canSubmit = hasPermission('FDR:SUBMIT');

  const [fdrs, setFdrs] = useState<FdrItem[]>([]);
  const [metrics, setMetrics] = useState<FdrDashboardMetrics | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<string>('');
  const [verificationFilter, setVerificationFilter] = useState<string>('');
  const [duplicateFilter, setDuplicateFilter] = useState<string>('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null);
  const [editingFdr, setEditingFdr] = useState<FdrItem | null>(null);

  const fetchFdrs = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (submissionFilter) params.submissionStatus = submissionFilter;
      if (verificationFilter) params.verificationStatus = verificationFilter;
      if (duplicateFilter) params.isDuplicateFlagged = duplicateFilter;

      const [listRes, metricsRes]: any = await Promise.all([
        apiClient.get('/v1/fdrs', { params }),
        apiClient.get('/v1/fdrs/metrics').catch(() => ({ data: null })),
      ]);

      if (listRes.data) {
        setFdrs(listRes.data);
        setTotalCount(listRes.meta?.total || listRes.data.length);
      }
      if (metricsRes?.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error('Error fetching FDRs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFdrs();
  }, [page, submissionFilter, verificationFilter, duplicateFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFdrs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSubmissionFilter('');
    setVerificationFilter('');
    setDuplicateFilter('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="w-full space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            FDR & Financial Instrument Register
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register, submit, and audit Fixed Deposit Receipts and Bank Guarantees with automated duplicate detection and secure document verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchFdrs}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={() => navigate('/fdrs/register')} className="gap-2">
              <Plus className="w-4 h-4" />
              Register New FDR
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Instruments
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics?.totalFdrs || totalCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {metrics?.draftCount || 0} drafts • {metrics?.submittedCount || 0} submitted
          </p>
        </Card>

        <Card className="p-5 border-emerald-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Total Registered Capital
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {metrics?.totalDepositFormatted || '₹0.00'}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {metrics?.verifiedCount || 0} instruments verified
          </p>
        </Card>

        <Card className="p-5 border-indigo-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Submitted for Scrutiny
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-700 mt-2">
            {metrics?.submittedCount || 0}
          </p>
          <p className="text-xs text-indigo-600 font-medium mt-1">
            Awaiting official bank verification
          </p>
        </Card>

        <Card className="p-5 border-amber-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Duplicate Review Flags
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-800 mt-2">
            {metrics?.duplicateFlaggedCount || 0}
          </p>
          <p className="text-xs text-amber-700 font-medium mt-1">
            Duplicate detection alert flagged
          </p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border-slate-200 bg-white shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by FDR ID, Certificate No, Bank, Holder, or Requirement ID..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={submissionFilter}
              onChange={(e) => {
                setSubmissionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700"
            >
              <option value="">All Submission Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="RETURNED_FOR_CORRECTION">RETURNED FOR CORRECTION</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700"
            >
              <option value="">All Verification Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="UNDER_SCRUTINY">UNDER SCRUTINY</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <select
              value={duplicateFilter}
              onChange={(e) => {
                setDuplicateFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700"
            >
              <option value="">All Duplicate Flags</option>
              <option value="true">Flagged Duplicates Only</option>
              <option value="false">Clean Instruments Only</option>
            </select>

            <Button type="submit" size="sm" variant="outline">
              Filter
            </Button>
            {(search || submissionFilter || verificationFilter || duplicateFilter) && (
              <Button type="button" size="sm" variant="ghost" onClick={handleResetFilters}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* FDR Table */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">FDR ID & Certificate</th>
                <th className="py-3.5 px-4">Institution</th>
                <th className="py-3.5 px-4">Bank & Branch</th>
                <th className="py-3.5 px-4">Deposit Amount</th>
                <th className="py-3.5 px-4">Maturity Date</th>
                <th className="py-3.5 px-4">Submission</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading FDR records...
                  </td>
                </tr>
              ) : fdrs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No financial deposit records found.
                  </td>
                </tr>
              ) : (
                fdrs.map((item) => {
                  const subConfig = SUBMISSION_STATUS_CONFIG[item.submissionStatus];
                  const verConfig = VERIFICATION_STATUS_CONFIG[item.verificationStatus];

                  const rawAmount =
                    typeof item.depositAmount === 'object' && item.depositAmount !== null
                      ? (item.depositAmount as any).$numberDecimal || '0'
                      : item.depositAmount || '0';
                  const formattedAmt = Number(rawAmount).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  return (
                    <tr key={item._id || item.fdrId} className="hover:bg-slate-50/60 transition-colors">
                      {/* FDR ID & Number */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {item.fdrId}
                          </span>
                          {item.isDuplicateFlagged && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300" title={item.duplicateReviewNotes}>
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Duplicate Alert
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 font-mono font-semibold text-xs mt-1">
                          Cert #{item.fdrNumber}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          Mandate: {item.requirementId}
                        </p>
                      </td>

                      {/* Institution */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block line-clamp-1 max-w-[160px]">
                          {item.institutionName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                          {item.institutionId}
                        </span>
                      </td>

                      {/* Bank & Branch */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block line-clamp-1 max-w-[160px]">
                          {item.bankName}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 line-clamp-1 max-w-[160px]">
                          {item.bankBranch}
                        </span>
                      </td>

                      {/* Deposit Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₹{formattedAmt}
                      </td>

                      {/* Maturity Date */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="block font-medium">
                          {new Date(item.maturityDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Issued: {new Date(item.issueDate).toLocaleDateString('en-IN')}
                        </span>
                      </td>

                      {/* Submission Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={subConfig.badgeVariant}>{subConfig.label}</Badge>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={verConfig.badgeVariant}>{verConfig.label}</Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedDetailsId(item.fdrId)}
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View FDR Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(item.submissionStatus === 'DRAFT' || item.submissionStatus === 'RETURNED_FOR_CORRECTION') && canUpdate && (
                            <button
                              onClick={() => navigate(`/fdrs/edit/${item.fdrId}`)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Draft Record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {fdrs.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, totalCount)} of {totalCount} instruments
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1 px-2.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="font-semibold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1 px-2.5"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <AddFdrModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchFdrs}
      />

      <EditFdrModal
        isOpen={!!editingFdr}
        fdr={editingFdr}
        onClose={() => setEditingFdr(null)}
        onSuccess={fetchFdrs}
      />

      <FdrDetailsModal
        isOpen={!!selectedDetailsId}
        fdrId={selectedDetailsId}
        onClose={() => setSelectedDetailsId(null)}
        onRefresh={fetchFdrs}
        onEditDraft={(fdrItem) => setEditingFdr(fdrItem)}
      />
    </div>
  );
};
