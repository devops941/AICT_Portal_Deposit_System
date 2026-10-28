import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { DiscrepancyItem } from './types';

interface ResolveDiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  discrepancy: DiscrepancyItem | null;
  onSuccess: () => void;
}

export const ResolveDiscrepancyModal: React.FC<ResolveDiscrepancyModalProps> = ({
  isOpen,
  onClose,
  discrepancy,
  onSuccess,
}) => {
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'WAIVED'>('RESOLVED');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !discrepancy) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionRemarks.trim()) {
      setError('Resolution remarks are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.patch(`/v1/discrepancies/${discrepancy.discrepancyId || discrepancy._id}/resolve`, {
        resolutionStatus,
        resolutionRemarks: resolutionRemarks.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update resolution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Resolve Discrepancy
              </h2>
              <p className="text-xs text-slate-500">
                #{discrepancy.discrepancyId} — {discrepancy.title}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Resolution Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResolutionStatus('RESOLVED')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                  resolutionStatus === 'RESOLVED'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ✓ Mark Resolved
              </button>
              <button
                type="button"
                onClick={() => setResolutionStatus('WAIVED')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                  resolutionStatus === 'WAIVED'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-500/20 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ⚖ Official Waiver
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Resolution Remarks / Justification
            </label>
            <textarea
              rows={3}
              value={resolutionRemarks}
              onChange={(e) => setResolutionRemarks(e.target.value)}
              placeholder="Detail how the discrepancy was rectified or statutory waiver reference..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
