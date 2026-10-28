import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import {
  RequirementItem,
  RequirementType,
  InstrumentType,
  RequirementStatus,
  REQUIREMENT_TYPE_LABELS,
  INSTRUMENT_TYPE_LABELS,
} from './types';

interface EditRequirementModalProps {
  isOpen: boolean;
  requirement: RequirementItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditRequirementModal: React.FC<EditRequirementModalProps> = ({
  isOpen,
  requirement,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [requirementType, setRequirementType] = useState<RequirementType>('ANNUAL_COMPLIANCE');
  const [requiredAmount, setRequiredAmount] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [applicableRuleReference, setApplicableRuleReference] = useState('');
  const [acceptableInstrumentTypes, setAcceptableInstrumentTypes] = useState<InstrumentType[]>([]);
  const [requirementStatus, setRequirementStatus] = useState<RequirementStatus>('ACTIVE');
  const [supportingDocs, setSupportingDocs] = useState('');
  const [businessRules, setBusinessRules] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requirement) {
      setTitle(requirement.title);
      setRequirementType(requirement.requirementType);

      // Handle Decimal format or number
      const amt =
        typeof requirement.requiredAmount === 'object' && requirement.requiredAmount !== null
          ? (requirement.requiredAmount as any).$numberDecimal || '0'
          : String(requirement.requiredAmount || '0');
      setRequiredAmount(amt);

      if (requirement.submissionDeadline) {
        setSubmissionDeadline(requirement.submissionDeadline.split('T')[0]);
      }
      setApplicableRuleReference(requirement.applicableRuleReference);
      setAcceptableInstrumentTypes(requirement.acceptableInstrumentTypes || ['FDR']);
      setRequirementStatus(requirement.requirementStatus);
      setSupportingDocs((requirement.supportingDocumentRequirements || []).join('\n'));
      setBusinessRules((requirement.applicableBusinessRules || []).join('\n'));
      setError(null);
    }
  }, [requirement]);

  if (!isOpen || !requirement) return null;

  const toggleInstrument = (type: InstrumentType) => {
    if (acceptableInstrumentTypes.includes(type)) {
      if (acceptableInstrumentTypes.length === 1) return;
      setAcceptableInstrumentTypes(acceptableInstrumentTypes.filter((t) => t !== type));
    } else {
      setAcceptableInstrumentTypes([...acceptableInstrumentTypes, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requiredAmount || !submissionDeadline) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        requirementType,
        requiredAmount: requiredAmount.trim(),
        submissionDeadline,
        applicableRuleReference: applicableRuleReference.trim(),
        acceptableInstrumentTypes,
        requirementStatus,
        supportingDocumentRequirements: supportingDocs
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        applicableBusinessRules: businessRules
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await apiClient.patch(`/v1/requirements/${requirement._id || requirement.requirementId}`, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update requirement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                {requirement.requirementId}
              </span>
              <h3 className="text-lg font-bold text-slate-900">Edit Deposit Requirement</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned to: {requirement.institutionName} ({requirement.institutionId})
            </p>
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Type & Status */}
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
                Lifecycle Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={requirementStatus}
                onChange={(e) => setRequirementStatus(e.target.value as RequirementStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="FULFILLED">FULFILLED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="WAIVED">WAIVED</option>
              </select>
            </div>
          </div>

          {/* Amount & Deadline */}
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
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono"
                />
              </div>
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

          {/* Rule Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Rule Reference <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={applicableRuleReference}
              onChange={(e) => setApplicableRuleReference(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Acceptable Instrument Types */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Acceptable Instrument Types
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

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
