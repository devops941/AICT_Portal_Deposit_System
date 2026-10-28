"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const passwordValidation = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
exports.loginSchema = {
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address format'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
};
exports.refreshSchema = {
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
};
exports.forgotPasswordSchema = {
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address format'),
    }),
};
exports.resetPasswordSchema = {
    body: zod_1.z
        .object({
        token: zod_1.z.string().min(1, 'Reset token is required'),
        newPassword: passwordValidation,
        confirmPassword: zod_1.z.string().min(1, 'Password confirmation is required'),
    })
        .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'New password and confirmation password do not match',
        path: ['confirmPassword'],
    }),
};
exports.changePasswordSchema = {
    body: zod_1.z
        .object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: passwordValidation,
        confirmPassword: zod_1.z.string().min(1, 'Password confirmation is required'),
    })
        .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'New password and confirmation password do not match',
        path: ['confirmPassword'],
    }),
};
