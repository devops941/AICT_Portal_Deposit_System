"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discrepancyRepository = exports.DiscrepancyRepository = void 0;
const Discrepancy_model_1 = require("../../models/Discrepancy.model");
class DiscrepancyRepository {
    async create(data) {
        return Discrepancy_model_1.Discrepancy.create(data);
    }
    async findById(id) {
        return Discrepancy_model_1.Discrepancy.findOne({
            $or: [{ discrepancyId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
        });
    }
    async findByInstrumentId(instrumentId) {
        return Discrepancy_model_1.Discrepancy.find({ instrumentId }).sort({ createdAt: -1 });
    }
    async findWithFilters(params, userTenantId) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
        const skip = (page - 1) * limit;
        const query = {};
        if (userTenantId) {
            query.institutionId = userTenantId;
        }
        else if (params.institutionId) {
            query.institutionId = params.institutionId;
        }
        if (params.instrumentId) {
            query.instrumentId = params.instrumentId;
        }
        if (params.discrepancyType) {
            query.discrepancyType = params.discrepancyType;
        }
        if (params.severity) {
            query.severity = params.severity;
        }
        if (params.resolutionStatus) {
            query.resolutionStatus = params.resolutionStatus;
        }
        if (params.search) {
            const regex = new RegExp(params.search.trim(), 'i');
            query.$or = [
                { discrepancyId: regex },
                { instrumentId: regex },
                { title: regex },
                { description: regex },
            ];
        }
        const [data, total] = await Promise.all([
            Discrepancy_model_1.Discrepancy.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Discrepancy_model_1.Discrepancy.countDocuments(query),
        ]);
        return { data, total, page, limit };
    }
    async updateResolution(id, resolutionStatus, resolutionRemarks, resolvedBy) {
        return Discrepancy_model_1.Discrepancy.findOneAndUpdate({ $or: [{ discrepancyId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])] }, {
            $set: {
                resolutionStatus,
                resolutionRemarks,
                resolvedAt: new Date(),
                resolvedBy,
            },
        }, { new: true });
    }
}
exports.DiscrepancyRepository = DiscrepancyRepository;
exports.discrepancyRepository = new DiscrepancyRepository();
