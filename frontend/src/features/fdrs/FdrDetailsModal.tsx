import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck,
  Building,
  Calendar,
  Landmark,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Upload,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  FdrItem,
  DocumentItem,
  SUBMISSION_STATUS_CONFIG,
  VERIFICATION_STATUS_CONFIG,
} from './types';
import { DocumentViewerModal } from './DocumentViewerModal';

interface FdrDetailsModalProps {
  isOpen: boolean;
  fdrId: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onEditDraft?: (fdr: FdrItem) => void;
}

export const FdrDetailsModal: React.FC<FdrDetailsModalProps> = ({
  isOpen,
  fdrId,
  onClose,
  onRefresh,
  onEditDraft,
}) => {
  const { hasPermission } = useAuth();
  const canSubmit = hasPermission('FDR:SUBMIT');
  const canUpdate = hasPermission('FDR:UPDATE');

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history'>('overview');
  const [fdr, setFdr] = useState<FdrItem | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIdForView, setSelectedDocIdForView] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen && fdrId) {
      fetchFdrData();
    }
  }, [isOpen, fdrId]);

  const fetchFdrData = async () => {
    if (!fdrId) return;
    setIsLoading(true);
    try {
      const [fdrRes, docsRes]: any = await Promise.all([
        apiClient.get(`/v1/fdrs/${fdrId}`),
        apiClient.get(`/v1/documents/instrument/${fdrId}`).catch(() => ({ data: [] })),
      ]);

      if (fdrRes.data) {
        setFdr(fdrRes.data);
      }
      if (docsRes?.data) {
        setDocuments(docsRes.data);
      }
    } catch (e) {
      console.error('Failed to load FDR details', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !fdrId) return null;

  const handleSubmitDraft = async () => {
    if (!fdr) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/v1/fdrs/${fdr._id || fdr.fdrId}/submit`);
      await fetchFdrData();
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to submit FDR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fdr || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('instrumentId', fdr.fdrId);
      form.append('documentType', 'FDR_RECEIPT');
      form.append('institutionId', fdr.institutionId);

      await apiClient.post('/v1/documents/upload', form);
      await fetchFdrData();
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const subConfig = fdr ? SUBMISSION_STATUS_CONFIG[fdr.submissionStatus] : null;
  const verConfig = fdr ? VERIFICATION_STATUS_CONFIG[fdr.verificationStatus] : null;

  const rawAmount =
    fdr && typeof fdr.depositAmount === 'object' && fdr.depositAmount !== null
      ? (fdr.depositAmount as any).$numberDecimal || '0'
      : fdr?.depositAmount || '0';
  const formattedAmount = Number(rawAmount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded">
                  {fdr?.fdrId}
                </span>
                {subConfig && <Badge variant={subConfig.badgeVariant}>{subConfig.label}</Badge>}
                {verConfig && <Badge variant={verConfig.badgeVariant}>{verConfig.label}</Badge>}
              </div>
              <h3 className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                {fdr?.bankName} — Certificate #{fdr?.fdrNumber}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchFdrData}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Duplicate Scrutiny Warning Banner */}
        {fdr?.isDuplicateFlagged && (
          <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold">Duplicate Scrutiny Flag Activated:</span>{' '}
              {fdr.duplicateReviewNotes || 'This instrument shares identical certificate credentials with another registered deposit record.'}
            </div>
          </div>
        )}

        {/* Financial Header Card */}
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Principal Deposit Value
            </span>
            <p className="text-2xl font-bold font-mono text-white mt-0.5">
              ₹{formattedAmount}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Holder: <span className="text-slate-200">{fdr?.holderName}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Maturity Date
            </span>
            <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
              {fdr && new Date(fdr.maturityDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Issued: {fdr && new Date(fdr.issueDate).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Deposit Overview
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Attached Documents
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
              {documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Activity & Audit History
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && fdr && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Issuing Bank & Branch
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1">{fdr.bankName}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{fdr.bankBranch}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Linked Security Requirement
                      </span>
                      <p className="text-sm font-bold font-mono text-slate-900 mt-1">{fdr.requirementId}</p>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                        {fdr.requirementTitle || 'Joint Affiliation Requirement'}
                      </p>
                    </div>
                  </div>

                  {/* Institutional & Tenor Info */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Instrument Parameters & Mandates
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Institution:</span>
                        <span className="font-semibold text-slate-800">{fdr.institutionName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Instrument Type:</span>
                        <span className="font-semibold text-slate-800">{fdr.instrumentType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Joint Mandate:</span>
                        <span className="font-semibold text-emerald-700">
                          {fdr.isJointAccount ? 'Yes (AICTE RO Joint)' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Auto-Renewal:</span>
                        <span className="font-semibold text-slate-800">
                          {fdr.autoRenewal ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {fdr.remarks && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <span className="font-semibold block text-slate-900 mb-0.5">Remarks / Notes:</span>
                      {fdr.remarks}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ATTACHED DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Secure Document Repository</h4>
                      <p className="text-xs text-slate-500">
                        Cryptographically validated certificates and bank letters stored in private storage
                      </p>
                    </div>

                    <label className="inline-block cursor-pointer">
                      <span className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        {isUploading ? 'Uploading...' : 'Attach Document'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        disabled={isUploading}
                        onChange={handleAttachDocument}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {documents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No Documents Uploaded</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Please upload original FDR receipts or bank confirmation letters to support official scrutiny.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {documents.map((doc) => (
                        <div key={doc._id || doc.documentId} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                                  {doc.originalFileName}
                                </span>
                                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                  {doc.documentId}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {(doc.fileSize / 1024).toFixed(1)} KB • {doc.documentType} • Uploaded by {doc.uploadedBy}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {doc.cloudinaryUrl && (
                              <a
                                href={doc.cloudinaryUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="h-8 px-2.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                title="Open on Cloudinary CDN"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Cloudinary</span>
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedDocIdForView(doc.documentId)}
                              className="h-8 px-2.5 text-xs gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {fdr?.history && fdr.history.length > 0 ? (
                      fdr.history.map((h, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary-600 ring-4 ring-white" />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800 font-mono">
                              {h.action}
                            </span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-500">
                              {new Date(h.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <p className="text-slate-600 mt-1 text-xs">{h.details}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              By: {h.performedBy} ({h.performedByEmail})
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No activity recorded.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            {fdr && (fdr.submissionStatus === 'DRAFT' || fdr.submissionStatus === 'RETURNED_FOR_CORRECTION') && canUpdate && onEditDraft && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEditDraft(fdr);
                }}
              >
                Edit Draft
              </Button>
            )}

            {fdr && (fdr.submissionStatus === 'DRAFT' || fdr.submissionStatus === 'RETURNED_FOR_CORRECTION') && canSubmit && (
              <Button
                size="sm"
                isLoading={isSubmitting}
                onClick={handleSubmitDraft}
                className="gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Submit for Verification
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Embedded Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!selectedDocIdForView}
        documentId={selectedDocIdForView}
        onClose={() => setSelectedDocIdForView(null)}
      />
    </div>
  );
};
