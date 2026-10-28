import React, { useState, useEffect } from 'react';
import { X, Building2, Landmark, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../services/apiClient';
import {
  InstitutionComplianceSummary,
  COMPLIANCE_STATUS_CONFIG,
  REQUIREMENT_TYPE_LABELS,
} from './types';

interface InstitutionComplianceModalProps {
  isOpen: boolean;
  institutionId: string | null;
  institutionName?: string;
  onClose: () => void;
}

export const InstitutionComplianceModal: React.FC<InstitutionComplianceModalProps> = ({
  isOpen,
  institutionId,
  institutionName,
  onClose,
}) => {
  const [summary, setSummary] = useState<InstitutionComplianceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && institutionId) {
      fetchSummary();
    }
  }, [isOpen, institutionId]);

  const fetchSummary = async () => {
    if (!institutionId) return;
    setIsLoading(true);
    try {
      const res: any = await apiClient.get(`/v1/requirements/institution/${institutionId}/compliance`);
      if (res.data) {
        setSummary(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch institution compliance summary', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !institutionId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                  {institutionId}
                </span>
                <span className="text-xs text-slate-500 font-medium">Institution Compliance Details</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {summary?.institutionName || institutionName || institutionId}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : summary ? (
            <>
              {/* Financial Aggregate Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total Required
                  </span>
                  <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {summary.totalRequiredFormatted}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Across {summary.totalRequirements} mandates</p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                    Eligible Verified
                  </span>
                  <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    {summary.totalEligibleFormatted}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Cleared through official scrutiny</p>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/20">
                  <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                    Total Shortfall
                  </span>
                  <p className="text-xl font-bold font-mono text-rose-700 mt-1">
                    {summary.totalShortfallFormatted}
                  </p>
                  <p className="text-[11px] text-rose-600 mt-0.5">Formula: max(0, Required - Verified)</p>
                </div>

                <div className="p-4 rounded-xl border border-primary-200 bg-primary-50/30">
                  <span className="text-[11px] font-semibold text-primary-700 uppercase tracking-wider">
                    Compliance Rate
                  </span>
                  <p className="text-xl font-bold font-mono text-primary-700 mt-1">
                    {summary.overallComplianceRate}%
                  </p>
                  <p className="text-[11px] text-primary-600 mt-0.5">
                    {summary.compliantCount} of {summary.totalRequirements} requirements compliant
                  </p>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  {summary.compliantCount} Compliant
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  {summary.partiallyCompliantCount} Partially Compliant
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  {summary.underReviewCount} Under Review
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                  {summary.overdueCount} Overdue
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                  {summary.notSubmittedCount} Not Submitted
                </span>
              </div>

              {/* Requirements Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Deposit Mandates Breakdown
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Mandate ID</th>
                        <th className="py-3 px-4">Required</th>
                        <th className="py-3 px-4">Verified Deposit</th>
                        <th className="py-3 px-4">Shortfall</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {summary.requirements.map((req) => {
                        const cfg = COMPLIANCE_STATUS_CONFIG[req.complianceStatus];
                        return (
                          <tr key={req.requirementId} className="hover:bg-slate-50/60">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-slate-800">
                                {req.requirementId}
                              </span>
                              <span className="block text-[11px] text-slate-400 mt-0.5">
                                Deadline: {new Date(req.deadline).toLocaleDateString('en-IN')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                              {req.requiredAmountFormatted}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                              {req.eligibleVerifiedDepositFormatted}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-rose-600">
                              {req.outstandingShortfallFormatted}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center py-8 text-xs text-slate-500">No compliance data available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/60">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
