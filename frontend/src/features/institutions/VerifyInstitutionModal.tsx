import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import { InstitutionItem, VerificationStatus } from './types';

interface VerifyInstitutionModalProps {
  institution: InstitutionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VerifyInstitutionModal: React.FC<VerifyInstitutionModalProps> = ({
  institution,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    institution?.verificationStatus || 'VERIFIED'
  );
  const [remarks, setRemarks] = useState(institution?.verificationRemarks || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await apiClient.patch(`/v1/institutions/${institution.id}/verify`, {
        verificationStatus,
        remarks: remarks.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update verification status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!institution) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Institution Compliance"
      description={`Scrutiny certification for ${institution.name} [${institution.code}]`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {errorMessage}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-slate-700">Verification Outcome</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVerificationStatus('VERIFIED')}
              className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Certified &amp; Verified</span>
            </button>

            <button
              type="button"
              onClick={() => setVerificationStatus('UNDER_SCRUTINY')}
              className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                verificationStatus === 'UNDER_SCRUTINY'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Under Scrutiny</span>
            </button>

            <button
              type="button"
              onClick={() => setVerificationStatus('PENDING')}
              className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                verificationStatus === 'PENDING'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Pending Review</span>
            </button>

            <button
              type="button"
              onClick={() => setVerificationStatus('REJECTED')}
              className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                verificationStatus === 'REJECTED'
                  ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Reject / Deficient</span>
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-700">Official Scrutiny Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Compliance notes, document validation findings, or deficiency reasons..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            required={verificationStatus === 'REJECTED'}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            Submit Decision
          </Button>
        </div>
      </form>
    </Modal>
  );
};
