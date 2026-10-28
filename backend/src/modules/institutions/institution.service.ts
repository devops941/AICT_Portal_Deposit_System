import { institutionRepository, InstitutionRepository } from './institution.repository';
import {
  CreateInstitutionInput,
  UpdateInstitutionInput,
  UpdateStatusInput,
  VerifyInstitutionInput,
  AddDocumentInput,
  InstitutionQueryParams,
  InstitutionResponse,
  PaginatedInstitutionsResult,
} from './institution.types';
import { IInstitution } from '../../models/Institution.model';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';

export class InstitutionService {
  constructor(private readonly repository: InstitutionRepository = institutionRepository) {}

  private mapInstitution(doc: IInstitution): InstitutionResponse {
    return {
      id: doc._id.toString(),
      name: doc.name,
      code: doc.code,
      aicteId: doc.aicteId,
      institutionType: doc.institutionType,
      address: doc.address,
      state: doc.state,
      district: doc.district,
      pincode: doc.pincode,
      contactEmail: doc.contactEmail,
      contactPhone: doc.contactPhone,
      administratorId: doc.administratorId?.toString(),
      administratorName: doc.administratorName,
      registrationStatus: doc.registrationStatus,
      verificationStatus: doc.verificationStatus,
      status: doc.status,
      verificationRemarks: doc.verificationRemarks,
      verifiedBy: doc.verifiedBy?.toString(),
      verifiedAt: doc.verifiedAt?.toISOString(),
      documents: doc.documents || [],
      activityHistory: doc.activityHistory || [],
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  // Check tenant scope for institution users
  private getInstitutionScope(currentUser: AuthUserContext): string | undefined {
    if (currentUser.userType === 'ADMIN') return undefined;

    // Central AICTE officers see all institutions
    const isCentralOfficer = currentUser.roles.some((r: string) =>
      ['SYSTEM_ADMINISTRATOR', 'VERIFICATION_OFFICER', 'SENIOR_VERIFICATION_OFFICER', 'APPROVING_AUTHORITY', 'AUDITOR'].includes(r)
    );
    if (isCentralOfficer) return undefined;

    return currentUser.institutionId;
  }

  async getInstitutions(
    params: InstitutionQueryParams,
    currentUser: AuthUserContext
  ): Promise<PaginatedInstitutionsResult> {
    const institutionScope = this.getInstitutionScope(currentUser);
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));

    const { institutions, total } = await this.repository.findWithPagination(
      params,
      institutionScope
    );

    return {
      data: institutions.map((inst) => this.mapInstitution(inst)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getInstitutionById(id: string, currentUser: AuthUserContext): Promise<InstitutionResponse> {
    const institution = await this.repository.findById(id);
    if (!institution) {
      throw AppError.notFound(`Institution not found with identifier: ${id}`);
    }

    const institutionScope = this.getInstitutionScope(currentUser);
    if (institutionScope && institution.code !== institutionScope && institution._id.toString() !== institutionScope) {
      throw AppError.forbidden('You are only authorized to access your own institution data.');
    }

    return this.mapInstitution(institution);
  }

  async createInstitution(
    input: CreateInstitutionInput,
    currentUser: AuthUserContext
  ): Promise<InstitutionResponse> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw AppError.conflict(`An institution with code "${input.code.toUpperCase()}" already exists.`);
    }

    const actor = {
      name: currentUser.email.split('@')[0] || 'Administrator',
      email: currentUser.email,
    };

    const created = await this.repository.create(input, actor);
    return this.mapInstitution(created);
  }

  async updateInstitution(
    id: string,
    input: UpdateInstitutionInput,
    currentUser: AuthUserContext
  ): Promise<InstitutionResponse> {
    const institution = await this.repository.findById(id);
    if (!institution) {
      throw AppError.notFound(`Institution not found: ${id}`);
    }

    const institutionScope = this.getInstitutionScope(currentUser);
    if (institutionScope && institution.code !== institutionScope && institution._id.toString() !== institutionScope) {
      throw AppError.forbidden('You can only update your own institution.');
    }

    const actor = {
      name: currentUser.email.split('@')[0],
      email: currentUser.email,
    };

    const updated = await this.repository.update(institution._id.toString(), input, actor);
    return this.mapInstitution(updated!);
  }

  async updateStatus(
    id: string,
    input: UpdateStatusInput,
    currentUser: AuthUserContext
  ): Promise<InstitutionResponse> {
    const institution = await this.repository.findById(id);
    if (!institution) {
      throw AppError.notFound(`Institution not found: ${id}`);
    }

    const actor = {
      name: currentUser.email.split('@')[0],
      email: currentUser.email,
    };

    const updated = await this.repository.updateStatus(
      institution._id.toString(),
      input.status,
      input.reason || '',
      actor
    );
    return this.mapInstitution(updated!);
  }

  async verifyInstitution(
    id: string,
    input: VerifyInstitutionInput,
    currentUser: AuthUserContext
  ): Promise<InstitutionResponse> {
    const institution = await this.repository.findById(id);
    if (!institution) {
      throw AppError.notFound(`Institution not found: ${id}`);
    }

    const actor = {
      id: currentUser.id,
      name: currentUser.email.split('@')[0],
      email: currentUser.email,
    };

    const updated = await this.repository.verify(
      institution._id.toString(),
      input.verificationStatus,
      input.remarks || '',
      actor
    );
    return this.mapInstitution(updated!);
  }

  async addDocument(
    id: string,
    input: AddDocumentInput,
    currentUser: AuthUserContext
  ): Promise<InstitutionResponse> {
    const institution = await this.repository.findById(id);
    if (!institution) {
      throw AppError.notFound(`Institution not found: ${id}`);
    }

    const institutionScope = this.getInstitutionScope(currentUser);
    if (institutionScope && institution.code !== institutionScope && institution._id.toString() !== institutionScope) {
      throw AppError.forbidden('You can only upload documents for your own institution.');
    }

    const actor = {
      name: currentUser.email.split('@')[0],
      email: currentUser.email,
    };

    const updated = await this.repository.addDocument(institution._id.toString(), input, actor);
    return this.mapInstitution(updated!);
  }

  async getInstitutionUsers(id: string, currentUser: AuthUserContext) {
    const institution = await this.repository.findById(id);
    if (!institution) {
      throw AppError.notFound(`Institution not found: ${id}`);
    }

    const institutionScope = this.getInstitutionScope(currentUser);
    if (institutionScope && institution.code !== institutionScope && institution._id.toString() !== institutionScope) {
      throw AppError.forbidden('You can only view users for your own institution.');
    }

    const users = await this.repository.findUsersByInstitution(institution.code);
    return users.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      institutionId: u.institutionId,
      status: u.status,
      roles: (u.roles as any[]).map((r) => ({
        id: r._id?.toString() || r.id,
        name: r.name,
        displayName: r.displayName,
      })),
      lastLogin: u.lastLogin?.toISOString(),
      createdAt: u.createdAt.toISOString(),
    }));
  }
}

export const institutionService = new InstitutionService();
