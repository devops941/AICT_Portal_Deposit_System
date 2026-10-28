import { FilterQuery } from 'mongoose';
import { User, IUser } from '../../models/User.model';
import { IRole } from '../../models/Role.model';
import { UserListQuery, CreateUserInput, UpdateUserInput } from './user.types';

export class UserRepository {
  async findMany(
    query: UserListQuery,
    accessibleInstitutionId?: string
  ): Promise<{ items: Array<IUser & { roles: IRole[] }>; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IUser> = {};

    // Enforce institution-level data isolation
    if (accessibleInstitutionId) {
      filter.institutionId = accessibleInstitutionId;
    } else if (query.institutionId) {
      filter.institutionId = query.institutionId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.roleId) {
      filter.roles = query.roleId;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .populate<{ roles: IRole[] }>('roles')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<(IUser & { roles: IRole[] }) | null> {
    return User.findById(id).populate<{ roles: IRole[] }>('roles');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async create(data: CreateUserInput & { passwordHash: string }): Promise<IUser & { roles: IRole[] }> {
    const created = await User.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash: data.passwordHash,
      institutionId: data.institutionId,
      roles: data.roleIds,
      status: data.status || 'ACTIVE',
      mustChangePassword: true,
    });

    return (await this.findById(created._id.toString()))!;
  }

  async update(id: string, data: UpdateUserInput): Promise<(IUser & { roles: IRole[] }) | null> {
    const updatePayload: Record<string, any> = {};
    if (data.fullName !== undefined) updatePayload.fullName = data.fullName;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.institutionId !== undefined) updatePayload.institutionId = data.institutionId;
    if (data.roleIds !== undefined) updatePayload.roles = data.roleIds;
    if (data.status !== undefined) updatePayload.status = data.status;

    return User.findByIdAndUpdate(id, updatePayload, { new: true }).populate<{ roles: IRole[] }>('roles');
  }

  async updateStatus(id: string, status: string): Promise<(IUser & { roles: IRole[] }) | null> {
    return User.findByIdAndUpdate(id, { status }, { new: true }).populate<{ roles: IRole[] }>('roles');
  }
}

export const userRepository = new UserRepository();
