import { Approval, IApproval } from '../../models/Approval.model';
import { ApprovalFilterParams } from './approval.types';

export class ApprovalRepository {
  async create(data: Partial<IApproval>): Promise<IApproval> {
    return Approval.create(data);
  }

  async findById(id: string): Promise<IApproval | null> {
    return Approval.findOne({
      $or: [{ approvalId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });
  }

  async findByInstrumentId(instrumentId: string): Promise<IApproval | null> {
    return Approval.findOne({ instrumentId }).sort({ createdAt: -1 });
  }

  async findWithFilters(
    params: ApprovalFilterParams,
    userTenantId?: string
  ): Promise<{ data: IApproval[]; total: number; page: number; limit: number }> {
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
      Approval.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Approval.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async save(approval: IApproval): Promise<IApproval> {
    return approval.save();
  }
}

export const approvalRepository = new ApprovalRepository();
