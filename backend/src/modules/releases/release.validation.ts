import { z } from 'zod';

export const createReleaseSchema = {
  body: z.object({
    instrumentId: z.string().trim().min(1, 'Instrument ID is required'),
    requestReason: z.string().trim().min(5, 'Request reason must be at least 5 characters'),
    requestedAmount: z
      .union([z.string(), z.number()])
      .optional()
      .refine((val) => val === undefined || (!isNaN(Number(val)) && Number(val) > 0), {
        message: 'Requested amount must be a positive number',
      })
      .transform((val) => (val !== undefined ? String(val) : undefined)),
    supportingDocuments: z.array(z.string().trim()).optional().default([]),
  }),
};

export const reviewReleaseSchema = {
  body: z.object({
    action: z.enum(['UNDER_REVIEW', 'CLARIFICATION_REQUIRED']),
    clarificationQuery: z.string().trim().optional(),
    decisionRemarks: z.string().trim().optional(),
  }),
};

export const clarificationResponseSchema = {
  body: z.object({
    response: z.string().trim().min(1, 'Response explanation is required'),
    supportingDocuments: z.array(z.string().trim()).optional().default([]),
  }),
};

export const approveReleaseSchema = {
  body: z.object({
    decisionRemarks: z.string().trim().min(1, 'Decision remarks are required for approval'),
    approvalLevel: z.number().int().min(1).max(2).optional(),
  }),
};

export const rejectReleaseSchema = {
  body: z.object({
    rejectionReason: z.string().trim().min(1, 'Rejection reason is required'),
  }),
};

export const closeReleaseSchema = {
  body: z.object({
    closureRemarks: z.string().trim().min(1, 'Closure remarks are required'),
    settlementReference: z.string().trim().optional(),
  }),
};
