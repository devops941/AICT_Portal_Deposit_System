import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  RotateCcw,
  Clock,
  ShieldAlert,
  Award,
  Building2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { ApprovalItem, APPROVAL_STATUS_CONFIG } from './types';

interface ApprovalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvalId: string;
  onSuccess: () => void;
}

export const ApprovalDetailsModal: React.FC<ApprovalDetailsModalProps> = ({
  isOpen,
  onClose,
  approvalId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [approval, setApproval] = useState<ApprovalItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-action toggles
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'RETURN' | 'ESCALATE' | null>(null);
  const [escalateRole, setEscalateRole] = useState('APPROVING_AUTHORITY');

  useEffect(() => {
    if (isOpen && approvalId) {
      fetchApproval();
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, approvalId]);

  const fetchApproval = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/v1/approvals/${approvalId}`);
      const data = res?.data?.data || res?.data || res;
      setApproval(data);
      setRemarks('');
      setActionType(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch approval details');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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
      setError('Remarks are required for this workflow decision.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const id = approval?.approvalId || approval?._id || approvalId;
      if (actionType === 'APPROVE') {
        await api.post(`/v1/approvals/${id}/approve`, { remarks: remarks.trim() });
      } else if (actionType === 'REJECT') {
        await api.post(`/v1/approvals/${id}/reject`, { remarks: remarks.trim() });
      } else if (actionType === 'RETURN') {
        await api.post(`/v1/approvals/${id}/return`, { remarks: remarks.trim(), returnToStep: 1 });
      } else if (actionType === 'ESCALATE') {
        await api.post(`/v1/approvals/${id}/escalate`, {
          remarks: remarks.trim(),
          escalateToRole: escalateRole,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Workflow action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = approval
    ? APPROVAL_STATUS_CONFIG[approval.status] || APPROVAL_STATUS_CONFIG.PENDING
    : APPROVAL_STATUS_CONFIG.PENDING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Financial Approval Center
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  #{approval?.approvalId || approvalId}
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusConfig.badgeClass}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Workflow: {approval?.workflowType} • Instrument #{approval?.instrumentId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              Loading multi-level approval details...
            </div>
          ) : approval ? (
            <>
              {/* Financial & Requester Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-slate-200 rounded-2xl shadow-sm">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Sanction Amount
                  </span>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {approval.amountFormatted || `₹${approval.amount}`}
                  </p>
                  <span className="text-xs text-slate-500 truncate block mt-0.5">
                    Institution: <strong className="text-slate-700">{approval.institutionName}</strong>
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Submission Initiator
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
                    {approval.requestedByName}
                  </p>
                  <span className="text-xs text-slate-500 font-mono truncate block mt-0.5">
                    {approval.requestedByEmail}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Workflow Level
                  </span>
                  <p className="text-sm font-bold text-indigo-600 mt-1">
                    Step {approval.currentStep} of {approval.totalSteps}
                  </p>
                  <span className="text-xs text-slate-500 truncate block mt-0.5">
                    Target Role: {currentStepItem?.roleRequired || 'Approver'}
                  </span>
                </div>
              </div>

              {/* Separation of Duties Warning Alert */}
              {isSelfRequester && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <p className="font-bold text-sm">Separation of Duties (SoD) Active:</p>
                    <p className="mt-0.5">
                      You initiated or requested this financial instrument ({approval.requestedByEmail}). Statutory regulations prevent self-approval. A distinct designated officer or approving authority must review and approve this step.
                    </p>
                  </div>
                </div>
              )}

              {/* Multi-Step Visual Progress Stepper with Clean Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Approval Workflow Hierarchy
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {approval.totalSteps} Approval Tiers Configured
                  </span>
                </div>

                <div className="space-y-4 my-2">
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
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-sm ${
                              isApproved
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : isRejected
                                ? 'border-rose-500 bg-rose-500 text-white'
                                : isReturned
                                ? 'border-purple-500 bg-purple-500 text-white'
                                : isEscalated
                                ? 'border-amber-500 bg-amber-500 text-white'
                                : isCurrent
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-500/20'
                                : 'border-slate-300 bg-white text-slate-500'
                            }`}
                          >
                            {isApproved ? '✓' : isRejected ? '✕' : isReturned ? '↩' : isEscalated ? '⇮' : step.stepNumber}
                          </div>
                          {idx < arr.length - 1 && (
                            <div className="w-0.5 flex-1 bg-slate-200 my-1 min-h-[28px]" />
                          )}
                        </div>

                        {/* Step Details Card */}
                        <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50/90 transition-colors">
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
                                <p className="text-xs text-slate-600 mt-1.5 italic bg-white p-2.5 rounded-xl border border-slate-200/80">
                                  &ldquo;{step.remarks}&rdquo;
                                </p>
                              )}
                            </div>

                            <span
                              className={`self-start sm:self-auto px-2.5 py-1 text-xs font-bold rounded-full ${
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

              {/* Action Form if user is eligible to act on current step */}
              {!approval.isCompleted && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Execute Stage Decision (Level {approval.currentStep} of {approval.totalSteps})
                    </h4>
                    {isSuperAdmin && (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        Admin Executive Authority Active
                      </span>
                    )}
                  </div>

                  {!hasStepRole && (
                    <p className="text-xs text-amber-700">
                      ℹ️ You require the <span className="font-semibold">{currentStepItem?.roleRequired}</span> role to sign off on this stage.
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={isSelfRequester || !hasStepRole}
                      onClick={() => {
                        setActionType('APPROVE');
                        if (!remarks) setRemarks('Statutory compliance and financial terms approved.');
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
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
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
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
                        if (!remarks) setRemarks('Escalated to senior authority for review.');
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
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
                        if (!remarks) setRemarks('Rejected: Statutory requirements not met.');
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                        actionType === 'REJECT'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                      }`}
                    >
                      ✗ Reject Request
                    </button>
                  </div>

                  {actionType && (
                    <div className="space-y-3 pt-2 animate-in fade-in">
                      {actionType === 'ESCALATE' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Escalate To Role
                          </label>
                          <select
                            value={escalateRole}
                            onChange={(e) => setEscalateRole(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                          >
                            <option value="APPROVING_AUTHORITY">Approving Authority (Bureau Head / Director)</option>
                            <option value="SENIOR_VERIFICATION_OFFICER">Senior Verification Officer</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Decision Remarks / Official Concurrence Note <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] text-slate-400">
                            Required for official audit trail
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="State the statutory rationale for this decision..."
                          className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                          required
                        />
                      </div>

                      {/* Quick Remarks Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
                        <button
                          type="button"
                          onClick={() => setRemarks('All statutory compliance terms validated against scheduled bank records.')}
                          className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100"
                        >
                          Bank Verified
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemarks('Concurred with verification officer observations; sanctioned.')}
                          className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100"
                        >
                          Officer Concurred
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemarks('Approved subject to formal physical bank confirmation receipt.')}
                          className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100"
                        >
                          Conditional Approval
                        </button>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleExecuteAction}
                          disabled={isSubmitting || !remarks.trim()}
                          className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 ${
                            actionType === 'APPROVE'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : actionType === 'RETURN'
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : actionType === 'ESCALATE'
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-rose-600 hover:bg-rose-700'
                          }`}
                        >
                          {isSubmitting ? 'Recording Action...' : `Confirm ${actionType}`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Audit Action History */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Approval Audit Trail ({(approval.approvalHistory || []).length})
                </h3>

                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-sm">
                  {(approval.approvalHistory || []).map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">
                            {item.action}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            Step {item.stepNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {item.remarks}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          By {item.performedBy} ({item.performedByEmail})
                        </p>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-8 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
