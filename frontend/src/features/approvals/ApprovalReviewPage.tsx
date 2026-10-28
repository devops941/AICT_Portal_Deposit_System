import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  Building2,
  Calendar,
  UserCheck,
  FileText,
  RefreshCw,
  Landmark,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { ApprovalItem, APPROVAL_STATUS_CONFIG } from './types';

export const ApprovalReviewPage: React.FC = () => {
  const { approvalId } = useParams<{ approvalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [approval, setApproval] = useState<ApprovalItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sub-action toggles
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'RETURN' | 'ESCALATE' | null>(null);
  const [escalateRole, setEscalateRole] = useState('APPROVING_AUTHORITY');

  const fetchApproval = async () => {
    if (!approvalId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/v1/approvals/${approvalId}`);
      const data = res?.data?.data || res?.data || res;
      setApproval(data);
      setRemarks('');
      setActionType(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch approval workflow details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApproval();
  }, [approvalId]);

  const userRoles = user?.roles || [];
  const isSuperAdmin = user?.userType === 'ADMIN' || userRoles.includes('SYSTEM_ADMINISTRATOR');

  // Separation of duties check
  const isSelfRequester =
    !isSuperAdmin &&
    approval &&
    user &&
    (approval.requestedBy === user.id ||
      approval.requestedByEmail?.toLowerCase() === user.email?.toLowerCase());

  // Check if user has explicit role for current step (or Super Admin authorization)
  const currentStepItem = approval?.steps?.find((s) => s.stepNumber === approval.currentStep);
  const hasStepRole =
    currentStepItem &&
    (userRoles.includes(currentStepItem.roleRequired) ||
      userRoles.includes('APPROVING_AUTHORITY') ||
      isSuperAdmin ||
      (currentStepItem.roleRequired === 'VERIFICATION_OFFICER' &&
        userRoles.includes('SENIOR_VERIFICATION_OFFICER')));

  const handleExecuteAction = async () => {
    if (!actionType) return;
    if (!remarks.trim()) {
      setError('Remarks are required for this statutory workflow decision.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const id = approval?.approvalId || approval?._id || approvalId;
      if (actionType === 'APPROVE') {
        await api.post(`/v1/approvals/${id}/approve`, { remarks: remarks.trim() });
        setSuccessMessage('Approval decision successfully recorded. Workflow stage updated.');
      } else if (actionType === 'REJECT') {
        await api.post(`/v1/approvals/${id}/reject`, { remarks: remarks.trim() });
        setSuccessMessage('Approval rejected successfully.');
      } else if (actionType === 'RETURN') {
        await api.post(`/v1/approvals/${id}/return`, { remarks: remarks.trim(), returnToStep: 1 });
        setSuccessMessage('Workflow returned to preliminary scrutiny step.');
      } else if (actionType === 'ESCALATE') {
        await api.post(`/v1/approvals/${id}/escalate`, {
          remarks: remarks.trim(),
          escalateToRole: escalateRole,
        });
        setSuccessMessage(`Stage successfully escalated to ${escalateRole}.`);
      }

      await fetchApproval();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Workflow action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = approval
    ? APPROVAL_STATUS_CONFIG[approval.status] || APPROVAL_STATUS_CONFIG.PENDING
    : APPROVAL_STATUS_CONFIG.PENDING;

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Loading statutory approval workflow #{approvalId}...
        </p>
      </div>
    );
  }

  if (error && !approval) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 my-12 bg-white border border-rose-200 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Failed to Load Approval</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={() => navigate('/approvals')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          Return to Approvals Center
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in">
      {/* Top Breadcrumb & Back Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/approvals')}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Back to Approvals"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Link to="/approvals" className="hover:text-indigo-600 transition-colors">
                Financial Approvals
              </Link>
              <span>/</span>
              <span>Review Stage</span>
              <span>/</span>
              <span className="font-mono font-semibold text-slate-700">
                #{approval?.approvalId || approvalId}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 mt-0.5">
              <span>Financial Approval Stage Review</span>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                #{approval?.approvalId || approvalId}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center whitespace-nowrap px-3.5 py-1 text-xs font-bold rounded-full border shadow-sm ${statusConfig.badgeClass}`}
          >
            {statusConfig.label}
          </span>
          <button
            type="button"
            onClick={fetchApproval}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Admin Executive Authority Banner */}
      {isSuperAdmin && (
        <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/80 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Admin Executive Authority Active
              </p>
              <p className="text-xs text-indigo-800 mt-0.5">
                Logged in as System Super Administrator. You hold statutory override authority to sanction, escalate, return, or reject this approval workflow.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 whitespace-nowrap">
            Executive Override
          </span>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {approval && (
        <>
          {/* 4 Financial & Requester Context Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sanction Amount */}
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Sanction Amount
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-2 truncate">
                {approval.amountFormatted || `₹${approval.amount}`}
              </p>
              <span className="text-xs text-slate-500 block mt-1">
                Security Deposit Sanction
              </span>
            </div>

            {/* Institution */}
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Institution
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-2 truncate" title={approval.institutionName}>
                {approval.institutionName}
              </p>
              <span className="text-xs text-slate-500 font-mono block mt-1">
                ID: {approval.institutionId}
              </span>
            </div>

            {/* Submission Initiator */}
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Submission Initiator
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-2 truncate" title={approval.requestedByName}>
                {approval.requestedByName}
              </p>
              <span className="text-xs text-slate-500 font-mono block mt-1 truncate" title={approval.requestedByEmail}>
                {approval.requestedByEmail}
              </span>
            </div>

            {/* Workflow Stage */}
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Workflow Stage
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-base font-bold text-indigo-600 mt-2">
                Level {approval.currentStep} of {approval.totalSteps}
              </p>
              <span className="text-xs text-slate-500 block mt-1 truncate">
                Role: <strong className="text-slate-700">{currentStepItem?.roleRequired || 'Approver'}</strong>
              </span>
            </div>
          </div>

          {/* Separation of Duties Warning */}
          {isSelfRequester && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold text-sm">Separation of Duties (SoD) Active:</p>
                <p className="mt-0.5">
                  You initiated this financial instrument submission ({approval.requestedByEmail}). Statutory regulations prevent self-approval. A distinct designated statutory officer must review and sign off on this step.
                </p>
              </div>
            </div>
          )}

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Main Column (7 cols): Workflow Hierarchy & Stage Decision */}
            <div className="lg:col-span-7 space-y-6">
              {/* Approval Workflow Hierarchy */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Approval Workflow Hierarchy
                  </h2>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {approval.totalSteps} Approval Tiers Configured
                  </span>
                </div>

                <div className="space-y-4 pt-1">
                  {(approval.steps || []).map((step, idx, arr) => {
                    const isCurrent = step.stepNumber === approval.currentStep && !approval.isCompleted;
                    const isApproved = step.status === 'APPROVED';
                    const isRejected = step.status === 'REJECTED';
                    const isReturned = step.status === 'RETURNED';
                    const isEscalated = step.status === 'ESCALATED';

                    return (
                      <div key={step.stepNumber} className="flex items-start gap-4">
                        {/* Timeline Indicator Column */}
                        <div className="flex flex-col items-center self-stretch shrink-0 pt-0.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-sm ${
                              isApproved
                                ? 'border-emerald-500 bg-emerald-500 text-white ring-4 ring-emerald-500/10'
                                : isRejected
                                ? 'border-rose-500 bg-rose-500 text-white ring-4 ring-rose-500/10'
                                : isReturned
                                ? 'border-purple-500 bg-purple-500 text-white ring-4 ring-purple-500/10'
                                : isEscalated
                                ? 'border-amber-500 bg-amber-500 text-white ring-4 ring-amber-500/10'
                                : isCurrent
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-500/20'
                                : 'border-slate-300 bg-white text-slate-500'
                            }`}
                          >
                            {isApproved ? '✓' : isRejected ? '✕' : isReturned ? '↩' : isEscalated ? '⇮' : step.stepNumber}
                          </div>
                          {idx < arr.length - 1 && (
                            <div className="w-0.5 flex-1 bg-slate-200 my-1.5 min-h-[32px]" />
                          )}
                        </div>

                        {/* Step Details Card */}
                        <div className="flex-1 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">
                                  {step.title}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-200 text-slate-700">
                                  Role: {step.roleRequired}
                                </span>
                              </div>
                              {step.actionBy && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Concurred by <span className="font-semibold text-slate-700">{step.actionBy}</span> ({step.actionByEmail}) on{' '}
                                  {step.actionDate && new Date(step.actionDate).toLocaleString()}
                                </p>
                              )}
                              {step.remarks && (
                                <p className="text-xs text-slate-700 mt-2 italic bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                  &ldquo;{step.remarks}&rdquo;
                                </p>
                              )}
                            </div>

                            <span
                              className={`self-start sm:self-auto inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-xs font-bold rounded-full ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isRejected
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isReturned
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : isEscalated
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : isCurrent
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execute Stage Decision Card */}
              {!approval.isCompleted ? (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Execute Stage Decision (Level {approval.currentStep} of {approval.totalSteps})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Statutory sign-off for {currentStepItem?.title || `Stage ${approval.currentStep}`}
                      </p>
                    </div>
                    {isSuperAdmin && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 whitespace-nowrap">
                        Executive Sign-off
                      </span>
                    )}
                  </div>

                  {!hasStepRole && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        You require the <strong className="font-bold">{currentStepItem?.roleRequired}</strong> role to sign off on this stage.
                      </span>
                    </div>
                  )}

                  {/* 4 Interactive Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      disabled={isSelfRequester || !hasStepRole}
                      onClick={() => {
                        setActionType('APPROVE');
                        if (!remarks) setRemarks('Statutory compliance and financial terms approved.');
                      }}
                      className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all text-center ${
                        actionType === 'APPROVE'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                      }`}
                    >
                      ✓ Approve Step
                    </button>
                    <button
                      type="button"
                      disabled={isSelfRequester || !hasStepRole}
                      onClick={() => {
                        setActionType('RETURN');
                        if (!remarks) setRemarks('Returned for correction: Please verify ledger endorsement details.');
                      }}
                      className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all text-center ${
                        actionType === 'RETURN'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                      }`}
                    >
                      ↩ Return for Revision
                    </button>
                    <button
                      type="button"
                      disabled={isSelfRequester || !hasStepRole}
                      onClick={() => {
                        setActionType('ESCALATE');
                        if (!remarks) setRemarks('Escalated to senior authority for specialized review.');
                      }}
                      className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all text-center ${
                        actionType === 'ESCALATE'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                      }`}
                    >
                      ⇮ Escalate Stage
                    </button>
                    <button
                      type="button"
                      disabled={isSelfRequester || !hasStepRole}
                      onClick={() => {
                        setActionType('REJECT');
                        if (!remarks) setRemarks('Rejected: Instrument particulars failed statutory requirements.');
                      }}
                      className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all text-center ${
                        actionType === 'REJECT'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                      }`}
                    >
                      ✗ Reject Request
                    </button>
                  </div>

                  {/* Decision Form when action is selected */}
                  {actionType && (
                    <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in">
                      {actionType === 'ESCALATE' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Escalate To Role
                          </label>
                          <select
                            value={escalateRole}
                            onChange={(e) => setEscalateRole(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-medium"
                          >
                            <option value="APPROVING_AUTHORITY">Approving Authority (Bureau Head / Regional Director)</option>
                            <option value="SENIOR_VERIFICATION_OFFICER">Senior Verification Officer</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Decision Remarks / Statutory Concurrence Note <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] text-slate-400">
                            Permanent audit trail entry
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="State the statutory rationale for this decision..."
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                          required
                        />
                      </div>

                      {/* Quick Remarks Presets */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-[11px] text-slate-400 font-semibold">Quick Presets:</span>
                        <button
                          type="button"
                          onClick={() => setRemarks('All statutory compliance terms validated against scheduled bank records.')}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          Bank Verified
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemarks('Concurred with verification officer observations; sanctioned.')}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          Officer Concurred
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemarks('Approved subject to formal physical bank confirmation receipt.')}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          Conditional Approval
                        </button>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setActionType(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteAction}
                          disabled={isSubmitting || !remarks.trim()}
                          className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 ${
                            actionType === 'APPROVE'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : actionType === 'RETURN'
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : actionType === 'ESCALATE'
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-rose-600 hover:bg-rose-700'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Recording Decision...
                            </>
                          ) : (
                            `Confirm ${actionType}`
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-white border border-slate-200 rounded-3xl text-center space-y-2 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Workflow Finalized
                  </h3>
                  <p className="text-xs text-slate-500">
                    This statutory approval process has concluded with final status:{' '}
                    <strong className="text-slate-800">{approval.status}</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Right Side Column (5 cols): Instrument Particulars & Full Audit Trail */}
            <div className="lg:col-span-5 space-y-6">
              {/* Linked Instrument Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Instrument Particulars
                  </h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                    {approval.workflowType}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-100">
                    <span className="text-slate-500 shrink-0">Instrument ID</span>
                    <span className="font-mono font-bold text-slate-900">
                      {approval.instrumentId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-100">
                    <span className="text-slate-500 shrink-0">Requirement ID</span>
                    <span className="font-mono text-slate-700">
                      {approval.requirementId}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-1 border-b border-slate-100">
                    <span className="text-slate-500 shrink-0">Institution</span>
                    <span className="font-semibold text-slate-900 text-right" title={approval.institutionName}>
                      {approval.institutionName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-1">
                    <span className="text-slate-500 shrink-0">Submission Date</span>
                    <span className="text-slate-700 font-mono">
                      {new Date(approval.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/fdrs?search=${approval.instrumentId}`}
                    className="w-full py-2 px-3 text-center block bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                  >
                    View Instrument in FDR Registry →
                  </Link>
                </div>
              </div>

              {/* Complete Approval Audit Trail Log */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Approval Audit Trail ({(approval.approvalHistory || []).length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {(approval.approvalHistory || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-1.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-700">
                            {item.action}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            Step {item.stepNumber}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        {item.remarks}
                      </p>

                      <p className="text-[10px] text-slate-400 font-medium">
                        By <span className="text-slate-700 font-semibold">{item.performedBy}</span> ({item.performedByEmail})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
