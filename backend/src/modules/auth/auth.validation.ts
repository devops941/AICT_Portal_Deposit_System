import { z } from 'zod';

const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email address format'),
  }),
};

export const resetPasswordSchema = {
  body: z
    .object({
      token: z.string().min(1, 'Reset token is required'),
      newPassword: passwordValidation,
      confirmPassword: z.string().min(1, 'Password confirmation is required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'New password and confirmation password do not match',
      path: ['confirmPassword'],
    }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: passwordValidation,
      confirmPassword: z.string().min(1, 'Password confirmation is required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'New password and confirmation password do not match',
      path: ['confirmPassword'],
    }),
};

export type LoginInput = z.infer<typeof loginSchema.body>;
export type RefreshInput = z.infer<typeof refreshSchema.body>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema.body>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema.body>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema.body>;
