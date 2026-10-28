import mongoose, { FilterQuery } from 'mongoose';
import { Fdr, IFdr, IFdrActivityLog } from '../../models/Fdr.model';
import { FdrQueryParams, FdrDashboardMetrics } from './fdr.types';
import { DecimalUtils } from '../../utils/decimal';

export class FdrRepository {
  /**
   * Find FDRs with pagination, filtering, search, and tenant scoping
   */
  async findWithPagination(
    params: FdrQueryParams,
    institutionScope?: string
  ): Promise<{ fdrs: IFdr[]; total: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: FilterQuery<IFdr> = {};

    // Multi-tenant data isolation
    if (institutionScope) {
      query.institutionId = institutionScope;
    } else if (params.institutionId) {
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
      Fdr.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean<IFdr[]>({ virtuals: true }),
      Fdr.countDocuments(query),
    ]);

    return { fdrs, total };
  }

  /**
   * Find FDR by MongoDB _id or business fdrId
   */
  async findByIdOrFdrId(id: string): Promise<IFdr | null> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const doc = await Fdr.findById(id);
      if (doc) return doc;
    }
    return Fdr.findOne({ fdrId: id.toUpperCase().trim() });
  }

  /**
   * Create a new FDR record
   */
  async create(data: Partial<IFdr>): Promise<IFdr> {
    return Fdr.create(data);
  }

  /**
   * Update an existing FDR by ID or fdrId
   */
  async update(id: string, data: Partial<IFdr>): Promise<IFdr | null> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return Fdr.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    }
    return Fdr.findOneAndUpdate(
      { fdrId: id.toUpperCase().trim() },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  /**
   * Append an activity log to FDR history
   */
  async appendActivityLog(id: string, log: IFdrActivityLog): Promise<void> {
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { fdrId: id.toUpperCase().trim() };

    await Fdr.updateOne(filter, {
      $push: { history: { ...log, timestamp: new Date() } },
    });
  }

  /**
   * Find existing active instruments matching the same certificate number or bank
   */
  async findPotentialDuplicates(
    fdrNumber: string,
    bankName: string,
    excludeId?: string
  ): Promise<IFdr[]> {
    const query: FilterQuery<IFdr> = {
      fdrNumber: fdrNumber.trim(),
      bankName: new RegExp(`^${bankName.trim()}$`, 'i'),
      lifecycleStatus: { $ne: 'CANCELLED' },
    };

    if (excludeId) {
      if (mongoose.Types.ObjectId.isValid(excludeId)) {
        query._id = { $ne: excludeId };
      } else {
        query.fdrId = { $ne: excludeId.toUpperCase().trim() };
      }
    }

    return Fdr.find(query).limit(5);
  }

  /**
   * Aggregate FDR dashboard metrics
   */
  async getMetrics(institutionScope?: string): Promise<FdrDashboardMetrics> {
    const query: FilterQuery<IFdr> = {};
    if (institutionScope) {
      query.institutionId = institutionScope;
    }

    const [counts, sumResult] = await Promise.all([
      Fdr.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$submissionStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Fdr.find(query, { depositAmount: 1 }).lean(),
    ]);

    let totalFdrs = 0;
    let draftCount = 0;
    let submittedCount = 0;
    let verifiedCount = 0;

    for (const c of counts) {
      totalFdrs += c.count;
      if (c._id === 'DRAFT') draftCount = c.count;
      if (c._id === 'SUBMITTED') submittedCount = c.count;
      if (c._id === 'APPROVED') verifiedCount = c.count;
    }

    const [duplicateCount, verifiedDocsCount] = await Promise.all([
      Fdr.countDocuments({ ...query, isDuplicateFlagged: true }),
      Fdr.countDocuments({ ...query, verificationStatus: 'VERIFIED' }),
    ]);

    let totalDeposit = DecimalUtils.from(0);
    for (const item of sumResult) {
      if (item.depositAmount) {
        totalDeposit = DecimalUtils.add(totalDeposit, item.depositAmount);
      }
    }

    return {
      totalFdrs,
      draftCount,
      submittedCount,
      verifiedCount: verifiedDocsCount,
      duplicateFlaggedCount: duplicateCount,
      totalDepositAmount: DecimalUtils.toFixedString(totalDeposit),
      totalDepositFormatted: DecimalUtils.formatCurrency(totalDeposit),
    };
  }
}

export const fdrRepository = new FdrRepository();
