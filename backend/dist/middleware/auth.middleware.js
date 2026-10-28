"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInstitutionAccess = exports.authorizePermissions = exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const appError_1 = require("../utils/appError");
const Admin_model_1 = require("../models/Admin.model");
const User_model_1 = require("../models/User.model");
const authenticateToken = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        return next(appError_1.AppError.unauthorized('Authentication token is required'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        if (decoded.userType === 'ADMIN') {
            const admin = await Admin_model_1.Admin.findById(decoded.userId);
            if (!admin) {
                return next(appError_1.AppError.unauthorized('Administrator account not found'));
            }
            if (!admin.isActive) {
                return next(appError_1.AppError.forbidden('Administrator account is deactivated'));
            }
            if (admin.isLocked()) {
                return next(appError_1.AppError.forbidden('Administrator account is temporarily locked due to failed attempts'));
            }
            req.user = {
                id: admin._id.toString(),
                email: admin.email,
                fullName: admin.fullName,
                userType: 'ADMIN',
                roles: ['SYSTEM_ADMINISTRATOR'],
                permissions: ['*'],
                institutionId: undefined,
            };
            return next();
        }
        const user = await User_model_1.User.findById(decoded.userId).populate({
            path: 'roles',
            populate: {
                path: 'permissions',
            },
        });
        if (!user) {
            return next(appError_1.AppError.unauthorized('User account not found'));
        }
        if (user.status !== 'ACTIVE') {
            return next(appError_1.AppError.forbidden(`Your account is currently ${user.status.toLowerCase()}`));
        }
        if (user.isLocked()) {
            return next(appError_1.AppError.forbidden('User account is temporarily locked due to multiple failed login attempts'));
        }
        const roleNames = [];
        const permissionCodes = new Set();
        for (const role of user.roles) {
            if (typeof role === 'object' && role.name) {
                roleNames.push(role.name);
                if (Array.isArray(role.permissions)) {
                    for (const perm of role.permissions) {
                        if (typeof perm === 'object' && perm.code) {
                            permissionCodes.add(perm.code);
                        }
                    }
                }
            }
        }
        req.user = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            userType: 'USER',
            roles: roleNames,
            permissions: Array.from(permissionCodes),
            institutionId: user.institutionId,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateToken = authenticateToken;
const authorizeRoles = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(appError_1.AppError.unauthorized());
        }
        if (req.user.userType === 'ADMIN' || req.user.roles.includes('SYSTEM_ADMINISTRATOR')) {
            return next();
        }
        const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
        if (!hasRole) {
            return next(appError_1.AppError.forbidden(`Access restricted to roles: [${allowedRoles.join(', ')}]`));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
const authorizePermissions = (...requiredPermissions) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(appError_1.AppError.unauthorized());
        }
        if (req.user.permissions.includes('*')) {
            return next();
        }
        const hasAllPermissions = requiredPermissions.every((perm) => req.user.permissions.includes(perm));
        if (!hasAllPermissions) {
            return next(appError_1.AppError.forbidden(`Missing required permission: [${requiredPermissions.join(', ')}]`));
        }
        next();
    };
};
exports.authorizePermissions = authorizePermissions;
const checkInstitutionAccess = (targetInstitutionId) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(appError_1.AppError.unauthorized());
        }
        if (req.user.userType === 'ADMIN' || req.user.roles.includes('SYSTEM_ADMINISTRATOR')) {
            return next();
        }
        const requestedInstId = targetInstitutionId || req.params.institutionId || req.body.institutionId;
        if (requestedInstId && req.user.institutionId && req.user.institutionId !== requestedInstId) {
            return next(appError_1.AppError.forbidden('Institution data isolation policy violation: Cross-tenant access denied'));
        }
        next();
    };
};
exports.checkInstitutionAccess = checkInstitutionAccess;
