"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionRepository = exports.InstitutionRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Institution_model_1 = require("../../models/Institution.model");
const User_model_1 = require("../../models/User.model");
class InstitutionRepository {
    async findWithPagination(params, institutionScope) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
        const skip = (page - 1) * limit;
        const query = {};
        if (institutionScope) {
            query.$or = [{ code: institutionScope }, { _id: institutionScope }];
        }
        if (params.search) {
            const searchRegex = new RegExp(params.search.trim(), 'i');
            query.$or = [
                { name: searchRegex },
                { code: searchRegex },
                { aicteId: searchRegex },
                { contactEmail: searchRegex },
                { district: searchRegex },
            ];
        }
        if (params.status) {
            query.status = params.status;
        }
        if (params.verificationStatus) {
            query.verificationStatus = params.verificationStatus;
        }
        if (params.institutionType) {
            query.institutionType = params.institutionType;
        }
        if (params.state) {
            query.state = new RegExp(`^${params.state.trim()}$`, 'i');
        }
        if (params.district) {
            query.district = new RegExp(`^${params.district.trim()}$`, 'i');
        }
        const sortField = params.sortBy || 'createdAt';
        const sortDirection = params.sortOrder === 'asc' ? 1 : -1;
        const sortOption = { [sortField]: sortDirection };
        const [institutions, total] = await Promise.all([
            Institution_model_1.Institution.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
            Institution_model_1.Institution.countDocuments(query),
        ]);
        return { institutions: institutions, total };
    }
    async findById(id) {
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            const byId = await Institution_model_1.Institution.findById(id);
            if (byId)
                return byId;
        }
        return Institution_model_1.Institution.findOne({ code: id.toUpperCase() });
    }
    async findByCode(code) {
        return Institution_model_1.Institution.findOne({ code: code.trim().toUpperCase() });
    }
    async create(data, actor) {
        const institution = new Institution_model_1.Institution({
            name: data.name.trim(),
            code: data.code.trim().toUpperCase(),
            aicteId: data.aicteId?.trim() || undefined,
            institutionType: data.institutionType,
            address: data.address.trim(),
            state: data.state.trim(),
            district: data.district.trim(),
            pincode: data.pincode.trim(),
            contactEmail: data.contactEmail.trim().toLowerCase(),
            contactPhone: data.contactPhone.trim(),
            administratorName: data.administratorName?.trim(),
            administratorId: data.administratorId ? new mongoose_1.default.Types.ObjectId(data.administratorId) : undefined,
            registrationStatus: 'REGISTERED',
            verificationStatus: 'PENDING',
            status: 'ACTIVE',
            activityHistory: [
                {
                    action: 'CREATED',
                    performedBy: actor.name,
                    performedByEmail: actor.email,
                    details: `Institution ${data.name} [${data.code.toUpperCase()}] registered in the portal.`,
                    timestamp: new Date(),
                },
            ],
        });
        return institution.save();
    }
    async update(id, data, actor) {
        const institution = await this.findById(id);
        if (!institution)
            return null;
        if (data.name !== undefined)
            institution.name = data.name.trim();
        if (data.aicteId !== undefined)
            institution.aicteId = data.aicteId.trim();
        if (data.institutionType !== undefined)
            institution.institutionType = data.institutionType;
        if (data.address !== undefined)
            institution.address = data.address.trim();
        if (data.state !== undefined)
            institution.state = data.state.trim();
        if (data.district !== undefined)
            institution.district = data.district.trim();
        if (data.pincode !== undefined)
            institution.pincode = data.pincode.trim();
        if (data.contactEmail !== undefined)
            institution.contactEmail = data.contactEmail.trim().toLowerCase();
        if (data.contactPhone !== undefined)
            institution.contactPhone = data.contactPhone.trim();
        if (data.administratorName !== undefined)
            institution.administratorName = data.administratorName.trim();
        if (data.administratorId !== undefined) {
            institution.administratorId = data.administratorId
                ? new mongoose_1.default.Types.ObjectId(data.administratorId)
                : undefined;
        }
        institution.activityHistory.push({
            action: 'UPDATED',
            performedBy: actor.name,
            performedByEmail: actor.email,
            details: 'Institution profile fields updated.',
            timestamp: new Date(),
        });
        return institution.save();
    }
    async updateStatus(id, status, reason, actor) {
        const institution = await this.findById(id);
        if (!institution)
            return null;
        const oldStatus = institution.status;
        institution.status = status;
        institution.activityHistory.push({
            action: 'STATUS_CHANGED',
            performedBy: actor.name,
            performedByEmail: actor.email,
            details: `Status changed from ${oldStatus} to ${status}.${reason ? ` Reason: ${reason}` : ''}`,
            timestamp: new Date(),
        });
        return institution.save();
    }
    async verify(id, verificationStatus, remarks, actor) {
        const institution = await this.findById(id);
        if (!institution)
            return null;
        institution.verificationStatus = verificationStatus;
        institution.verificationRemarks = remarks || undefined;
        institution.verifiedBy = mongoose_1.default.Types.ObjectId.isValid(actor.id)
            ? new mongoose_1.default.Types.ObjectId(actor.id)
            : undefined;
        institution.verifiedAt = new Date();
        institution.activityHistory.push({
            action: 'VERIFICATION',
            performedBy: actor.name,
            performedByEmail: actor.email,
            details: `Institution verification status marked as ${verificationStatus}.${remarks ? ` Remarks: ${remarks}` : ''}`,
            timestamp: new Date(),
        });
        return institution.save();
    }
    async addDocument(id, doc, actor) {
        const institution = await this.findById(id);
        if (!institution)
            return null;
        institution.documents.push({
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            uploadedAt: new Date(),
            status: 'PENDING',
            remarks: doc.remarks,
        });
        institution.activityHistory.push({
            action: 'DOCUMENT_UPLOADED',
            performedBy: actor.name,
            performedByEmail: actor.email,
            details: `Uploaded document: [${doc.documentType}] ${doc.fileName}`,
            timestamp: new Date(),
        });
        return institution.save();
    }
    async findUsersByInstitution(institutionCode) {
        return User_model_1.User.find({ institutionId: institutionCode })
            .populate('roles')
            .select('-passwordHash')
            .sort({ createdAt: -1 });
    }
}
exports.InstitutionRepository = InstitutionRepository;
exports.institutionRepository = new InstitutionRepository();
