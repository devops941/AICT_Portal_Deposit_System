export type InstitutionType =
  | 'CENTRAL_UNIVERSITY'
  | 'STATE_UNIVERSITY'
  | 'GOVT_ENGINEERING_COLLEGE'
  | 'GOVT_AIDED_COLLEGE'
  | 'SELF_FINANCING_PRIVATE'
  | 'AUTONOMOUS_INSTITUTE'
  | 'DEEMED_TO_BE_UNIVERSITY'
  | 'OTHER';

export type RegistrationStatus = 'DRAFT' | 'SUBMITTED' | 'REGISTERED';
export type VerificationStatus = 'PENDING' | 'UNDER_SCRUTINY' | 'VERIFIED' | 'REJECTED';
export type InstitutionStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface InstitutionDocument {
  id?: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  remarks?: string;
}

export interface ActivityLog {
  id?: string;
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: string;
}

export interface InstitutionItem {
  id: string;
  name: string;
  code: string;
  aicteId?: string;
  institutionType: InstitutionType;
  address: string;
  state: string;
  district: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  administratorId?: string;
  administratorName?: string;
  registrationStatus: RegistrationStatus;
  verificationStatus: VerificationStatus;
  status: InstitutionStatus;
  verificationRemarks?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  documents: InstitutionDocument[];
  activityHistory: ActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  institutionId?: string;
  status: string;
  roles: Array<{ id: string; name: string; displayName: string }>;
  lastLogin?: string;
  createdAt: string;
}

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  CENTRAL_UNIVERSITY: 'Central University',
  STATE_UNIVERSITY: 'State University',
  GOVT_ENGINEERING_COLLEGE: 'Government College',
  GOVT_AIDED_COLLEGE: 'Govt. Aided College',
  SELF_FINANCING_PRIVATE: 'Private Self-Financing',
  AUTONOMOUS_INSTITUTE: 'Autonomous Institute',
  DEEMED_TO_BE_UNIVERSITY: 'Deemed to be University',
  OTHER: 'Other Institute',
};
