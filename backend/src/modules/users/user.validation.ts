import { z } from 'zod';

export const userListQuerySchema = {
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']).optional(),
    roleId: z.string().optional(),
    institutionId: z.string().optional(),
  }),
};

export const createUserSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address format'),
    phone: z.string().min(7, 'Valid phone number is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional(), // If not provided, a secure random password is generated
    institutionId: z.string().optional(),
    roleIds: z.array(z.string()).min(1, 'At least one role assignment is required'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']).optional(),
  }),
};

export const updateUserSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    phone: z.string().min(7).optional(),
    institutionId: z.string().optional(),
    roleIds: z.array(z.string()).min(1).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']).optional(),
  }),
};

export const updateUserStatusSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']),
  }),
};

export const userIdParamSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
};
