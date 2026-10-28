"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const appError_1 = require("../../utils/appError");
const services_1 = require("../../services");
const auth_repository_1 = require("./auth.repository");
class AuthService {
    repository;
    constructor(repository = auth_repository_1.authRepository) {
        this.repository = repository;
    }
    hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, {
            expiresIn: '15m',
        });
    }
    generateRefreshTokenString() {
        return crypto_1.default.randomBytes(40).toString('hex');
    }
    async login(email, passwordPlain, ipAddress, userAgent) {
        const normalizedEmail = email.toLowerCase().trim();
        const admin = await this.repository.findAdminByEmail(normalizedEmail);
        if (admin) {
            if (admin.isLocked()) {
                const remainingMin = Math.ceil((admin.lockUntil.getTime() - Date.now()) / (60 * 1000));
                throw appError_1.AppError.forbidden(`Admin account is locked due to multiple failed attempts. Try again in ${remainingMin} minute(s).`);
            }
            if (!admin.isActive) {
                throw appError_1.AppError.forbidden('Administrator account is deactivated. Contact technical administration.');
            }
            const isPasswordValid = await bcryptjs_1.default.compare(passwordPlain, admin.passwordHash);
            if (!isPasswordValid) {
                await this.repository.recordFailedAttempt(admin, 5, 15 * 60 * 1000);
                throw appError_1.AppError.unauthorized('Invalid email or password');
            }
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
                userId: admin._id,
                expiresAt,
                ipAddress,
                userAgent,
            });
            return {
                accessToken,
                refreshToken: rawRefreshToken,
                expiresIn: 15 * 60,
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
        const user = await this.repository.findUserByEmail(normalizedEmail);
        if (user) {
            if (user.isLocked()) {
                const remainingMin = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
                throw appError_1.AppError.forbidden(`Account is temporarily locked due to multiple failed attempts. Try again in ${remainingMin} minute(s).`);
            }
            if (user.status !== 'ACTIVE') {
                throw appError_1.AppError.forbidden(`Your account is currently ${user.status.toLowerCase()}. Contact your institution administrator.`);
            }
            const isPasswordValid = await bcryptjs_1.default.compare(passwordPlain, user.passwordHash);
            if (!isPasswordValid) {
                await this.repository.recordFailedAttempt(user, 5, 15 * 60 * 1000);
                throw appError_1.AppError.unauthorized('Invalid email or password');
            }
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
                userId: user._id,
                expiresAt,
                ipAddress,
                userAgent,
            });
            const roleNames = user.roles.map((r) => r.name);
            const permissionCodes = new Set();
            for (const role of user.roles) {
                if (Array.isArray(role.permissions)) {
                    for (const p of role.permissions) {
                        if (p && p.code)
                            permissionCodes.add(p.code);
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
        throw appError_1.AppError.unauthorized('Invalid email or password');
    }
    async refreshAccessToken(rawRefreshToken, ipAddress, userAgent) {
        const tokenHash = this.hashToken(rawRefreshToken);
        const tokenDoc = await this.repository.findRefreshToken(tokenHash);
        if (!tokenDoc) {
            throw appError_1.AppError.unauthorized('Invalid refresh token');
        }
        if (tokenDoc.revokedAt) {
            await this.repository.revokeAllUserTokens(tokenDoc.userId.toString());
            throw appError_1.AppError.forbidden('Compromised refresh token detected. All active sessions have been terminated.');
        }
        if (tokenDoc.isExpired()) {
            throw appError_1.AppError.unauthorized('Refresh token has expired. Please log in again.');
        }
        let email = '';
        if (tokenDoc.userType === 'ADMIN') {
            const admin = await this.repository.findAdminById(tokenDoc.userId.toString());
            if (!admin || !admin.isActive)
                throw appError_1.AppError.unauthorized('Administrator account unavailable');
            email = admin.email;
        }
        else {
            const user = await this.repository.findUserById(tokenDoc.userId.toString());
            if (!user || user.status !== 'ACTIVE')
                throw appError_1.AppError.unauthorized('User account unavailable');
            email = user.email;
        }
        const newAccessToken = this.generateAccessToken({
            userId: tokenDoc.userId.toString(),
            email,
            userType: tokenDoc.userType,
        });
        const newRawRefreshToken = this.generateRefreshTokenString();
        const newTokenHash = this.hashToken(newRawRefreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.repository.revokeRefreshToken(tokenHash, newTokenHash);
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
    async logout(rawRefreshToken) {
        if (!rawRefreshToken)
            return;
        const tokenHash = this.hashToken(rawRefreshToken);
        await this.repository.revokeRefreshToken(tokenHash);
    }
    async forgotPassword(email) {
        const normalizedEmail = email.toLowerCase().trim();
        let userType = 'USER';
        let userId = null;
        const admin = await this.repository.findAdminByEmail(normalizedEmail);
        if (admin) {
            userType = 'ADMIN';
            userId = admin._id;
        }
        else {
            const user = await this.repository.findUserByEmail(normalizedEmail);
            if (user) {
                userType = 'USER';
                userId = user._id;
            }
        }
        if (!userId) {
            return {
                message: 'If an account with that email exists, password reset instructions have been sent.',
            };
        }
        const rawResetToken = crypto_1.default.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(rawResetToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.repository.savePasswordResetToken({
            tokenHash,
            email: normalizedEmail,
            userType,
            userId,
            expiresAt,
        });
        await services_1.emailService.sendEmail(normalizedEmail, 'Password Reset Request - AICTE Security Deposit Portal', `<p>Your password reset token is: <strong>${rawResetToken}</strong></p>`);
        return {
            message: 'If an account with that email exists, password reset instructions have been sent.',
            ...(env_1.env.NODE_ENV !== 'production' ? { resetToken: rawResetToken } : {}),
        };
    }
    async resetPassword(rawResetToken, newPasswordPlain) {
        const tokenHash = this.hashToken(rawResetToken);
        const resetDoc = await this.repository.findResetToken(tokenHash);
        if (!resetDoc || !resetDoc.isValid()) {
            throw appError_1.AppError.badRequest('Password reset token is invalid or has expired');
        }
        const newPasswordHash = await bcryptjs_1.default.hash(newPasswordPlain, 12);
        if (resetDoc.userType === 'ADMIN') {
            await this.repository.updateAdminPassword(resetDoc.userId.toString(), newPasswordHash);
        }
        else {
            await this.repository.updateUserPassword(resetDoc.userId.toString(), newPasswordHash);
        }
        await this.repository.markResetTokenUsed(resetDoc._id.toString());
        await this.repository.revokeAllUserTokens(resetDoc.userId.toString());
    }
    async changePassword(currentUser, currentPasswordPlain, newPasswordPlain) {
        if (currentUser.userType === 'ADMIN') {
            const admin = await this.repository.findAdminByEmail(currentUser.email);
            if (!admin)
                throw appError_1.AppError.notFound('Administrator account not found');
            const isCurrentValid = await bcryptjs_1.default.compare(currentPasswordPlain, admin.passwordHash);
            if (!isCurrentValid)
                throw appError_1.AppError.badRequest('Current password is incorrect');
            const newPasswordHash = await bcryptjs_1.default.hash(newPasswordPlain, 12);
            await this.repository.updateAdminPassword(admin._id.toString(), newPasswordHash);
        }
        else {
            const user = await this.repository.findUserByEmail(currentUser.email);
            if (!user)
                throw appError_1.AppError.notFound('User account not found');
            const isCurrentValid = await bcryptjs_1.default.compare(currentPasswordPlain, user.passwordHash);
            if (!isCurrentValid)
                throw appError_1.AppError.badRequest('Current password is incorrect');
            const newPasswordHash = await bcryptjs_1.default.hash(newPasswordPlain, 12);
            await this.repository.updateUserPassword(user._id.toString(), newPasswordHash);
        }
        await this.repository.revokeAllUserTokens(currentUser.id);
    }
    async getCurrentUser(currentUser) {
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
exports.AuthService = AuthService;
exports.authService = new AuthService();
