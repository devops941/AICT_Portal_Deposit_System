import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  Download,
  MessageSquareQuote,
  ShieldCheck,
  RefreshCw,
  Building,
  Landmark,
  Calendar,
  Clock,
  Check,
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

export const VerificationScrutinyPage: React.FC = () => {
  const { fdrId } = useParams<{ fdrId: string }>();
  const navigate = useNavigate();

  const [packet, setPacket] = useState<VerificationPacket | null>(null);
  const [checklist, setChecklist] = useState<VerificationChecklistItem[]>([]);
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const fetchVerificationPacket = async () => {
    if (!fdrId) return;
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

  useEffect(() => {
    fetchVerificationPacket();
  }, [fdrId]);

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

      setSuccessMessage('Instrument successfully verified and submitted to Approval Workflow!');
      setTimeout(() => {
        navigate('/verifications');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
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

      setSuccessMessage('Instrument scrutiny rejected.');
      setTimeout(() => {
        navigate('/verifications');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rejection failed');
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
    <div className="w-full space-y-6 pb-12 animate-in fade-in">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/verifications')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to Verification Desk"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Verification Desk</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-semibold text-slate-800">Scrutiny Detail</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Officer Verification Scrutiny
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchVerificationPacket}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={() => navigate('/verifications')}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white"
          >
            Exit Scrutiny
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm font-semibold text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm font-medium text-rose-700 flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-24 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading statutory verification packet and banking mandate...
        </div>
      ) : packet ? (
        <>
          {/* Header Card: Institution & Instrument Badges */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 shadow-sm shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900">
                    {packet.fdr?.institutionName || 'Statutory Institution'}
                  </h2>
                  <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    #{packet.fdr?.fdrId || fdrId}
                  </span>
                  {packet.fdr?.isDuplicateFlagged && (
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Duplicate Suspect
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Status: {packet.fdr?.verificationStatus || 'PENDING'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Code: {packet.fdr?.institutionId}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" />
                    {packet.fdr?.bankName} ({packet.fdr?.bankBranch})
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-700 font-medium">
                    Cert No: {packet.fdr?.fdrNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Mandate Compliance
              </span>
              <span className={`inline-block mt-1 px-3 py-1 text-xs font-bold rounded-full ${
                allPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {allPassed ? '✓ 10/10 Points Satisfied' : 'Pending Verification Points'}
              </span>
            </div>
          </div>

          {/* 4-Stat Financial Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-slate-200 rounded-2xl shadow-sm">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Mandated Deposit Capital
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900">
                {packet.fdr.depositAmountFormatted || `₹${packet.fdr.depositAmount}`}
              </p>
              <span className="text-xs text-slate-500">Currency: {packet.fdr.currency} • Type: {packet.fdr.instrumentType}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Certificate Number
              </span>
              <p className="text-lg font-semibold font-mono text-slate-900">
                {packet.fdr.fdrNumber}
              </p>
              <span className="text-xs text-slate-500">Scheduled Commercial Bank</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Tenure & Maturity Date
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {new Date(packet.fdr.issueDate).toLocaleDateString()} → {new Date(packet.fdr.maturityDate).toLocaleDateString()}
              </p>
              <span className="text-xs text-emerald-600 font-medium block">
                {packet.fdr.autoRenewal ? '✓ Auto-Renewal Mandated' : 'Manual Renewal'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Joint AICTE Mandate
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {packet.fdr.isJointAccount ? '✓ Valid Joint Mandate' : '⚠ Single Account'}
              </p>
              <span className="text-xs text-slate-500 truncate block" title={packet.fdr.holderName}>
                {packet.fdr.holderName}
              </span>
            </div>
          </div>

          {/* Duplicate review alert if flagged */}
          {packet.fdr.isDuplicateFlagged && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold text-sm">Duplicate Detection Warning Review:</p>
                <p className="mt-1 leading-relaxed">
                  {packet.fdr.duplicateReviewNotes ||
                    'This FDR certificate number matches an existing registered record in the system. Verify original physical bank seal before approval.'}
                </p>
              </div>
            </div>
          )}

          {/* Main 2-Column Content Layout with Sticky Right Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7-8 Columns: 10-Point Statutory Verification Checklist */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* Checklist Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Statutory Verification Checklist (10 Points)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Scrutinize and validate each statutory compliance item according to AICTE Approval Process Handbook.
                    </p>
                  </div>
                  {allPassed && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold self-start sm:self-auto">
                      ✓ All Criteria Satisfied
                    </span>
                  )}
                </div>

                {/* Checklist Rows */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                  {checklist.map((item, idx) => (
                    <div
                      key={item.itemKey}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
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
                          className="mt-2.5 w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                        />
                      </div>

                      {/* Tri-state status buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
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
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
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
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
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
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
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

                {/* Officer Concurrence Remarks */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Officer Concurrence Remarks & Executive Summary
                  </label>
                  <textarea
                    rows={3}
                    value={officerRemarks}
                    onChange={(e) => setOfficerRemarks(e.target.value)}
                    placeholder="Record comprehensive summary observations for the approving authority..."
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Right 4-5 Columns: Attached Documents Proofs (STICKY) & Discrepancies */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-thin">
              {/* Attached Documents Proofs Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Attached Document Proofs
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {packet.documents.length} Files
                  </span>
                </div>

                {packet.documents.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                    No documents uploaded for this instrument yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
                    {packet.documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate" title={doc.originalFileName}>
                              {doc.originalFileName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc.documentId || doc._id)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-100 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors shadow-xs"
                            title="Preview Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(doc.documentId || doc._id, doc.originalFileName)}
                            className="p-1.5 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shadow-xs"
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

              {/* Logged Discrepancies Card */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Discrepancies ({packet.discrepancies.length})
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
                  <p className="text-xs text-slate-500 italic p-3 text-center">
                    No discrepancies raised. Instrument conforms to preliminary scrutiny.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                    {packet.discrepancies.map((disc) => {
                      const sev = SEVERITY_CONFIG[disc.severity] || SEVERITY_CONFIG.MEDIUM;
                      return (
                        <div
                          key={disc._id}
                          className="p-3 bg-white flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${sev.badgeClass}`}
                            >
                              {sev.label}
                            </span>
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
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-900">
                              #{disc.discrepancyId}: {disc.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {disc.description}
                            </p>
                          </div>

                          {disc.resolutionStatus === 'OPEN' && (
                            <button
                              type="button"
                              onClick={() => setResolveDisc(disc)}
                              className="mt-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm self-end"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection input expansion */}
          {isRejecting && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in shadow-sm">
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
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
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

          {/* Fixed/Sticky Bottom Action Bar */}
          <div className="sticky bottom-4 z-20 p-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/verifications')}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                Back to Desk
              </button>
              {allPassed && (
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <Check className="w-4 h-4" /> Ready for Final Endorsement
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
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
                className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isVerifying ? 'Verifying...' : 'Verify & Approve for Workflow'}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* Sub-modals for Discrepancy & Clarification */}
      <CreateDiscrepancyModal
        isOpen={isCreateDiscOpen}
        onClose={() => setIsCreateDiscOpen(false)}
        instrumentId={packet?.fdr?.fdrId || fdrId || ''}
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
        instrumentId={packet?.fdr?.fdrId || fdrId || ''}
        institutionName={packet?.fdr?.institutionName}
        onSuccess={() => {
          navigate('/verifications');
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
