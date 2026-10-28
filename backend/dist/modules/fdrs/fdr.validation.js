"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fdrQuerySchema = exports.fdrIdParamSchema = exports.updateFdrSchema = exports.createFdrSchema = void 0;
const zod_1 = require("zod");
const instrumentTypes = ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'];
const submissionStatuses = ['DRAFT', 'SUBMITTED', 'RETURNED_FOR_CORRECTION', 'APPROVED'];
const verificationStatuses = ['PENDING', 'UNDER_SCRUTINY', 'VERIFIED', 'REJECTED'];
const lifecycleStatuses = ['ACTIVE', 'MATURED', 'RELEASED', 'CLAIMED', 'CANCELLED'];
const positiveDecimalSchema = zod_1.z.union([
    zod_1.z.number().positive('Deposit amount must be greater than 0'),
    zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/, 'Deposit amount must be a positive decimal with up to 2 decimal places'),
]);
exports.createFdrSchema = {
    body: zod_1.z
        .object({
        institutionId: zod_1.z.string().trim().optional(),
        requirementId: zod_1.z.string().trim().min(1, 'Requirement ID is required'),
        instrumentType: zod_1.z.enum(instrumentTypes).default('FDR'),
        bankName: zod_1.z.string().trim().min(2, 'Bank name is required'),
        bankBranch: zod_1.z.string().trim().min(2, 'Bank branch is required'),
        fdrNumber: zod_1.z.string().trim().min(1, 'FDR / Instrument certificate number is required'),
        holderName: zod_1.z.string().trim().min(2, 'Deposit holder name is required'),
        depositAmount: positiveDecimalSchema,
        issueDate: zod_1.z.coerce.date({
            required_error: 'Issue date is required',
            invalid_type_error: 'Invalid issue date',
        }),
        maturityDate: zod_1.z.coerce.date({
            required_error: 'Maturity date is required',
            invalid_type_error: 'Invalid maturity date',
        }),
        currency: zod_1.z.string().trim().default('INR'),
        isJointAccount: zod_1.z.boolean().default(true),
        autoRenewal: zod_1.z.boolean().default(true),
        interestRate: zod_1.z.number().min(0).max(100).optional(),
        remarks: zod_1.z.string().trim().optional(),
        documentReferences: zod_1.z.array(zod_1.z.string().trim()).optional().default([]),
        saveAsDraft: zod_1.z.boolean().optional().default(false),
    })
        .refine((data) => new Date(data.maturityDate).getTime() > new Date(data.issueDate).getTime(), {
        message: 'Maturity date must be after the issue date',
        path: ['maturityDate'],
    }),
};
exports.updateFdrSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().trim().min(1, 'FDR ID is required'),
    }),
    body: zod_1.z.object({
        bankName: zod_1.z.string().trim().min(2).optional(),
        bankBranch: zod_1.z.string().trim().min(2).optional(),
        fdrNumber: zod_1.z.string().trim().min(1).optional(),
        holderName: zod_1.z.string().trim().min(2).optional(),
        depositAmount: positiveDecimalSchema.optional(),
        issueDate: zod_1.z.coerce.date().optional(),
        maturityDate: zod_1.z.coerce.date().optional(),
        currency: zod_1.z.string().trim().optional(),
        isJointAccount: zod_1.z.boolean().optional(),
        autoRenewal: zod_1.z.boolean().optional(),
        interestRate: zod_1.z.number().min(0).max(100).optional(),
        remarks: zod_1.z.string().trim().optional(),
        documentReferences: zod_1.z.array(zod_1.z.string().trim()).optional(),
        duplicateReviewNotes: zod_1.z.string().trim().optional(),
    }),
};
exports.fdrIdParamSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().trim().min(1, 'FDR ID is required'),
    }),
};
exports.fdrQuerySchema = {
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        institutionId: zod_1.z.string().optional(),
        requirementId: zod_1.z.string().optional(),
        bankName: zod_1.z.string().optional(),
        submissionStatus: zod_1.z.enum(submissionStatuses).optional(),
        verificationStatus: zod_1.z.enum(verificationStatuses).optional(),
        lifecycleStatus: zod_1.z.enum(lifecycleStatuses).optional(),
        isDuplicateFlagged: zod_1.z.string().optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
};
