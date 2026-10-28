"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const appError_1 = require("../../utils/appError");
const services_1 = require("../../services");
const Admin_model_1 = require("../../models/Admin.model");
const RefreshToken_model_1 = require("../../models/RefreshToken.model");
const user_repository_1 = require("./user.repository");
class UserService {
    repository;
    constructor(repository = user_repository_1.userRepository) {
        this.repository = repository;
    }
    mapToResponse(user) {
        return {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            institutionId: user.institutionId,
            roles: (user.roles || []).map((r) => ({
                id: r._id?.toString() || '',
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
    async getUsers(query, currentUser) {
        const accessibleInstitutionId = currentUser.userType === 'ADMIN' || currentUser.roles.includes('SYSTEM_ADMINISTRATOR')
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
    async getUserById(id, currentUser) {
        const user = await this.repository.findById(id);
        if (!user)
            throw appError_1.AppError.notFound('User not found');
        if (currentUser.userType !== 'ADMIN' &&
            !currentUser.roles.includes('SYSTEM_ADMINISTRATOR') &&
            user.institutionId &&
            user.institutionId !== currentUser.institutionId) {
            throw appError_1.AppError.forbidden('Access to user record outside your institution is denied');
        }
        return this.mapToResponse(user);
    }
    async createUser(input, currentUser) {
        const normalizedEmail = input.email.toLowerCase().trim();
        const existingUser = await this.repository.findByEmail(normalizedEmail);
        const existingAdmin = await Admin_model_1.Admin.findOne({ email: normalizedEmail });
        if (existingUser || existingAdmin) {
            throw appError_1.AppError.conflict('An account with this email address already exists');
        }
        let finalInstitutionId = input.institutionId;
        if (currentUser.userType !== 'ADMIN' &&
            !currentUser.roles.includes('SYSTEM_ADMINISTRATOR')) {
            finalInstitutionId = currentUser.institutionId;
        }
        const plainPassword = input.password || `${crypto_1.default.randomBytes(4).toString('hex')}@AICTE1`;
        const passwordHash = await bcryptjs_1.default.hash(plainPassword, 12);
        const created = await this.repository.create({
            ...input,
            email: normalizedEmail,
            institutionId: finalInstitutionId,
            passwordHash,
        });
        await services_1.emailService.sendEmail(normalizedEmail, 'Welcome to AICTE Security Deposit Portal - Temporary Password', `<p>Hello ${input.fullName},</p><p>Your account has been created. Your temporary password is: <strong>${plainPassword}</strong></p>`);
        return this.mapToResponse(created);
    }
    async updateUser(id, input, currentUser) {
        const user = await this.repository.findById(id);
        if (!user)
            throw appError_1.AppError.notFound('User not found');
        if (currentUser.userType !== 'ADMIN' &&
            !currentUser.roles.includes('SYSTEM_ADMINISTRATOR') &&
            user.institutionId &&
            user.institutionId !== currentUser.institutionId) {
            throw appError_1.AppError.forbidden('Access to modify user record outside your institution is denied');
        }
        const updated = await this.repository.update(id, input);
        return this.mapToResponse(updated);
    }
    async updateUserStatus(id, status, currentUser) {
        const user = await this.repository.findById(id);
        if (!user)
            throw appError_1.AppError.notFound('User not found');
        if (currentUser.userType !== 'ADMIN' &&
            !currentUser.roles.includes('SYSTEM_ADMINISTRATOR') &&
            user.institutionId &&
            user.institutionId !== currentUser.institutionId) {
            throw appError_1.AppError.forbidden('Access to change user status outside your institution is denied');
        }
        const updated = await this.repository.updateStatus(id, status);
        if (status !== 'ACTIVE') {
            await RefreshToken_model_1.RefreshToken.updateMany({ userId: id }, { revokedAt: new Date() });
        }
        return this.mapToResponse(updated);
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
