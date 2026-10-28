import { IPermission } from '../../models/Permission.model';

export interface RoleResponse {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  permissions: Array<{
    id: string;
    code: string;
    resource: string;
    action: string;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionResponse {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string;
}

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateRoleInput {
  displayName?: string;
  description?: string;
  permissionIds?: string[];
}
