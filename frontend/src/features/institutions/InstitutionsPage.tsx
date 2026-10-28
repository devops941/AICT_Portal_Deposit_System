import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  MoreVertical,
  Edit2,
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Mail,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  InstitutionItem,
  InstitutionType,
  VerificationStatus,
  InstitutionStatus,
  INSTITUTION_TYPE_LABELS,
} from './types';
import { InstitutionDetailsModal } from './InstitutionDetailsModal';
import { RegisterInstitutionModal } from './RegisterInstitutionModal';
import { EditInstitutionModal } from './EditInstitutionModal';
import { VerifyInstitutionModal } from './VerifyInstitutionModal';

export const InstitutionsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('INSTITUTIONS:CREATE');
  const canUpdate = hasPermission('INSTITUTIONS:UPDATE');
  const canVerify = hasPermission('INSTITUTIONS:VERIFY');

  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [verificationFilter, setVerificationFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');

  // Modals state
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<InstitutionItem | null>(null);
  const [verifyingInstitution, setVerifyingInstitution] = useState<InstitutionItem | null>(null);

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

  const fetchInstitutions = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (verificationFilter) params.verificationStatus = verificationFilter;
      if (typeFilter) params.institutionType = typeFilter;
      if (stateFilter.trim()) params.state = stateFilter.trim();

      const res: any = await apiClient.get('/v1/institutions', { params });
      setInstitutions(res.data || []);
      setTotalCount(res.meta?.total ?? res.pagination?.total ?? 0);

      // Refresh selected institution if open
      if (selectedInstitution) {
        const updated = (res.data || []).find((i: InstitutionItem) => i.id === selectedInstitution.id);
        if (updated) setSelectedInstitution(updated);
      }
    } catch (err) {
      console.error('Failed to load institutions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [page, search, statusFilter, verificationFilter, typeFilter, stateFilter]);

  const handleToggleStatus = async (inst: InstitutionItem) => {
    const nextStatus: InstitutionStatus = inst.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiClient.patch(`/v1/institutions/${inst.id}/status`, {
        status: nextStatus,
        reason: `Status switched to ${nextStatus} from admin console`,
      });
      fetchInstitutions();
      setActiveMenuId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update institution status');
    }
  };

  const handleOpenDetails = (inst: InstitutionItem) => {
    setSelectedInstitution(inst);
    setIsDetailsOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenEdit = (inst: InstitutionItem) => {
    setEditingInstitution(inst);
    setActiveMenuId(null);
  };

  const handleOpenVerify = (inst: InstitutionItem) => {
    setVerifyingInstitution(inst);
    setActiveMenuId(null);
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const verifiedCount = institutions.filter((i) => i.verificationStatus === 'VERIFIED').length;
  const pendingCount = institutions.filter((i) => i.verificationStatus === 'PENDING').length;
  const activeCount = institutions.filter((i) => i.status === 'ACTIVE').length;

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institution Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Directory of accredited technical universities, colleges, and affiliated institutes.
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => setIsRegisterOpen(true)}
            className="rounded-xl px-4 py-2 text-xs font-semibold shadow-sm shadow-primary-600/30 gap-1.5"
          >
            <Plus className="w-4 h-4" /> Register Institution
          </Button>
        )}
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Institutes
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {totalCount}
          </p>
          <span className="text-xs text-slate-500 font-medium">Registered technical institutions</span>
        </div>

        <div className="p-5 bg-white border border-emerald-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Verified Profiles
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {verifiedCount}
          </p>
          <span className="text-xs text-emerald-600 font-medium">Officially verified & compliant</span>
        </div>

        <div className="p-5 bg-white border border-amber-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending Scrutiny
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-2">
            {pendingCount}
          </p>
          <span className="text-xs text-amber-600 font-medium">Awaiting statutory approval</span>
        </div>

        <div className="p-5 bg-white border border-indigo-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Active Enrolled
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-indigo-700 mt-2">
            {activeCount}
          </p>
          <span className="text-xs text-indigo-600 font-medium">Active portal participants</span>
        </div>
      </div>

      {/* Main Table Card Container */}
      <Card className="p-0 overflow-hidden border border-slate-200/80 rounded-2xl shadow-sm bg-white">
        {/* Integrated Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, code, AICTE ID, district..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>

            {/* Refresh */}
            <div className="flex items-center gap-2.5 self-end md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInstitutions()}
                className="gap-1.5 font-medium text-xs py-2 h-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Filter Dropdowns Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-xs font-medium rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="CENTRAL_UNIVERSITY">Central University</option>
              <option value="STATE_UNIVERSITY">State University</option>
              <option value="GOVT_ENGINEERING_COLLEGE">Government College</option>
              <option value="GOVT_AIDED_COLLEGE">Govt. Aided</option>
              <option value="SELF_FINANCING_PRIVATE">Self-Financing</option>
              <option value="AUTONOMOUS_INSTITUTE">Autonomous</option>
              <option value="DEEMED_TO_BE_UNIVERSITY">Deemed University</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-xs font-medium rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="">All Verifications</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNDER_SCRUTINY">Under Scrutiny</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-xs font-medium rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <input
              type="text"
              placeholder="Filter by State..."
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-xs font-medium rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:border-primary-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Institution Name &amp; Code</th>
                <th className="py-3.5 px-6">Category Type</th>
                <th className="py-3.5 px-6">Location</th>
                <th className="py-3.5 px-6">Contact / Admin</th>
                <th className="py-3.5 px-6">Verification</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {institutions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {isLoading ? 'Loading institutions...' : 'No institutions found matching criteria.'}
                  </td>
                </tr>
              ) : (
                institutions.map((inst) => {
                  const isActiveMenu = activeMenuId === inst.id;

                  return (
                    <tr
                      key={inst.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetails(inst)}
                    >
                      {/* Name & Code */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold flex-shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs hover:text-primary-600 transition-colors">
                              {inst.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-primary-700 bg-primary-50 px-1.5 py-0.2 rounded font-semibold">
                                {inst.code}
                              </span>
                              {inst.aicteId && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  AICTE: {inst.aicteId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="text-slate-700 font-medium">
                          {INSTITUTION_TYPE_LABELS[inst.institutionType] || inst.institutionType}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{inst.district}, {inst.state}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-800">{inst.administratorName || 'Official Desk'}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{inst.contactEmail}</span>
                          </p>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-4 px-6">
                        {inst.verificationStatus === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Verified
                          </span>
                        )}
                        {inst.verificationStatus === 'UNDER_SCRUTINY' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            Under Scrutiny
                          </span>
                        )}
                        {inst.verificationStatus === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pending
                          </span>
                        )}
                        {inst.verificationStatus === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Deficient
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {inst.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        )}
                        {inst.status === 'INACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactive
                          </span>
                        )}
                        {inst.status === 'SUSPENDED' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left" ref={isActiveMenu ? menuRef : undefined}>
                          <button
                            onClick={() => setActiveMenuId(isActiveMenu ? null : inst.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isActiveMenu && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => handleOpenDetails(inst)}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Profile</span>
                              </button>

                              {canUpdate && (
                                <button
                                  onClick={() => handleOpenEdit(inst)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Edit Profile</span>
                                </button>
                              )}

                              {canVerify && (
                                <button
                                  onClick={() => handleOpenVerify(inst)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Verify Status</span>
                                </button>
                              )}

                              {canUpdate && (
                                <button
                                  onClick={() => handleToggleStatus(inst)}
                                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2 ${
                                    inst.status === 'ACTIVE'
                                      ? 'text-rose-600 hover:bg-rose-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                >
                                  {inst.status === 'ACTIVE' ? (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Deactivate</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Activate</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
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

        {/* Table Footer with Pagination */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{institutions.length}</strong> of{' '}
            <strong className="text-slate-700">{totalCount}</strong> institutions
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Button>
            <span className="text-xs text-slate-600 px-1 font-semibold">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2 text-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Details Modal */}
      <InstitutionDetailsModal
        isOpen={isDetailsOpen}
        institution={selectedInstitution}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedInstitution(null);
        }}
        onUpdate={fetchInstitutions}
        onOpenVerify={(inst) => {
          setIsDetailsOpen(false);
          handleOpenVerify(inst);
        }}
      />

      {/* Register Modal */}
      <RegisterInstitutionModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={fetchInstitutions}
      />

      {/* Edit Modal */}
      <EditInstitutionModal
        isOpen={Boolean(editingInstitution)}
        institution={editingInstitution}
        onClose={() => setEditingInstitution(null)}
        onSuccess={fetchInstitutions}
      />

      {/* Verify Modal */}
      <VerifyInstitutionModal
        isOpen={Boolean(verifyingInstitution)}
        institution={verifyingInstitution}
        onClose={() => setVerifyingInstitution(null)}
        onSuccess={fetchInstitutions}
      />
    </div>
  );
};
