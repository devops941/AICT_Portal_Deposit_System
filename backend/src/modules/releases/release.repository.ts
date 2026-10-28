import { Release, IRelease } from '../../models/Release.model';

export class ReleaseRepository {
  async create(data: Partial<IRelease>): Promise<IRelease> {
    const release = new Release(data);
    return release.save();
  }

  async findById(id: string): Promise<IRelease | null> {
    return Release.findById(id);
  }

  async findByReleaseId(releaseId: string): Promise<IRelease | null> {
    return Release.findOne({ releaseId: releaseId.toUpperCase().trim() });
  }

  async findByIdOrReleaseId(identifier: string): Promise<IRelease | null> {
    return Release.findOne({
      $or: [
        { releaseId: identifier.toUpperCase().trim() },
        ...(identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : []),
      ],
    });
  }

  async find(filter: any, skip = 0, limit = 20): Promise<{ releases: IRelease[]; total: number }> {
    const [releases, total] = await Promise.all([
      Release.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Release.countDocuments(filter),
    ]);
    return { releases, total };
  }

  async update(releaseId: string, updateData: any): Promise<IRelease | null> {
    return Release.findOneAndUpdate(
      { releaseId: releaseId.toUpperCase().trim() },
      { $set: updateData },
      { new: true }
    );
  }

  async findActiveByInstrumentId(instrumentId: string): Promise<IRelease | null> {
    return Release.findOne({
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

export const releaseRepository = new ReleaseRepository();
