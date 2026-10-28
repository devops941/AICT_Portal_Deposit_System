import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';

interface CreateRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialInstrumentId?: string;
  initialFdrNumber?: string;
}

export const CreateRenewalModal: React.FC<CreateRenewalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialInstrumentId = '',
  initialFdrNumber = '',
}) => {
  const [previousInstrumentId, setPreviousInstrumentId] = useState(initialInstrumentId);
  const [fdrNumberDisplay, setFdrNumberDisplay] = useState(initialFdrNumber);
  const [renewalReason, setRenewalReason] = useState(
    'Maturity approaching. Submitting fresh replacement instrument as mandated by AICTE security deposit regulations.'
  );

  // Toggle providing replacement details immediately
  const [provideReplacement, setProvideReplacement] = useState(false);

  // Replacement Form Fields
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [repFdrNumber, setRepFdrNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [interestRate, setInterestRate] = useState<number | ''>('');
  const [isJointAccount, setIsJointAccount] = useState(true);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [remarks, setRemarks] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialInstrumentId) {
      setPreviousInstrumentId(initialInstrumentId);
    }
    if (initialFdrNumber) {
      setFdrNumberDisplay(initialFdrNumber);
    }
  }, [initialInstrumentId, initialFdrNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!previousInstrumentId.trim()) {
      setErrorMessage('Previous Instrument ID is required');
      return;
    }

    if (!renewalReason.trim()) {
      setErrorMessage('Renewal reason is required');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        previousInstrumentId: previousInstrumentId.trim(),
        renewalReason: renewalReason.trim(),
      };

      if (provideReplacement) {
        if (!bankName.trim() || !bankBranch.trim() || !repFdrNumber.trim() || !depositAmount || !issueDate || !maturityDate) {
          setErrorMessage('Please fill in all required replacement FDR fields');
          setIsLoading(false);
          return;
        }

        payload.replacementDetails = {
          instrumentType: 'FDR',
          bankName: bankName.trim(),
          bankBranch: bankBranch.trim(),
          fdrNumber: repFdrNumber.trim(),
          holderName: holderName.trim() || 'Institution & AICTE Joint Account',
          depositAmount: depositAmount.trim(),
          issueDate: new Date(issueDate).toISOString(),
          maturityDate: new Date(maturityDate).toISOString(),
          isJointAccount,
          autoRenewal,
          interestRate: interestRate !== '' ? Number(interestRate) : undefined,
          remarks: remarks.trim() || undefined,
        };
      }

      await api.post('/renewals', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to initiate renewal request. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Initiate FDR Renewal Request
              </h2>
              <p className="text-xs text-slate-500">
                Replace an expiring or matured security deposit instrument
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Previous Instrument Details */}
          <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-3">
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Target Predecessor Instrument</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                  Previous Instrument ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FDR-2026-INST-ANNA-001-..."
                  value={previousInstrumentId}
                  onChange={(e) => setPreviousInstrumentId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                  FDR / Certificate Number
                </label>
                <input
                  type="text"
                  readOnly
                  value={fdrNumberDisplay || 'Will link from Instrument ID'}
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Renewal Reason */}
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              Statutory Reason for Renewal *
            </label>
            <textarea
              required
              rows={2}
              value={renewalReason}
              onChange={(e) => setRenewalReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
            />
          </div>

          {/* Replacement Instrument Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setProvideReplacement(!provideReplacement)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={provideReplacement}
                  onChange={(e) => setProvideReplacement(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Upload & Extract Replacement FDR Now
                  </div>
                  <div className="text-[11px] text-slate-500">
                    If unchecked, renewal will be saved as Draft
                  </div>
                </div>
              </div>
              {provideReplacement ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {provideReplacement && (
              <div className="p-4 border-t border-slate-200 space-y-3 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main Branch"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      New FDR Certificate # *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SBI-2026-FDR-88912"
                      value={repFdrNumber}
                      onChange={(e) => setRepFdrNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      Deposit Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 500000.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      New Issue Date *
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">
                      New Maturity Date *
                    </label>
                    <input
                      type="date"
                      value={maturityDate}
                      onChange={(e) => setMaturityDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isJointAccount}
                      onChange={(e) => setIsJointAccount(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                    />
                    <span>Joint Account with AICTE</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRenewal}
                      onChange={(e) => setAutoRenewal(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                    />
                    <span>Auto-Renewal Clause Included</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {isLoading
                  ? 'Processing...'
                  : provideReplacement
                  ? 'Submit Renewal with Replacement'
                  : 'Save Renewal Draft'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
