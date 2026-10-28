import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck,
  Building,
  Landmark,
  DollarSign,
  Calendar,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Percent,
  Search,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { InstrumentType, INSTRUMENT_TYPE_LABELS } from '../requirements/types';

interface AddFdrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RequirementOption {
  requirementId: string;
  title: string;
  institutionId: string;
  institutionName: string;
  requiredAmountFormatted: string;
  acceptableInstrumentTypes: InstrumentType[];
}

interface UploadedFileItem {
  file: File;
  documentType: string;
}

export const AddFdrModal: React.FC<AddFdrModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Select Requirement
  const [requirements, setRequirements] = useState<RequirementOption[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState('');
  const [selectedReq, setSelectedReq] = useState<RequirementOption | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Step 2: Bank Details
  const [bankName, setBankName] = useState('State Bank of India');
  const [bankBranch, setBankBranch] = useState('');
  const [isJointAccount, setIsJointAccount] = useState(true);
  const [autoRenewal, setAutoRenewal] = useState(true);

  // Step 3: Deposit Details
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('FDR');
  const [fdrNumber, setFdrNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [interestRate, setInterestRate] = useState<string>('7.25');
  const [remarks, setRemarks] = useState('');

  // Step 4: Documents to Upload
  const [filesToUpload, setFilesToUpload] = useState<UploadedFileItem[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('FDR_RECEIPT');

  // Loading & Errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setError(null);
      setSearchQuery('');

      // Default dates
      const today = new Date().toISOString().split('T')[0];
      setIssueDate(today);

      const d = new Date();
      d.setFullYear(d.getFullYear() + 5);
      setMaturityDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchRequirements(debouncedSearch);
    }
  }, [debouncedSearch, isOpen]);

  const fetchRequirements = async (search?: string) => {
    try {
      const url = search && search.trim().length > 0
        ? `/v1/requirements?limit=100&search=${encodeURIComponent(search.trim())}`
        : '/v1/requirements?limit=100';
      const res: any = await apiClient.get(url);
      if (res.data) {
        const opts: RequirementOption[] = res.data.map((r: any) => ({
          requirementId: r.requirementId,
          title: r.title,
          institutionId: r.institutionId,
          institutionName: r.institutionName,
          requiredAmountFormatted: r.calculatedCompliance?.requiredAmountFormatted || '₹0.00',
          acceptableInstrumentTypes: r.acceptableInstrumentTypes || ['FDR'],
        }));
        setRequirements(opts);
        if (opts.length > 0 && !selectedRequirementId) {
          setSelectedRequirementId(opts[0].requirementId);
          setSelectedReq(opts[0]);
          setHolderName(`Joint Account: ${opts[0].institutionName} & RO AICTE`);
        }
      }
    } catch (e) {
      console.error('Failed to load requirements', e);
    }
  };

  const filteredRequirements = requirements.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.requirementId.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.institutionName.toLowerCase().includes(q) ||
      r.institutionId.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  const handleSelectReq = (reqId: string) => {
    setSelectedRequirementId(reqId);
    const found = requirements.find((r) => r.requirementId === reqId);
    if (found) {
      setSelectedReq(found);
      setHolderName(`Joint Account: ${found.institutionName} & RO AICTE`);
      if (found.acceptableInstrumentTypes && found.acceptableInstrumentTypes.length > 0) {
        setInstrumentType(found.acceptableInstrumentTypes[0]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFilesToUpload([...filesToUpload, { file, documentType: selectedDocType }]);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload(filesToUpload.filter((_, i) => i !== index));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!selectedRequirementId) {
      setError('Please select an active deposit requirement.');
      return false;
    }
    setError(null);
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!bankName.trim() || !bankBranch.trim()) {
      setError('Please provide issuing bank name and branch details.');
      return false;
    }
    setError(null);
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!fdrNumber.trim() || !holderName.trim() || !depositAmount || !issueDate || !maturityDate) {
      setError('Please fill in all mandatory deposit parameters.');
      return false;
    }
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Deposit amount must be a positive financial value.');
      return false;
    }
    if (new Date(maturityDate).getTime() <= new Date(issueDate).getTime()) {
      setError('Maturity date must strictly succeed the instrument issue date.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setCurrentStep((s) => (s < 5 ? ((s + 1) as 1 | 2 | 3 | 4 | 5) : 5));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4 | 5) : 1));
  };

  const handleFinalSubmit = async (saveAsDraft: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create FDR
      const fdrPayload = {
        institutionId: selectedReq?.institutionId,
        requirementId: selectedRequirementId,
        instrumentType,
        bankName: bankName.trim(),
        bankBranch: bankBranch.trim(),
        fdrNumber: fdrNumber.trim().toUpperCase(),
        holderName: holderName.trim(),
        depositAmount: depositAmount.trim(),
        issueDate,
        maturityDate,
        currency: 'INR',
        isJointAccount,
        autoRenewal,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        remarks: remarks.trim() || undefined,
        saveAsDraft,
      };

      const res: any = await apiClient.post('/v1/fdrs', fdrPayload);
      const createdFdr = res.data?.data || res.data;
      const targetInstrumentId = createdFdr?.fdrId || createdFdr?._id;

      // 2. Upload any selected documents linked to this new FDR ID
      if (filesToUpload.length > 0 && targetInstrumentId) {
        for (const item of filesToUpload) {
          const form = new FormData();
          form.append('file', item.file);
          form.append('instrumentId', targetInstrumentId);
          form.append('documentType', item.documentType);
          form.append('institutionId', selectedReq?.institutionId || '');
          try {
            await apiClient.post('/v1/documents/upload', form);
          } catch (docErr) {
            console.error('Failed to upload document attachment:', docErr);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete FDR registration');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Requirement' },
    { num: 2, title: 'Bank Details' },
    { num: 3, title: 'Deposit Details' },
    { num: 4, title: 'Documents' },
    { num: 5, title: 'Review & Submit' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Register Financial Deposit (FDR)</h3>
              <p className="text-xs text-slate-500">
                Multi-step instrument registration, lien mandate, and document submission
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200/70 flex items-center justify-between">
          {steps.map((st, i) => (
            <React.Fragment key={st.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    currentStep === st.num
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30'
                      : currentStep > st.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentStep > st.num ? '✓' : st.num}
                </div>
                <span
                  className={`text-xs hidden sm:inline font-medium ${
                    currentStep === st.num ? 'text-primary-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  {st.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > st.num ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT REQUIREMENT */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Associated Security Deposit Mandate <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    {filteredRequirements.length} found
                  </span>
                </div>

                {/* Mandate search filter */}
                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Mandate ID (REQ-...), Institution Name, Code..."
                    className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {filteredRequirements.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">No deposit mandates match "{searchQuery}"</p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-primary-600 hover:underline font-medium text-[11px]"
                    >
                      Clear search filter
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {filteredRequirements.map((req) => {
                      const isSelected = selectedRequirementId === req.requirementId;
                      return (
                        <div
                          key={req.requirementId}
                          onClick={() => handleSelectReq(req.requirementId)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500/30 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {req.requirementId}
                            </span>
                            <span className="text-xs font-bold font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200/60">
                              Required: {req.requiredAmountFormatted}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 mt-1">{req.title}</p>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                            <span>{req.institutionName} ({req.institutionId})</span>
                            <span>Allowed: {req.acceptableInstrumentTypes.join(', ')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: BANK DETAILS */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Issuing Scheduled Commercial Bank <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  placeholder="e.g. State Bank of India, Punjab National Bank, HDFC Bank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Branch Name & Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  required
                  placeholder="e.g. Guindy Corporate Branch, Chennai - 600025"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {/* Joint Mandate Checkbox */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="jointCheck"
                  checked={isJointAccount}
                  onChange={(e) => setIsJointAccount(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                />
                <label htmlFor="jointCheck" className="text-xs text-slate-700 cursor-pointer select-none">
                  <span className="font-semibold block text-slate-900">Joint Account with Regional Officer, AICTE</span>
                  Statutory requirement that FDR certificate is created jointly with AICTE RO with lien endorsement.
                </label>
              </div>

              {/* Auto Renewal */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="autoRenewCheck"
                  checked={autoRenewal}
                  onChange={(e) => setAutoRenewal(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                />
                <label htmlFor="autoRenewCheck" className="text-xs text-slate-700 cursor-pointer select-none">
                  <span className="font-semibold block text-slate-900">Auto-Renewal Clause Enabled</span>
                  Bank will automatically roll over the fixed deposit tenure until explicit release by AICTE.
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: DEPOSIT DETAILS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Instrument Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={instrumentType}
                    onChange={(e) => setInstrumentType(e.target.value as InstrumentType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    {selectedReq?.acceptableInstrumentTypes.map((type) => (
                      <option key={type} value={type}>
                        {INSTRUMENT_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    FDR Certificate / Instrument No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fdrNumber}
                    onChange={(e) => setFdrNumber(e.target.value)}
                    required
                    placeholder="e.g. SBI-FDR-2026-9901"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Deposit Holder Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Deposit Amount (INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required
                      placeholder="2000000.00"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  {depositAmount && !isNaN(Number(depositAmount)) && Number(depositAmount) > 0 && (
                    <p className="mt-1 text-[11px] text-slate-500 font-medium">
                      Equivalent to: ₹{Number(depositAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Interest Rate (% p.a.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="7.25"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-semibold text-sm">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Issue Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Maturity Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: UPLOAD DOCUMENTS */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Classification
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="FDR_RECEIPT">Original Fixed Deposit Receipt / Certificate</option>
                  <option value="BANK_CONFIRMATION_LETTER">Bank Confirmation & Lien Marking Letter</option>
                  <option value="BOARD_RESOLUTION">Board / Governing Council Resolution</option>
                  <option value="SFMS_ADVICE">SFMS Structured Financial Advice</option>
                  <option value="OTHER">Other Supporting Document</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-primary-500 transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">
                  Select instrument certificate or drag & drop
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: PDF, PNG, JPEG (Verified via actual file content, max 15MB)
                </p>
                <div className="mt-3">
                  <label className="inline-block cursor-pointer">
                    <span className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/30">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Selected Files List */}
              {filesToUpload.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Attached Files ({filesToUpload.length})
                  </h5>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {filesToUpload.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-primary-600" />
                          <div>
                            <span className="font-semibold text-slate-800">{item.file.name}</span>
                            <span className="block text-[11px] text-slate-400">
                              {(item.file.size / 1024).toFixed(1)} KB — {item.documentType}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW AND SUBMIT */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                      {fdrNumber || 'N/A'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{holderName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Deposit Amount</span>
                    <p className="text-lg font-bold font-mono text-slate-900">
                      ₹{depositAmount ? Number(depositAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Bank & Branch:</span>
                    <span className="text-slate-800 font-semibold">{bankName} — {bankBranch}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Linked Requirement:</span>
                    <span className="text-slate-800 font-mono font-semibold">{selectedRequirementId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Tenure Window:</span>
                    <span className="text-slate-800 font-semibold">{issueDate} to {maturityDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Attached Documents:</span>
                    <span className="text-slate-800 font-semibold">{filesToUpload.length} files attached</span>
                  </div>
                </div>
              </div>

              {/* Note about official scrutiny */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-600 mt-0.5" />
                <div>
                  <span className="font-bold">Official Scrutiny Workflow</span>
                  <p className="mt-0.5 text-indigo-700">
                    Submitting this record will mark it as <strong>SUBMITTED</strong>, notify the AICTE regional scrutiny desk, and immediately synchronize into the institutional compliance calculation engine.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" size="sm" onClick={handleBack} disabled={isLoading} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <Button type="button" size="sm" onClick={handleNext} className="gap-1.5">
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isLoading}
                  onClick={() => handleFinalSubmit(true)}
                  className="text-slate-700"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  isLoading={isLoading}
                  onClick={() => handleFinalSubmit(false)}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Submit for Scrutiny
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
