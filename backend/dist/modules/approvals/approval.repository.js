"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvalRepository = exports.ApprovalRepository = void 0;
const Approval_model_1 = require("../../models/Approval.model");
class ApprovalRepository {
    async create(data) {
        return Approval_model_1.Approval.create(data);
    }
    async findById(id) {
        return Approval_model_1.Approval.findOne({
            $or: [{ approvalId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
        });
    }
    async findByInstrumentId(instrumentId) {
        return Approval_model_1.Approval.findOne({ instrumentId }).sort({ createdAt: -1 });
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
        if (params.status) {
            query.status = params.status;
        }
        if (params.workflowType) {
            query.workflowType = params.workflowType;
        }
        if (params.currentStep) {
            query.currentStep = Number(params.currentStep);
        }
        if (params.search) {
            const regex = new RegExp(params.search.trim(), 'i');
            query.$or = [
                { approvalId: regex },
                { instrumentId: regex },
                { institutionName: regex },
                { requirementTitle: regex },
            ];
        }
        const [data, total] = await Promise.all([
            Approval_model_1.Approval.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Approval_model_1.Approval.countDocuments(query),
        ]);
        return { data, total, page, limit };
    }
    async save(approval) {
        return approval.save();
    }
}
exports.ApprovalRepository = ApprovalRepository;
exports.approvalRepository = new ApprovalRepository();
