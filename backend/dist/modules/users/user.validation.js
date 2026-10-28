"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdParamSchema = exports.updateUserStatusSchema = exports.updateUserSchema = exports.createUserSchema = exports.userListQuerySchema = void 0;
const zod_1 = require("zod");
exports.userListQuerySchema = {
    query: zod_1.z.object({
        page: zod_1.z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
        limit: zod_1.z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
        search: zod_1.z.string().optional(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']).optional(),
        roleId: zod_1.z.string().optional(),
        institutionId: zod_1.z.string().optional(),
    }),
};
exports.createUserSchema = {
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').max(100),
        email: zod_1.z.string().email('Invalid email address format'),
        phone: zod_1.z.string().min(7, 'Valid phone number is required'),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .optional(),
        institutionId: zod_1.z.string().optional(),
        roleIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one role assignment is required'),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']).optional(),
    }),
};
exports.updateUserSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
    }),
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(100).optional(),
        phone: zod_1.z.string().min(7).optional(),
        institutionId: zod_1.z.string().optional(),
        roleIds: zod_1.z.array(zod_1.z.string()).min(1).optional(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']).optional(),
    }),
};
exports.updateUserStatusSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']),
    }),
};
exports.userIdParamSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
    }),
};
