"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewalRepository = exports.RenewalRepository = void 0;
const Renewal_model_1 = require("../../models/Renewal.model");
class RenewalRepository {
    async create(data) {
        const renewal = new Renewal_model_1.Renewal(data);
        return renewal.save();
    }
    async findById(id) {
        return Renewal_model_1.Renewal.findById(id);
    }
    async findByRenewalId(renewalId) {
        return Renewal_model_1.Renewal.findOne({ renewalId: renewalId.toUpperCase().trim() });
    }
    async findByPreviousInstrumentId(fdrId) {
        return Renewal_model_1.Renewal.find({ previousInstrumentId: fdrId.toUpperCase().trim() }).sort({ createdAt: -1 });
    }
    async find(filter, skip = 0, limit = 20) {
        const [renewals, total] = await Promise.all([
            Renewal_model_1.Renewal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Renewal_model_1.Renewal.countDocuments(filter),
        ]);
        return { renewals, total };
    }
    async update(renewalId, updateData) {
        return Renewal_model_1.Renewal.findOneAndUpdate({ renewalId: renewalId.toUpperCase().trim() }, { $set: updateData }, { new: true });
    }
}
exports.RenewalRepository = RenewalRepository;
exports.renewalRepository = new RenewalRepository();
