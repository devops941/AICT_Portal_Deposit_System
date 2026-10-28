import React, { useState, useEffect, useRef } from 'react';
import {
  Landmark,
  Search,
  Plus,
  RefreshCw,
  MoreVertical,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  ShieldPlus,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  RequirementItem,
  RequirementType,
  ComplianceStatus,
  DashboardMetrics,
  REQUIREMENT_TYPE_LABELS,
  COMPLIANCE_STATUS_CONFIG,
} from './types';
import { CreateRequirementModal } from './CreateRequirementModal';
import { EditRequirementModal } from './EditRequirementModal';
import { RequirementDetailsModal } from './RequirementDetailsModal';
import { PledgeInstrumentModal } from './PledgeInstrumentModal';
import { InstitutionComplianceModal } from './InstitutionComplianceModal';

export const RequirementsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('DEPOSITS:CREATE');
  const canUpdate = hasPermission('DEPOSITS:UPDATE');
  const canPledge = hasPermission('DEPOSITS:SUBMIT');

  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [complianceFilter, setComplianceFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null);
  const [editingRequirement, setEditingRequirement] = useState<RequirementItem | null>(null);
  const [pledgingRequirement, setPledgingRequirement] = useState<RequirementItem | null>(null);
  const [viewingInstitutionId, setViewingInstitutionId] = useState<string | null>(null);
  const [viewingInstitutionName, setViewingInstitutionName] = useState<string>('');

  // Actions menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRequirements = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (complianceFilter) params.complianceStatus = complianceFilter;
      if (typeFilter) params.requirementType = typeFilter;

      const [listRes, metricsRes]: any = await Promise.all([
        apiClient.get('/v1/requirements', { params }),
        apiClient.get('/v1/requirements/metrics').catch(() => ({ data: null })),
      ]);

      if (listRes.data) {
        setRequirements(listRes.data);
        setTotalCount(listRes.meta?.total || listRes.data.length);
      }
      if (metricsRes?.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error('Error fetching requirements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [page, complianceFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequirements();
  };

  const handleResetFilters = () => {
    setSearch('');
    setComplianceFilter('');
    setTypeFilter('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Compute live aggregates from currently loaded requirements
  let sumRequired = 0;
  let sumVerified = 0;
  let sumShortfall = 0;

  requirements.forEach((r) => {
    const req = r.calculatedCompliance ? parseFloat(r.calculatedCompliance.requiredAmount) : 0;
    const ver = r.calculatedCompliance ? parseFloat(r.calculatedCompliance.eligibleVerifiedDeposit) : 0;
    const sft = r.calculatedCompliance ? parseFloat(r.calculatedCompliance.outstandingShortfall) : 0;
    sumRequired += req;
    sumVerified += ver;
    sumShortfall += sft;
  });

  return (
    <div className="w-full space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Security Deposit Requirements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mandate, track, and audit institutional joint security deposits, FDRs, and guarantees with real-time compliance calculation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchRequirements}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Requirement
            </Button>
          )}
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Mandated
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            ₹{sumRequired.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Across {metrics?.totalRequirements || totalCount} security mandates
          </p>
        </Card>

        <Card className="p-5 border-emerald-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Eligible Verified Deposit
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            ₹{sumVerified.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {metrics?.compliantCount || 0} mandates 100% compliant
          </p>
        </Card>

        <Card className="p-5 border-rose-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Outstanding Shortfall
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-rose-700 mt-2">
            ₹{sumShortfall.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-rose-600 font-medium mt-1">
            Shortfall = max(0, Required - Verified)
          </p>
        </Card>

        <Card className="p-5 border-indigo-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Under Review / Scrutiny
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-700 mt-2">
            {metrics?.underReviewCount || 0}
          </p>
          <p className="text-xs text-indigo-600 font-medium mt-1">
            Pledges awaiting official verification
          </p>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="p-4 border-slate-200 bg-white shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Requirement ID, Title, Institution Name, or Rule Reference..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={complianceFilter}
              onChange={(e) => {
                setComplianceFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700"
            >
              <option value="">All Compliance Statuses</option>
              <option value="COMPLIANT">COMPLIANT</option>
              <option value="PARTIALLY_COMPLIANT">PARTIALLY COMPLIANT</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="NOT_SUBMITTED">NOT SUBMITTED</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700 max-w-[200px]"
            >
              <option value="">All Requirement Types</option>
              {Object.entries(REQUIREMENT_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>

            <Button type="submit" size="sm" variant="outline">
              Filter
            </Button>
            {(search || complianceFilter || typeFilter) && (
              <Button type="button" size="sm" variant="ghost" onClick={handleResetFilters}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Requirements Data Table */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Requirement ID & Title</th>
                <th className="py-3.5 px-4">Institution</th>
                <th className="py-3.5 px-4">Required Amount</th>
                <th className="py-3.5 px-4">Eligible Deposit</th>
                <th className="py-3.5 px-4">Outstanding Shortfall</th>
                <th className="py-3.5 px-4">Submission Deadline</th>
                <th className="py-3.5 px-4">Compliance Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading security deposit requirements...
                  </td>
                </tr>
              ) : requirements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Landmark className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No security deposit requirements found matching filters.
                  </td>
                </tr>
              ) : (
                requirements.map((req) => {
                  const cfg = COMPLIANCE_STATUS_CONFIG[req.complianceStatus];
                  const hasShortfall = req.shortfall && parseFloat(req.shortfall) > 0;
                  const isMenuOpen = activeMenuId === req._id;

                  return (
                    <tr key={req._id || req.requirementId} className="hover:bg-slate-50/60 transition-colors">
                      {/* ID & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {req.requirementId}
                          </span>
                        </div>
                        <p className="text-slate-800 font-semibold mt-1 line-clamp-1 max-w-xs">
                          {req.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Ref: {req.applicableRuleReference}
                        </p>
                      </td>

                      {/* Institution */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingInstitutionId(req.institutionId);
                            setViewingInstitutionName(req.institutionName);
                          }}
                          className="text-left group"
                        >
                          <span className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors block line-clamp-1 max-w-[180px]">
                            {req.institutionName}
                          </span>
                          <span className="text-[11px] text-primary-600 font-mono mt-0.5 block group-hover:underline">
                            {req.institutionId} ↗
                          </span>
                        </button>
                      </td>

                      {/* Required Amount */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {req.calculatedCompliance?.requiredAmountFormatted ||
                          `₹${Number(
                            typeof req.requiredAmount === 'object' && req.requiredAmount !== null
                              ? (req.requiredAmount as any).$numberDecimal || 0
                              : req.requiredAmount
                          ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      </td>

                      {/* Eligible Deposit */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                        {req.eligibleDepositFormatted || '₹0.00'}
                      </td>

                      {/* Outstanding Shortfall */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold ${
                            hasShortfall ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {req.shortfallFormatted || (hasShortfall ? `₹${req.shortfall}` : '₹0.00')}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="block font-medium">
                          {new Date(req.submissionDeadline).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span
                          className={`text-[10px] font-semibold mt-0.5 block ${
                            req.complianceStatus === 'OVERDUE' ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          {req.complianceStatus === 'OVERDUE'
                            ? 'Deadline Expired'
                            : `${Math.ceil(
                                (new Date(req.submissionDeadline).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )} days left`}
                        </span>
                      </td>

                      {/* Compliance Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedDetailsId(req.requirementId)}
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Full Details & Financial Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canPledge && (
                            <button
                              onClick={() => setPledgingRequirement(req)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Pledge Financial Instrument"
                            >
                              <ShieldPlus className="w-4 h-4" />
                            </button>
                          )}

                          {canUpdate && (
                            <button
                              onClick={() => setEditingRequirement(req)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Requirement"
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
            Showing {requirements.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, totalCount)} of {totalCount} requirements
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
      <CreateRequirementModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchRequirements}
      />

      <EditRequirementModal
        isOpen={!!editingRequirement}
        requirement={editingRequirement}
        onClose={() => setEditingRequirement(null)}
        onSuccess={fetchRequirements}
      />

      <RequirementDetailsModal
        isOpen={!!selectedDetailsId}
        requirementId={selectedDetailsId}
        onClose={() => setSelectedDetailsId(null)}
        onRefresh={fetchRequirements}
        onOpenPledgeModal={() => {
          const req = requirements.find((r) => r.requirementId === selectedDetailsId);
          if (req) {
            setPledgingRequirement(req);
          }
        }}
      />

      <PledgeInstrumentModal
        isOpen={!!pledgingRequirement}
        requirement={pledgingRequirement}
        onClose={() => setPledgingRequirement(null)}
        onSuccess={() => {
          fetchRequirements();
          if (selectedDetailsId) {
            // Trigger refresh in details modal if open
            setSelectedDetailsId(selectedDetailsId);
          }
        }}
      />

      <InstitutionComplianceModal
        isOpen={!!viewingInstitutionId}
        institutionId={viewingInstitutionId}
        institutionName={viewingInstitutionName}
        onClose={() => {
          setViewingInstitutionId(null);
          setViewingInstitutionName('');
        }}
      />
    </div>
  );
};
