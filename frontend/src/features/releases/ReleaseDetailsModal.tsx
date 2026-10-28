import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  History,
  Lock,
  ArrowRight,
  ShieldAlert,
  Send,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { ReleaseItem } from './types';

interface ReleaseDetailsModalProps {
  releaseId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const ReleaseDetailsModal: React.FC<ReleaseDetailsModalProps> = ({
  releaseId,
  onClose,
  onUpdated,
}) => {
  const { user } = useAuth();
  const [release, setRelease] = useState<ReleaseItem | null>(null);
  const [instrument, setInstrument] = useState<any>(null);
  const [requirement, setRequirement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'ELIGIBILITY' | 'WORKFLOW' | 'AUDIT'>('SUMMARY');

  // Action states
  const [actionType, setActionType] = useState<'NONE' | 'APPROVE' | 'REJECT' | 'CLARIFY' | 'RESPOND' | 'CLOSE'>('NONE');
  const [remarksInput, setRemarksInput] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (releaseId) {
      setRelease(null);
      setInstrument(null);
      setRequirement(null);
      fetchReleaseDetails();
    }
  }, [releaseId]);

  const fetchReleaseDetails = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res: any = await api.get(`/releases/${releaseId}`);
      const data = res?.data || res;
      if (data) {
        setRelease(data.release || data);
        setInstrument(data.instrument || null);
        setRequirement(data.requirement || null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch release details');
    } finally {
      setIsLoading(false);
    }
  };

  if (!releaseId) return null;

  const isOfficer =
    user?.userType === 'ADMIN' ||
    user?.roles?.includes('SYSTEM_ADMINISTRATOR') ||
    user?.roles?.includes('VERIFICATION_OFFICER') ||
    user?.roles?.includes('SENIOR_VERIFICATION_OFFICER') ||
    user?.roles?.includes('AICTE_OFFICER') ||
    user?.roles?.includes('APPROVING_AUTHORITY');

  const isApprovingAuthority =
    user?.userType === 'ADMIN' ||
    user?.roles?.includes('SYSTEM_ADMINISTRATOR') ||
    user?.roles?.includes('APPROVING_AUTHORITY') ||
    user?.roles?.includes('FINANCE_OFFICER');

