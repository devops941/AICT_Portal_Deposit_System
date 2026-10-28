import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  UploadCloud,
  FileText,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Eye,
  Filter,
  Building,
  DollarSign,
  Hash,
  HelpCircle,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';
import { IAiExtraction, AiSearchResult } from './types';
import { OcrReviewModal } from './OcrReviewModal';

export const AiIntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EXTRACTIONS' | 'RISK_FLAGS' | 'SEARCH'>('EXTRACTIONS');
  const [extractions, setExtractions] = useState<IAiExtraction[]>([]);
  const [riskFlags, setRiskFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExtraction, setSelectedExtraction] = useState<IAiExtraction | null>(null);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AiSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Fetch initial extractions & risk flags
  const fetchData = async () => {
    setLoading(true);
    try {
      const [flagsRes] = await Promise.all([
        api.get('/ai/risk-flags').catch(() => ({ data: { data: [] } })),
      ]);
      const flags = Array.isArray(flagsRes.data)
        ? flagsRes.data
        : Array.isArray(flagsRes.data?.data)
        ? flagsRes.data.data
        : Array.isArray(flagsRes)
        ? flagsRes
        : [];
      setRiskFlags(flags);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick prompt buttons
  const sampleQueries = [
    'Show FDRs maturing in the next 30 days.',
    'Show institutions with deposit shortfall.',
    'Show pending release requests.',
    'Show pending verification FDRs',
    'Show FDRs from State Bank of India',
  ];

  const handleRunSearch = async (queryToRun?: string) => {
    const q = (queryToRun || searchQuery).trim();
    if (!q) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await api.post('/ai/search', { query: q });
      if (res.data?.success) {
        setSearchResult(res.data.data);
        setActiveTab('SEARCH');
      }
    } catch (err: any) {
      setSearchError(err.response?.data?.message || 'Failed to execute natural-language search query');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/ai/ocr/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const newExt = res.data.data;
        setExtractions((prev) => [newExt, ...prev]);
        setSelectedExtraction(newExt);
        fetchData(); // refresh risk flags
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to process document with OCR engine');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (conf >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const totalFlags = riskFlags.length;
  const duplicateFlagsCount = riskFlags.filter((f) => f.duplicateRisk?.isDuplicateSuspected).length;
  const mismatchCount = riskFlags.filter((f) => f.comparison?.hasMismatches).length;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI & OCR Document Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provider-independent OCR extraction, statutory classification, form-vs-document comparison, and natural language audit search
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Radar
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Risk & Duplicate Flags</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalFlags}</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Amount / Date Mismatches</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{mismatchCount}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Suspected Duplicates</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">{duplicateFlagsCount}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Hash className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">OCR Engine Status</span>
            <span className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Operational
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Natural Language AI Search Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Natural-Language Search</h3>
          </div>
          <span className="text-xs text-slate-500">Authorized & Tenant-Scoped</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunSearch()}
              placeholder='e.g. "Show FDRs maturing in the next 30 days" or "Show institutions with deposit shortfall"'
              className="w-full text-sm py-3 px-4 pl-11 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <Sparkles className="w-4 h-4 text-indigo-500 absolute left-4 top-3.5" />
          </div>
          <button
            onClick={() => handleRunSearch()}
            disabled={searchLoading || !searchQuery.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Ask AI</span>
          </button>
        </div>

        {/* Suggested Queries Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-400">Try asking:</span>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setSearchQuery(sq);
                handleRunSearch(sq);
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-medium transition-colors border border-slate-200"
            >
              {sq}
            </button>
          ))}
        </div>

        {searchError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Main Tabbed Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 pt-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('EXTRACTIONS')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'EXTRACTIONS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>OCR Scanner & Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('RISK_FLAGS')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'RISK_FLAGS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Duplicate & Discrepancy Radar ({totalFlags})</span>
            </button>
            {searchResult && (
              <button
                onClick={() => setActiveTab('SEARCH')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'SEARCH'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Search Results ({searchResult.totalResults})</span>
              </button>
            )}
          </div>

          {/* Quick Upload Action */}
          <div className="pb-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors">
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Processing OCR...' : 'Scan New Document'}</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {uploadError && (
          <div className="m-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* TAB 1: OCR Extractions */}
        {activeTab === 'EXTRACTIONS' && (
          <div className="p-6">
            {extractions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Documents Uploaded in Current Session</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                  Upload an FDR Certificate, Renewal Advice, or Bank Confirmation PDF/Image to trigger the OCR engine and statutory classification.
                </p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors">
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose File to Scan</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                      <th className="py-3 px-4">Extraction ID</th>
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Bank & FDR #</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Confidence</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {extractions.map((ext) => (
                      <tr key={ext.extractionId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                          {ext.extractionId}
                        </td>
                        <td className="py-3 px-4 text-slate-800">{ext.fileName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {ext.documentClassification?.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="font-semibold text-slate-900">
                            {ext.extractedFields.bankName?.value || '—'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {ext.extractedFields.fdrNumber?.value || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {ext.extractedFields.depositAmount?.value
                            ? `₹${parseFloat(ext.extractedFields.depositAmount.value).toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${getConfidenceColor(
                              ext.overallConfidence
                            )}`}
                          >
                            {ext.overallConfidence}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedExtraction(ext)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-colors border border-indigo-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review & Compare</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Risk Flags & Duplicates */}
        {activeTab === 'RISK_FLAGS' && (
          <div className="p-6">
            {riskFlags.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No Active Risk Flags</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  All scanned certificates match registered values with zero duplicate hash collisions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {riskFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-900">
                          {flag.extractionId}
                        </span>
                        <span className="text-xs text-slate-500">• {flag.fileName}</span>
                        {flag.duplicateRisk?.isDuplicateSuspected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            DUPLICATE SUSPECTED ({flag.duplicateRisk.matchType})
                          </span>
                        )}
                        {flag.comparison?.hasMismatches && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            MISMATCHES ({flag.comparison.mismatches.length})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {flag.duplicateRisk?.details ||
                          flag.comparison?.mismatches?.map((m: any) => m.description).join(' | ')}
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const res = await api.get(`/ai/extractions/${flag.extractionId}`);
                          if (res.data?.success) {
                            setSelectedExtraction(res.data.data);
                          }
                        } catch {
                          // Ignored
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Investigate</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Natural Language Search Results */}
        {activeTab === 'SEARCH' && searchResult && (
          <div className="p-6 space-y-4">
            {/* Interpreted Intent Banner */}
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Interpreted Query Intent
              </div>
              <p className="text-xs text-slate-800 mt-1 font-medium leading-relaxed">
                {searchResult.interpretedIntent}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 font-mono">
                Target Domain: <span className="font-bold text-indigo-700">{searchResult.domain}</span> • Results: {searchResult.totalResults} records
              </div>
            </div>

            {searchResult.results.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                No records matched the filter criteria in {searchResult.domain}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                      <th className="py-3 px-4">Identifier</th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Amount / Due</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {searchResult.results.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                          {item.fdrId || item.requirementId || item.releaseRequestId}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {item.institutionName || item.institutionId}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.bankName || item.requirementTitle || item.requestReason}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.depositAmount || item.requiredAmount || item.requestedAmount
                            ? `₹${parseFloat(
                                item.depositAmount || item.requiredAmount || item.requestedAmount
                              ).toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {item.verificationStatus || item.complianceStatus || item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Side-by-Side Review Modal */}
      {selectedExtraction && (
        <OcrReviewModal
          isOpen={!!selectedExtraction}
          onClose={() => setSelectedExtraction(null)}
          extraction={selectedExtraction}
          onExtractionUpdated={(updated) => {
            setSelectedExtraction(updated);
            setExtractions((prev) =>
              prev.map((e) => (e.extractionId === updated.extractionId ? updated : e))
            );
            fetchData();
          }}
        />
      )}
    </div>
  );
};
