import React, { useState, useEffect } from 'react';
import { X, ShieldPlus, AlertCircle, Building, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import { RequirementItem, InstrumentType, INSTRUMENT_TYPE_LABELS } from './types';

interface PledgeInstrumentModalProps {
  isOpen: boolean;
  requirement: RequirementItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PledgeInstrumentModal: React.FC<PledgeInstrumentModalProps> = ({
  isOpen,
  requirement,
  onClose,
  onSuccess,
}) => {
  const [instrumentId, setInstrumentId] = useState('');
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('FDR');
  const [bankName, setBankName] = useState('State Bank of India');
  const [branchName, setBranchName] = useState('');
  const [amount, setAmount] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [isJointAccount, setIsJointAccount] = useState(true);
  const [remarks, setRemarks] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requirement) {
      setInstrumentId('');
      setBranchName('');
      setAmount('');
      setRemarks('');
      setIsJointAccount(true);
      setError(null);

      // Default type to first acceptable instrument type
      if (requirement.acceptableInstrumentTypes && requirement.acceptableInstrumentTypes.length > 0) {
        setInstrumentType(requirement.acceptableInstrumentTypes[0]);
      } else {
        setInstrumentType('FDR');
      }

      // Default maturity date to 3 years from today
      const d = new Date();
      d.setFullYear(d.getFullYear() + 3);
      setMaturityDate(d.toISOString().split('T')[0]);
    }
  }, [requirement, isOpen]);

  if (!isOpen || !requirement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instrumentId.trim() || !bankName.trim() || !branchName.trim() || !amount || !maturityDate) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid positive amount.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        instrumentId: instrumentId.trim().toUpperCase(),
        instrumentType,
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        amount: amount.trim(),
        maturityDate,
        isJointAccount,
        remarks: remarks.trim() || undefined,
      };

      await apiClient.post(
        `/v1/requirements/${requirement._id || requirement.requirementId}/pledge`,
        payload
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to pledge instrument against requirement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pledge Financial Instrument</h3>
              <p className="text-xs text-slate-500">
                Pledging against mandate <span className="font-semibold text-slate-700">{requirement.requirementId}</span>
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

          {/* Instrument Reference ID & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Instrument Reference ID / FDR No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                required
                placeholder="e.g. FDR-SBI-2026-904"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Instrument Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={instrumentType}
                onChange={(e) => setInstrumentType(e.target.value as InstrumentType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {requirement.acceptableInstrumentTypes.map((type) => (
                  <option key={type} value={type}>
                    {INSTRUMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bank Name & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Issuing Bank Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                placeholder="e.g. State Bank of India"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Branch Name & City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                required
                placeholder="e.g. Guindy Branch, Chennai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Amount & Maturity Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Instrument Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="2000000.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono"
                />
              </div>
              {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
                <p className="mt-1 text-[11px] text-slate-500 font-medium">
                  ₹{Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              )}
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

          {/* Joint Account Checkbox */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <input
              type="checkbox"
              id="jointAccountCheck"
              checked={isJointAccount}
              onChange={(e) => setIsJointAccount(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
            />
            <label htmlFor="jointAccountCheck" className="text-xs text-slate-700 cursor-pointer select-none">
              <span className="font-semibold block text-slate-900">Joint Account with AICTE Mandate</span>
              Confirms that the fixed deposit or guarantee is held jointly in the name of Regional Officer, AICTE and the head of the institution.
            </label>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Remarks & SFMS / Lien Confirmation Reference
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Lien marked in favor of AICTE, SFMS acknowledgment message ref: SFMS-2026-99"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="gap-2">
              <ShieldPlus className="w-4 h-4" />
              Pledge Instrument
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
