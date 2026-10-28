import {
  InstitutionType,
  RegistrationStatus,
  VerificationStatus,
  InstitutionStatus,
  IInstitutionDocument,
  IActivityLog,
} from '../../models/Institution.model';

export interface CreateInstitutionInput {
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
  administratorName?: string;
  administratorId?: string;
}

export interface UpdateInstitutionInput {
  name?: string;
  aicteId?: string;
  institutionType?: InstitutionType;
  address?: string;
  state?: string;
  district?: string;
  pincode?: string;
  contactEmail?: string;
  contactPhone?: string;
  administratorName?: string;
  administratorId?: string;
}

export interface UpdateStatusInput {
  status: InstitutionStatus;
  reason?: string;
}

export interface VerifyInstitutionInput {
  verificationStatus: VerificationStatus;
  remarks?: string;
}

export interface AddDocumentInput {
  documentType: string;
  fileName: string;
  fileUrl: string;
  remarks?: string;
}

export interface InstitutionQueryParams {
  search?: string;
  status?: InstitutionStatus;
  verificationStatus?: VerificationStatus;
  institutionType?: InstitutionType;
  state?: string;
  district?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InstitutionResponse {
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
  documents: IInstitutionDocument[];
  activityHistory: IActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedInstitutionsResult {
  data: InstitutionResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
