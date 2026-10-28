import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Building2,
  Landmark,
  Eye,
  Download,
  MessageSquareQuote,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import {
  VerificationPacket,
  VerificationChecklistItem,
  DiscrepancyItem,
  SEVERITY_CONFIG,
} from './types';
import { CreateDiscrepancyModal } from './CreateDiscrepancyModal';
import { ResolveDiscrepancyModal } from './ResolveDiscrepancyModal';
import { ClarificationModal } from './ClarificationModal';
import { DocumentViewerModal } from '../fdrs/DocumentViewerModal';
import { ChecklistStatusConfirmModal } from './ChecklistStatusConfirmModal';

interface VerificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fdrId: string;
  onSuccess: () => void;
}

export const VerificationDetailsModal: React.FC<VerificationDetailsModalProps> = ({
  isOpen,
  onClose,
  fdrId,
  onSuccess,
}) => {
  const [packet, setPacket] = useState<VerificationPacket | null>(null);
  const [checklist, setChecklist] = useState<VerificationChecklistItem[]>([]);
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-modals
  const [isCreateDiscOpen, setIsCreateDiscOpen] = useState(false);
  const [resolveDisc, setResolveDisc] = useState<DiscrepancyItem | null>(null);
  const [isClarificationOpen, setIsClarificationOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  // Rejection state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Checklist confirmation popup state
  const [confirmChecklistModal, setConfirmChecklistModal] = useState<{
    isOpen: boolean;
    itemIndex: number;
    itemKey: string;
    itemLabel: string;
    targetStatus: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
    currentStatus?: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'PENDING';
    initialRemarks?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && fdrId) {
      fetchVerificationPacket();
    }
  }, [isOpen, fdrId]);

  const fetchVerificationPacket = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/v1/verifications/${fdrId}`);
      const data: VerificationPacket = res.data?.data || res.data;
      setPacket(data);
      setChecklist(data.checklist || []);
      setOfficerRemarks(data.fdr?.verificationRemarks || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch verification packet');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleChecklistStatusChange = (
    itemKey: string,
    status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE',
    remarks?: string
  ) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.itemKey === itemKey
          ? {
              ...item,
              status,
              comments: remarks !== undefined ? remarks : item.comments,
            }
          : item
      )
    );
  };

  const requestChecklistStatusChange = (
    itemIndex: number,
    itemKey: string,
    itemLabel: string,
    targetStatus: 'PASS' | 'FAIL' | 'NOT_APPLICABLE',
    currentStatus?: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'PENDING',
    currentRemarks?: string
  ) => {
    setConfirmChecklistModal({
      isOpen: true,
      itemIndex,
      itemKey,
      itemLabel,
      targetStatus,
      currentStatus,
      initialRemarks: currentRemarks || '',
    });
  };

  const handleChecklistCommentChange = (itemKey: string, comments: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.itemKey === itemKey ? { ...item, comments } : item))
    );
  };

  const handleVerifyFdr = async () => {
    const hasPending = checklist.some((c) => c.status === 'PENDING');
    if (hasPending) {
      setError('Please review and score all 10 checklist criteria (Pass, Fail, or N/A).');
      return;
    }

    const hasFailed = checklist.some((c) => c.status === 'FAIL');
    if (hasFailed) {
      setError('Cannot verify FDR because one or more criteria failed. Please raise a discrepancy or request clarification.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await api.post(`/v1/verifications/${fdrId}/verify`, {
        remarks: officerRemarks.trim() || 'All checklist criteria validated and verified.',
        checklist,
        initiateApprovalWorkflow: true,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectFdr = async () => {
    if (!rejectionReason.trim()) {
      setError('Please state the non-compliance reasons for rejection.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await api.post(`/v1/verifications/${fdrId}/reject`, {
        remarks: rejectionReason.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rejection failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = async (docId: string, filename: string) => {
    try {
      const res = await api.get(`/v1/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download document.');
    }
  };

  const allPassed = checklist.length > 0 && checklist.every((c) => c.status === 'PASS' || c.status === 'NOT_APPLICABLE');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl my-8 bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Officer Verification Desk
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  #{packet?.fdr?.fdrId || fdrId}
                </span>
                {packet?.fdr?.isDuplicateFlagged && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Duplicate Suspect
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {packet?.fdr?.institutionName} — {packet?.fdr?.bankName} ({packet?.fdr?.bankBranch})
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              Loading verification packet and banking mandate...
            </div>
          ) : packet ? (
            <>
              {/* Financial & Mandate Summary Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-slate-200 rounded-2xl shadow-sm">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Deposit Amount
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">
                    {packet.fdr.depositAmountFormatted || `₹${packet.fdr.depositAmount}`}
                  </p>
                  <span className="text-xs text-slate-500">Currency: {packet.fdr.currency}</span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    FDR Certificate No.
                  </span>
                  <p className="text-base font-semibold text-slate-900 mt-0.5 font-mono">
                    {packet.fdr.fdrNumber}
                  </p>
                  <span className="text-xs text-slate-500">Type: {packet.fdr.instrumentType}</span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Tenure / Maturity
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {new Date(packet.fdr.issueDate).toLocaleDateString()} →{' '}
                    {new Date(packet.fdr.maturityDate).toLocaleDateString()}
                  </p>
                  <span className="text-xs text-emerald-600 font-medium">
                    {packet.fdr.autoRenewal ? 'Auto-Renewal Mandated' : 'Manual Renewal'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Joint AICTE Mandate
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {packet.fdr.isJointAccount ? '✓ Valid Joint Mandate' : '⚠ Single Account'}
                  </p>
                  <span className="text-xs text-slate-500 truncate block" title={packet.fdr.holderName}>
                    {packet.fdr.holderName}
                  </span>
                </div>
              </div>

              {/* Duplicate review alert if flagged */}
              {packet.fdr.isDuplicateFlagged && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold text-sm">Duplicate Detection Review Flag:</p>
                    <p className="mt-1">
                      {packet.fdr.duplicateReviewNotes ||
                        'This FDR certificate number matches an existing registered record in the system. Verify original physical bank seal before approval.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Supporting Document Proofs Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Attached Document Proofs ({packet.documents.length})
                  </h3>
                </div>

                {packet.documents.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                    No documents uploaded for this instrument yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {packet.documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/30 border border-slate-200 rounded-xl transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {doc.originalFileName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Type: {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc(doc.documentId || doc._id)
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Preview Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownload(doc.documentId || doc._id, doc.originalFileName)
                            }
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Configurable 10-Point Verification Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Statutory Verification Checklist (10 Points)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Scrutinize and validate each statutory compliance item according to AICTE Approval Process Handbook.
                    </p>
                  </div>
                  {allPassed && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                      ✓ All Criteria Satisfied
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-sm">
                  {checklist.map((item, idx) => (
                    <div
                      key={item.itemKey}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {item.label}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={item.comments || ''}
                          onChange={(e) => handleChecklistCommentChange(item.itemKey, e.target.value)}
                          placeholder="Optional verification remarks / cross-reference note..."
                          className="mt-2 w-full max-w-lg px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                        />
                      </div>

                      {/* Tri-state status buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            requestChecklistStatusChange(
                              idx + 1,
                              item.itemKey,
                              item.label,
                              'PASS',
                              item.status,
                              item.comments
                            )
                          }
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                            item.status === 'PASS'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Pass
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestChecklistStatusChange(
                              idx + 1,
                              item.itemKey,
                              item.label,
                              'FAIL',
                              item.status,
                              item.comments
                            )
                          }
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                            item.status === 'FAIL'
                              ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Fail
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestChecklistStatusChange(
                              idx + 1,
                              item.itemKey,
                              item.label,
                              'NOT_APPLICABLE',
                              item.status,
                              item.comments
                            )
                          }
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                            item.status === 'NOT_APPLICABLE'
                              ? 'bg-slate-200 border-slate-400 text-slate-900 font-bold shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Officer Consolidated Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Officer Concurrence Remarks
                </label>
                <textarea
                  rows={2}
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  placeholder="Record summary observations for the approving authority..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
                />
              </div>

              {/* Discrepancies Table & Log Action */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Logged Discrepancies ({packet.discrepancies.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreateDiscOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors shadow-sm"
                  >
                    + Flag Discrepancy
                  </button>
                </div>

                {packet.discrepancies.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No discrepancies raised. Instrument conforms to preliminary scrutiny.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                    {packet.discrepancies.map((disc) => {
                      const sev = SEVERITY_CONFIG[disc.severity] || SEVERITY_CONFIG.MEDIUM;
                      return (
                        <div
                          key={disc._id}
                          className="p-3.5 bg-white flex items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${sev.badgeClass} mt-0.5`}
                            >
                              {sev.label}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">
                                #{disc.discrepancyId}: {disc.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{disc.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                disc.resolutionStatus === 'RESOLVED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : disc.resolutionStatus === 'WAIVED'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {disc.resolutionStatus}
                            </span>
                            {disc.resolutionStatus === 'OPEN' && (
                              <button
                                type="button"
                                onClick={() => setResolveDisc(disc)}
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rejection input expansion */}
              {isRejecting && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                    Confirm Instrument Scrutiny Rejection
                  </h4>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide detailed non-compliance grounds to be communicated officially..."
                    className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-800"
                    required
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectFdr}
                      disabled={isVerifying}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition-colors"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsClarificationOpen(true)}
              className="px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <MessageSquareQuote className="w-4 h-4" /> Request Clarification
            </button>

            <button
              type="button"
              onClick={() => setIsRejecting(true)}
              className="px-4 py-2 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>

            <button
              type="button"
              onClick={handleVerifyFdr}
              disabled={isVerifying || !allPassed}
              className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isVerifying ? 'Verifying...' : 'Verify & Approve for Workflow'}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <CreateDiscrepancyModal
        isOpen={isCreateDiscOpen}
        onClose={() => setIsCreateDiscOpen(false)}
        instrumentId={packet?.fdr?.fdrId || fdrId}
        institutionId={packet?.fdr?.institutionId}
        institutionName={packet?.fdr?.institutionName}
        onSuccess={fetchVerificationPacket}
      />

      <ResolveDiscrepancyModal
        isOpen={!!resolveDisc}
        onClose={() => setResolveDisc(null)}
        discrepancy={resolveDisc}
        onSuccess={fetchVerificationPacket}
      />

      <ClarificationModal
        isOpen={isClarificationOpen}
        onClose={() => setIsClarificationOpen(false)}
        instrumentId={packet?.fdr?.fdrId || fdrId}
        institutionName={packet?.fdr?.institutionName}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
      />

      {previewDoc && (
        <DocumentViewerModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          documentId={previewDoc}
        />
      )}

      {/* Confirmation Modal for Checklist Pass/Fail/NA */}
      {confirmChecklistModal && (
        <ChecklistStatusConfirmModal
          isOpen={confirmChecklistModal.isOpen}
          onClose={() => setConfirmChecklistModal(null)}
          onConfirm={handleChecklistStatusChange}
          itemIndex={confirmChecklistModal.itemIndex}
          itemKey={confirmChecklistModal.itemKey}
          itemLabel={confirmChecklistModal.itemLabel}
          targetStatus={confirmChecklistModal.targetStatus}
          currentStatus={confirmChecklistModal.currentStatus}
          initialRemarks={confirmChecklistModal.initialRemarks}
        />
      )}
    </div>
  );
};
