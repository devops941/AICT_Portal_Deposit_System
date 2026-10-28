import React, { useState, useEffect } from 'react';
import {
  X,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Building,
  DollarSign,
  TrendingUp,
  History,
  Check,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  RequirementItem,
  ComplianceCalculationResult,
  REQUIREMENT_TYPE_LABELS,
  INSTRUMENT_TYPE_LABELS,
  COMPLIANCE_STATUS_CONFIG,
} from './types';

interface RequirementDetailsModalProps {
  isOpen: boolean;
  requirementId: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onOpenPledgeModal?: () => void;
}

export const RequirementDetailsModal: React.FC<RequirementDetailsModalProps> = ({
  isOpen,
  requirementId,
  onClose,
  onRefresh,
  onOpenPledgeModal,
}) => {
  const { hasPermission } = useAuth();
  const canVerify = hasPermission('DEPOSITS:VERIFY');
  const canPledge = hasPermission('DEPOSITS:SUBMIT');

  const [activeTab, setActiveTab] = useState<'breakdown' | 'instruments' | 'rules' | 'audit'>('breakdown');
  const [requirement, setRequirement] = useState<RequirementItem | null>(null);
  const [compliance, setCompliance] = useState<ComplianceCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && requirementId) {
      fetchRequirementDetails();
    }
  }, [isOpen, requirementId]);

  const fetchRequirementDetails = async () => {
    if (!requirementId) return;
    setIsLoading(true);
    try {
      const res: any = await apiClient.get(`/v1/requirements/${requirementId}`);
      if (res.data) {
        setRequirement(res.data.requirement);
        setCompliance(res.data.compliance);
      }
    } catch (err) {
      console.error('Error fetching requirement details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !requirementId) return null;

  const handleVerifyInstrument = async (instrumentId: string, verificationStatus: 'VERIFIED' | 'REJECTED') => {
    setActionLoading(instrumentId);
    try {
      await apiClient.patch(`/v1/requirements/${requirementId}/instruments/${instrumentId}/verify`, {
        verificationStatus,
        remarks: verificationStatus === 'VERIFIED' ? 'Verified by authorized official' : 'Rejected during official audit',
      });
      await fetchRequirementDetails();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update instrument status');
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig = compliance
    ? COMPLIANCE_STATUS_CONFIG[compliance.complianceStatus]
    : null;

  // Percentage fulfilled calculation
  const reqAmtNum = compliance ? parseFloat(compliance.requiredAmount) : 1;
  const verifiedAmtNum = compliance ? parseFloat(compliance.eligibleVerifiedDeposit) : 0;
  const percentFulfilled = reqAmtNum > 0 ? Math.min(100, Math.round((verifiedAmtNum / reqAmtNum) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                  {requirement?.requirementId}
                </span>
                {statusConfig && (
                  <Badge variant={statusConfig.badgeVariant}>{statusConfig.label}</Badge>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                {requirement?.title || 'Requirement Details'}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequirementDetails}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh compliance calculation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Shortfall Summary Card */}
        {compliance && (
          <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Required Amount */}
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Required Amount</p>
                <p className="text-2xl font-bold font-mono tracking-tight mt-1 text-white">
                  {compliance.requiredAmountFormatted}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Mandated under {requirement?.applicableRuleReference}</p>
              </div>

              {/* Eligible Verified Deposit */}
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Eligible Verified Deposit</p>
                <p className="text-2xl font-bold font-mono tracking-tight mt-1 text-emerald-400">
                  {compliance.eligibleVerifiedDepositFormatted}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {percentFulfilled}% fulfilled across eligible instruments
                </p>
              </div>

              {/* Outstanding Shortfall */}
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Outstanding Shortfall</p>
                <p
                  className={`text-2xl font-bold font-mono tracking-tight mt-1 ${
                    compliance.isCompliant ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {compliance.outstandingShortfallFormatted}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {compliance.isCompliant
                    ? '100% compliant — No shortfall'
                    : `Formula: max(0, Required - Verified)`}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
                <span>Compliance Fulfillment</span>
                <span>{percentFulfilled}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    percentFulfilled >= 100
                      ? 'bg-emerald-500'
                      : percentFulfilled > 0
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${percentFulfilled}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'breakdown'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Financial & Compliance Breakdown
          </button>
          <button
            onClick={() => setActiveTab('instruments')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'instruments'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Pledged Instruments
            {requirement?.pledgedInstruments && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                {requirement.pledgedInstruments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'rules'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Applicable Rules & Guidelines
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'audit'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Activity & Audit History
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* TAB 1: BREAKDOWN */}
              {activeTab === 'breakdown' && compliance && (
                <div className="space-y-6">
                  {/* Institution & Mandate Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Assigned Institution
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{requirement?.institutionName}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {requirement?.institutionId}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Mandate Timeline & Deadline
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-1">
                        Deadline: {new Date(compliance.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p
                        className={`text-xs font-semibold mt-0.5 ${
                          compliance.isOverdue ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {compliance.daysRemainingOrOverdue < 0
                          ? `${Math.abs(compliance.daysRemainingOrOverdue)} days overdue`
                          : `${compliance.daysRemainingOrOverdue} days remaining`}
                      </p>
                    </div>
                  </div>

                  {/* Summary Breakdown Metrics */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Deposit Composition & Verification
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                        <span className="text-[11px] text-slate-500 font-medium">Total Pledged</span>
                        <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                          {compliance.breakdown.totalPledgedFormatted}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30">
                        <span className="text-[11px] text-emerald-700 font-medium">Verified & Eligible</span>
                        <p className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                          {compliance.breakdown.verifiedEligibleFormatted}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30">
                        <span className="text-[11px] text-indigo-700 font-medium">Pending Verification</span>
                        <p className="text-base font-bold font-mono text-indigo-700 mt-0.5">
                          ₹{Number(compliance.breakdown.pendingVerificationAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30">
                        <span className="text-[11px] text-rose-700 font-medium">Ineligible / Rejected</span>
                        <p className="text-base font-bold font-mono text-rose-700 mt-0.5">
                          ₹{(Number(compliance.breakdown.rejectedAmount) + Number(compliance.breakdown.ineligibleTypeAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Formula Citation */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                    <span className="font-bold text-slate-800 block mb-1">
                      Statutory Compliance Calculation Standard
                    </span>
                    Financial shortfall is computed via exact decimal arithmetic:{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">
                      Shortfall = max(0, Required Amount - Eligible Verified Deposit)
                    </code>
                    . Instruments undergo verification checks against acceptable instrument types, tenure maturity rules, and lien marking.
                  </div>
                </div>
              )}

              {/* TAB 2: PLEDGED INSTRUMENTS */}
              {activeTab === 'instruments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Pledged Instruments</h4>
                      <p className="text-xs text-slate-500">
                        List of Fixed Deposits, Bank Guarantees, and Bonds pledged against this mandate
                      </p>
                    </div>
                    {canPledge && (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (onOpenPledgeModal) onOpenPledgeModal();
                        }}
                        className="gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Pledge Instrument
                      </Button>
                    )}
                  </div>

                  {(!compliance?.breakdown.instruments || compliance.breakdown.instruments.length === 0) ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                      <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No Instruments Pledged Yet</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        This requirement has not received any deposit instruments. Institutions can pledge FDRs or Bank Guarantees.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {compliance.breakdown.instruments.map((inst) => (
                        <div key={inst.instrumentId} className="p-4 bg-white hover:bg-slate-50/50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-800">
                                  #{inst.instrumentId}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                  {INSTRUMENT_TYPE_LABELS[inst.instrumentType]}
                                </span>
                                {inst.isJointAccount && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                                    Joint Mandate
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                {inst.bankName} — {inst.branchName}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Maturity: {new Date(inst.maturityDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-base font-bold font-mono text-slate-900">
                                  {inst.amountFormatted}
                                </p>
                                <div className="mt-0.5">
                                  {inst.verificationStatus === 'VERIFIED' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                                    </span>
                                  )}
                                  {inst.verificationStatus === 'PENDING' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Scrutiny
                                    </span>
                                  )}
                                  {inst.verificationStatus === 'REJECTED' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Official Verification Controls */}
                              {canVerify && inst.verificationStatus === 'PENDING' && (
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionLoading === inst.instrumentId}
                                    onClick={() => handleVerifyInstrument(inst.instrumentId, 'VERIFIED')}
                                    className="h-8 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                  >
                                    Verify
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionLoading === inst.instrumentId}
                                    onClick={() => handleVerifyInstrument(inst.instrumentId, 'REJECTED')}
                                    className="h-8 px-2.5 text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Ineligibility Warning */}
                          {!inst.isEligible && inst.ineligibilityReasons.length > 0 && (
                            <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 mt-0.5" />
                              <div>
                                <span className="font-semibold">Ineligibility Remarks:</span>{' '}
                                {inst.ineligibilityReasons.join('; ')}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RULES & GUIDELINES */}
              {activeTab === 'rules' && (
                <div className="space-y-6">
                  {/* Acceptable Instruments */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                      Acceptable Financial Instruments
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {requirement?.acceptableInstrumentTypes.map((type) => (
                        <div
                          key={type}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800"
                        >
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{INSTRUMENT_TYPE_LABELS[type]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supporting Documents Checklist */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                      Mandatory Supporting Documents
                    </h4>
                    <div className="space-y-2">
                      {requirement?.supportingDocumentRequirements && requirement.supportingDocumentRequirements.length > 0 ? (
                        requirement.supportingDocumentRequirements.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200/80 bg-white text-xs text-slate-700"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{doc}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">No specific supporting documents specified.</p>
                      )}
                    </div>
                  </div>

                  {/* Applicable Business Rules */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                      Business Rules & Lien Mandates
                    </h4>
                    <div className="space-y-2">
                      {requirement?.applicableBusinessRules && requirement.applicableBusinessRules.length > 0 ? (
                        requirement.applicableBusinessRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed"
                          >
                            • {rule}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">Standard AICTE deposit rules apply.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT HISTORY */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Audit Trail & Lifecycle Events
                    </h4>
                    <span className="text-xs text-slate-400">
                      {requirement?.activityHistory.length || 0} events recorded
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {requirement?.activityHistory && requirement.activityHistory.length > 0 ? (
                      requirement.activityHistory.map((item, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary-600 ring-4 ring-white" />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800 font-mono">
                              {item.action}
                            </span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-500">
                              {new Date(item.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <p className="text-slate-600 mt-1 text-xs">{item.details}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              By: {item.performedBy} ({item.performedByEmail})
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No activity history available.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="text-xs text-slate-500">
            Mandate created: {requirement && new Date(requirement.createdAt).toLocaleDateString('en-IN')}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
