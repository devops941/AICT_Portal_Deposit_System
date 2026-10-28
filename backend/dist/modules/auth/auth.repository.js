"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = exports.AuthRepository = void 0;
const Admin_model_1 = require("../../models/Admin.model");
const User_model_1 = require("../../models/User.model");
const RefreshToken_model_1 = require("../../models/RefreshToken.model");
const PasswordResetToken_model_1 = require("../../models/PasswordResetToken.model");
class AuthRepository {
    async findAdminByEmail(email) {
        return Admin_model_1.Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    }
    async findUserByEmail(email) {
        return User_model_1.User.findOne({ email: email.toLowerCase() })
            .select('+passwordHash')
            .populate({
            path: 'roles',
            populate: { path: 'permissions' },
        });
    }
    async findAdminById(id) {
        return Admin_model_1.Admin.findById(id);
    }
    async findUserById(id) {
        return User_model_1.User.findById(id).populate({
            path: 'roles',
            populate: { path: 'permissions' },
        });
    }
    async recordFailedAttempt(doc, maxAttempts = 5, lockDurationMs = 15 * 60 * 1000) {
        doc.failedLoginAttempts = (doc.failedLoginAttempts || 0) + 1;
        if (doc.failedLoginAttempts >= maxAttempts) {
            doc.lockUntil = new Date(Date.now() + lockDurationMs);
        }
        await doc.save();
    }
    async resetFailedAttempts(doc, ip) {
        doc.failedLoginAttempts = 0;
        doc.lockUntil = undefined;
        doc.lastLogin = new Date();
        if (ip)
            doc.lastLoginIp = ip;
        await doc.save();
    }
    async saveRefreshToken(data) {
        return RefreshToken_model_1.RefreshToken.create(data);
    }
    async findRefreshToken(tokenHash) {
        return RefreshToken_model_1.RefreshToken.findOne({ tokenHash });
    }
    async revokeRefreshToken(tokenHash, replacedBy) {
        await RefreshToken_model_1.RefreshToken.updateOne({ tokenHash }, {
            revokedAt: new Date(),
            ...(replacedBy ? { replacedByTokenHash: replacedBy } : {}),
        });
    }
    async revokeAllUserTokens(userId) {
        await RefreshToken_model_1.RefreshToken.updateMany({ userId, revokedAt: { $exists: false } }, { revokedAt: new Date() });
    }
    async savePasswordResetToken(data) {
        await PasswordResetToken_model_1.PasswordResetToken.updateMany({ userId: data.userId, usedAt: { $exists: false } }, { usedAt: new Date() });
        return PasswordResetToken_model_1.PasswordResetToken.create(data);
    }
    async findResetToken(tokenHash) {
        return PasswordResetToken_model_1.PasswordResetToken.findOne({ tokenHash });
    }
    async markResetTokenUsed(tokenId) {
        await PasswordResetToken_model_1.PasswordResetToken.findByIdAndUpdate(tokenId, { usedAt: new Date() });
    }
    async updateAdminPassword(adminId, newPasswordHash) {
        await Admin_model_1.Admin.findByIdAndUpdate(adminId, {
            passwordHash: newPasswordHash,
            failedLoginAttempts: 0,
            lockUntil: undefined,
        });
    }
    async updateUserPassword(userId, newPasswordHash) {
        await User_model_1.User.findByIdAndUpdate(userId, {
            passwordHash: newPasswordHash,
            failedLoginAttempts: 0,
            lockUntil: undefined,
            mustChangePassword: false,
        });
    }
}
exports.AuthRepository = AuthRepository;
exports.authRepository = new AuthRepository();
