import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  FileText,
  Users,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  InstitutionItem,
  InstitutionUser,
  INSTITUTION_TYPE_LABELS,
} from './types';

interface InstitutionDetailsModalProps {
  institution: InstitutionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onOpenVerify: (institution: InstitutionItem) => void;
}

export const InstitutionDetailsModal: React.FC<InstitutionDetailsModalProps> = ({
  institution,
  isOpen,
  onClose,
  onUpdate,
  onOpenVerify,
}) => {
  const { hasPermission } = useAuth();
  const canVerify = hasPermission('INSTITUTIONS:VERIFY');
  const canUpdate = hasPermission('INSTITUTIONS:UPDATE');

  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'verification' | 'users' | 'history'>('profile');
  const [users, setUsers] = useState<InstitutionUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Add Document state
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docType, setDocType] = useState('AICTE_APPROVAL_LETTER');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [docRemarks, setDocRemarks] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  useEffect(() => {
    if (institution && isOpen) {
      if (activeTab === 'users') {
        fetchUsers();
      }
    }
  }, [institution, isOpen, activeTab]);

  const fetchUsers = async () => {
    if (!institution) return;
    setIsLoadingUsers(true);
    try {
      const res: any = await apiClient.get(`/v1/institutions/${institution.id}/users`);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load institution users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution) return;
    setIsSubmittingDoc(true);

    try {
      await apiClient.post(`/v1/institutions/${institution.id}/documents`, {
        documentType: docType,
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        remarks: docRemarks.trim() || undefined,
      });

      setIsAddingDoc(false);
      setFileName('');
      setFileUrl('');
      setDocRemarks('');
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to register document');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  if (!institution) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={institution.name}
      description={`Code: ${institution.code} • ${INSTITUTION_TYPE_LABELS[institution.institutionType] || institution.institutionType}`}
      className="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Profile &amp; Details</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({institution.documents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'verification'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verification Status</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Assigned Staff</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({institution.activityHistory?.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: Profile & Geography */}
        {activeTab === 'profile' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Institution Code</span>
                <p className="font-mono font-bold text-slate-900">{institution.code}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">AICTE Permanent ID</span>
                <p className="font-mono font-bold text-slate-900">{institution.aicteId || 'Not Configured'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Category Type</span>
                <p className="font-semibold text-slate-900">{INSTITUTION_TYPE_LABELS[institution.institutionType] || institution.institutionType}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">State</span>
                <p className="font-semibold text-slate-900">{institution.state}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">District</span>
                <p className="font-semibold text-slate-900">{institution.district}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Pincode</span>
                <p className="font-mono font-semibold text-slate-900">{institution.pincode}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Campus Address</span>
              <p className="text-slate-800 leading-relaxed">{institution.address}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Contact Email</span>
                <p className="text-slate-800 flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{institution.contactEmail}</span>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Contact Phone</span>
                <p className="text-slate-800 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{institution.contactPhone}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Institution Administrator</span>
                <p className="font-semibold text-slate-900 mt-0.5">{institution.administratorName || 'Not Assigned'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Onboarding Date</span>
                <p className="text-slate-600 mt-0.5">{new Date(institution.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-1">
              <span className="text-slate-500 font-medium">
                Mandatory compliance documents, EOA letters, and land registration title deeds.
              </span>
              {canUpdate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingDoc(!isAddingDoc)}
                  className="gap-1.5 text-xs h-7 py-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingDoc ? 'Cancel Upload' : 'Upload Document'}</span>
                </Button>
              )}
            </div>

            {isAddingDoc && (
              <form onSubmit={handleAddDocument} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Document Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="AICTE_APPROVAL_LETTER">AICTE Approval / EOA Letter</option>
                      <option value="LAND_REGISTRATION">Land Title Deed &amp; Registration</option>
                      <option value="AFFILIATION_CERTIFICATE">University Affiliation Certificate</option>
                      <option value="PAN_TAN">PAN / TAN Statutory Documents</option>
                      <option value="OTHER">Other Compliance Document</option>
                    </select>
                  </div>

                  <Input
                    label="File Display Name"
                    placeholder="e.g. EOA_Certificate_2026.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Document URL"
                  placeholder="https://docs.institution.edu/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  required
                />

                <Input
                  label="Remarks (Optional)"
                  placeholder="Notes on validity or issuing authority..."
                  value={docRemarks}
                  onChange={(e) => setDocRemarks(e.target.value)}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingDoc(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={isSubmittingDoc}>
                    Save Document
                  </Button>
                </div>
              </form>
            )}

            {(!institution.documents || institution.documents.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                No documents uploaded for this institution yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {institution.documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{doc.fileName}</p>
                          <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {doc.documentType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          {doc.remarks && ` • ${doc.remarks}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {doc.status === 'VERIFIED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      )}
                      {doc.status === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                      {doc.status === 'REJECTED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Rejected
                        </span>
                      )}

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-50 transition-colors"
                        title="View Document"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Verification */}
        {activeTab === 'verification' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border flex items-center justify-between bg-slate-50 border-slate-200">
              <div className="flex items-center gap-3">
                {institution.verificationStatus === 'VERIFIED' && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
                {institution.verificationStatus === 'PENDING' && (
                  <Clock className="w-6 h-6 text-amber-600" />
                )}
                {institution.verificationStatus === 'UNDER_SCRUTINY' && (
                  <Clock className="w-6 h-6 text-indigo-600" />
                )}
                {institution.verificationStatus === 'REJECTED' && (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Status: {institution.verificationStatus.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {institution.verifiedAt
                      ? `Certified on ${new Date(institution.verifiedAt).toLocaleDateString()}`
                      : 'Pending official scrutiny by designated verification officers.'}
                  </p>
                </div>
              </div>

              {canVerify && (
                <Button size="sm" onClick={() => onOpenVerify(institution)} className="gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Update Verification</span>
                </Button>
              )}
            </div>

            {institution.verificationRemarks && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Scrutiny Officer Remarks</span>
                <p className="text-slate-800 leading-relaxed">{institution.verificationRemarks}</p>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Verification Guidelines</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 leading-relaxed text-[11px]">
                <li>Only Verification Officers and Approving Authorities hold authority to certify institutions.</li>
                <li>Verified status enables deposit applications, FDR pledges, and release requests.</li>
                <li>Rejections must carry detailed compliance deficiency remarks for rectification.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 4: Assigned Staff */}
        {activeTab === 'users' && (
          <div className="space-y-3 text-xs">
            {isLoadingUsers ? (
              <div className="p-8 text-center text-slate-400">Loading assigned staff...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                No users currently assigned to institution code <code className="font-mono text-slate-700">{institution.code}</code>.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                {users.map((u) => (
                  <div key={u.id} className="p-3.5 bg-white flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{u.fullName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{u.email} • {u.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.roles.map((r) => (
                        <span key={r.id || r.name} className="px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-medium text-[10px]">
                          {r.displayName || r.name}
                        </span>
                      ))}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Audit Trail */}
        {activeTab === 'history' && (
          <div className="space-y-3 text-xs">
            {(!institution.activityHistory || institution.activityHistory.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                No recorded activity history.
              </div>
            ) : (
              <div className="space-y-2">
                {institution.activityHistory.map((log, idx) => (
                  <div key={log.id || idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-800">{log.details}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        By {log.performedBy} ({log.performedByEmail})
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
