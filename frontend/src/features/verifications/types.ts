import { FdrItem } from '../fdrs/types';

export interface VerificationChecklistItem {
  itemKey: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'PENDING';
  comments?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface ClarificationRecord {
  _id?: string;
  query: string;
  requestedBy: string;
  requestedByEmail: string;
  requestedAt: string;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

export type DiscrepancySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DiscrepancyResolutionStatus = 'OPEN' | 'RESOLVED' | 'WAIVED';
export type DiscrepancyType =
  | 'AMOUNT_MISMATCH'
  | 'DATE_INVALID'
  | 'NAME_MISMATCH'
  | 'DOCUMENT_ILLEGIBLE'
  | 'DUPLICATE_SUSPECT'
  | 'MISSING_DOCUMENT'
  | 'BANK_MISMATCH'
  | 'OTHER';

export interface DiscrepancyItem {
  _id: string;
  discrepancyId: string;
  instrumentId: string;
  institutionId: string;
  institutionName?: string;
  requirementId?: string;
  discrepancyType: DiscrepancyType;
  title: string;
  description: string;
  severity: DiscrepancySeverity;
  createdBy: string;
  createdByName?: string;
  assignedTo?: string;
  resolutionStatus: DiscrepancyResolutionStatus;
  resolutionRemarks?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface VerificationDocumentRecord {
  _id: string;
  documentId: string;
  instrumentId: string;
  documentType: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  uploadedBy: string;
  uploadedAt: string;
  verificationStatus: string;
}

export interface VerificationPacket {
  fdr: FdrItem;
  institution?: {
    code: string;
    name: string;
    aicteId?: string;
    institutionType: string;
    state: string;
    district: string;
    contactEmail: string;
    contactPhone: string;
    administratorName: string;
    verificationStatus: string;
  };
  requirement?: {
    requirementId: string;
    title: string;
    requirementType: string;
    requiredAmountFormatted: string;
    acceptableInstrumentTypes: string[];
    complianceStatus: string;
  };
  documents: VerificationDocumentRecord[];
  discrepancies: DiscrepancyItem[];
  checklist: VerificationChecklistItem[];
  activeApproval?: any;
}

export const SEVERITY_CONFIG: Record<
  DiscrepancySeverity,
  { label: string; badgeClass: string; dotClass: string }
> = {
  CRITICAL: {
    label: 'Critical',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  HIGH: {
    label: 'High',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  MEDIUM: {
    label: 'Medium',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  LOW: {
    label: 'Low',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};
