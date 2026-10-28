"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementRepository = exports.RequirementRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Requirement_model_1 = require("../../models/Requirement.model");
class RequirementRepository {
    async findWithPagination(params, institutionScope) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
        const skip = (page - 1) * limit;
        const query = {};
        if (institutionScope) {
            query.institutionId = institutionScope;
        }
        else if (params.institutionId) {
            query.institutionId = params.institutionId;
        }
        if (params.search) {
            const searchRegex = new RegExp(params.search.trim(), 'i');
            query.$or = [
                { requirementId: searchRegex },
                { title: searchRegex },
                { institutionName: searchRegex },
                { applicableRuleReference: searchRegex },
            ];
        }
        if (params.requirementType) {
            query.requirementType = params.requirementType;
        }
        if (params.requirementStatus) {
            query.requirementStatus = params.requirementStatus;
        }
        if (params.complianceStatus) {
            query.complianceStatus = params.complianceStatus;
        }
        const sortField = params.sortBy || 'createdAt';
        const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
        const [requirements, total] = await Promise.all([
            Requirement_model_1.Requirement.find(query)
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limit)
                .lean({ virtuals: true }),
            Requirement_model_1.Requirement.countDocuments(query),
        ]);
        return { requirements, total };
    }
    async findByIdOrRequirementId(id) {
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            const doc = await Requirement_model_1.Requirement.findById(id);
            if (doc)
                return doc;
        }
        return Requirement_model_1.Requirement.findOne({ requirementId: id.toUpperCase().trim() });
    }
    async create(data) {
        return Requirement_model_1.Requirement.create(data);
    }
    async update(id, data) {
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            return Requirement_model_1.Requirement.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
        }
        return Requirement_model_1.Requirement.findOneAndUpdate({ requirementId: id.toUpperCase().trim() }, { $set: data }, { new: true, runValidators: true });
    }
    async appendActivityLog(id, log) {
        const filter = mongoose_1.default.Types.ObjectId.isValid(id)
            ? { _id: id }
            : { requirementId: id.toUpperCase().trim() };
        await Requirement_model_1.Requirement.updateOne(filter, {
            $push: { activityHistory: { ...log, timestamp: new Date() } },
        });
    }
    async addPledgedInstrument(id, instrument) {
        const filter = mongoose_1.default.Types.ObjectId.isValid(id)
            ? { _id: id }
            : { requirementId: id.toUpperCase().trim() };
        return Requirement_model_1.Requirement.findOneAndUpdate(filter, { $push: { pledgedInstruments: instrument } }, { new: true, runValidators: true });
    }
    async updateInstrumentVerification(requirementId, instrumentId, verificationStatus, remarks) {
        const filter = mongoose_1.default.Types.ObjectId.isValid(requirementId)
            ? { _id: requirementId, 'pledgedInstruments.instrumentId': instrumentId }
            : { requirementId: requirementId.toUpperCase().trim(), 'pledgedInstruments.instrumentId': instrumentId };
        const updateFields = {
            'pledgedInstruments.$.verificationStatus': verificationStatus,
        };
        if (remarks) {
            updateFields['pledgedInstruments.$.remarks'] = remarks;
        }
        return Requirement_model_1.Requirement.findOneAndUpdate(filter, { $set: updateFields }, { new: true, runValidators: true });
    }
    async findByInstitution(institutionId) {
        return Requirement_model_1.Requirement.find({
            $or: [{ institutionId: institutionId }, { institutionId: institutionId.toUpperCase() }],
        }).sort({ createdAt: -1 });
    }
    async getDashboardMetrics(institutionScope) {
        const query = {};
        if (institutionScope) {
            query.institutionId = institutionScope;
        }
        const counts = await Requirement_model_1.Requirement.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$complianceStatus',
                    count: { $sum: 1 },
                },
            },
        ]);
        const result = {
            totalRequirements: 0,
            compliantCount: 0,
            partiallyCompliantCount: 0,
            notSubmittedCount: 0,
            overdueCount: 0,
            underReviewCount: 0,
        };
        for (const item of counts) {
            result.totalRequirements += item.count;
            switch (item._id) {
                case 'COMPLIANT':
                    result.compliantCount = item.count;
                    break;
                case 'PARTIALLY_COMPLIANT':
                    result.partiallyCompliantCount = item.count;
                    break;
                case 'NOT_SUBMITTED':
                    result.notSubmittedCount = item.count;
                    break;
                case 'OVERDUE':
                    result.overdueCount = item.count;
                    break;
                case 'UNDER_REVIEW':
                    result.underReviewCount = item.count;
                    break;
            }
        }
        return result;
    }
}
exports.RequirementRepository = RequirementRepository;
exports.requirementRepository = new RequirementRepository();
