import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import { FdrItem } from './types';

interface EditFdrModalProps {
  isOpen: boolean;
  fdr: FdrItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditFdrModal: React.FC<EditFdrModalProps> = ({
  isOpen,
  fdr,
  onClose,
  onSuccess,
}) => {
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [fdrNumber, setFdrNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [isJointAccount, setIsJointAccount] = useState(true);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [interestRate, setInterestRate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fdr) {
      setBankName(fdr.bankName);
      setBankBranch(fdr.bankBranch);
      setFdrNumber(fdr.fdrNumber);
      setHolderName(fdr.holderName);

      const amt =
        typeof fdr.depositAmount === 'object' && fdr.depositAmount !== null
          ? (fdr.depositAmount as any).$numberDecimal || '0'
          : String(fdr.depositAmount || '0');
      setDepositAmount(amt);

      if (fdr.issueDate) setIssueDate(fdr.issueDate.split('T')[0]);
      if (fdr.maturityDate) setMaturityDate(fdr.maturityDate.split('T')[0]);
      setIsJointAccount(fdr.isJointAccount);
      setAutoRenewal(fdr.autoRenewal);
      setInterestRate(fdr.interestRate ? String(fdr.interestRate) : '');
      setRemarks(fdr.remarks || '');
      setError(null);
    }
  }, [fdr]);

  if (!isOpen || !fdr) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !bankBranch.trim() || !fdrNumber.trim() || !holderName.trim() || !depositAmount) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please provide a valid positive deposit amount.');
      return;
    }

    if (new Date(maturityDate).getTime() <= new Date(issueDate).getTime()) {
      setError('Maturity date must be after the issue date.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        bankName: bankName.trim(),
        bankBranch: bankBranch.trim(),
        fdrNumber: fdrNumber.trim().toUpperCase(),
        holderName: holderName.trim(),
        depositAmount: depositAmount.trim(),
        issueDate,
        maturityDate,
        isJointAccount,
        autoRenewal,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        remarks: remarks.trim() || undefined,
      };

      await apiClient.patch(`/v1/fdrs/${fdr._id || fdr.fdrId}`, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update FDR record');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                {fdr.fdrId}
              </span>
              <h3 className="text-base font-bold text-slate-900">Edit Draft Deposit Record</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned to: {fdr.institutionName} ({fdr.institutionId})
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bank Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Branch Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Certificate Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fdrNumber}
                onChange={(e) => setFdrNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Deposit Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deposit Holder Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
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
