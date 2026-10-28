import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { EligibilityAssessmentData } from './types';

interface CreateReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialInstrumentId?: string;
  initialFdrNumber?: string;
}

export const CreateReleaseModal: React.FC<CreateReleaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialInstrumentId = '',
  initialFdrNumber = '',
}) => {
  const [instrumentId, setInstrumentId] = useState(initialInstrumentId);
  const [fdrNumberDisplay, setFdrNumberDisplay] = useState(initialFdrNumber);
  const [requestReason, setRequestReason] = useState(
    'Fulfillment of academic program deposit term and statutory lock-in obligations. Requesting final discharge and refund.'
  );
  const [requestedAmount, setRequestedAmount] = useState('');
  const [docRefInput, setDocRefInput] = useState('DOC-REL-NODUES-01, DOC-COUNCIL-CLEARANCE');

  // Eligibility Check state
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<EligibilityAssessmentData | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialInstrumentId) {
      setInstrumentId(initialInstrumentId);
      runEligibilityCheck(initialInstrumentId);
    }
    if (initialFdrNumber) {
      setFdrNumberDisplay(initialFdrNumber);
    }
  }, [initialInstrumentId, initialFdrNumber]);

  if (!isOpen) return null;

  const runEligibilityCheck = async (targetId?: string) => {
    const idToAssess = (targetId || instrumentId).trim();
    if (!idToAssess) {
      setEligibilityError('Please enter an Instrument ID to evaluate release eligibility');
      return;
    }

    setIsCheckingEligibility(true);
    setEligibilityError(null);
    try {
      const res = await api.get(`/releases/eligibility/${idToAssess}`);
      if (res.data?.data) {
        setEligibilityData(res.data.data);
        if (!requestedAmount && res.data.data.instrumentSummary?.depositAmountFormatted) {
          // Pre-fill amount
          setFdrNumberDisplay(res.data.data.instrumentSummary.fdrNumber);
        }
      }
    } catch (err: any) {
      setEligibilityError(
        err.response?.data?.message || 'Could not verify eligibility for this instrument.'
      );
      setEligibilityData(null);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!instrumentId.trim()) {
      setErrorMessage('Instrument ID is required');
      return;
    }

    if (!requestReason.trim()) {
      setErrorMessage('Request reason is required');
      return;
    }

    if (eligibilityData && !eligibilityData.isEligible && eligibilityData.blockingReasons.length > 0) {
      setErrorMessage(
        `Cannot submit: Instrument is blocked by statutory rules: ${eligibilityData.blockingReasons.join(
          '; '
        )}`
      );
      return;
    }

    setIsLoading(true);
    try {
      const docs = docRefInput
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      await api.post('/releases', {
        instrumentId: instrumentId.trim(),
        requestReason: requestReason.trim(),
        requestedAmount: requestedAmount.trim() || undefined,
        supportingDocuments: docs,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit release request. Please try again.'
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
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Create Deposit Release Request
              </h2>
              <p className="text-xs text-slate-500">
                Statutory deposit discharge, refund assessment & council sanction
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

          {/* Instrument Target Selection */}
          <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-3">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" /> Target Security Deposit Instrument
              </span>
              <button
                type="button"
                onClick={() => runEligibilityCheck()}
                disabled={isCheckingEligibility || !instrumentId.trim()}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                {isCheckingEligibility ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Check Eligibility</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                  Instrument ID / Reference *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. FDR-2026-INST-ANNA-001-..."
                    value={instrumentId}
                    onChange={(e) => setInstrumentId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => runEligibilityCheck()}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs"
                    title="Assess eligibility"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                  Certificate / FDR Number
                </label>
                <input
                  type="text"
                  readOnly
                  value={fdrNumberDisplay || 'Will auto-detect on check'}
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Eligibility Assessment Card */}
          {eligibilityError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{eligibilityError}</span>
            </div>
          )}

          {eligibilityData && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      eligibilityData.isEligible ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-900">
                    Eligibility Score: {eligibilityData.eligibilityScore} / 100
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    eligibilityData.isEligible
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {eligibilityData.isEligible ? 'ELIGIBLE TO REQUEST' : 'BLOCKERS DETECTED'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    eligibilityData.isEligible ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${eligibilityData.eligibilityScore}%` }}
                />
              </div>

              {/* Checks checklist */}
              <div className="space-y-1.5 pt-1">
                {eligibilityData.checks.map((chk) => (
                  <div
                    key={chk.checkKey}
                    className="flex items-start gap-2 text-[11px] leading-tight"
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : chk.severity === 'BLOCKER' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={
                        chk.passed
                          ? 'text-slate-700'
                          : chk.severity === 'BLOCKER'
                          ? 'text-rose-700 font-bold'
                          : 'text-amber-700 font-semibold'
                      }
                    >
                      {chk.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requested Amount */}
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              Requested Release Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Leave blank for full deposit release"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Optional: Leave blank to request the full principal amount of the deposit certificate.
            </span>
          </div>

          {/* Request Reason */}
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              Justification & Statutory Release Reason *
            </label>
            <textarea
              required
              rows={2}
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
            />
          </div>

          {/* Supporting Documents */}
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              Supporting Document References
            </label>
            <input
              type="text"
              placeholder="Comma-separated document IDs (e.g. DOC-NODUES-01, DOC-COUNCIL-02)"
              value={docRefInput}
              onChange={(e) => setDocRefInput(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Attach No-Dues Certificate, Governing Body Resolution, or Bank Release verification references.
            </span>
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
              disabled={isLoading || (eligibilityData?.isEligible === false && eligibilityData?.blockingReasons?.length > 0)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isLoading ? 'Submitting...' : 'Submit Release Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
