"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementQuerySchema = exports.verifyInstrumentSchema = exports.pledgeInstrumentSchema = exports.requirementIdParamSchema = exports.updateRequirementSchema = exports.createRequirementSchema = void 0;
const zod_1 = require("zod");
const requirementTypes = [
    'NEW_INSTITUTION_ESTABLISHMENT',
    'PROGRAM_EXPANSION',
    'ANNUAL_COMPLIANCE',
    'PENALTY_ESCROW',
    'ADDITIONAL_COURSE_INSPECTION',
    'LAND_DEFICIENCY_ESCROW',
];
const instrumentTypes = ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'];
const requirementStatuses = ['ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED', 'WAIVED'];
const complianceStatuses = [
    'NOT_SUBMITTED',
    'PARTIALLY_COMPLIANT',
    'COMPLIANT',
    'OVERDUE',
    'UNDER_REVIEW',
];
const positiveDecimalSchema = zod_1.z.union([
    zod_1.z.number().positive('Amount must be greater than 0'),
    zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive financial decimal with up to 2 decimal places'),
]);
exports.createRequirementSchema = {
    body: zod_1.z.object({
        requirementId: zod_1.z.string().trim().optional(),
        institutionId: zod_1.z.string().trim().min(1, 'Institution ID is required'),
        title: zod_1.z.string().trim().min(3, 'Title must be at least 3 characters').max(250, 'Title cannot exceed 250 characters'),
        requirementType: zod_1.z.enum(requirementTypes, {
            errorMap: () => ({ message: 'Invalid requirement type' }),
        }),
        requiredAmount: positiveDecimalSchema,
        currency: zod_1.z.string().trim().default('INR'),
        effectiveDate: zod_1.z.coerce.date().optional(),
        submissionDeadline: zod_1.z.coerce.date({
            required_error: 'Submission deadline is required',
            invalid_type_error: 'Invalid submission deadline date',
        }),
        applicableRuleReference: zod_1.z.string().trim().min(1, 'Applicable rule reference is required'),
        acceptableInstrumentTypes: zod_1.z.array(zod_1.z.enum(instrumentTypes)).min(1, 'At least one acceptable instrument type is required'),
        supportingDocumentRequirements: zod_1.z.array(zod_1.z.string().trim()).optional().default([]),
        applicableBusinessRules: zod_1.z.array(zod_1.z.string().trim()).optional().default([]),
    }),
};
exports.updateRequirementSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().trim().min(1, 'Requirement ID is required'),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().trim().min(3).max(250).optional(),
        requirementType: zod_1.z.enum(requirementTypes).optional(),
        requiredAmount: positiveDecimalSchema.optional(),
        currency: zod_1.z.string().trim().optional(),
        effectiveDate: zod_1.z.coerce.date().optional(),
        submissionDeadline: zod_1.z.coerce.date().optional(),
        applicableRuleReference: zod_1.z.string().trim().optional(),
        acceptableInstrumentTypes: zod_1.z.array(zod_1.z.enum(instrumentTypes)).min(1).optional(),
        supportingDocumentRequirements: zod_1.z.array(zod_1.z.string().trim()).optional(),
        applicableBusinessRules: zod_1.z.array(zod_1.z.string().trim()).optional(),
        requirementStatus: zod_1.z.enum(requirementStatuses).optional(),
        complianceStatus: zod_1.z.enum(complianceStatuses).optional(),
    }),
};
exports.requirementIdParamSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().trim().min(1, 'Requirement ID is required'),
    }),
};
exports.pledgeInstrumentSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().trim().min(1, 'Requirement ID is required'),
    }),
    body: zod_1.z.object({
        instrumentId: zod_1.z.string().trim().min(1, 'Instrument reference ID / FDR Number is required'),
        instrumentType: zod_1.z.enum(instrumentTypes, {
            errorMap: () => ({ message: 'Invalid instrument type' }),
        }),
        bankName: zod_1.z.string().trim().min(2, 'Bank name is required'),
        branchName: zod_1.z.string().trim().min(2, 'Branch name is required'),
        amount: positiveDecimalSchema,
        maturityDate: zod_1.z.coerce.date({
            required_error: 'Maturity date is required',
            invalid_type_error: 'Invalid maturity date',
        }),
        isJointAccount: zod_1.z.boolean().default(true),
        remarks: zod_1.z.string().trim().optional(),
    }),
};
exports.verifyInstrumentSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().trim().min(1, 'Requirement ID is required'),
        instrumentId: zod_1.z.string().trim().min(1, 'Instrument ID is required'),
    }),
    body: zod_1.z.object({
        verificationStatus: zod_1.z.enum(['VERIFIED', 'REJECTED']),
        remarks: zod_1.z.string().trim().optional(),
    }),
};
exports.requirementQuerySchema = {
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        institutionId: zod_1.z.string().optional(),
        requirementType: zod_1.z.enum(requirementTypes).optional(),
        requirementStatus: zod_1.z.enum(requirementStatuses).optional(),
        complianceStatus: zod_1.z.enum(complianceStatuses).optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
};
