"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionService = exports.InstitutionService = void 0;
const institution_repository_1 = require("./institution.repository");
const appError_1 = require("../../utils/appError");
class InstitutionService {
    repository;
    constructor(repository = institution_repository_1.institutionRepository) {
        this.repository = repository;
    }
    mapInstitution(doc) {
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
    getInstitutionScope(currentUser) {
        if (currentUser.userType === 'ADMIN')
            return undefined;
        const isCentralOfficer = currentUser.roles.some((r) => ['SYSTEM_ADMINISTRATOR', 'VERIFICATION_OFFICER', 'SENIOR_VERIFICATION_OFFICER', 'APPROVING_AUTHORITY', 'AUDITOR'].includes(r));
        if (isCentralOfficer)
            return undefined;
        return currentUser.institutionId;
    }
    async getInstitutions(params, currentUser) {
        const institutionScope = this.getInstitutionScope(currentUser);
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
        const { institutions, total } = await this.repository.findWithPagination(params, institutionScope);
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
    async getInstitutionById(id, currentUser) {
        const institution = await this.repository.findById(id);
        if (!institution) {
            throw appError_1.AppError.notFound(`Institution not found with identifier: ${id}`);
        }
        const institutionScope = this.getInstitutionScope(currentUser);
        if (institutionScope && institution.code !== institutionScope && institution._id.toString() !== institutionScope) {
            throw appError_1.AppError.forbidden('You are only authorized to access your own institution data.');
        }
        return this.mapInstitution(institution);
    }
    async createInstitution(input, currentUser) {
        const existing = await this.repository.findByCode(input.code);
        if (existing) {
            throw appError_1.AppError.conflict(`An institution with code "${input.code.toUpperCase()}" already exists.`);
        }
        const actor = {
            name: currentUser.email.split('@')[0] || 'Administrator',
            email: currentUser.email,
        };
        const created = await this.repository.create(input, actor);
        return this.mapInstitution(created);
    }
    async updateInstitution(id, input, currentUser) {
        const institution = await this.repository.findById(id);
        if (!institution) {
            throw appError_1.AppError.notFound(`Institution not found: ${id}`);
        }
        const institutionScope = this.getInstitutionScope(currentUser);
        if (institutionScope && institution.code !== institutionScope && institution._id.toString() !== institutionScope) {
            throw appError_1.AppError.forbidden('You can only update your own institution.');
        }
        const actor = {
            name: currentUser.email.split('@')[0],
            email: currentUser.email,
        };
        const updated = await this.repository.update(institution._id.toString(), input, actor);
        return this.mapInstitution(updated);
    }
    async updateStatus(id, input, currentUser) {
        const institution = await this.repository.findById(id);
        if (!institution) {
            throw appError_1.AppError.notFound(`Institution not found: ${id}`);
        }
        const actor = {
            name: currentUser.email.split('@')[0],
            email: currentUser.email,
        };
        const updated = await this.repository.updateStatus(institution._id.toString(), input.status, input.reason || '', actor);
        return this.mapInstitution(updated);
    }
    async verifyInstitution(id, input, currentUser) {
        const institution = await this.repository.findById(id);
        if (!institution) {
            throw appError_1.AppError.notFound(`Institution not found: ${id}`);
        }
        const actor = {
            id: currentUser.id,
            name: currentUser.email.split('@')[0],
            email: currentUser.email,
        };
        const updated = await this.repository.verify(institution._id.toString(), input.verificationStatus, input.remarks || '', actor);
        return this.mapInstitution(updated);
    }
    async addDocument(id, input, currentUser) {
        const institution = await this.repository.findById(id);
        if (!institution) {
            throw appError_1.AppError.notFound(`Institution not found: ${id}`);
        }
        const institutionScope = this.getInstitutionScope(currentUser);
        if (institutionScope && institution.code !== institutionScope && institution._id.toString() !== institutionScope) {
            throw appError_1.AppError.forbidden('You can only upload documents for your own institution.');
        }
        const actor = {
            name: currentUser.email.split('@')[0],
            email: currentUser.email,
        };
        const updated = await this.repository.addDocument(institution._id.toString(), input, actor);
        return this.mapInstitution(updated);
    }
    async getInstitutionUsers(id, currentUser) {
        const institution = await this.repository.findById(id);
        if (!institution) {
            throw appError_1.AppError.notFound(`Institution not found: ${id}`);
        }
        const institutionScope = this.getInstitutionScope(currentUser);
        if (institutionScope && institution.code !== institutionScope && institution._id.toString() !== institutionScope) {
            throw appError_1.AppError.forbidden('You can only view users for your own institution.');
        }
        const users = await this.repository.findUsersByInstitution(institution.code);
        return users.map((u) => ({
            id: u._id.toString(),
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            institutionId: u.institutionId,
            status: u.status,
            roles: u.roles.map((r) => ({
                id: r._id?.toString() || r.id,
                name: r.name,
                displayName: r.displayName,
            })),
            lastLogin: u.lastLogin?.toISOString(),
            createdAt: u.createdAt.toISOString(),
        }));
    }
}
exports.InstitutionService = InstitutionService;
exports.institutionService = new InstitutionService();
