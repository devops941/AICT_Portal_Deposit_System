import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  GitCommit,
  FileCheck,
  History,
  Lock,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { RenewalItem, LineageNode, ReplacementLineageResponse } from './types';

interface RenewalDetailsModalProps {
  renewalId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const RenewalDetailsModal: React.FC<RenewalDetailsModalProps> = ({
  renewalId,
  onClose,
  onUpdated,
}) => {
  const { user } = useAuth();
  const [renewal, setRenewal] = useState<RenewalItem | null>(null);
  const [previousFdr, setPreviousFdr] = useState<any>(null);
  const [replacementFdr, setReplacementFdr] = useState<any>(null);
  const [lineage, setLineage] = useState<ReplacementLineageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'LINEAGE' | 'HISTORY'>('DETAILS');

  // Approval state
  const [approvalRemarks, setApprovalRemarks] = useState(
    'Replacement FDR verified against AICTE deposit norms. Amount, joint clause, and validity tenure confirmed.'
  );
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (renewalId) {
      setRenewal(null);
      setPreviousFdr(null);
      setReplacementFdr(null);
      setLineage(null);
      fetchRenewalDetails();
    }
  }, [renewalId]);

  const fetchRenewalDetails = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res: any = await api.get(`/renewals/${renewalId}`);
      const data = res?.data || res;
      if (data) {
        const ren = data.renewal || data;
        const prev = data.previousFdr;
        const rep = data.replacementFdr;

        if (ren) {
          if (!ren.originalAmountFormatted) {
            ren.originalAmountFormatted =
              data.originalAmountFormatted ||
              (ren.originalAmount?.$numberDecimal
                ? `₹${Number(ren.originalAmount.$numberDecimal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : '₹0.00');
          }
          if (!ren.replacementAmountFormatted) {
            ren.replacementAmountFormatted =
              data.replacementAmountFormatted ||
              (ren.replacementDetails?.depositAmount?.$numberDecimal
                ? `₹${Number(ren.replacementDetails.depositAmount.$numberDecimal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : null);
          }
        }

        setRenewal(ren);
        setPreviousFdr(prev);
        setReplacementFdr(rep);

        // Fetch replacement lineage
        const targetId = ren?.replacementInstrumentId || ren?.previousInstrumentId;
        if (targetId) {
          try {
            const linRes: any = await api.get(`/renewals/lineage/${targetId}`);
            const linData = linRes?.data || linRes;
            setLineage(linData || null);
          } catch (e) {
            console.error('Lineage fetch failed', e);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load renewal details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!renewalId) return null;

  const isOfficer =
    user?.userType === 'ADMIN' ||
    user?.roles?.includes('SYSTEM_ADMINISTRATOR') ||
    user?.roles?.includes('APPROVING_AUTHORITY') ||
    user?.roles?.includes('SENIOR_VERIFICATION_OFFICER') ||
    user?.roles?.includes('VERIFICATION_OFFICER') ||
    user?.roles?.includes('AICTE_OFFICER');

  const handleApprove = async () => {
    if (!approvalRemarks.trim()) {
      setErrorMessage('Approval remarks are required');
      return;
    }

    setIsSubmittingApproval(true);
    setErrorMessage(null);
    try {
      await api.post(`/renewals/${renewalId}/approve`, {
        remarks: approvalRemarks.trim(),
      });
      setSuccessMessage('Renewal approved successfully! Replacement FDR is now ACTIVE.');
      setTimeout(() => {
        onUpdated();
        fetchRenewalDetails();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to approve renewal');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Renewal Request #{renewal?.renewalId || renewalId}
                </h2>
                {renewal && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      renewal.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : renewal.status === 'SUBMITTED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {renewal.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {renewal?.institutionName} ({renewal?.institutionId})
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

        {/* Tab Header */}
        <div className="flex border-b border-slate-100 px-6 gap-6 bg-slate-50/40">
          <button
            onClick={() => setActiveTab('DETAILS')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'DETAILS'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Side-by-Side Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('LINEAGE')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'LINEAGE'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>Replacement Lineage</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'HISTORY'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail ({renewal?.history?.length || 0})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[650px] overflow-y-auto space-y-6 bg-white min-h-[360px]">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-500">
              <RotateCcw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading statutory inspection records...</p>
              <p className="text-xs text-slate-400 mt-1">Retrieving predecessor & replacement instruments</p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* TAB 1: COMPARISON */}
              {activeTab === 'DETAILS' && renewal && (
                <div className="space-y-6">
              {/* Reason card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Renewal Justification
                </div>
                <div className="text-xs text-slate-800 mt-1 font-medium">{renewal.renewalReason}</div>
                <div className="text-[10px] text-slate-500 mt-2 font-mono">
                  Requested By: {renewal.requestedBy} ({renewal.requestedByEmail}) on{' '}
                  {new Date(renewal.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Side-by-side cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PREDECESSOR INSTRUMENT */}
                <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Predecessor Instrument
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Lock className="w-3 h-3 text-amber-600" /> Preserved Immutable
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Certificate #</div>
                      <div className="text-sm font-mono font-bold text-slate-900">
                        {renewal.originalFdrNumber}
                      </div>
                      <div className="text-[10px] text-indigo-600 font-mono font-medium">
                        {renewal.previousInstrumentId}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Depository Bank</div>
                      <div className="text-xs font-semibold text-slate-800">
                        {renewal.originalBankName}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Original Amount</div>
                      <div className="text-sm font-bold text-emerald-700">
                        {renewal.originalAmountFormatted}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Maturity Date</div>
                      <div className="text-xs font-mono font-semibold text-slate-700">
                        {new Date(renewal.originalMaturityDate).toLocaleDateString()}
                      </div>
                    </div>

                    {previousFdr && (
                      <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                        Lifecycle Status:{' '}
                        <span className="text-amber-700 font-bold">
                          {previousFdr.lifecycleStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* REPLACEMENT INSTRUMENT */}
                <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Replacement Instrument
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {renewal.status === 'APPROVED' ? 'Active Replacement' : 'Proposed'}
                    </span>
                  </div>

                  {renewal.replacementDetails ? (
                    <div className="space-y-2 pt-1">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Certificate #</div>
                        <div className="text-sm font-mono font-bold text-indigo-700">
                          {renewal.replacementDetails.fdrNumber}
                        </div>
                        {renewal.replacementInstrumentId && (
                          <div className="text-[10px] text-emerald-700 font-mono font-medium">
                            {renewal.replacementInstrumentId}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Depository Bank & Branch</div>
                        <div className="text-xs font-semibold text-slate-800">
                          {renewal.replacementDetails.bankName} (
                          {renewal.replacementDetails.bankBranch})
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Deposit Amount</div>
                        <div className="text-sm font-bold text-emerald-700">
                          {renewal.replacementAmountFormatted}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-slate-500 font-medium">Issue Date</div>
                          <div className="text-xs font-mono font-semibold text-slate-700">
                            {new Date(renewal.replacementDetails.issueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-medium">Maturity Date</div>
                          <div className="text-xs font-mono font-semibold text-slate-700">
                            {new Date(renewal.replacementDetails.maturityDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-indigo-100 flex items-center gap-4 text-[10px] text-indigo-700 font-medium">
                        <span>Joint: {renewal.replacementDetails.isJointAccount ? 'Yes' : 'No'}</span>
                        <span>Auto-Renewal: {renewal.replacementDetails.autoRenewal ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No replacement FDR details submitted yet. Renewal is currently in DRAFT status.
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Box for Scrutiny Officers */}
              {isOfficer && (renewal.status === 'SUBMITTED' || renewal.status === 'UNDER_REVIEW') && (
                <div className="p-5 bg-indigo-50/40 border border-indigo-200 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Officer Verification & Statutory Approval
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Approving this renewal will officially create the Replacement FDR, supersede the
                    predecessor instrument while strictly preserving its original financial record,
                    and recalculate deposit requirement compliance.
                  </p>

                  <div>
                    <label className="text-[11px] text-slate-700 font-semibold block mb-1">
                      Approval Remarks / Verification Findings *
                    </label>
                    <textarea
                      rows={2}
                      value={approvalRemarks}
                      onChange={(e) => setApprovalRemarks(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleApprove}
                      disabled={isSubmittingApproval}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmittingApproval ? 'Processing...' : 'Approve & Activate Renewal'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LINEAGE */}
          {activeTab === 'LINEAGE' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Full Statutory Replacement Lineage
              </h3>

              {lineage ? (
                <div className="space-y-3">
                  {/* Ancestors */}
                  {lineage.ancestors.map((node, idx) => (
                    <div
                      key={node.fdrId}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {node.fdrNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                            Predecessor #{idx + 1}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {node.bankName} • {node.depositAmountFormatted} • Maturing:{' '}
                          {new Date(node.maturityDate).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-amber-700 font-bold">
                        {node.lifecycleStatus}
                      </span>
                    </div>
                  ))}

                  {/* Arrow Indicator */}
                  {lineage.ancestors.length > 0 && (
                    <div className="flex justify-center text-indigo-600">
                      <ArrowRight className="w-5 h-5 rotate-90" />
                    </div>
                  )}

                  {/* Current / Target Node */}
                  <div className="p-4 bg-indigo-50/80 border-2 border-indigo-500 rounded-xl flex items-center justify-between shadow-md shadow-indigo-500/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-indigo-950">
                          {lineage.currentInstrument.fdrNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                          Active Target
                        </span>
                      </div>
                      <div className="text-xs text-indigo-900 mt-1 font-medium">
                        {lineage.currentInstrument.bankName} •{' '}
                        {lineage.currentInstrument.depositAmountFormatted} • Maturing:{' '}
                        {new Date(lineage.currentInstrument.maturityDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-700 font-bold">
                      {lineage.currentInstrument.lifecycleStatus}
                    </span>
                  </div>

                  {/* Successors */}
                  {lineage.successors.map((node) => (
                    <div
                      key={node.fdrId}
                      className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {node.fdrNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Subsequent Replacement
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {node.bankName} • {node.depositAmountFormatted}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 font-bold">
                        {node.lifecycleStatus}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Loading replacement lineage...
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT HISTORY */}
          {activeTab === 'HISTORY' && renewal && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Immutable Lifecycle Log
              </h3>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {renewal.history.map((log, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{log.action}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700">{log.details}</div>
                      <div className="text-[10px] text-slate-500">
                        By: {log.performedBy} ({log.performedByEmail})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </div>
  );
};
