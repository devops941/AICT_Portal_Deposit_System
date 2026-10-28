"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discrepancyService = exports.DiscrepancyService = void 0;
const discrepancy_repository_1 = require("./discrepancy.repository");
const Fdr_model_1 = require("../../models/Fdr.model");
const appError_1 = require("../../utils/appError");
class DiscrepancyService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async createDiscrepancy(input, user) {
        const fdr = await Fdr_model_1.Fdr.findOne({
            $or: [
                { fdrId: input.instrumentId },
                ...(input.instrumentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: input.instrumentId }] : []),
            ],
        });
        if (!fdr) {
            throw appError_1.AppError.notFound(`Financial instrument #${input.instrumentId} not found`);
        }
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const discrepancyId = `DISC-${year}-${randomSuffix}`;
        const discrepancy = await this.repo.create({
            discrepancyId,
            instrumentId: fdr.fdrId,
            institutionId: fdr.institutionId,
            institutionName: fdr.institutionName,
            requirementId: fdr.requirementId,
            discrepancyType: input.discrepancyType,
            title: input.title,
            description: input.description,
            severity: input.severity,
            createdBy: user.email,
            createdByName: user.fullName,
            assignedTo: input.assignedTo || fdr.institutionName,
            resolutionStatus: 'OPEN',
        });
        if (fdr.verificationStatus === 'PENDING') {
            fdr.verificationStatus = 'UNDER_SCRUTINY';
        }
        fdr.history.push({
            action: 'DISCREPANCY_FLAGGED',
            performedBy: user.fullName,
            performedByEmail: user.email,
            details: `[${input.severity}] Discrepancy raised: ${input.title}. ${input.description}`,
            timestamp: new Date(),
        });
        await fdr.save();
        return discrepancy;
    }
    async resolveDiscrepancy(id, input, user) {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw appError_1.AppError.notFound(`Discrepancy #${id} not found`);
        }
        if (existing.resolutionStatus !== 'OPEN') {
            throw appError_1.AppError.badRequest(`Discrepancy #${id} is already ${existing.resolutionStatus}`);
        }
        const updated = await this.repo.updateResolution(id, input.resolutionStatus, input.resolutionRemarks, user.email);
        if (!updated) {
            throw appError_1.AppError.internal('Failed to update discrepancy');
        }
        const fdr = await Fdr_model_1.Fdr.findOne({ fdrId: updated.instrumentId });
        if (fdr) {
            fdr.history.push({
                action: `DISCREPANCY_${input.resolutionStatus}`,
                performedBy: user.fullName,
                performedByEmail: user.email,
                details: `Discrepancy #${updated.discrepancyId} was marked ${input.resolutionStatus}. Remarks: ${input.resolutionRemarks}`,
                timestamp: new Date(),
            });
            await fdr.save();
        }
        return updated;
    }
    async getDiscrepancies(params, user) {
        const tenantId = user.institutionId;
        return this.repo.findWithFilters(params, tenantId);
    }
    async getByInstrument(instrumentId) {
        return this.repo.findByInstrumentId(instrumentId);
    }
}
exports.DiscrepancyService = DiscrepancyService;
exports.discrepancyService = new DiscrepancyService(discrepancy_repository_1.discrepancyRepository);