  const handleApprove = async () => {
    if (!remarksInput.trim()) {
      setErrorMessage('Approval remarks are required');
      return;
    }
    setIsSubmittingAction(true);
    setErrorMessage(null);
    try {
      await api.post(`/releases/${releaseId}/approve`, {
        decisionRemarks: remarksInput.trim(),
      });
      setSuccessMessage('Release level approved successfully!');
      setActionType('NONE');
      setRemarksInput('');
      onUpdated();
      fetchReleaseDetails();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Approval failed');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!remarksInput.trim()) {
      setErrorMessage('Rejection reason is required');
      return;
    }
    setIsSubmittingAction(true);
    setErrorMessage(null);
    try {
      await api.post(`/releases/${releaseId}/reject`, {
        rejectionReason: remarksInput.trim(),
      });
      setSuccessMessage('Release request rejected.');
      setActionType('NONE');
      setRemarksInput('');
      onUpdated();
      fetchReleaseDetails();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Rejection failed');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleClarify = async () => {
    if (!remarksInput.trim()) {
      setErrorMessage('Clarification query is required');
      return;
    }
    setIsSubmittingAction(true);
    setErrorMessage(null);
    try {
      await api.post(`/releases/${releaseId}/review`, {
        action: 'CLARIFICATION_REQUIRED',
        clarificationQuery: remarksInput.trim(),
      });
      setSuccessMessage('Clarification requested from institution.');
      setActionType('NONE');
      setRemarksInput('');
      onUpdated();
      fetchReleaseDetails();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to request clarification');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRespondClarification = async () => {
    if (!remarksInput.trim()) {
      setErrorMessage('Response explanation is required');
      return;
    }
    setIsSubmittingAction(true);
    setErrorMessage(null);
    try {
      await api.post(`/releases/${releaseId}/clarification`, {
        response: remarksInput.trim(),
      });
      setSuccessMessage('Clarification response submitted.');
      setActionType('NONE');
      setRemarksInput('');
      onUpdated();
      fetchReleaseDetails();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAuthorizeRelease = async () => {
    setIsSubmittingAction(true);
    setErrorMessage(null);
    try {
      await api.post(`/releases/${releaseId}/authorize`);
      setSuccessMessage('Release officially authorized! Deposit instrument is discharged.');
      onUpdated();
      fetchReleaseDetails();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to authorize release');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleClose = async () => {
    if (!remarksInput.trim()) {
      setErrorMessage('Closure remarks are required');
      return;
    }
    setIsSubmittingAction(true);
    setErrorMessage(null);
    try {
      await api.post(`/releases/${releaseId}/close`, {
        closureRemarks: remarksInput.trim(),
      });
      setSuccessMessage('Release record successfully closed and archived.');
      setActionType('NONE');
      setRemarksInput('');
      onUpdated();
      fetchReleaseDetails();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to close record');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            CLOSED
          </span>
        );
      case 'AUTHORIZED_RELEASE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
            AUTHORIZED DISCHARGE
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            SANCTION APPROVED
          </span>
        );
      case 'CLARIFICATION_REQUIRED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            CLARIFICATION REQUIRED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            UNDER SCRUTINY
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            SUBMITTED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Release Request #{release?.releaseId || releaseId}
                </h2>
                {getStatusBadge(release?.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {release?.institutionName} ({release?.institutionId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 gap-6 bg-slate-50/40">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'SUMMARY'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Release Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('ELIGIBILITY')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'ELIGIBILITY'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Eligibility Scorecard ({release?.eligibilityScore || 0}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('WORKFLOW')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'WORKFLOW'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Workflow & Approvals ({release?.currentLevel || 1}/{release?.totalLevels || 2})</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'AUDIT'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit History ({release?.history?.length || 0})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[650px] overflow-y-auto space-y-6 bg-white min-h-[360px]">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-500">
              <CreditCard className="w-8 h-8 animate-pulse text-emerald-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading release & refund records...</p>
              <p className="text-xs text-slate-400 mt-1">Retrieving statutory clearance and approval hierarchy</p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* TAB 1: SUMMARY */}
              {activeTab === 'SUMMARY' && release && (
            <div className="space-y-6">
              {/* Stat Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Release Request Data
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Requested Amount</div>
                    <div className="text-xl font-bold text-emerald-700">
                      {release.requestedAmountFormatted}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Statutory Justification</div>
                    <div className="text-xs text-slate-800 font-medium">{release.requestReason}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                    Requested by: {release.requestedBy} ({release.requestedByEmail}) on{' '}
                    {new Date(release.requestDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Target Instrument Pledged
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Certificate #</div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {release.fdrNumber}
                    </div>
                    <div className="text-[10px] text-indigo-600 font-mono font-medium">
                      {release.instrumentId}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Bank & Branch</div>
                    <div className="text-xs font-semibold text-slate-800">
                      {release.bankName} {instrument?.bankBranch ? `(${instrument.bankBranch})` : ''}
                    </div>
                  </div>
                  {instrument && (
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-[10px]">
                      <span className="text-slate-500 font-medium">
                        Maturity: {new Date(instrument.maturityDate).toLocaleDateString()}
                      </span>
                      <span className="font-bold text-amber-700">
                        {instrument.lifecycleStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting documents */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Supporting Discharge & Clearance Documents
                </div>
                {release.supportingDocuments && release.supportingDocuments.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {release.supportingDocuments.map((doc, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-indigo-700 flex items-center gap-1.5 shadow-sm"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                        {doc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    No document reference IDs attached.
                  </div>
                )}
              </div>

              {/* Statutory Portal Disclaimer */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>
                  <strong className="text-slate-800">Statutory Portal Record:</strong> Portal records official regulatory approval and
                  discharge decisions. Actual physical bank FDR closure or remittance must be executed
                  via authorized banking channels.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: ELIGIBILITY SCORECARD */}
          {activeTab === 'ELIGIBILITY' && release && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Eligibility Evaluation Score</div>
                  <div className="text-xs text-slate-500">
                    Evaluated against statutory holding tenure, compliance conditions, and conflicting claims.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-700">
                    {release.eligibilityScore} / 100
                  </div>
                  <div className="text-[10px] font-bold text-slate-600">
                    {release.isEligible ? 'ELIGIBLE TO PROCEED' : 'CONDITIONS RESTRICTED'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {release.eligibilityChecks.map((chk, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl flex items-start gap-3"
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : chk.severity === 'BLOCKER' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{chk.label}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            chk.passed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : chk.severity === 'BLOCKER'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {chk.severity}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 mt-0.5">{chk.message}</div>
                      {chk.details && (
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          {chk.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: WORKFLOW & APPROVALS */}
          {activeTab === 'WORKFLOW' && release && (
            <div className="space-y-6">
              {/* Stepper */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Configured Approval Hierarchy
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {release.approvalLevels.map((lvl) => (
                    <div
                      key={lvl.levelNumber}
                      className={`p-4 rounded-xl border ${
                        lvl.status === 'APPROVED'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : lvl.status === 'REJECTED'
                          ? 'bg-rose-50/50 border-rose-200'
                          : release.currentLevel === lvl.levelNumber
                          ? 'bg-indigo-50/60 border-2 border-indigo-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{lvl.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            lvl.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lvl.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {lvl.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1 font-medium">
                        Mandated Role: <span className="font-mono text-indigo-700">{lvl.roleRequired}</span>
                      </div>
                      {lvl.actionBy && (
                        <div className="text-[10px] text-slate-500 mt-2 border-t border-slate-200 pt-1">
                          Decided by: {lvl.actionByEmail} on{' '}
                          {lvl.actionDate ? new Date(lvl.actionDate).toLocaleDateString() : ''}
                        </div>
                      )}
                      {lvl.remarks && (
                        <div className="text-[11px] text-slate-700 italic mt-1 font-medium">"{lvl.remarks}"</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Clarification Notice */}
              {release.status === 'CLARIFICATION_REQUIRED' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Clarification Requested by Scrutiny Officer:</span>
                  </div>
                  <div className="text-xs text-slate-800 pl-6 font-medium">
                    "{release.clarificationQuery}"
                  </div>

                  {/* Institution can respond */}
                  {actionType === 'NONE' && (
                    <div className="pt-2 pl-6">
                      <button
                        onClick={() => setActionType('RESPOND')}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Clarification Response</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Officer Decision Box */}
              {isOfficer &&
                actionType === 'NONE' &&
                (release.status === 'SUBMITTED' || release.status === 'UNDER_REVIEW') && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Take Action on Current Approval Level</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActionType('APPROVE')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Level {release.currentLevel}</span>
                      </button>

                      <button
                        onClick={() => setActionType('CLARIFY')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-amber-600/20"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Request Clarification</span>
                      </button>

                      <button
                        onClick={() => setActionType('REJECT')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-rose-600/20"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject Request</span>
                      </button>
                    </div>
                  </div>
                )}

              {/* Authorized Approver Sanction Button */}
              {isApprovingAuthority && release.status === 'APPROVED' && (
                <div className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Statutory Release Ready for Official Authorization</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    All review levels have been approved. Sanctioning this authorized release will
                    officially transition the deposit instrument status to RELEASED and recalculate
                    statutory compliance.
                  </p>
                  <button
                    onClick={handleAuthorizeRelease}
                    disabled={isSubmittingAction}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingAction ? 'Processing...' : 'Sanction Authorized Release'}</span>
                  </button>
                </div>
              )}

              {/* Close Record Button */}
              {isOfficer && (release.status === 'AUTHORIZED_RELEASE' || release.status === 'APPROVED') && actionType === 'NONE' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Conclude & Close Statutory File</div>
                      <div className="text-[11px] text-slate-500">
                        Archive the release request after external bank settlement.
                      </div>
                    </div>
                    <button
                      onClick={() => setActionType('CLOSE')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Close Release Record</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Input Form */}
              {actionType !== 'NONE' && (
                <div className="p-4 bg-slate-50 border border-indigo-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-slate-900">
                    {actionType === 'APPROVE' && `Confirm Approval for Level ${release.currentLevel}`}
                    {actionType === 'REJECT' && 'Provide Rejection Reason'}
                    {actionType === 'CLARIFY' && 'Formulate Clarification Query for Institution'}
                    {actionType === 'RESPOND' && 'Provide Clarification Explanation'}
                    {actionType === 'CLOSE' && 'Conclude Statutory Release Record'}
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Enter details / justification..."
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setActionType('NONE');
                        setRemarksInput('');
                      }}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>

                    {actionType === 'APPROVE' && (
                      <button
                        onClick={handleApprove}
                        disabled={isSubmittingAction}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                      >
                        Submit Approval
                      </button>
                    )}

                    {actionType === 'REJECT' && (
                      <button
                        onClick={handleReject}
                        disabled={isSubmittingAction}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                      >
                        Confirm Rejection
                      </button>
                    )}

                    {actionType === 'CLARIFY' && (
                      <button
                        onClick={handleClarify}
                        disabled={isSubmittingAction}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                      >
                        Send Query
                      </button>
                    )}

                    {actionType === 'RESPOND' && (
                      <button
                        onClick={handleRespondClarification}
                        disabled={isSubmittingAction}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                      >
                        Submit Explanation
                      </button>
                    )}

                    {actionType === 'CLOSE' && (
                      <button
                        onClick={handleClose}
                        disabled={isSubmittingAction}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm"
                      >
                        Finalize & Close
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT HISTORY */}
          {activeTab === 'AUDIT' && release && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Permanent Statutory Timeline
              </h3>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {release.history.map((log, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{log.action}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700">{log.details}</div>
                      <div className="text-[10px] text-slate-500">
                        By: {log.performedBy} ({log.performedByEmail}) {log.role ? `[${log.role}]` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
      </div>
    </div>
  );
};
