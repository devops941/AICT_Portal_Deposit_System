import React, { useState, useEffect } from 'react';
import { X, Landmark, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import {
  RequirementType,
  InstrumentType,
  REQUIREMENT_TYPE_LABELS,
  INSTRUMENT_TYPE_LABELS,
} from './types';

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
  const [requirementType, setRequirementType] = useState<RequirementType>('ANNUAL_COMPLIANCE');
  const [requiredAmount, setRequiredAmount] = useState('');
  const [currency] = useState('INR');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [applicableRuleReference, setApplicableRuleReference] = useState('');
  const [acceptableInstrumentTypes, setAcceptableInstrumentTypes] = useState<InstrumentType[]>(['FDR', 'BANK_GUARANTEE']);
  const [supportingDocs, setSupportingDocs] = useState<string>('Bank Confirmation Letter\nLien Marking Endorsement Letter\nBoard Resolution for Joint Account Mandate');
  const [businessRules, setBusinessRules] = useState<string>('Deposit must be in joint name with Regional Officer AICTE\nMinimum tenure 5 years with auto-renewal clause');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchInstitutions();
      // Set default deadline 60 days ahead
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
        if (res.data.length > 0 && !institutionId) {
          setInstitutionId(res.data[0].code);
        }
      }
    } catch (e: any) {
      console.error('Failed to load institutions for requirement creation', e);
    }
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
    if (!institutionId || !title.trim() || !requiredAmount || !submissionDeadline || !applicableRuleReference.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const numAmount = parseFloat(requiredAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please specify a valid positive amount.');
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
                Mandate a joint security escrow requirement for an accredited technical institution
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">Select an accredited institution</option>
              {institutions.map((inst) => (
                <option key={inst.code} value={inst.code}>
                  {inst.name} ({inst.code})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Requirement Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Mandatory Joint Security Deposit for 2026-27 Affiliation Renewal"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Requirement Type & Rule Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Requirement Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={requirementType}
                onChange={(e) => setRequirementType(e.target.value as RequirementType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {Object.entries(REQUIREMENT_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
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
                placeholder="e.g. AICTE-APH-2026-CH2-SEC4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Required Amount & Submission Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Required Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={requiredAmount}
                  onChange={(e) => setRequiredAmount(e.target.value)}
                  required
                  placeholder="3500000.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono"
                />
              </div>
              {requiredAmount && !isNaN(Number(requiredAmount)) && Number(requiredAmount) > 0 && (
                <p className="mt-1 text-[11px] text-slate-500 font-medium">
                  Equivalent to: ₹{Number(requiredAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="gap-2">
              <FileText className="w-4 h-4" />
              Create Deposit Mandate
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
