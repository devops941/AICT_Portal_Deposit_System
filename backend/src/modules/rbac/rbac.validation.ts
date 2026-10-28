import { z } from 'zod';

export const createRoleSchema = {
  body: z.object({
    name: z
      .string()
      .min(3, 'Role name must be at least 3 characters')
      .max(50)
      .regex(/^[A-Z0-9_]+$/, 'Role name must be uppercase letters, numbers, and underscores only'),
    displayName: z.string().min(2).max(100),
    description: z.string().min(5).max(300),
    permissionIds: z.array(z.string()).min(1, 'At least one permission is required'),
  }),
};

export const updateRoleSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format'),
  }),
  body: z.object({
    displayName: z.string().min(2).max(100).optional(),
    description: z.string().min(5).max(300).optional(),
    permissionIds: z.array(z.string()).min(1).optional(),
  }),
};

export const roleIdParamSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format'),
  }),
};
