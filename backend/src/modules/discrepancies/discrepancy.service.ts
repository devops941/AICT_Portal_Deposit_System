import { DiscrepancyRepository, discrepancyRepository } from './discrepancy.repository';
import { CreateDiscrepancyInput, ResolveDiscrepancyInput, DiscrepancyFilterParams } from './discrepancy.types';
import { IDiscrepancy } from '../../models/Discrepancy.model';
import { Fdr } from '../../models/Fdr.model';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';

export class DiscrepancyService {
  constructor(private repo: DiscrepancyRepository) {}

  async createDiscrepancy(
    input: CreateDiscrepancyInput,
    user: AuthUserContext
  ): Promise<IDiscrepancy> {
    const fdr = await Fdr.findOne({
      $or: [
        { fdrId: input.instrumentId },
        ...(input.instrumentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: input.instrumentId }] : []),
      ],
    });

    if (!fdr) {
      throw AppError.notFound(`Financial instrument #${input.instrumentId} not found`);
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

    // Mark FDR under scrutiny if currently pending or submitted
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

  async resolveDiscrepancy(
    id: string,
    input: ResolveDiscrepancyInput,
    user: AuthUserContext
  ): Promise<IDiscrepancy> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound(`Discrepancy #${id} not found`);
    }

    if (existing.resolutionStatus !== 'OPEN') {
      throw AppError.badRequest(`Discrepancy #${id} is already ${existing.resolutionStatus}`);
    }

    const updated = await this.repo.updateResolution(
      id,
      input.resolutionStatus,
      input.resolutionRemarks,
      user.email
    );

    if (!updated) {
      throw AppError.internal('Failed to update discrepancy');
    }

    // Update FDR history
    const fdr = await Fdr.findOne({ fdrId: updated.instrumentId });
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

  async getDiscrepancies(params: DiscrepancyFilterParams, user: AuthUserContext) {
    const tenantId = user.institutionId;
    return this.repo.findWithFilters(params, tenantId);
  }

  async getByInstrument(instrumentId: string) {
    return this.repo.findByInstrumentId(instrumentId);
  }
}

export const discrepancyService = new DiscrepancyService(discrepancyRepository);
