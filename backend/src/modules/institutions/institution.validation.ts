import { z } from 'zod';

const institutionTypeEnum = z.enum([
  'CENTRAL_UNIVERSITY',
  'STATE_UNIVERSITY',
  'GOVT_ENGINEERING_COLLEGE',
  'GOVT_AIDED_COLLEGE',
  'SELF_FINANCING_PRIVATE',
  'AUTONOMOUS_INSTITUTE',
  'DEEMED_TO_BE_UNIVERSITY',
  'OTHER',
]);

const statusEnum = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);
const verificationStatusEnum = z.enum(['PENDING', 'UNDER_SCRUTINY', 'VERIFIED', 'REJECTED']);

export const createInstitutionSchema = {
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(200),
    code: z
      .string()
      .min(3, 'Code must be at least 3 characters')
      .max(50)
      .regex(/^[A-Za-z0-9\-_]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
    aicteId: z.string().max(50).optional(),
    institutionType: institutionTypeEnum,
    address: z.string().min(5, 'Address must be at least 5 characters').max(300),
    state: z.string().min(2).max(100),
    district: z.string().min(2).max(100),
    pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
    contactEmail: z.string().email('Invalid email address'),
    contactPhone: z.string().min(8, 'Phone number must be at least 8 digits').max(25),
    administratorName: z.string().max(100).optional(),
    administratorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid admin user ID').optional(),
  }),
};

export const updateInstitutionSchema = {
  params: z.object({
    id: z.string().min(1, 'Institution ID is required'),
  }),
  body: z.object({
    name: z.string().min(3).max(200).optional(),
    aicteId: z.string().max(50).optional(),
    institutionType: institutionTypeEnum.optional(),
    address: z.string().min(5).max(300).optional(),
    state: z.string().min(2).max(100).optional(),
    district: z.string().min(2).max(100).optional(),
    pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits').optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().min(8).max(25).optional(),
    administratorName: z.string().max(100).optional(),
    administratorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  }),
};

export const updateStatusSchema = {
  params: z.object({
    id: z.string().min(1, 'Institution ID is required'),
  }),
  body: z.object({
    status: statusEnum,
    reason: z.string().max(300).optional(),
  }),
};

export const verifyInstitutionSchema = {
  params: z.object({
    id: z.string().min(1, 'Institution ID is required'),
  }),
  body: z.object({
    verificationStatus: verificationStatusEnum,
    remarks: z.string().max(500).optional(),
  }),
};

export const addDocumentSchema = {
  params: z.object({
    id: z.string().min(1, 'Institution ID is required'),
  }),
  body: z.object({
    documentType: z.string().min(2).max(100),
    fileName: z.string().min(2).max(200),
    fileUrl: z.string().url('Must be a valid document URL'),
    remarks: z.string().max(300).optional(),
  }),
};

export const institutionIdParamSchema = {
  params: z.object({
    id: z.string().min(1, 'Institution ID is required'),
  }),
};
