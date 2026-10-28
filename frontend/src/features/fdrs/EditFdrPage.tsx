import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Landmark,
  Calendar,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  ShieldCheck,
  Percent,
  Check,
  Clock,
  ExternalLink,
  Eye,
  Download,
  AlertTriangle,
  Save,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { FdrItem, DocumentItem } from './types';
import { DocumentViewerModal } from './DocumentViewerModal';

export const EditFdrPage: React.FC = () => {
  const { fdrId } = useParams<{ fdrId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('FDR:UPDATE');
  const canSubmit = hasPermission('FDR:SUBMIT');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Original FDR and Documents
  const [fdr, setFdr] = useState<FdrItem | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  // Form State
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [fdrNumber, setFdrNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [isJointAccount, setIsJointAccount] = useState(true);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [interestRate, setInterestRate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Additional New Files to Upload
  const [newFiles, setNewFiles] = useState<{ file: File; documentType: string }[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('FDR_RECEIPT');

  // Fetch FDR and documents
  useEffect(() => {
    if (fdrId) {
      fetchFdrDetails();
    }
  }, [fdrId]);

  const fetchFdrDetails = async () => {
    if (!fdrId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [fdrRes, docsRes]: any = await Promise.all([
        apiClient.get(`/v1/fdrs/${fdrId}`),
        apiClient.get(`/v1/documents/instrument/${fdrId}`).catch(() => ({ data: [] })),
      ]);

      const fdrData: FdrItem = fdrRes?.data?.data || fdrRes?.data || fdrRes;
      if (fdrData) {
        setFdr(fdrData);
        setBankName(fdrData.bankName || '');
        setBankBranch(fdrData.bankBranch || '');
        setFdrNumber(fdrData.fdrNumber || '');
        setHolderName(fdrData.holderName || '');

        const amt =
          typeof fdrData.depositAmount === 'object' && fdrData.depositAmount !== null
            ? (fdrData.depositAmount as any).$numberDecimal || '0'
            : String(fdrData.depositAmount || '0');
        setDepositAmount(amt);

        if (fdrData.issueDate) setIssueDate(fdrData.issueDate.split('T')[0]);
        if (fdrData.maturityDate) setMaturityDate(fdrData.maturityDate.split('T')[0]);
        setIsJointAccount(fdrData.isJointAccount ?? true);
        setAutoRenewal(fdrData.autoRenewal ?? true);
        setInterestRate(fdrData.interestRate ? String(fdrData.interestRate) : '');
        setRemarks(fdrData.remarks || '');
      }

      const docsData: DocumentItem[] = docsRes?.data?.data || docsRes?.data || docsRes || [];
      if (Array.isArray(docsData)) {
        setDocuments(docsData);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch FDR details');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate Tenure
  const tenureYears = React.useMemo(() => {
    if (!issueDate || !maturityDate) return null;
    const start = new Date(issueDate);
    const end = new Date(maturityDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime <= 0) return '0';
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return (diffDays / 365.25).toFixed(1);
  }, [issueDate, maturityDate]);

  // Formatted amount preview
  const formattedDepositPreview = React.useMemo(() => {
    const num = parseFloat(depositAmount);
    if (isNaN(num) || num <= 0) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  }, [depositAmount]);

  // Handle adding new file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum 10MB limit.');
      return;
    }
    setNewFiles((prev) => [...prev, { file, documentType: selectedDocType }]);
    e.target.value = '';
  };

  const handleRemoveNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Download existing document
  const handleDownloadDoc = async (docId: string, filename: string) => {
    try {
      const res: any = await apiClient.get(`/v1/documents/${docId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data || res]));
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

  // Save changes
  const handleSave = async (submitAfterSave = false) => {
    if (!fdr) return;

    if (!bankName.trim() || !bankBranch.trim() || !fdrNumber.trim() || !holderName.trim() || !depositAmount) {
      setError('Please fill in all mandatory fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please provide a valid positive deposit amount.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (new Date(maturityDate).getTime() <= new Date(issueDate).getTime()) {
      setError('Maturity date must be strictly after the issue date.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (submitAfterSave) {
      setIsSubmitting(true);
    } else {
      setIsSaving(true);
    }
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Update FDR record via PATCH
      const payload = {
        bankName: bankName.trim(),
        bankBranch: bankBranch.trim(),
        fdrNumber: fdrNumber.trim().toUpperCase(),
        holderName: holderName.trim(),
        depositAmount: depositAmount.trim(),
        issueDate,
        maturityDate,
        isJointAccount,
        autoRenewal,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        remarks: remarks.trim() || undefined,
      };

      const targetId = fdr.fdrId || fdr._id;
      await apiClient.patch(`/v1/fdrs/${targetId}`, payload);

      // 2. Upload any newly attached document files
      if (newFiles.length > 0) {
        for (const item of newFiles) {
          const form = new FormData();
          form.append('file', item.file);
          form.append('instrumentId', fdr.fdrId);
          form.append('documentType', item.documentType);
          form.append('institutionId', fdr.institutionId || '');
          try {
            await apiClient.post('/v1/documents/upload', form);
          } catch (docErr) {
            console.error('Failed to upload file:', docErr);
          }
        }
        setNewFiles([]);
      }

      // 3. If "Save & Submit for Scrutiny" is requested
      if (submitAfterSave) {
        await apiClient.post(`/v1/fdrs/${targetId}/submit`);
        setSuccessMessage('FDR successfully updated and submitted for official AICTE verification scrutiny!');
        setTimeout(() => {
          navigate('/fdrs');
        }, 1500);
      } else {
        setSuccessMessage('Draft deposit record updated successfully.');
        await fetchFdrDetails();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save FDR changes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-24 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold text-slate-700">Loading Draft Deposit Instrument Record...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching banking details, statutory mandates, and attached document proofs...</p>
      </div>
    );
  }

  if (!fdr) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Instrument Record Not Found</h2>
        <p className="text-xs text-slate-600">The requested FDR #{fdrId} could not be located in the statutory database.</p>
        <Button onClick={() => navigate('/fdrs')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to FDR Registry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/fdrs')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to FDR Registry"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">FDR Registry</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-semibold text-slate-800">Edit Draft Deposit Record</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Edit Deposit Record #{fdr.fdrId}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/fdrs')}
            className="text-xs"
          >
            Cancel & Exit
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSaving || isSubmitting || !canUpdate}
            onClick={() => handleSave(false)}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          {canSubmit && (fdr.submissionStatus === 'DRAFT' || fdr.submissionStatus === 'RETURNED_FOR_CORRECTION') && (
            <Button
              type="button"
              size="sm"
              disabled={isSaving || isSubmitting}
              onClick={() => handleSave(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting...' : 'Save & Submit'}
            </Button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm font-semibold text-emerald-800 flex items-center gap-2.5 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm font-medium text-rose-700 flex items-center gap-2.5 animate-in fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Summary Banner */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shadow-sm shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">
                {fdr.institutionName || 'Statutory Technical Institution'}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Code: {fdr.institutionId}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Status: {fdr.submissionStatus}
              </span>
              {fdr.isDuplicateFlagged && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Duplicate Suspect
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Registered by <span className="font-semibold text-slate-700">{fdr.createdBy}</span> • Linked Mandate: <span className="font-mono text-slate-700">{fdr.requirementId}</span> ({fdr.requirementTitle})
            </p>
          </div>
        </div>

        <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Deposit Capital Value
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 block mt-0.5">
            {formattedDepositPreview || (fdr.depositAmountFormatted || `₹${fdr.depositAmount}`)}
          </span>
          <span className="text-xs text-slate-500">Scheduled Commercial Bank FDR</span>
        </div>
      </div>

      {/* Form Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7-8 Columns: Main Form Fields */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Banking & Branch Particulars */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Landmark className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  1. Scheduled Commercial Bank Particulars
                </h3>
                <p className="text-xs text-slate-500">
                  AICTE Approval Process Handbook mandates FDRs with Scheduled Commercial Banks only.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scheduled Bank Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, HDFC Bank, Axis Bank..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Branch Name & City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  placeholder="e.g. Kalavakkam OMR Branch, Chennai"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none text-slate-800"
                  required
                />
              </div>
            </div>

            {/* AICTE Joint Mandate & Auto-Renewal Checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isJointAccount}
                  onChange={(e) => setIsJointAccount(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Valid AICTE Joint Mandate
                  </span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                    Joint account pledged with Regional Officer (RO), AICTE. Single-party accounts violate statutory norms.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={autoRenewal}
                  onChange={(e) => setAutoRenewal(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Auto-Renewal Clause Active
                  </span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                    Ensures instrument remains in continuous force until formal written release authorization by AICTE.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Instrument & Deposit Terms */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  2. Deposit Certificate & Financial Terms
                </h3>
                <p className="text-xs text-slate-500">
                  Verify certificate numbers, lien remarks, and capital sums.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  FDR / Certificate Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fdrNumber}
                  onChange={(e) => setFdrNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. AXIS-FDR-2026-8842"
                  className="w-full px-3.5 py-2.5 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Principal Deposit Amount (INR ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g. 4500000"
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none text-slate-800"
                    required
                  />
                </div>
                {formattedDepositPreview && (
                  <span className="text-xs text-emerald-600 font-semibold block mt-1">
                    Value: {formattedDepositPreview}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deposit Holder Name (Joint Account) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="e.g. Joint Account: SSN College of Engineering & Regional Officer, AICTE"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Interest Rate (%) (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="e.g. 7.25"
                    className="w-full pr-8 pl-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none text-slate-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Statutory Dates & Tenure */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  3. Statutory Tenure & Validity Period
                </h3>
                <p className="text-xs text-slate-500">
                  Minimum non-liquidation maturity tenure must satisfy statutory requirements (normally 5–8 years).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Issue Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Maturity Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none text-slate-800"
                  required
                />
              </div>
            </div>

            {tenureYears !== null && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Calculated Deposit Tenure:</span>
                <span
                  className={`font-bold px-3 py-1 rounded-full ${
                    parseFloat(tenureYears) >= 5
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border border-amber-300'
                  }`}
                >
                  {tenureYears} Years ({Math.round(parseFloat(tenureYears) * 12)} Months)
                  {parseFloat(tenureYears) >= 5 ? ' ✓ Minimum Met' : ' ⚠ Less than standard 5-year lock-in'}
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Internal Remarks */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              4. Verification Observations / Submission Remarks (Optional)
            </h3>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Record any special bank confirmation references, ledger notes, or correction notes..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Right 4 Columns: Attached Documents Proofs & Upload */}
        <div className="lg:col-span-4 space-y-6">
          {/* Linked Mandate Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Building className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Linked Security Mandate</h3>
            </div>
            <p className="text-xs font-semibold text-slate-900 leading-snug">
              {fdr.requirementTitle}
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Requirement ID:</span>
                <span className="font-mono text-slate-700 font-semibold">{fdr.requirementId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Instrument Type:</span>
                <span className="font-semibold text-indigo-600">{fdr.instrumentType || 'FDR'}</span>
              </div>
            </div>
          </div>

          {/* Attached Document Proofs */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Document Proofs ({documents.length})
                </h3>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate" title={doc.originalFileName}>
                          {doc.originalFileName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDocId(doc.documentId || doc._id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc.documentId || doc._id, doc.originalFileName)}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload New Files */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Attach Additional Document Proof
              </label>

              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
              >
                <option value="FDR_RECEIPT">FDR Fixed Deposit Receipt</option>
                <option value="BANK_CONFIRMATION_LETTER">Bank Confirmation Letter</option>
                <option value="BOARD_RESOLUTION">Board Resolution</option>
                <option value="OTHER">Other Proof / Mandate</option>
              </select>

              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-xl cursor-pointer hover:bg-indigo-50/70 transition-colors">
                <Upload className="w-5 h-5 text-indigo-600 mb-1" />
                <span className="text-xs font-semibold text-indigo-700">Choose File to Upload</span>
                <span className="text-[10px] text-slate-500 mt-0.5">PDF, PNG, JPG up to 10MB</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {/* Newly attached files queue */}
              {newFiles.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Pending Upload Queue ({newFiles.length})
                  </span>
                  {newFiles.map((nf, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-indigo-50/60 border border-indigo-200 rounded-lg flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-indigo-950 truncate">{nf.file.name}</p>
                        <p className="text-[10px] text-indigo-700">{nf.documentType}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(idx)}
                        className="p-1 text-rose-500 hover:bg-rose-100 rounded transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 p-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/fdrs')}
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to FDR Registry
          </Button>
          <span className="hidden sm:inline-block text-xs text-slate-500">
            Last Modified: {new Date(fdr.updatedAt || fdr.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button
            type="button"
            size="sm"
            disabled={isSaving || isSubmitting || !canUpdate}
            onClick={() => handleSave(false)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving Changes...' : 'Save as Draft'}
          </Button>

          {canSubmit && (fdr.submissionStatus === 'DRAFT' || fdr.submissionStatus === 'RETURNED_FOR_CORRECTION') && (
            <Button
              type="button"
              size="sm"
              disabled={isSaving || isSubmitting}
              onClick={() => handleSave(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting...' : 'Save & Submit for Scrutiny'}
            </Button>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {previewDocId && (
        <DocumentViewerModal
          isOpen={!!previewDocId}
          onClose={() => setPreviewDocId(null)}
          documentId={previewDocId}
        />
      )}
    </div>
  );
};
