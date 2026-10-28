import { AppError } from '../../utils/appError';
import { rbacRepository, RbacRepository } from './rbac.repository';
import { RoleResponse, PermissionResponse, CreateRoleInput, UpdateRoleInput } from './rbac.types';
import { IRole } from '../../models/Role.model';
import { IPermission } from '../../models/Permission.model';

export class RbacService {
  constructor(private readonly repository: RbacRepository = rbacRepository) {}

  private mapRole(role: IRole & { permissions: IPermission[] }): RoleResponse {
    return {
      id: role._id.toString(),
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystemRole: role.isSystemRole,
      permissions: (role.permissions || []).map((p) => ({
        id: (p as any)._id?.toString() || '',
        code: p.code,
        resource: p.resource,
        action: p.action,
        description: p.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async getRoles(): Promise<RoleResponse[]> {
    const roles = await this.repository.findAllRoles();
    return roles.map(this.mapRole);
  }

  async createRole(input: CreateRoleInput): Promise<RoleResponse> {
    const existing = await this.repository.findRoleByName(input.name);
    if (existing) {
      throw AppError.conflict(`Role with name "${input.name.toUpperCase()}" already exists`);
    }

    const created = await this.repository.createRole(input);
    return this.mapRole(created);
  }

  async updateRole(id: string, input: UpdateRoleInput): Promise<RoleResponse> {
    const role = await this.repository.findRoleById(id);
    if (!role) throw AppError.notFound('Role not found');

    const updated = await this.repository.updateRole(id, input);
    return this.mapRole(updated!);
  }

  async getPermissions(): Promise<PermissionResponse[]> {
    const permissions = await this.repository.findAllPermissions();
    return permissions.map((p) => ({
      id: p._id.toString(),
      code: p.code,
      resource: p.resource,
      action: p.action,
      description: p.description,
    }));
  }
}

export const rbacService = new RbacService();
