"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleIdParamSchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
exports.createRoleSchema = {
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(3, 'Role name must be at least 3 characters')
            .max(50)
            .regex(/^[A-Z0-9_]+$/, 'Role name must be uppercase letters, numbers, and underscores only'),
        displayName: zod_1.z.string().min(2).max(100),
        description: zod_1.z.string().min(5).max(300),
        permissionIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one permission is required'),
    }),
};
exports.updateRoleSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format'),
    }),
    body: zod_1.z.object({
        displayName: zod_1.z.string().min(2).max(100).optional(),
        description: zod_1.z.string().min(5).max(300).optional(),
        permissionIds: zod_1.z.array(zod_1.z.string()).min(1).optional(),
    }),
};
exports.roleIdParamSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format'),
    }),
};
