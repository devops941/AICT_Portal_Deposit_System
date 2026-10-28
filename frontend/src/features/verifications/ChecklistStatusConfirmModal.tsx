import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';

export interface ChecklistStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    itemKey: string,
    status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE',
    remarks?: string
  ) => void;
  itemIndex?: number;
  itemKey: string;
  itemLabel: string;
  targetStatus: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
  currentStatus?: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'PENDING';
  initialRemarks?: string;
}

export const ChecklistStatusConfirmModal: React.FC<ChecklistStatusConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemIndex,
  itemKey,
  itemLabel,
  targetStatus,
  currentStatus = 'PENDING',
  initialRemarks = '',
}) => {
  const [remarks, setRemarks] = useState(initialRemarks);

  // Sync initialRemarks whenever the modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      setRemarks(initialRemarks || '');
    }
  }, [isOpen, initialRemarks, itemKey]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(itemKey, targetStatus, remarks.trim());
    onClose();
  };

  const isPass = targetStatus === 'PASS';
  const isFail = targetStatus === 'FAIL';
  const isNA = targetStatus === 'NOT_APPLICABLE';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Dynamic Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isPass
              ? 'bg-emerald-50/80 border-emerald-100'
              : isFail
              ? 'bg-rose-50/80 border-rose-100'
              : 'bg-slate-100/80 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isPass
                  ? 'bg-emerald-100 text-emerald-700'
                  : isFail
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isPass && <CheckCircle2 className="w-5 h-5" />}
              {isFail && <AlertTriangle className="w-5 h-5" />}
              {isNA && <HelpCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Confirm Checklist Decision
              </h2>
              <p className="text-xs text-slate-500">
                {isPass
                  ? 'Mark criterion as COMPLIANT (PASS)'
                  : isFail
                  ? 'Flag criterion as NON-COMPLIANT (FAIL)'
                  : 'Mark criterion as NOT APPLICABLE (N/A)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Target Item Details */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                {itemIndex ?? '#'}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Statutory Point {itemIndex ?? ''}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">
              {itemLabel}
            </p>
          </div>

          {/* Status Change Indicator */}
          <div className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Current:</span>
              <span className="font-semibold text-slate-700 uppercase">
                {currentStatus}
              </span>
            </div>
            <span className="text-slate-400 font-bold">➔</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">New Decision:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isPass
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : isFail
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-slate-200 border-slate-400 text-slate-800'
                }`}
              >
                {isPass ? '✓ PASS' : isFail ? '✕ FAIL' : '— N/A'}
              </span>
            </div>
          </div>

          {/* Prompt Question */}
          <p className="text-xs text-slate-600 font-medium">
            Are you sure you want to mark this compliance point as{' '}
            <strong
              className={
                isPass
                  ? 'text-emerald-700'
                  : isFail
                  ? 'text-rose-700'
                  : 'text-slate-800'
              }
            >
              {targetStatus === 'NOT_APPLICABLE' ? 'N/A' : targetStatus}
            </strong>
            ?
          </p>

          {isFail && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Failing any checklist item will prevent final
                verification endorsement until resolved or clarified.
              </span>
            </div>
          )}

          {/* Optional Remarks input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Verification Remarks / Notes (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              placeholder={
                isFail
                  ? 'Enter reason for statutory failure...'
                  : 'Add optional verification observation...'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Modal Actions: No / Yes */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <X className="w-4 h-4 text-slate-500" />
            No, Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 ${
              isPass
                ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20'
                : isFail
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-500/20'
                : 'bg-slate-800 hover:bg-slate-900 focus:ring-2 focus:ring-slate-500/20'
            }`}
          >
            <Check className="w-4 h-4" />
            {isPass ? 'Yes, Mark as Pass' : isFail ? 'Yes, Mark as Fail' : 'Yes, Mark as N/A'}
          </button>
        </div>
      </div>
    </div>
  );
};
