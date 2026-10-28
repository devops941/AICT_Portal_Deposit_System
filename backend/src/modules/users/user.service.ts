import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';
import { emailService } from '../../services';
import { Admin } from '../../models/Admin.model';
import { RefreshToken } from '../../models/RefreshToken.model';
import { userRepository, UserRepository } from './user.repository';
import { UserListQuery, CreateUserInput, UpdateUserInput, UserResponse } from './user.types';
import { IUser } from '../../models/User.model';
import { IRole } from '../../models/Role.model';

export class UserService {
  constructor(private readonly repository: UserRepository = userRepository) {}

  private mapToResponse(user: IUser & { roles: IRole[] }): UserResponse {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      institutionId: user.institutionId,
      roles: (user.roles || []).map((r) => ({
        id: (r as any)._id?.toString() || '',
        name: r.name,
        displayName: r.displayName,
      })),
      status: user.status,
      failedLoginAttempts: user.failedLoginAttempts || 0,
      lastLogin: user.lastLogin,
      lastLoginIp: user.lastLoginIp,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // 1. List Users with Pagination & Institution Isolation
  async getUsers(
    query: UserListQuery,
    currentUser: AuthUserContext
  ): Promise<{ items: UserResponse[]; total: number; page: number; limit: number }> {
    // If user is not Super Admin, strictly enforce their own institutionId
    const accessibleInstitutionId =
      currentUser.userType === 'ADMIN' || currentUser.roles.includes('SYSTEM_ADMINISTRATOR')
        ? undefined
        : currentUser.institutionId;

    const { items, total } = await this.repository.findMany(query, accessibleInstitutionId);

    return {
      items: items.map(this.mapToResponse),
      total,
      page: query.page || 1,
      limit: query.limit || 10,
    };
  }

  // 2. Get User By ID
  async getUserById(id: string, currentUser: AuthUserContext): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) throw AppError.notFound('User not found');

    // Tenant check
    if (
      currentUser.userType !== 'ADMIN' &&
      !currentUser.roles.includes('SYSTEM_ADMINISTRATOR') &&
      user.institutionId &&
      user.institutionId !== currentUser.institutionId
    ) {
      throw AppError.forbidden('Access to user record outside your institution is denied');
    }

    return this.mapToResponse(user);
  }

  // 3. Create User
  async createUser(input: CreateUserInput, currentUser: AuthUserContext): Promise<UserResponse> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check duplicate in both User and Admin collections
    const existingUser = await this.repository.findByEmail(normalizedEmail);
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });

    if (existingUser || existingAdmin) {
      throw AppError.conflict('An account with this email address already exists');
    }

    // Force institution ID for institution admin creating staff
    let finalInstitutionId = input.institutionId;
    if (
      currentUser.userType !== 'ADMIN' &&
      !currentUser.roles.includes('SYSTEM_ADMINISTRATOR')
    ) {
      finalInstitutionId = currentUser.institutionId;
    }

    // Generate or hash password
    const plainPassword = input.password || `${crypto.randomBytes(4).toString('hex')}@AICTE1`;
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const created = await this.repository.create({
      ...input,
      email: normalizedEmail,
      institutionId: finalInstitutionId,
      passwordHash,
    });

    // Send credentials notification
    await emailService.sendEmail(
      normalizedEmail,
      'Welcome to AICTE Security Deposit Portal - Temporary Password',
      `<p>Hello ${input.fullName},</p><p>Your account has been created. Your temporary password is: <strong>${plainPassword}</strong></p>`
    );

    return this.mapToResponse(created);
  }

  // 4. Update User
  async updateUser(
    id: string,
    input: UpdateUserInput,
    currentUser: AuthUserContext
  ): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) throw AppError.notFound('User not found');

    // Tenant isolation check
    if (
      currentUser.userType !== 'ADMIN' &&
      !currentUser.roles.includes('SYSTEM_ADMINISTRATOR') &&
      user.institutionId &&
      user.institutionId !== currentUser.institutionId
    ) {
      throw AppError.forbidden('Access to modify user record outside your institution is denied');
    }

    const updated = await this.repository.update(id, input);
    return this.mapToResponse(updated!);
  }

  // 5. Update Status (Activate/Deactivate/Suspend)
  async updateUserStatus(
    id: string,
    status: string,
    currentUser: AuthUserContext
  ): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) throw AppError.notFound('User not found');

    // Tenant check
    if (
      currentUser.userType !== 'ADMIN' &&
      !currentUser.roles.includes('SYSTEM_ADMINISTRATOR') &&
      user.institutionId &&
      user.institutionId !== currentUser.institutionId
    ) {
      throw AppError.forbidden('Access to change user status outside your institution is denied');
    }

    const updated = await this.repository.updateStatus(id, status);

    // If deactivated or suspended, revoke all active sessions
    if (status !== 'ACTIVE') {
      await RefreshToken.updateMany({ userId: id }, { revokedAt: new Date() });
    }

    return this.mapToResponse(updated!);
  }
}

export const userService = new UserService();
