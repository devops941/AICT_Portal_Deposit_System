import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { DiscrepancyType, DiscrepancySeverity } from './types';

interface CreateDiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrumentId: string;
  institutionId?: string;
  institutionName?: string;
  onSuccess: () => void;
}

export const CreateDiscrepancyModal: React.FC<CreateDiscrepancyModalProps> = ({
  isOpen,
  onClose,
  instrumentId,
  institutionId,
  institutionName,
  onSuccess,
}) => {
  const [discrepancyType, setDiscrepancyType] = useState<DiscrepancyType>('DOCUMENT_ILLEGIBLE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<DiscrepancySeverity>('HIGH');
  const [assignedTo, setAssignedTo] = useState(institutionName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/v1/discrepancies', {
        instrumentId,
        institutionId,
        discrepancyType,
        title: title.trim(),
        description: description.trim(),
        severity,
        assignedTo: assignedTo.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to raise discrepancy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Log New Discrepancy
              </h2>
              <p className="text-xs text-slate-500">
                Flagging instrument #{instrumentId}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Discrepancy Category
              </label>
              <select
                value={discrepancyType}
                onChange={(e) => setDiscrepancyType(e.target.value as DiscrepancyType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
              >
                <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
                <option value="DATE_INVALID">Date Invalid / Expired</option>
                <option value="NAME_MISMATCH">Account Name Mismatch</option>
                <option value="DOCUMENT_ILLEGIBLE">Document Illegible</option>
                <option value="DUPLICATE_SUSPECT">Duplicate Suspect</option>
                <option value="MISSING_DOCUMENT">Missing Mandatory Document</option>
                <option value="BANK_MISMATCH">Bank Branch Mismatch</option>
                <option value="OTHER">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as DiscrepancySeverity)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
              >
                <option value="LOW">Low (Minor Non-Critical)</option>
                <option value="MEDIUM">Medium (Rectification Required)</option>
                <option value="HIGH">High (Statutory Requirement)</option>
                <option value="CRITICAL">Critical (Blocks Compliance)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Discrepancy Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bank Manager Seal Missing on FDR Advice"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Specific Finding & Remarks
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the specific deficiency observed during officer scrutiny..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Desk / Entity for Rectification
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Institution Name or Desk"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-800"
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
              className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Raising Discrepancy...' : 'Raise Discrepancy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
