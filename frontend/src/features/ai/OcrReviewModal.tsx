import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Hash,
  Building,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Check,
  Edit3,
  Save,
  Lock,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { IAiExtraction } from './types';

interface OcrReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  extraction: IAiExtraction;
  onExtractionUpdated?: (updated: IAiExtraction) => void;
}

export const OcrReviewModal: React.FC<OcrReviewModalProps> = ({
  isOpen,
  onClose,
  extraction,
  onExtractionUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for manual corrections
  const [correctedFields, setCorrectedFields] = useState({
    bankName: extraction.extractedFields.bankName?.value || '',
    fdrNumber: extraction.extractedFields.fdrNumber?.value || '',
    holderName: extraction.extractedFields.holderName?.value || '',
    depositAmount: extraction.extractedFields.depositAmount?.value || '',
    issueDate: extraction.extractedFields.issueDate?.value || '',
    maturityDate: extraction.extractedFields.maturityDate?.value || '',
    branchInformation: extraction.extractedFields.branchInformation?.value || '',
  });

  const [officerRemarks, setOfficerRemarks] = useState('');
  const [confirmOfficer, setConfirmOfficer] = useState(false);
  const [activeTab, setActiveTab] = useState<'FIELDS' | 'TEXT' | 'METADATA'>('FIELDS');

  if (!isOpen) return null;

  const handleSaveCorrection = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        correctedFields,
        officerRemarks,
        confirmExtraction: confirmOfficer,
      };

      const res = await api.post(`/ai/extractions/${extraction.extractionId}/correct`, payload);
      if (res.data?.success) {
        setSuccessMessage('Corrections saved and officer review recorded successfully.');
        setIsEditing(false);
        if (onExtractionUpdated) {
          onExtractionUpdated(res.data.data);
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to apply manual corrections. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> {confidence}%
        </span>
      );
    }
    if (confidence >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" /> {confidence}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <ShieldAlert className="w-3 h-3" /> {confidence}%
      </span>
    );
  };

  const duplicateFlag = extraction.duplicateRiskFlag;
  const comparison = extraction.comparisonResult;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">AI Document Intelligence Review</h2>
                  <span className="text-xs font-mono uppercase bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-md border border-indigo-400/20">
                    {extraction.extractionId}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  File: <span className="font-semibold text-white">{extraction.fileName}</span> ({extraction.mimeType})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block">Classification:</span>
              <span className="font-semibold text-indigo-300">{extraction.documentClassification?.category}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Overall AI Confidence:</span>
              <span className="font-semibold text-white">{extraction.overallConfidence}%</span>
            </div>
            <div>
              <span className="text-slate-400 block">Officer Sign-Off:</span>
              <span className={extraction.officerConfirmed ? 'font-semibold text-emerald-400' : 'font-semibold text-amber-400'}>
                {extraction.officerConfirmed ? 'Confirmed' : 'Pending Officer Review'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Audit Status:</span>
              <span className={extraction.isManualCorrection ? 'text-cyan-300 font-semibold' : 'text-slate-300'}>
                {extraction.isManualCorrection ? 'Manually Corrected' : 'Raw AI Extraction'}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts Strip */}
        <div className="p-6 space-y-3 bg-slate-50 border-b border-slate-200">
          {/* Statutory Authenticity Disclaimer */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            <Lock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">Statutory Verification Notice:</span> AI extraction provides automated data capture assistance for verification officers. It does NOT certify FDR authenticity. Formal confirmation requires officer verification and bank endorsement.
            </div>
          </div>

          {/* Duplicate Risk Warning */}
          {duplicateFlag?.isDuplicateSuspected && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-rose-950 flex items-center gap-2">
                  <span>POTENTIAL DUPLICATE DETECTED</span>
                  <span className="px-1.5 py-0.5 bg-rose-200 text-rose-800 rounded font-mono text-[10px]">
                    {duplicateFlag.matchType}
                  </span>
                </div>
                <p className="mt-1 text-rose-800 leading-relaxed">{duplicateFlag.details}</p>
                {duplicateFlag.matchedInstrumentId && (
                  <div className="mt-1.5 font-medium">
                    Matched Instrument ID: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200">{duplicateFlag.matchedInstrumentId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparison Discrepancies Warning */}
          {comparison?.hasMismatches && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-amber-950">
                  Form vs Document Discrepancies Identified ({comparison.mismatches.length})
                </div>
                <div className="mt-2 space-y-1.5">
                  {comparison.mismatches.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/70 p-2 rounded-lg border border-amber-200">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        m.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.severity}
                      </span>
                      <span className="font-semibold text-slate-800 capitalize">{m.field}:</span>
                      <span className="text-slate-600">{m.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body & Tabs */}
        <div className="p-6">
          {/* Success / Error Banners */}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('FIELDS')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'FIELDS'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Extracted Fields & Comparison
              </button>
              <button
                onClick={() => setActiveTab('TEXT')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'TEXT'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Raw OCR Text Stream
              </button>
              <button
                onClick={() => setActiveTab('METADATA')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'METADATA'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Audit & Cryptographic Metadata
              </button>
            </div>

            {/* Toggle Edit Button */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Manual Officer Correction</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                Correction Mode Active
              </span>
            )}
          </div>

          {/* TAB 1: Extracted Fields & Form Comparison */}
          {activeTab === 'FIELDS' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      Bank Name
                    </span>
                    {getConfidenceBadge(extraction.extractedFields.bankName?.confidence || 0)}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={correctedFields.bankName}
                      onChange={(e) => setCorrectedFields({ ...correctedFields, bankName: e.target.value })}
                      className="w-full text-sm font-medium p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-900">
                      {extraction.extractedFields.bankName?.value || <span className="text-slate-400 italic">Not detected</span>}
                    </div>
                  )}
                  {extraction.extractedFields.bankName?.rawSnippet && (
                    <div className="mt-1 text-[11px] text-slate-500 truncate font-mono">
                      Snippet: "{extraction.extractedFields.bankName.rawSnippet}"
                    </div>
                  )}
                </div>

                {/* FDR Number */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-indigo-600" />
                      FDR Number
                    </span>
                    {getConfidenceBadge(extraction.extractedFields.fdrNumber?.confidence || 0)}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={correctedFields.fdrNumber}
                      onChange={(e) => setCorrectedFields({ ...correctedFields, fdrNumber: e.target.value })}
                      className="w-full text-sm font-medium p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {extraction.extractedFields.fdrNumber?.value || <span className="text-slate-400 italic">Not detected</span>}
                    </div>
                  )}
                  {extraction.extractedFields.fdrNumber?.rawSnippet && (
                    <div className="mt-1 text-[11px] text-slate-500 truncate font-mono">
                      Snippet: "{extraction.extractedFields.fdrNumber.rawSnippet}"
                    </div>
                  )}
                </div>

                {/* Deposit Amount */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                      Deposit Amount
                    </span>
                    {getConfidenceBadge(extraction.extractedFields.depositAmount?.confidence || 0)}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={correctedFields.depositAmount}
                      onChange={(e) => setCorrectedFields({ ...correctedFields, depositAmount: e.target.value })}
                      className="w-full text-sm font-medium p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="text-base font-black text-indigo-950">
                      ₹{parseFloat(extraction.extractedFields.depositAmount?.value || '0').toLocaleString('en-IN')}
                    </div>
                  )}
                  {extraction.extractedFields.depositAmount?.rawSnippet && (
                    <div className="mt-1 text-[11px] text-slate-500 truncate font-mono">
                      Snippet: "{extraction.extractedFields.depositAmount.rawSnippet}"
                    </div>
                  )}
                </div>

                {/* Holder Name */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      Holder / Beneficiary Name
                    </span>
                    {getConfidenceBadge(extraction.extractedFields.holderName?.confidence || 0)}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={correctedFields.holderName}
                      onChange={(e) => setCorrectedFields({ ...correctedFields, holderName: e.target.value })}
                      className="w-full text-sm font-medium p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-900">
                      {extraction.extractedFields.holderName?.value || <span className="text-slate-400 italic">Not detected</span>}
                    </div>
                  )}
                </div>

                {/* Issue Date */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      Issue Date
                    </span>
                    {getConfidenceBadge(extraction.extractedFields.issueDate?.confidence || 0)}
                  </div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={correctedFields.issueDate}
                      onChange={(e) => setCorrectedFields({ ...correctedFields, issueDate: e.target.value })}
                      className="w-full text-sm font-medium p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {extraction.extractedFields.issueDate?.value || <span className="text-slate-400 italic">Not detected</span>}
                    </div>
                  )}
                </div>

                {/* Maturity Date */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      Maturity Date
                    </span>
                    {getConfidenceBadge(extraction.extractedFields.maturityDate?.confidence || 0)}
                  </div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={correctedFields.maturityDate}
                      onChange={(e) => setCorrectedFields({ ...correctedFields, maturityDate: e.target.value })}
                      className="w-full text-sm font-medium p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {extraction.extractedFields.maturityDate?.value || <span className="text-slate-400 italic">Not detected</span>}
                    </div>
                  )}
                </div>

                {/* Branch Info (Full Width) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      Branch Information
                    </span>
                    {getConfidenceBadge(extraction.extractedFields.branchInformation?.confidence || 0)}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={correctedFields.branchInformation}
                      onChange={(e) => setCorrectedFields({ ...correctedFields, branchInformation: e.target.value })}
                      className="w-full text-sm font-medium p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-900">
                      {extraction.extractedFields.branchInformation?.value || <span className="text-slate-400 italic">Not detected</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Officer Confirmation & Correction Controls */}
              {isEditing && (
                <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                    Officer Audit Trail & Confirmation
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Officer Verification Remarks (Mandatory for overrides)
                    </label>
                    <textarea
                      rows={2}
                      value={officerRemarks}
                      onChange={(e) => setOfficerRemarks(e.target.value)}
                      placeholder="e.g. Verified with issuing bank branch via SFMS advice or signed letter..."
                      className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="confirmOfficer"
                      checked={confirmOfficer}
                      onChange={(e) => setConfirmOfficer(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="confirmOfficer" className="text-xs font-semibold text-slate-800">
                      I officially confirm and sign off on these extracted values as an authorized verification officer.
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCorrection}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Saving...' : 'Save Officer Corrections'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Raw OCR Text Stream */}
          {activeTab === 'TEXT' && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-96 leading-relaxed select-text">
              <pre>{extraction.rawText || '// No text could be parsed from this document.'}</pre>
            </div>
          )}

          {/* TAB 3: Metadata */}
          {activeTab === 'METADATA' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-500 block mb-1">SHA-256 Cryptographic Hash:</span>
                <span className="font-mono text-slate-900 break-all bg-white p-2 block rounded border border-slate-200">
                  {extraction.fileHash}
                </span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-500 block mb-1">File Size & MIME:</span>
                <span className="text-slate-900">
                  {(extraction.fileSize / 1024).toFixed(1)} KB ({extraction.mimeType})
                </span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-500 block mb-1">Classification Reasoning:</span>
                <span className="text-slate-700">{extraction.documentClassification?.reasoning}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-500 block mb-1">Processed At:</span>
                <span className="text-slate-900 font-mono">
                  {new Date(extraction.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-t border-slate-200">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>AI Model Engine: Standard Statutory OCR & Parser</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
};
