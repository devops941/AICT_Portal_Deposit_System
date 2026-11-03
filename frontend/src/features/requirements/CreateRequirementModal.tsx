import React, { useState, useEffect } from 'react';
import { X, Landmark, FileText, Check, AlertCircle, Coins, Sparkles, ShieldCheck, Wand2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import {
  RequirementType,
  InstrumentType,
  REQUIREMENT_TYPE_LABELS,
  INSTRUMENT_TYPE_LABELS,
} from './types';
import {
  AICTE_STATUTORY_NORMS,
  getMinimumStatutoryAmount,
  formatLakhsCrores,
} from './requirementNorms';

interface CreateRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InstitutionOption {
  code: string;
  name: string;
}

export const CreateRequirementModal: React.FC<CreateRequirementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [institutionId, setInstitutionId] = useState('');
  const [title, setTitle] = useState('');
  const [requirementType, setRequirementType] = useState<RequirementType | ''>('');
  const [requiredAmount, setRequiredAmount] = useState('');
  const [currency] = useState('INR');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [applicableRuleReference, setApplicableRuleReference] = useState('');
  const [acceptableInstrumentTypes, setAcceptableInstrumentTypes] = useState<InstrumentType[]>(['FDR', 'BANK_GUARANTEE']);
  const [supportingDocs, setSupportingDocs] = useState<string>('');
  const [businessRules, setBusinessRules] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentNorm = requirementType ? AICTE_STATUTORY_NORMS[requirementType] : null;
  const minAmount = requirementType ? getMinimumStatutoryAmount(requirementType) : 0;
  const numAmount = parseFloat(requiredAmount);
  const isAmountEntered = !isNaN(numAmount) && numAmount > 0;
  const isBelowStatutoryMin = Boolean(requirementType && isAmountEntered && numAmount < minAmount);

  // Initialize form to completely clean empty state on open
  useEffect(() => {
    if (isOpen) {
      fetchInstitutions();
      // Clean empty slate
      setInstitutionId('');
      setTitle('');
      setRequirementType('');
      setRequiredAmount('');
      setApplicableRuleReference('');
      setSupportingDocs('');
      setBusinessRules('');
      setAcceptableInstrumentTypes(['FDR', 'BANK_GUARANTEE']);

      // Default deadline to 60 days ahead
      const d = new Date();
      d.setDate(d.getDate() + 60);
      setSubmissionDeadline(d.toISOString().split('T')[0]);
      setError(null);
    }
  }, [isOpen]);

  const fetchInstitutions = async () => {
    try {
      const res: any = await apiClient.get('/v1/institutions?limit=100');
      if (res.data) {
        setInstitutions(
          res.data.map((i: any) => ({
            code: i.code,
            name: i.name,
          }))
        );
      }
    } catch (e: any) {
      console.error('Failed to load institutions for requirement creation', e);
    }
  };

  // Optional one-click auto-fill if the user wants it
  const handleAutoFillNorms = () => {
    if (!currentNorm) return;
    setTitle(currentNorm.defaultTitle);
    setRequiredAmount(currentNorm.defaultAmount.toFixed(2));
    setApplicableRuleReference(currentNorm.ruleReference);
    setAcceptableInstrumentTypes(currentNorm.acceptableInstruments);
    setSupportingDocs(currentNorm.supportingDocs.join('\n'));
    setBusinessRules(currentNorm.businessRules.join('\n'));
  };

  if (!isOpen) return null;

  const toggleInstrument = (type: InstrumentType) => {
    if (acceptableInstrumentTypes.includes(type)) {
      if (acceptableInstrumentTypes.length === 1) return; // Keep at least one
      setAcceptableInstrumentTypes(acceptableInstrumentTypes.filter((t) => t !== type));
    } else {
      setAcceptableInstrumentTypes([...acceptableInstrumentTypes, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!institutionId) {
      setError('Please select a target institution.');
      return;
    }

    if (!requirementType) {
      setError('Please select a requirement type.');
      return;
    }

    if (!title.trim() || !requiredAmount || !submissionDeadline || !applicableRuleReference.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please specify a valid positive amount.');
      return;
    }

    // Strict Statutory Minimum Validation Check
    if (numAmount < minAmount) {
      setError(
        `AICTE Statutory Minimum Violation: Mandated minimum deposit for "${REQUIREMENT_TYPE_LABELS[requirementType]}" is ₹${minAmount.toLocaleString('en-IN')} (${formatLakhsCrores(minAmount)}). You cannot set an amount lower than this threshold.`
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        institutionId,
        title: title.trim(),
        requirementType,
        requiredAmount: requiredAmount.trim(),
        currency,
        submissionDeadline,
        applicableRuleReference: applicableRuleReference.trim(),
        acceptableInstrumentTypes,
        supportingDocumentRequirements: supportingDocs
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        applicableBusinessRules: businessRules
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await apiClient.post('/v1/requirements', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create security deposit requirement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create Security Deposit Requirement</h3>
              <p className="text-xs text-slate-500">
                Mandate a joint security escrow requirement conforming to AICTE APH norms
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Institution */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Institution <span className="text-rose-500">*</span>
            </label>
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="">Select an accredited institution...</option>
              {institutions.map((inst) => (
                <option key={inst.code} value={inst.code}>
                  {inst.name} ({inst.code})
                </option>
              ))}
            </select>
          </div>

          {/* Requirement Type & Rule Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Requirement Type <span className="text-rose-500">*</span>
                </label>
               
              </div>
              <select
                value={requirementType}
                onChange={(e) => setRequirementType(e.target.value as RequirementType)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white font-medium text-slate-800"
              >
                <option value="">Select Requirement Type...</option>
                {Object.entries(REQUIREMENT_TYPE_LABELS).map(([k, label]) => {
                  const norm = AICTE_STATUTORY_NORMS[k as RequirementType];
                  return (
                    <option key={k} value={k}>
                      {label} (Min: {norm ? formatLakhsCrores(norm.minAmount) : 'N/A'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rule Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={applicableRuleReference}
                onChange={(e) => setApplicableRuleReference(e.target.value)}
                required
                placeholder={currentNorm ? currentNorm.ruleReference : 'e.g. AICTE-APH-2026-CH2-SEC4'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Title & Optional Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Requirement Title <span className="text-rose-500">*</span>
              </label>
              {currentNorm && currentNorm.titlePresets.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setTitle(e.target.value);
                    }}
                    className="text-[11px] font-medium bg-primary-50 text-primary-700 border border-primary-200/80 rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer hover:bg-primary-100 transition-colors"
                  >
                    <option value="">Insert standard preset...</option>
                    {currentNorm.titlePresets.map((preset, idx) => (
                      <option key={idx} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={currentNorm ? currentNorm.defaultTitle : 'e.g. Mandatory Joint Security Deposit for 2026-27 Affiliation Renewal'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
            />
          </div>

          {/* Required Amount & Submission Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Required Amount (INR) <span className="text-rose-500">*</span>
                </label>
                {requirementType && (
                  <span className="text-[11px] font-semibold text-slate-500">
                    Mandated Min: <span className="text-primary-600">{formatLakhsCrores(minAmount)}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min={minAmount || 1}
                  value={requiredAmount}
                  onChange={(e) => setRequiredAmount(e.target.value)}
                  required
                  placeholder={currentNorm ? currentNorm.defaultAmount.toFixed(2) : 'e.g. 5000000.00'}
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none transition-all ${
                    isBelowStatutoryMin
                      ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                  }`}
                />
              </div>

           

              {/* Real-Time Minimum Validation Alert */}
              {isBelowStatutoryMin ? (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">AICTE Statutory Violation:</span> Mandated deposit for{' '}
                    <span className="underline font-semibold">{currentNorm?.label}</span> cannot be less than{' '}
                    <span className="font-bold">{formatLakhsCrores(minAmount)} (₹{minAmount.toLocaleString('en-IN')})</span>.
                  </div>
                </div>
              ) : (
                requirementType &&
                isAmountEntered && (
                  <div className="mt-2 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>
                      Complies with statutory minimum of <strong>{formatLakhsCrores(minAmount)}</strong>
                    </span>
                  </div>
                )
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Submission Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Recommended 60 days standard statutory preparation window
              </p>
            </div>
          </div>

          {/* Acceptable Instrument Types */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Acceptable Instrument Types <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(INSTRUMENT_TYPE_LABELS) as InstrumentType[]).map((type) => {
                const isChecked = acceptableInstrumentTypes.includes(type);
                return (
                  <div
                    key={type}
                    onClick={() => toggleInstrument(type)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      isChecked
                        ? 'border-primary-500/40 bg-primary-50/40 text-slate-900 font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-primary-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs">{INSTRUMENT_TYPE_LABELS[type]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supporting Document Requirements */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Supporting Document Requirements (one per line)
            </label>
            <textarea
              rows={3}
              value={supportingDocs}
              onChange={(e) => setSupportingDocs(e.target.value)}
              placeholder="e.g.&#10;Tripartite Bank Confirmation Letter with AICTE Lien Endorsement&#10;Copy of Joint Fixed Deposit Receipt (Physical Scan)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono"
            />
          </div>

          {/* Business Rules */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Applicable Business Rules (one per line)
            </label>
            <textarea
              rows={2}
              value={businessRules}
              onChange={(e) => setBusinessRules(e.target.value)}
              placeholder="e.g.&#10;FDR must be drawn jointly in name of Principal/Dean and Member Secretary AICTE&#10;Mandatory lock-in tenure: 10 years (120 months) with irrevocable bank lien"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isBelowStatutoryMin}
              className={`gap-2 ${
                isBelowStatutoryMin ? 'opacity-50 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
              }`}
            >
              <FileText className="w-4 h-4" />
              Create Deposit Mandate
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
