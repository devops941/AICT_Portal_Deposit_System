import { Role, IRole } from '../../models/Role.model';
import { Permission, IPermission } from '../../models/Permission.model';
import { CreateRoleInput, UpdateRoleInput } from './rbac.types';

export class RbacRepository {
  async findAllRoles(): Promise<Array<IRole & { permissions: IPermission[] }>> {
    return Role.find().populate<{ permissions: IPermission[] }>('permissions').sort({ name: 1 });
  }

  async findRoleById(id: string): Promise<(IRole & { permissions: IPermission[] }) | null> {
    return Role.findById(id).populate<{ permissions: IPermission[] }>('permissions');
  }

  async findRoleByName(name: string): Promise<IRole | null> {
    return Role.findOne({ name: name.toUpperCase() });
  }

  async createRole(data: CreateRoleInput): Promise<IRole & { permissions: IPermission[] }> {
    const created = await Role.create({
      name: data.name.toUpperCase(),
      displayName: data.displayName,
      description: data.description,
      permissions: data.permissionIds,
      isSystemRole: false,
    });
    return (await this.findRoleById(created._id.toString()))!;
  }

  async updateRole(
    id: string,
    data: UpdateRoleInput
  ): Promise<(IRole & { permissions: IPermission[] }) | null> {
    const updatePayload: Record<string, any> = {};
    if (data.displayName !== undefined) updatePayload.displayName = data.displayName;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.permissionIds !== undefined) updatePayload.permissions = data.permissionIds;

    return Role.findByIdAndUpdate(id, updatePayload, { new: true }).populate<{
      permissions: IPermission[];
    }>('permissions');
  }

  async findAllPermissions(): Promise<IPermission[]> {
    return Permission.find().sort({ resource: 1, action: 1 });
  }
}

export const rbacRepository = new RbacRepository();
