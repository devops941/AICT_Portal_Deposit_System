import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
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
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Copy,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { InstrumentType, INSTRUMENT_TYPE_LABELS } from '../requirements/types';

interface RequirementOption {
  requirementId: string;
  title: string;
  institutionId: string;
  institutionName: string;
  requiredAmount: number;
  requiredAmountFormatted: string;
  acceptableInstrumentTypes: InstrumentType[];
  requirementType?: string;
  requirementStatus?: string;
  complianceStatus?: string;
  shortfall?: string;
  shortfallFormatted?: string;
  applicableRuleReference?: string;
  effectiveDate?: string;
  submissionDeadline?: string;
}

interface UploadedFileItem {
  file: File;
  documentType: string;
}

export const RegisterFdrPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Select Requirement
  const [requirements, setRequirements] = useState<RequirementOption[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState('');
  const [selectedReq, setSelectedReq] = useState<RequirementOption | null>(null);

  // Search & Filter State for Mandates
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterInstitution, setFilterInstitution] = useState<string>('ALL');
  const [filterInstrumentType, setFilterInstrumentType] = useState<string>('ALL');
  const [filterComplianceStatus, setFilterComplianceStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'amount-desc' | 'amount-asc' | 'id-asc' | 'newest'>('amount-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
  const [isFetchingReqs, setIsFetchingReqs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounce search query to trigger server-side query when searching across 1,000+ mandates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchRequirements(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    // Default dates
    const today = new Date().toISOString().split('T')[0];
    setIssueDate(today);

    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    setMaturityDate(d.toISOString().split('T')[0]);
  }, []);

  const fetchRequirements = async (search?: string) => {
    setIsFetchingReqs(true);
    try {
      const url = search && search.trim().length > 0
        ? `/v1/requirements?limit=100&search=${encodeURIComponent(search.trim())}`
        : '/v1/requirements?limit=100';

      const res: any = await apiClient.get(url);
      if (res.data) {
        const opts: RequirementOption[] = res.data.map((r: any) => {
          const rawAmt = typeof r.requiredAmount === 'number'
            ? r.requiredAmount
            : parseFloat(r.requiredAmount?.$numberDecimal || r.requiredAmount || '0');

          return {
            requirementId: r.requirementId,
            title: r.title,
            institutionId: r.institutionId,
            institutionName: r.institutionName,
            requiredAmount: rawAmt,
            requiredAmountFormatted:
              r.calculatedCompliance?.requiredAmountFormatted ||
              (rawAmt ? `₹${rawAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'),
            acceptableInstrumentTypes: r.acceptableInstrumentTypes || ['FDR'],
            requirementType: r.requirementType,
            requirementStatus: r.requirementStatus || 'ACTIVE',
            complianceStatus: r.calculatedCompliance?.complianceStatus || r.complianceStatus || 'NOT_SUBMITTED',
            shortfall: r.shortfall || r.calculatedCompliance?.outstandingShortfall,
            shortfallFormatted: r.shortfallFormatted || r.calculatedCompliance?.outstandingShortfallFormatted,
            applicableRuleReference: r.applicableRuleReference || 'AICTE Regulations APH Clause 4.2',
            effectiveDate: r.effectiveDate ? new Date(r.effectiveDate).toLocaleDateString() : undefined,
            submissionDeadline: r.submissionDeadline ? new Date(r.submissionDeadline).toLocaleDateString() : undefined,
          };
        });

        setRequirements(opts);

        // Keep or select initial requirement
        if (opts.length > 0) {
          if (!selectedRequirementId || !opts.some((x) => x.requirementId === selectedRequirementId)) {
            setSelectedRequirementId(opts[0].requirementId);
            setSelectedReq(opts[0]);
            setHolderName(`Joint Account: ${opts[0].institutionName} & RO AICTE`);
          } else {
            const found = opts.find((x) => x.requirementId === selectedRequirementId);
            if (found) setSelectedReq(found);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load requirements', e);
    } finally {
      setIsFetchingReqs(false);
    }
  };

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

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Distinct institutions for filter dropdown
  const uniqueInstitutions = useMemo(() => {
    const map = new Map<string, string>();
    requirements.forEach((r) => {
      if (r.institutionName) {
        map.set(r.institutionName, r.institutionName);
      }
    });
    return Array.from(map.values()).sort();
  }, [requirements]);

  // Client-side filtering & sorting across retrieved mandates
  const filteredRequirements = useMemo(() => {
    return requirements
      .filter((req) => {
        // Search text matching across fields
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = req.requirementId.toLowerCase().includes(q);
          const matchTitle = req.title.toLowerCase().includes(q);
          const matchInstName = req.institutionName.toLowerCase().includes(q);
          const matchInstId = req.institutionId.toLowerCase().includes(q);
          const matchRule = req.applicableRuleReference?.toLowerCase().includes(q) || false;
          const matchAmt = req.requiredAmountFormatted.toLowerCase().includes(q);
          if (!matchId && !matchTitle && !matchInstName && !matchInstId && !matchRule && !matchAmt) {
            return false;
          }
        }

        // Filter by Institution
        if (filterInstitution !== 'ALL') {
          if (req.institutionName !== filterInstitution && req.institutionId !== filterInstitution) {
            return false;
          }
        }

        // Filter by Instrument Type
        if (filterInstrumentType !== 'ALL') {
          if (!req.acceptableInstrumentTypes.includes(filterInstrumentType as any)) {
            return false;
          }
        }

        // Filter by Compliance Status
        if (filterComplianceStatus !== 'ALL') {
          if (req.complianceStatus !== filterComplianceStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount-desc') {
          return (b.requiredAmount || 0) - (a.requiredAmount || 0);
        }
        if (sortBy === 'amount-asc') {
          return (a.requiredAmount || 0) - (b.requiredAmount || 0);
        }
        if (sortBy === 'id-asc') {
          return a.requirementId.localeCompare(b.requirementId);
        }
        return 0;
      });
  }, [requirements, searchQuery, filterInstitution, filterInstrumentType, filterComplianceStatus, sortBy]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterInstitution, filterInstrumentType, filterComplianceStatus, sortBy, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRequirements.length / pageSize));
  const paginatedRequirements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequirements.slice(start, start + pageSize);
  }, [filteredRequirements, currentPage, pageSize]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterInstitution !== 'ALL' ||
    filterInstrumentType !== 'ALL' ||
    filterComplianceStatus !== 'ALL' ||
    sortBy !== 'amount-desc';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterInstitution('ALL');
    setFilterInstrumentType('ALL');
    setFilterComplianceStatus('ALL');
    setSortBy('amount-desc');
    setCurrentPage(1);
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
      setError('Please select an active AICTE security deposit requirement mandate.');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4 | 5) : 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      setSuccessMessage(
        saveAsDraft
          ? 'Fixed Deposit draft created successfully.'
          : 'Fixed Deposit successfully registered and submitted for AICTE scrutiny!'
      );

      setTimeout(() => {
        navigate('/fdrs');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to complete FDR registration');
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Requirement Mandate', desc: 'Select AICTE deposit rule' },
    { num: 2, title: 'Bank Details', desc: 'Issuing bank & branch' },
    { num: 3, title: 'Deposit Parameters', desc: 'Amount, tenure, certificate' },
    { num: 4, title: 'Documents', desc: 'Attach certificate scan' },
    { num: 5, title: 'Review & Submit', desc: 'Verify & finalize' },
  ];

  // Helper for compliance status badge styling
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PARTIALLY_COMPLIANT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'OVERDUE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'UNDER_REVIEW':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/fdrs')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to FDR Registry"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">FDR Registry</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-semibold text-slate-800">New Registration</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Step {currentStep} of 5
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Register Financial Deposit (FDR)
            </h1>
          </div>
        </div>

        <button
          onClick={() => navigate('/fdrs')}
          className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white self-start sm:self-auto shadow-sm"
        >
          Cancel Registration
        </button>
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

      {/* Stepper Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {steps.map((st) => {
            const isCurrent = currentStep === st.num;
            const isCompleted = currentStep > st.num;

            return (
              <div
                key={st.num}
                onClick={() => {
                  if (st.num < currentStep) setCurrentStep(st.num as any);
                }}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-blue-50/90 border border-blue-200 ring-2 ring-blue-500/20 shadow-sm'
                    : isCompleted
                    ? 'bg-slate-50 hover:bg-slate-100 cursor-pointer border border-transparent'
                    : 'opacity-60 border border-transparent'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : st.num}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      isCurrent ? 'text-blue-900' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    {st.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate hidden md:block">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Responsive Layout (Balanced Whitespace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Step Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
            {/* Context Banner for Steps 2 to 5 */}
            {currentStep > 1 && selectedReq && (
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider block">
                      Active Mandate Fulfilled
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedReq.requirementId}
                    </span>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="text-slate-700 font-medium truncate inline-block max-w-[200px] sm:max-w-[280px] align-bottom">
                      {selectedReq.institutionName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs">
                    Required: {selectedReq.requiredAmountFormatted}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline underline-offset-2 ml-1"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* STEP 1: SELECT ASSOCIATED REQUIREMENT MANDATE */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Step 1: Select Associated Security Deposit Mandate
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Filter and choose the AICTE statutory security deposit requirement fulfilled by this instrument.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>
                      {filteredRequirements.length} available {filteredRequirements.length === 1 ? 'mandate' : 'mandates'}
                    </span>
                  </div>
                </div>

                {/* Mandate Filter & Search Toolbar */}
                <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                  {/* Primary Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search across mandates by Mandate ID (REQ-...), Institution Name, Code, Program or Rule Reference..."
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all shadow-xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdowns Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {/* Institution Selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Institution Filter
                      </label>
                      <select
                        value={filterInstitution}
                        onChange={(e) => setFilterInstitution(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="ALL">All Institutions ({uniqueInstitutions.length})</option>
                        {uniqueInstitutions.map((inst) => (
                          <option key={inst} value={inst}>
                            {inst}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Instrument Type Selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Allowed Instrument
                      </label>
                      <select
                        value={filterInstrumentType}
                        onChange={(e) => setFilterInstrumentType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="ALL">All Instrument Types</option>
                        <option value="FDR">Fixed Deposit (FDR)</option>
                        <option value="BANK_GUARANTEE">Bank Guarantee (BG)</option>
                        <option value="DEMAND_DRAFT">Demand Draft (DD)</option>
                        <option value="GOVERNMENT_BOND">Government Bond</option>
                      </select>
                    </div>

                    {/* Compliance Status */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Compliance Status
                      </label>
                      <select
                        value={filterComplianceStatus}
                        onChange={(e) => setFilterComplianceStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="NOT_SUBMITTED">Not Submitted</option>
                        <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
                        <option value="COMPLIANT">Compliant</option>
                        <option value="OVERDUE">Overdue</option>
                      </select>
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Sort Mandates By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="amount-desc">Amount: Highest First</option>
                        <option value="amount-asc">Amount: Lowest First</option>
                        <option value="id-asc">Mandate ID (A-Z)</option>
                        <option value="newest">Newest First</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Filter Chips & Reset Action */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-500 text-[11px] font-medium">Active Filters:</span>
                        {searchQuery && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 text-[11px]">
                            Search: "{searchQuery}"
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="hover:text-blue-950 font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        )}
                        {filterInstitution !== 'ALL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 text-[11px]">
                            Inst: {filterInstitution}
                            <button
                              type="button"
                              onClick={() => setFilterInstitution('ALL')}
                              className="hover:text-blue-950 font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        )}
                        {filterInstrumentType !== 'ALL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 text-[11px]">
                            Type: {filterInstrumentType}
                            <button
                              type="button"
                              onClick={() => setFilterInstrumentType('ALL')}
                              className="hover:text-blue-950 font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        )}
                        {filterComplianceStatus !== 'ALL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 text-[11px]">
                            Status: {filterComplianceStatus}
                            <button
                              type="button"
                              onClick={() => setFilterComplianceStatus('ALL')}
                              className="hover:text-blue-950 font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Mandates Cards List / Grid */}
                {isFetchingReqs ? (
                  <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-medium">Searching & loading approved AICTE deposit mandates...</p>
                  </div>
                ) : filteredRequirements.length === 0 ? (
                  <div className="py-12 px-6 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        No security deposit mandates found
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        No mandate matched your search criteria "{searchQuery}" with the applied filters. Try clearing or relaxing the filters.
                      </p>
                    </div>
                    {hasActiveFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      className={`grid gap-3.5 ${
                        paginatedRequirements.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                      }`}
                    >
                      {paginatedRequirements.map((req) => {
                        const isSelected = selectedRequirementId === req.requirementId;
                        return (
                          <div
                            key={req.requirementId}
                            onClick={() => handleSelectReq(req.requirementId)}
                            className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-md'
                                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60 shadow-xs'
                            }`}
                          >
                            {/* Selection Radio Circle */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">
                                  {req.requirementId}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyId(req.requirementId, e)}
                                  className="text-slate-400 hover:text-slate-700 transition-colors"
                                  title="Copy Mandate ID"
                                >
                                  {copiedId === req.requirementId ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                                Required: {req.requiredAmountFormatted}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-800 mt-2 line-clamp-2">
                              {req.title}
                            </p>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-500">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{req.institutionName}</span>
                                </span>
                                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 shrink-0">
                                  {req.institutionId}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1 pt-1">
                                <span className="text-[10px] text-slate-400 truncate">
                                  Allowed: {req.acceptableInstrumentTypes.join(', ')}
                                </span>
                                {req.complianceStatus && (
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${getStatusBadge(
                                      req.complianceStatus
                                    )}`}
                                  >
                                    {req.complianceStatus.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded-md">
                                <CheckCircle className="w-3 h-3" />
                                SELECTED
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="text-slate-500">
                          Showing{' '}
                          <span className="font-semibold text-slate-800">
                            {(currentPage - 1) * pageSize + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-semibold text-slate-800">
                            {Math.min(currentPage * pageSize, filteredRequirements.length)}
                          </span>{' '}
                          of{' '}
                          <span className="font-semibold text-slate-800">
                            {filteredRequirements.length}
                          </span>{' '}
                          mandates
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Previous page"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {Array.from({ length: totalPages }).map((_, idx) => {
                            const pNum = idx + 1;
                            // Show first, last, and near current page
                            if (
                              pNum === 1 ||
                              pNum === totalPages ||
                              (pNum >= currentPage - 1 && pNum <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={pNum}
                                  type="button"
                                  onClick={() => setCurrentPage(pNum)}
                                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                                    currentPage === pNum
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {pNum}
                                </button>
                              );
                            }
                            if (pNum === currentPage - 2 || pNum === currentPage + 2) {
                              return (
                                <span key={pNum} className="px-1 text-slate-400">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}

                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Next page"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: BANK & MANDATE DETAILS */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Step 2: Issuing Bank & Joint AICTE Mandate
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Provide the scheduled commercial bank branch details and configure statutory lien conditions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Scheduled Commercial Bank <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      placeholder="e.g. State Bank of India, Punjab National Bank, HDFC Bank"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Joint Mandate Checkbox */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:bg-slate-100/60 transition-colors">
                    <input
                      type="checkbox"
                      id="jointCheck"
                      checked={isJointAccount}
                      onChange={(e) => setIsJointAccount(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <label htmlFor="jointCheck" className="text-xs text-slate-700 cursor-pointer select-none">
                      <span className="font-semibold block text-slate-900">Joint Account with Regional Officer, AICTE</span>
                      Statutory requirement that FDR certificate is created jointly with AICTE RO with lien endorsement.
                    </label>
                  </div>

                  {/* Auto Renewal */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:bg-slate-100/60 transition-colors">
                    <input
                      type="checkbox"
                      id="autoRenewCheck"
                      checked={autoRenewal}
                      onChange={(e) => setAutoRenewal(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <label htmlFor="autoRenewCheck" className="text-xs text-slate-700 cursor-pointer select-none">
                      <span className="font-semibold block text-slate-900">Auto-Renewal Clause Enabled</span>
                      Bank will automatically roll over the fixed deposit tenure until explicit release by AICTE.
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DEPOSIT PARAMETERS */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Step 3: Instrument Parameters & Tenure
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the certificate numbers, financial amount, and validity dates as endorsed by the issuing bank.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Instrument Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={instrumentType}
                      onChange={(e) => setInstrumentType(e.target.value as InstrumentType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                        placeholder="5000000.00"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    {depositAmount && !isNaN(Number(depositAmount)) && Number(depositAmount) > 0 && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700 font-semibold">
                          ₹{Number(depositAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                        {selectedReq && (
                          <span
                            className={
                              Number(depositAmount) >= selectedReq.requiredAmount
                                ? 'text-emerald-600 font-medium'
                                : 'text-amber-600 font-medium'
                            }
                          >
                            {Number(depositAmount) >= selectedReq.requiredAmount
                              ? '✓ Meets 100% of requirement'
                              : `Covers ${Math.round(
                                  (Number(depositAmount) / selectedReq.requiredAmount) * 100
                                )}% of requirement`}
                          </span>
                        )}
                      </div>
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="absolute right-3.5 top-2.5 text-slate-400 font-semibold text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Issue Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: ATTACH STATUTORY DOCUMENTS */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Step 4: Attach Mandatory Document Proofs
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload legible scanned copies of the original FDR certificate, bank endorsement letter, or board resolution.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Document Classification
                    </label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="FDR_RECEIPT">Fixed Deposit Receipt / Certificate</option>
                      <option value="BANK_CONFIRMATION_LETTER">Bank Confirmation & Lien Letter</option>
                      <option value="BOARD_RESOLUTION">Board / Governing Council Resolution</option>
                      <option value="SFMS_ADVICE">SFMS Structured Financial Advice</option>
                      <option value="OTHER">Other Supporting Document</option>
                    </select>
                  </div>

                  {/* Upload Dropzone */}
                  <div className="sm:col-span-2 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-800">
                      Select instrument certificate or drag & drop
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supported formats: PDF, PNG, JPEG (Verified via actual file content, max 15MB)
                    </p>
                    <div className="mt-4">
                      <label className="inline-block cursor-pointer">
                        <span className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
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
                </div>

                {/* Selected Files List */}
                {filesToUpload.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Attached Files for Scrutiny ({filesToUpload.length})
                    </h5>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {filesToUpload.map((item, idx) => (
                        <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800">{item.file.name}</span>
                              <span className="block text-[11px] text-slate-500 font-mono">
                                {(item.file.size / 1024).toFixed(1)} KB — Type: {item.documentType}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: REVIEW AND STATUTORY SUBMISSION */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Step 5: Review & Statutory Submission
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Carefully verify all registration fields before submitting the security deposit for officer scrutiny.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                        {fdrNumber || 'N/A'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{holderName}</h4>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">Deposit Amount</span>
                      <p className="text-xl font-bold font-mono text-slate-900">
                        ₹{depositAmount ? Number(depositAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Official Statutory Scrutiny Notice</span>
                    <p className="mt-0.5 text-blue-800 leading-relaxed">
                      Submitting this record will mark it as <strong>SUBMITTED</strong>, immediately dispatch it to the AICTE Regional Scrutiny Officer Desk, and automatically update institutional compliance standing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Footer Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Selected Mandate:</span>
                    <span className="font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {selectedReq?.requirementId || 'None'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentStep < 5 ? (
                  <Button type="button" size="sm" onClick={handleNext} className="gap-1.5 shadow-sm">
                    Next Step
                    <ArrowRight className="w-4 h-4" />
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
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Submit for Scrutiny
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Side Rail: Selected Mandate & Statutory Summary Tracker */}
        <div className="lg:col-span-4 space-y-5 sticky top-6">
          {/* Selected Mandate Overview Panel */}
          {selectedReq ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  Selected Mandate
                </span>
                <span className="font-mono text-[11px] text-slate-500 font-medium">
                  {selectedReq.institutionId}
                </span>
              </div>

              <div>
                <span className="font-mono text-xs font-bold text-slate-900 block">
                  {selectedReq.requirementId}
                </span>
                <h4 className="text-xs font-semibold text-slate-700 mt-1 line-clamp-2">
                  {selectedReq.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  {selectedReq.institutionName}
                </p>
              </div>

              {/* Required Amount Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/80 space-y-1">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                  Statutory Deposit Required
                </span>
                <div className="text-xl font-bold font-mono text-blue-950">
                  {selectedReq.requiredAmountFormatted}
                </div>
                {selectedReq.shortfallFormatted && (
                  <span className="text-[10px] font-semibold text-amber-700 block">
                    Outstanding Shortfall: {selectedReq.shortfallFormatted}
                  </span>
                )}
              </div>

              {/* Acceptable Instruments */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Allowed Instrument Types:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReq.acceptableInstrumentTypes.map((type) => (
                    <span
                      key={type}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                        type === 'FDR'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* AICTE Regulatory Reference */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Statutory Rule Reference
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                  {selectedReq.applicableRuleReference}
                </p>
              </div>

              {/* AICTE Statutory Checklist */}
              <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Mandatory Conditions
                </span>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Joint lien endorsement with Regional Officer, AICTE</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Minimum statutory deposit tenure of 5 years</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Scheduled Commercial Bank operating in India</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Original FDR certificate scan upload mandatory</span>
                  </div>
                </div>
              </div>

              {currentStep === 1 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNext}
                  className="w-full gap-1.5 mt-2 shadow-sm"
                >
                  Confirm Mandate & Proceed
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Info className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                Select a Deposit Mandate
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose a mandate from the left list to review its financial parameters, allowable instruments, and statutory requirements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
