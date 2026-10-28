import mongoose, { FilterQuery } from 'mongoose';
import {
  Requirement,
  IRequirement,
  IPledgedInstrument,
  IRequirementActivityLog,
} from '../../models/Requirement.model';
import { RequirementQueryParams } from './requirement.types';

export class RequirementRepository {
  /**
   * Find requirements with pagination, filtering, search, and institution scoping
   */
  async findWithPagination(
    params: RequirementQueryParams,
    institutionScope?: string
  ): Promise<{ requirements: IRequirement[]; total: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: FilterQuery<IRequirement> = {};

    // Strict tenant isolation for institution users
    if (institutionScope) {
      query.institutionId = institutionScope;
    } else if (params.institutionId) {
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
      Requirement.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean<IRequirement[]>({ virtuals: true }),
      Requirement.countDocuments(query),
    ]);

    return { requirements, total };
  }

  /**
   * Find requirement by MongoDB _id or business requirementId
   */
  async findByIdOrRequirementId(id: string): Promise<IRequirement | null> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const doc = await Requirement.findById(id);
      if (doc) return doc;
    }
    return Requirement.findOne({ requirementId: id.toUpperCase().trim() });
  }

  /**
   * Create a new security deposit requirement
   */
  async create(data: Partial<IRequirement>): Promise<IRequirement> {
    return Requirement.create(data);
  }

  /**
   * Update an existing requirement by ID
   */
  async update(id: string, data: Partial<IRequirement>): Promise<IRequirement | null> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return Requirement.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    }
    return Requirement.findOneAndUpdate(
      { requirementId: id.toUpperCase().trim() },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  /**
   * Append an activity log entry to the requirement audit trail
   */
  async appendActivityLog(id: string, log: IRequirementActivityLog): Promise<void> {
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { requirementId: id.toUpperCase().trim() };

    await Requirement.updateOne(filter, {
      $push: { activityHistory: { ...log, timestamp: new Date() } },
    });
  }

  /**
   * Pledge an instrument against a requirement
   */
  async addPledgedInstrument(id: string, instrument: IPledgedInstrument): Promise<IRequirement | null> {
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { requirementId: id.toUpperCase().trim() };

    return Requirement.findOneAndUpdate(
      filter,
      { $push: { pledgedInstruments: instrument } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Update verification status of a pledged instrument
   */
  async updateInstrumentVerification(
    requirementId: string,
    instrumentId: string,
    verificationStatus: 'VERIFIED' | 'REJECTED',
    remarks?: string
  ): Promise<IRequirement | null> {
    const filter = mongoose.Types.ObjectId.isValid(requirementId)
      ? { _id: requirementId, 'pledgedInstruments.instrumentId': instrumentId }
      : { requirementId: requirementId.toUpperCase().trim(), 'pledgedInstruments.instrumentId': instrumentId };

    const updateFields: Record<string, unknown> = {
      'pledgedInstruments.$.verificationStatus': verificationStatus,
    };
    if (remarks) {
      updateFields['pledgedInstruments.$.remarks'] = remarks;
    }

    return Requirement.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
  }

  /**
   * Find all requirements for an institution
   */
  async findByInstitution(institutionId: string): Promise<IRequirement[]> {
    return Requirement.find({
      $or: [{ institutionId: institutionId }, { institutionId: institutionId.toUpperCase() }],
    }).sort({ createdAt: -1 });
  }

  /**
   * Aggregate high-level compliance dashboard metrics
   */
  async getDashboardMetrics(institutionScope?: string): Promise<{
    totalRequirements: number;
    compliantCount: number;
    partiallyCompliantCount: number;
    notSubmittedCount: number;
    overdueCount: number;
    underReviewCount: number;
  }> {
    const query: FilterQuery<IRequirement> = {};
    if (institutionScope) {
      query.institutionId = institutionScope;
    }

    const counts = await Requirement.aggregate([
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

export const requirementRepository = new RequirementRepository();
