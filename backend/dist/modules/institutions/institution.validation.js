"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionIdParamSchema = exports.addDocumentSchema = exports.verifyInstitutionSchema = exports.updateStatusSchema = exports.updateInstitutionSchema = exports.createInstitutionSchema = void 0;
const zod_1 = require("zod");
const institutionTypeEnum = zod_1.z.enum([
    'CENTRAL_UNIVERSITY',
    'STATE_UNIVERSITY',
    'GOVT_ENGINEERING_COLLEGE',
    'GOVT_AIDED_COLLEGE',
    'SELF_FINANCING_PRIVATE',
    'AUTONOMOUS_INSTITUTE',
    'DEEMED_TO_BE_UNIVERSITY',
    'OTHER',
]);
const statusEnum = zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);
const verificationStatusEnum = zod_1.z.enum(['PENDING', 'UNDER_SCRUTINY', 'VERIFIED', 'REJECTED']);
exports.createInstitutionSchema = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(3, 'Name must be at least 3 characters').max(200),
        code: zod_1.z
            .string()
            .min(3, 'Code must be at least 3 characters')
            .max(50)
            .regex(/^[A-Za-z0-9\-_]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
        aicteId: zod_1.z.string().max(50).optional(),
        institutionType: institutionTypeEnum,
        address: zod_1.z.string().min(5, 'Address must be at least 5 characters').max(300),
        state: zod_1.z.string().min(2).max(100),
        district: zod_1.z.string().min(2).max(100),
        pincode: zod_1.z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
        contactEmail: zod_1.z.string().email('Invalid email address'),
        contactPhone: zod_1.z.string().min(8, 'Phone number must be at least 8 digits').max(25),
        administratorName: zod_1.z.string().max(100).optional(),
        administratorId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid admin user ID').optional(),
    }),
};
exports.updateInstitutionSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Institution ID is required'),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(3).max(200).optional(),
        aicteId: zod_1.z.string().max(50).optional(),
        institutionType: institutionTypeEnum.optional(),
        address: zod_1.z.string().min(5).max(300).optional(),
        state: zod_1.z.string().min(2).max(100).optional(),
        district: zod_1.z.string().min(2).max(100).optional(),
        pincode: zod_1.z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits').optional(),
        contactEmail: zod_1.z.string().email().optional(),
        contactPhone: zod_1.z.string().min(8).max(25).optional(),
        administratorName: zod_1.z.string().max(100).optional(),
        administratorId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    }),
};
exports.updateStatusSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Institution ID is required'),
    }),
    body: zod_1.z.object({
        status: statusEnum,
        reason: zod_1.z.string().max(300).optional(),
    }),
};
exports.verifyInstitutionSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Institution ID is required'),
    }),
    body: zod_1.z.object({
        verificationStatus: verificationStatusEnum,
        remarks: zod_1.z.string().max(500).optional(),
    }),
};
exports.addDocumentSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Institution ID is required'),
    }),
    body: zod_1.z.object({
        documentType: zod_1.z.string().min(2).max(100),
        fileName: zod_1.z.string().min(2).max(200),
        fileUrl: zod_1.z.string().url('Must be a valid document URL'),
        remarks: zod_1.z.string().max(300).optional(),
    }),
};
exports.institutionIdParamSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Institution ID is required'),
    }),
};
