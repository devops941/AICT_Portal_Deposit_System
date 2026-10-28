"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseRepository = exports.ReleaseRepository = void 0;
const Release_model_1 = require("../../models/Release.model");
class ReleaseRepository {
    async create(data) {
        const release = new Release_model_1.Release(data);
        return release.save();
    }
    async findById(id) {
        return Release_model_1.Release.findById(id);
    }
    async findByReleaseId(releaseId) {
        return Release_model_1.Release.findOne({ releaseId: releaseId.toUpperCase().trim() });
    }
    async findByIdOrReleaseId(identifier) {
        return Release_model_1.Release.findOne({
            $or: [
                { releaseId: identifier.toUpperCase().trim() },
                ...(identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : []),
            ],
        });
    }
    async find(filter, skip = 0, limit = 20) {
        const [releases, total] = await Promise.all([
            Release_model_1.Release.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Release_model_1.Release.countDocuments(filter),
        ]);
        return { releases, total };
    }
    async update(releaseId, updateData) {
        return Release_model_1.Release.findOneAndUpdate({ releaseId: releaseId.toUpperCase().trim() }, { $set: updateData }, { new: true });
    }
    async findActiveByInstrumentId(instrumentId) {
        return Release_model_1.Release.findOne({
            instrumentId: instrumentId.toUpperCase().trim(),
            status: {
                $in: [
                    'SUBMITTED',
                    'UNDER_REVIEW',
                    'CLARIFICATION_REQUIRED',
                    'APPROVED',
                    'AUTHORIZED_RELEASE',
                ],
            },
        });
    }
}
exports.ReleaseRepository = ReleaseRepository;
exports.releaseRepository = new ReleaseRepository();
