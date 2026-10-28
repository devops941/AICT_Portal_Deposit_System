"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fdrRepository = exports.FdrRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Fdr_model_1 = require("../../models/Fdr.model");
const decimal_1 = require("../../utils/decimal");
class FdrRepository {
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
                { fdrId: searchRegex },
                { fdrNumber: searchRegex },
                { bankName: searchRegex },
                { bankBranch: searchRegex },
                { holderName: searchRegex },
                { requirementId: searchRegex },
                { institutionName: searchRegex },
            ];
        }
        if (params.requirementId) {
            query.requirementId = params.requirementId.toUpperCase();
        }
        if (params.bankName) {
            query.bankName = new RegExp(params.bankName.trim(), 'i');
        }
        if (params.submissionStatus) {
            query.submissionStatus = params.submissionStatus;
        }
        if (params.verificationStatus) {
            query.verificationStatus = params.verificationStatus;
        }
        if (params.lifecycleStatus) {
            query.lifecycleStatus = params.lifecycleStatus;
        }
        if (params.isDuplicateFlagged !== undefined && params.isDuplicateFlagged !== '') {
            query.isDuplicateFlagged = params.isDuplicateFlagged === 'true' || params.isDuplicateFlagged === true;
        }
        const sortField = params.sortBy || 'createdAt';
        const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
        const [fdrs, total] = await Promise.all([
            Fdr_model_1.Fdr.find(query)
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limit)
                .lean({ virtuals: true }),
            Fdr_model_1.Fdr.countDocuments(query),
        ]);
        return { fdrs, total };
    }
    async findByIdOrFdrId(id) {
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            const doc = await Fdr_model_1.Fdr.findById(id);
            if (doc)
                return doc;
        }
        return Fdr_model_1.Fdr.findOne({ fdrId: id.toUpperCase().trim() });
    }
    async create(data) {
        return Fdr_model_1.Fdr.create(data);
    }
    async update(id, data) {
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            return Fdr_model_1.Fdr.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
        }
        return Fdr_model_1.Fdr.findOneAndUpdate({ fdrId: id.toUpperCase().trim() }, { $set: data }, { new: true, runValidators: true });
    }
    async appendActivityLog(id, log) {
        const filter = mongoose_1.default.Types.ObjectId.isValid(id)
            ? { _id: id }
            : { fdrId: id.toUpperCase().trim() };
        await Fdr_model_1.Fdr.updateOne(filter, {
            $push: { history: { ...log, timestamp: new Date() } },
        });
    }
    async findPotentialDuplicates(fdrNumber, bankName, excludeId) {
        const query = {
            fdrNumber: fdrNumber.trim(),
            bankName: new RegExp(`^${bankName.trim()}$`, 'i'),
            lifecycleStatus: { $ne: 'CANCELLED' },
        };
        if (excludeId) {
            if (mongoose_1.default.Types.ObjectId.isValid(excludeId)) {
                query._id = { $ne: excludeId };
            }
            else {
                query.fdrId = { $ne: excludeId.toUpperCase().trim() };
            }
        }
        return Fdr_model_1.Fdr.find(query).limit(5);
    }
    async getMetrics(institutionScope) {
        const query = {};
        if (institutionScope) {
            query.institutionId = institutionScope;
        }
        const [counts, sumResult] = await Promise.all([
            Fdr_model_1.Fdr.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$submissionStatus',
                        count: { $sum: 1 },
                    },
                },
            ]),
            Fdr_model_1.Fdr.find(query, { depositAmount: 1 }).lean(),
        ]);
        let totalFdrs = 0;
        let draftCount = 0;
        let submittedCount = 0;
        let verifiedCount = 0;
        for (const c of counts) {
            totalFdrs += c.count;
            if (c._id === 'DRAFT')
                draftCount = c.count;
            if (c._id === 'SUBMITTED')
                submittedCount = c.count;
            if (c._id === 'APPROVED')
                verifiedCount = c.count;
        }
        const [duplicateCount, verifiedDocsCount] = await Promise.all([
            Fdr_model_1.Fdr.countDocuments({ ...query, isDuplicateFlagged: true }),
            Fdr_model_1.Fdr.countDocuments({ ...query, verificationStatus: 'VERIFIED' }),
        ]);
        let totalDeposit = decimal_1.DecimalUtils.from(0);
        for (const item of sumResult) {
            if (item.depositAmount) {
                totalDeposit = decimal_1.DecimalUtils.add(totalDeposit, item.depositAmount);
            }
        }
        return {
            totalFdrs,
            draftCount,
            submittedCount,
            verifiedCount: verifiedDocsCount,
            duplicateFlaggedCount: duplicateCount,
            totalDepositAmount: decimal_1.DecimalUtils.toFixedString(totalDeposit),
            totalDepositFormatted: decimal_1.DecimalUtils.formatCurrency(totalDeposit),
        };
    }
}
exports.FdrRepository = FdrRepository;
exports.fdrRepository = new FdrRepository();
