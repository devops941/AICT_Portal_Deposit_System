import { z } from 'zod';

const requirementTypes = [
  'NEW_INSTITUTION_ESTABLISHMENT',
  'PROGRAM_EXPANSION',
  'ANNUAL_COMPLIANCE',
  'PENALTY_ESCROW',
  'ADDITIONAL_COURSE_INSPECTION',
  'LAND_DEFICIENCY_ESCROW',
] as const;

const instrumentTypes = ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'] as const;

const requirementStatuses = ['ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED', 'WAIVED'] as const;

const complianceStatuses = [
  'NOT_SUBMITTED',
  'PARTIALLY_COMPLIANT',
  'COMPLIANT',
  'OVERDUE',
  'UNDER_REVIEW',
] as const;

// Validation for financial decimal string/number
const positiveDecimalSchema = z.union([
  z.number().positive('Amount must be greater than 0'),
  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive financial decimal with up to 2 decimal places'),
]);

export const createRequirementSchema = {
  body: z.object({
    requirementId: z.string().trim().optional(),
    institutionId: z.string().trim().min(1, 'Institution ID is required'),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(250, 'Title cannot exceed 250 characters'),
    requirementType: z.enum(requirementTypes, {
      errorMap: () => ({ message: 'Invalid requirement type' }),
    }),
    requiredAmount: positiveDecimalSchema,
    currency: z.string().trim().default('INR'),
    effectiveDate: z.coerce.date().optional(),
    submissionDeadline: z.coerce.date({
      required_error: 'Submission deadline is required',
      invalid_type_error: 'Invalid submission deadline date',
    }),
    applicableRuleReference: z.string().trim().min(1, 'Applicable rule reference is required'),
    acceptableInstrumentTypes: z.array(z.enum(instrumentTypes)).min(1, 'At least one acceptable instrument type is required'),
    supportingDocumentRequirements: z.array(z.string().trim()).optional().default([]),
    applicableBusinessRules: z.array(z.string().trim()).optional().default([]),
  }),
};

export const updateRequirementSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Requirement ID is required'),
  }),
  body: z.object({
    title: z.string().trim().min(3).max(250).optional(),
    requirementType: z.enum(requirementTypes).optional(),
    requiredAmount: positiveDecimalSchema.optional(),
    currency: z.string().trim().optional(),
    effectiveDate: z.coerce.date().optional(),
    submissionDeadline: z.coerce.date().optional(),
    applicableRuleReference: z.string().trim().optional(),
    acceptableInstrumentTypes: z.array(z.enum(instrumentTypes)).min(1).optional(),
    supportingDocumentRequirements: z.array(z.string().trim()).optional(),
    applicableBusinessRules: z.array(z.string().trim()).optional(),
    requirementStatus: z.enum(requirementStatuses).optional(),
    complianceStatus: z.enum(complianceStatuses).optional(),
  }),
};

export const requirementIdParamSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Requirement ID is required'),
  }),
};

export const pledgeInstrumentSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Requirement ID is required'),
  }),
  body: z.object({
    instrumentId: z.string().trim().min(1, 'Instrument reference ID / FDR Number is required'),
    instrumentType: z.enum(instrumentTypes, {
      errorMap: () => ({ message: 'Invalid instrument type' }),
    }),
    bankName: z.string().trim().min(2, 'Bank name is required'),
    branchName: z.string().trim().min(2, 'Branch name is required'),
    amount: positiveDecimalSchema,
    maturityDate: z.coerce.date({
      required_error: 'Maturity date is required',
      invalid_type_error: 'Invalid maturity date',
    }),
    isJointAccount: z.boolean().default(true),
    remarks: z.string().trim().optional(),
  }),
};

export const verifyInstrumentSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Requirement ID is required'),
    instrumentId: z.string().trim().min(1, 'Instrument ID is required'),
  }),
  body: z.object({
    verificationStatus: z.enum(['VERIFIED', 'REJECTED']),
    remarks: z.string().trim().optional(),
  }),
};

export const requirementQuerySchema = {
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    institutionId: z.string().optional(),
    requirementType: z.enum(requirementTypes).optional(),
    requirementStatus: z.enum(requirementStatuses).optional(),
    complianceStatus: z.enum(complianceStatuses).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
};
