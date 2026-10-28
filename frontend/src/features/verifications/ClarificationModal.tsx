import React, { useState } from 'react';
import { X, MessageSquareQuote } from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrumentId: string;
  institutionName?: string;
  onSuccess: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  isOpen,
  onClose,
  instrumentId,
  institutionName,
  onSuccess,
}) => {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Clarification query is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/v1/verifications/${instrumentId}/clarification`, {
        query: query.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue clarification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-purple-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Request Clarification from Institution
              </h2>
              <p className="text-xs text-slate-500">
                Instrument #{instrumentId} — {institutionName}
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

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            ⚠️ <strong>Notice:</strong> Requesting clarification will change the record status to{' '}
            <span className="font-semibold">RETURNED_FOR_CORRECTION</span> and allow the institution
            to resubmit their document proofs without losing previous submission history.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Clarification Query & Instructions
            </label>
            <textarea
              rows={4}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Clearly state the missing document, unclear ledger endorsement, or discrepancy that requires rectification by the institution..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none text-slate-800"
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
              className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Issuing...' : 'Return For Clarification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
