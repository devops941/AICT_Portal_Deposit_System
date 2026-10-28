import { Renewal, IRenewal } from '../../models/Renewal.model';

export class RenewalRepository {
  async create(data: Partial<IRenewal>): Promise<IRenewal> {
    const renewal = new Renewal(data);
    return renewal.save();
  }

  async findById(id: string): Promise<IRenewal | null> {
    return Renewal.findById(id);
  }

  async findByRenewalId(renewalId: string): Promise<IRenewal | null> {
    return Renewal.findOne({ renewalId: renewalId.toUpperCase().trim() });
  }

  async findByPreviousInstrumentId(fdrId: string): Promise<IRenewal[]> {
    return Renewal.find({ previousInstrumentId: fdrId.toUpperCase().trim() }).sort({ createdAt: -1 });
  }

  async find(filter: any, skip = 0, limit = 20): Promise<{ renewals: IRenewal[]; total: number }> {
    const [renewals, total] = await Promise.all([
      Renewal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Renewal.countDocuments(filter),
    ]);
    return { renewals, total };
  }

  async update(renewalId: string, updateData: any): Promise<IRenewal | null> {
    return Renewal.findOneAndUpdate(
      { renewalId: renewalId.toUpperCase().trim() },
      { $set: updateData },
      { new: true }
    );
  }
}

export const renewalRepository = new RenewalRepository();
