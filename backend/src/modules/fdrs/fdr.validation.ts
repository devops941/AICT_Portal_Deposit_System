import { z } from 'zod';

const instrumentTypes = ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'] as const;
const submissionStatuses = ['DRAFT', 'SUBMITTED', 'RETURNED_FOR_CORRECTION', 'APPROVED'] as const;
const verificationStatuses = ['PENDING', 'UNDER_SCRUTINY', 'VERIFIED', 'REJECTED'] as const;
const lifecycleStatuses = ['ACTIVE', 'MATURED', 'RELEASED', 'CLAIMED', 'CANCELLED'] as const;

const positiveDecimalSchema = z.union([
  z.number().positive('Deposit amount must be greater than 0'),
  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Deposit amount must be a positive decimal with up to 2 decimal places'),
]);

export const createFdrSchema = {
  body: z
    .object({
      institutionId: z.string().trim().optional(),
      requirementId: z.string().trim().min(1, 'Requirement ID is required'),
      instrumentType: z.enum(instrumentTypes).default('FDR'),
      bankName: z.string().trim().min(2, 'Bank name is required'),
      bankBranch: z.string().trim().min(2, 'Bank branch is required'),
      fdrNumber: z.string().trim().min(1, 'FDR / Instrument certificate number is required'),
      holderName: z.string().trim().min(2, 'Deposit holder name is required'),
      depositAmount: positiveDecimalSchema,
      issueDate: z.coerce.date({
        required_error: 'Issue date is required',
        invalid_type_error: 'Invalid issue date',
      }),
      maturityDate: z.coerce.date({
        required_error: 'Maturity date is required',
        invalid_type_error: 'Invalid maturity date',
      }),
      currency: z.string().trim().default('INR'),
      isJointAccount: z.boolean().default(true),
      autoRenewal: z.boolean().default(true),
      interestRate: z.number().min(0).max(100).optional(),
      remarks: z.string().trim().optional(),
      documentReferences: z.array(z.string().trim()).optional().default([]),
      saveAsDraft: z.boolean().optional().default(false),
    })
    .refine((data) => new Date(data.maturityDate).getTime() > new Date(data.issueDate).getTime(), {
      message: 'Maturity date must be after the issue date',
      path: ['maturityDate'],
    }),
};

export const updateFdrSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'FDR ID is required'),
  }),
  body: z.object({
    bankName: z.string().trim().min(2).optional(),
    bankBranch: z.string().trim().min(2).optional(),
    fdrNumber: z.string().trim().min(1).optional(),
    holderName: z.string().trim().min(2).optional(),
    depositAmount: positiveDecimalSchema.optional(),
    issueDate: z.coerce.date().optional(),
    maturityDate: z.coerce.date().optional(),
    currency: z.string().trim().optional(),
    isJointAccount: z.boolean().optional(),
    autoRenewal: z.boolean().optional(),
    interestRate: z.number().min(0).max(100).optional(),
    remarks: z.string().trim().optional(),
    documentReferences: z.array(z.string().trim()).optional(),
    duplicateReviewNotes: z.string().trim().optional(),
  }),
};

export const fdrIdParamSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'FDR ID is required'),
  }),
};

export const fdrQuerySchema = {
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    institutionId: z.string().optional(),
    requirementId: z.string().optional(),
    bankName: z.string().optional(),
    submissionStatus: z.enum(submissionStatuses).optional(),
    verificationStatus: z.enum(verificationStatuses).optional(),
    lifecycleStatus: z.enum(lifecycleStatuses).optional(),
    isDuplicateFlagged: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
};
