import mongoose from 'mongoose';
import { Admin, IAdmin } from '../../models/Admin.model';
import { User, IUser } from '../../models/User.model';
import { RefreshToken, IRefreshToken } from '../../models/RefreshToken.model';
import { PasswordResetToken, IPasswordResetToken } from '../../models/PasswordResetToken.model';
import { IRole } from '../../models/Role.model';
import { IPermission } from '../../models/Permission.model';

export class AuthRepository {
  // 1. Lookups across tables
  async findAdminByEmail(email: string): Promise<IAdmin | null> {
    return Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  }

  async findUserByEmail(email: string): Promise<(IUser & { roles: Array<IRole & { permissions: IPermission[] }> }) | null> {
    return User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .populate<{ roles: Array<IRole & { permissions: IPermission[] }> }>({
        path: 'roles',
        populate: { path: 'permissions' },
      });
  }

  async findAdminById(id: string): Promise<IAdmin | null> {
    return Admin.findById(id);
  }

  async findUserById(id: string): Promise<(IUser & { roles: Array<IRole & { permissions: IPermission[] }> }) | null> {
    return User.findById(id).populate<{ roles: Array<IRole & { permissions: IPermission[] }> }>({
      path: 'roles',
      populate: { path: 'permissions' },
    });
  }

  // 2. Lockout and Attempt tracking
  async recordFailedAttempt(
    doc: IAdmin | IUser,
    maxAttempts: number = 5,
    lockDurationMs: number = 15 * 60 * 1000
  ): Promise<void> {
    doc.failedLoginAttempts = (doc.failedLoginAttempts || 0) + 1;
    if (doc.failedLoginAttempts >= maxAttempts) {
      doc.lockUntil = new Date(Date.now() + lockDurationMs);
    }
    await doc.save();
  }

  async resetFailedAttempts(doc: IAdmin | IUser, ip?: string): Promise<void> {
    doc.failedLoginAttempts = 0;
    doc.lockUntil = undefined;
    doc.lastLogin = new Date();
    if (ip) doc.lastLoginIp = ip;
    await doc.save();
  }

  // 3. Refresh Tokens
  async saveRefreshToken(data: {
    tokenHash: string;
    userType: 'ADMIN' | 'USER';
    userId: mongoose.Types.ObjectId;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<IRefreshToken> {
    return RefreshToken.create(data);
  }

  async findRefreshToken(tokenHash: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ tokenHash });
  }

  async revokeRefreshToken(tokenHash: string, replacedBy?: string): Promise<void> {
    await RefreshToken.updateOne(
      { tokenHash },
      {
        revokedAt: new Date(),
        ...(replacedBy ? { replacedByTokenHash: replacedBy } : {}),
      }
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { userId, revokedAt: { $exists: false } },
      { revokedAt: new Date() }
    );
  }

  // 4. Password Reset Tokens
  async savePasswordResetToken(data: {
    tokenHash: string;
    email: string;
    userType: 'ADMIN' | 'USER';
    userId: mongoose.Types.ObjectId;
    expiresAt: Date;
  }): Promise<IPasswordResetToken> {
    // Invalidate prior unused reset tokens for this user
    await PasswordResetToken.updateMany(
      { userId: data.userId, usedAt: { $exists: false } },
      { usedAt: new Date() }
    );
    return PasswordResetToken.create(data);
  }

  async findResetToken(tokenHash: string): Promise<IPasswordResetToken | null> {
    return PasswordResetToken.findOne({ tokenHash });
  }

  async markResetTokenUsed(tokenId: string): Promise<void> {
    await PasswordResetToken.findByIdAndUpdate(tokenId, { usedAt: new Date() });
  }

  // 5. Update Password Hash
  async updateAdminPassword(adminId: string, newPasswordHash: string): Promise<void> {
    await Admin.findByIdAndUpdate(adminId, {
      passwordHash: newPasswordHash,
      failedLoginAttempts: 0,
      lockUntil: undefined,
    });
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      passwordHash: newPasswordHash,
      failedLoginAttempts: 0,
      lockUntil: undefined,
      mustChangePassword: false,
    });
  }
}

export const authRepository = new AuthRepository();
