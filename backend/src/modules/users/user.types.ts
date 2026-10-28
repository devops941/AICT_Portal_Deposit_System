import { UserStatus } from '../../models/User.model';

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  institutionId?: string;
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  status: UserStatus;
  failedLoginAttempts: number;
  lastLogin?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  roleId?: string;
  institutionId?: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  institutionId?: string;
  roleIds: string[];
  status?: UserStatus;
}

export interface UpdateUserInput {
  fullName?: string;
  phone?: string;
  institutionId?: string;
  roleIds?: string[];
  status?: UserStatus;
}
