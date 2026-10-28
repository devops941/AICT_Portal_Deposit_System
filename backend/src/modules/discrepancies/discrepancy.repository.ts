import { Discrepancy, IDiscrepancy } from '../../models/Discrepancy.model';
import { DiscrepancyFilterParams } from './discrepancy.types';

export class DiscrepancyRepository {
  async create(data: Partial<IDiscrepancy>): Promise<IDiscrepancy> {
    return Discrepancy.create(data);
  }

  async findById(id: string): Promise<IDiscrepancy | null> {
    return Discrepancy.findOne({
      $or: [{ discrepancyId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });
  }

  async findByInstrumentId(instrumentId: string): Promise<IDiscrepancy[]> {
    return Discrepancy.find({ instrumentId }).sort({ createdAt: -1 });
  }

  async findWithFilters(
    params: DiscrepancyFilterParams,
    userTenantId?: string
  ): Promise<{ data: IDiscrepancy[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (userTenantId) {
      query.institutionId = userTenantId;
    } else if (params.institutionId) {
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
      Discrepancy.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Discrepancy.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async updateResolution(
    id: string,
    resolutionStatus: 'RESOLVED' | 'WAIVED',
    resolutionRemarks: string,
    resolvedBy: string
  ): Promise<IDiscrepancy | null> {
    return Discrepancy.findOneAndUpdate(
      { $or: [{ discrepancyId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])] },
      {
        $set: {
          resolutionStatus,
          resolutionRemarks,
          resolvedAt: new Date(),
          resolvedBy,
        },
      },
      { new: true }
    );
  }
}

export const discrepancyRepository = new DiscrepancyRepository();
