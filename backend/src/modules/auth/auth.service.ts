import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError';
import { emailService } from '../../services';
import { authRepository, AuthRepository } from './auth.repository';
import {
  LoginResult,
  RefreshResult,
  ForgotPasswordResult,
  CurrentUserResponse,
} from './auth.types';
import { AuthUserContext } from '../../middleware/auth.middleware';

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}

  // Helper: SHA-256 hash for secure token storage
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Helper: Generate JWT Access Token (15 mins)
  private generateAccessToken(payload: {
    userId: string;
    email: string;
    userType: 'ADMIN' | 'USER';
  }): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
  }

  // Helper: Generate Refresh Token (7 days)
  private generateRefreshTokenString(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  // 1. Unified Login (Checks separate 'Admin' table first, then 'User' table)
  async login(
    email: string,
    passwordPlain: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    const normalizedEmail = email.toLowerCase().trim();

    // A. Check SuperAdmin table ('admins' collection)
    const admin = await this.repository.findAdminByEmail(normalizedEmail);

    if (admin) {
      if (admin.isLocked()) {
        const remainingMin = Math.ceil((admin.lockUntil!.getTime() - Date.now()) / (60 * 1000));
        throw AppError.forbidden(`Admin account is locked due to multiple failed attempts. Try again in ${remainingMin} minute(s).`);
      }
      if (!admin.isActive) {
        throw AppError.forbidden('Administrator account is deactivated. Contact technical administration.');
      }

      const isPasswordValid = await bcrypt.compare(passwordPlain, admin.passwordHash);
      if (!isPasswordValid) {
        await this.repository.recordFailedAttempt(admin, 5, 15 * 60 * 1000);
        throw AppError.unauthorized('Invalid email or password');
      }

      // Successful login
      await this.repository.resetFailedAttempts(admin, ipAddress);

      const userIdStr = admin._id.toString();
      const accessToken = this.generateAccessToken({
        userId: userIdStr,
        email: admin.email,
        userType: 'ADMIN',
      });

      const rawRefreshToken = this.generateRefreshTokenString();
      const tokenHash = this.hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.repository.saveRefreshToken({
        tokenHash,
        userType: 'ADMIN',
        userId: admin._id as mongoose.Types.ObjectId,
        expiresAt,
        ipAddress,
        userAgent,
      });

      return {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: 15 * 60, // 15 minutes
        user: {
          id: userIdStr,
          email: admin.email,
          fullName: admin.fullName,
          userType: 'ADMIN',
          roles: ['SYSTEM_ADMINISTRATOR'],
          permissions: ['*'],
        },
      };
    }

    // B. Check Regular User table ('users' collection)
    const user = await this.repository.findUserByEmail(normalizedEmail);

    if (user) {
      if (user.isLocked()) {
        const remainingMin = Math.ceil((user.lockUntil!.getTime() - Date.now()) / (60 * 1000));
        throw AppError.forbidden(`Account is temporarily locked due to multiple failed attempts. Try again in ${remainingMin} minute(s).`);
      }
      if (user.status !== 'ACTIVE') {
        throw AppError.forbidden(`Your account is currently ${user.status.toLowerCase()}. Contact your institution administrator.`);
      }

      const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
      if (!isPasswordValid) {
        await this.repository.recordFailedAttempt(user, 5, 15 * 60 * 1000);
        throw AppError.unauthorized('Invalid email or password');
      }

      // Successful login
      await this.repository.resetFailedAttempts(user, ipAddress);

      const userIdStr = user._id.toString();
      const accessToken = this.generateAccessToken({
        userId: userIdStr,
        email: user.email,
        userType: 'USER',
      });

      const rawRefreshToken = this.generateRefreshTokenString();
      const tokenHash = this.hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.repository.saveRefreshToken({
        tokenHash,
        userType: 'USER',
        userId: user._id as mongoose.Types.ObjectId,
        expiresAt,
        ipAddress,
        userAgent,
      });

      // Extract populated roles and permissions
      const roleNames = user.roles.map((r) => r.name);
      const permissionCodes = new Set<string>();
      for (const role of user.roles) {
        if (Array.isArray(role.permissions)) {
          for (const p of role.permissions) {
            if (p && p.code) permissionCodes.add(p.code);
          }
        }
      }

      return {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: 15 * 60,
        user: {
          id: userIdStr,
          email: user.email,
          fullName: user.fullName,
          userType: 'USER',
          roles: roleNames,
          permissions: Array.from(permissionCodes),
          institutionId: user.institutionId,
        },
      };
    }

    // C. Not found in either collection
    throw AppError.unauthorized('Invalid email or password');
  }

  // 2. Refresh Token Rotation
  async refreshAccessToken(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RefreshResult> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const tokenDoc = await this.repository.findRefreshToken(tokenHash);

    if (!tokenDoc) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // Token Reuse Detection
    if (tokenDoc.revokedAt) {
      // Possible compromise: Revoke all tokens for this user immediately!
      await this.repository.revokeAllUserTokens(tokenDoc.userId.toString());
      throw AppError.forbidden('Compromised refresh token detected. All active sessions have been terminated.');
    }

    if (tokenDoc.isExpired()) {
      throw AppError.unauthorized('Refresh token has expired. Please log in again.');
    }

    // Look up user/admin to verify active status
    let email = '';
    if (tokenDoc.userType === 'ADMIN') {
      const admin = await this.repository.findAdminById(tokenDoc.userId.toString());
      if (!admin || !admin.isActive) throw AppError.unauthorized('Administrator account unavailable');
      email = admin.email;
    } else {
      const user = await this.repository.findUserById(tokenDoc.userId.toString());
      if (!user || user.status !== 'ACTIVE') throw AppError.unauthorized('User account unavailable');
      email = user.email;
    }

    // Generate new Access and Refresh tokens (Rotation)
    const newAccessToken = this.generateAccessToken({
      userId: tokenDoc.userId.toString(),
      email,
      userType: tokenDoc.userType,
    });

    const newRawRefreshToken = this.generateRefreshTokenString();
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Revoke old token and link to new token
    await this.repository.revokeRefreshToken(tokenHash, newTokenHash);

    // Save newly rotated refresh token
    await this.repository.saveRefreshToken({
      tokenHash: newTokenHash,
      userType: tokenDoc.userType,
      userId: tokenDoc.userId,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 15 * 60,
    };
  }

  // 3. Logout (Revoke Refresh Token)
  async logout(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.repository.revokeRefreshToken(tokenHash);
  }

  // 4. Forgot Password
  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    const normalizedEmail = email.toLowerCase().trim();

    let userType: 'ADMIN' | 'USER' = 'USER';
    let userId: mongoose.Types.ObjectId | null = null;

    const admin = await this.repository.findAdminByEmail(normalizedEmail);
    if (admin) {
      userType = 'ADMIN';
      userId = admin._id as mongoose.Types.ObjectId;
    } else {
      const user = await this.repository.findUserByEmail(normalizedEmail);
      if (user) {
        userType = 'USER';
        userId = user._id as mongoose.Types.ObjectId;
      }
    }

    // Always respond with positive generic message to prevent user enumeration
    if (!userId) {
      return {
        message: 'If an account with that email exists, password reset instructions have been sent.',
      };
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await this.repository.savePasswordResetToken({
      tokenHash,
      email: normalizedEmail,
      userType,
      userId,
      expiresAt,
    });

    // Send reset instructions via email service
    await emailService.sendEmail(
      normalizedEmail,
      'Password Reset Request - AICTE Security Deposit Portal',
      `<p>Your password reset token is: <strong>${rawResetToken}</strong></p>`
    );

    return {
      message: 'If an account with that email exists, password reset instructions have been sent.',
      ...(env.NODE_ENV !== 'production' ? { resetToken: rawResetToken } : {}),
    };
  }

  // 5. Reset Password
  async resetPassword(rawResetToken: string, newPasswordPlain: string): Promise<void> {
    const tokenHash = this.hashToken(rawResetToken);
    const resetDoc = await this.repository.findResetToken(tokenHash);

    if (!resetDoc || !resetDoc.isValid()) {
      throw AppError.badRequest('Password reset token is invalid or has expired');
    }

    const newPasswordHash = await bcrypt.hash(newPasswordPlain, 12);

    if (resetDoc.userType === 'ADMIN') {
      await this.repository.updateAdminPassword(resetDoc.userId.toString(), newPasswordHash);
    } else {
      await this.repository.updateUserPassword(resetDoc.userId.toString(), newPasswordHash);
    }

    await this.repository.markResetTokenUsed(resetDoc._id.toString());
    // Revoke all active sessions on password reset
    await this.repository.revokeAllUserTokens(resetDoc.userId.toString());
  }

  // 6. Change Password (Authenticated)
  async changePassword(
    currentUser: AuthUserContext,
    currentPasswordPlain: string,
    newPasswordPlain: string
  ): Promise<void> {
    if (currentUser.userType === 'ADMIN') {
      const admin = await this.repository.findAdminByEmail(currentUser.email);
      if (!admin) throw AppError.notFound('Administrator account not found');

      const isCurrentValid = await bcrypt.compare(currentPasswordPlain, admin.passwordHash);
      if (!isCurrentValid) throw AppError.badRequest('Current password is incorrect');

      const newPasswordHash = await bcrypt.hash(newPasswordPlain, 12);
      await this.repository.updateAdminPassword(admin._id.toString(), newPasswordHash);
    } else {
      const user = await this.repository.findUserByEmail(currentUser.email);
      if (!user) throw AppError.notFound('User account not found');

      const isCurrentValid = await bcrypt.compare(currentPasswordPlain, user.passwordHash);
      if (!isCurrentValid) throw AppError.badRequest('Current password is incorrect');

      const newPasswordHash = await bcrypt.hash(newPasswordPlain, 12);
      await this.repository.updateUserPassword(user._id.toString(), newPasswordHash);
    }

    // Revoke all active refresh tokens so other sessions must re-authenticate
    await this.repository.revokeAllUserTokens(currentUser.id);
  }

  // 7. Get Current User Profile
  async getCurrentUser(currentUser: AuthUserContext): Promise<CurrentUserResponse> {
    return {
      id: currentUser.id,
      email: currentUser.email,
      fullName: currentUser.fullName,
      userType: currentUser.userType,
      roles: currentUser.roles,
      permissions: currentUser.permissions,
      institutionId: currentUser.institutionId,
    };
  }
}

export const authService = new AuthService();
