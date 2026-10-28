import { z } from 'zod';

export const verifyFdrSchema = z.object({
  remarks: z.string().min(3, 'Verification remarks must be at least 3 characters'),
  checklist: z
    .array(
      z.object({
        itemKey: z.string(),
        label: z.string().optional(),
        status: z.enum(['PASS', 'FAIL', 'NOT_APPLICABLE', 'PENDING']),
        comments: z.string().optional(),
      })
    )
    .optional(),
  initiateApprovalWorkflow: z.boolean().optional(),
});

export const rejectVerificationSchema = z.object({
  remarks: z.string().min(5, 'Rejection remarks must be at least 5 characters detailing the non-compliance'),
});

export const requestClarificationSchema = z.object({
  query: z.string().min(5, 'Clarification query must be at least 5 characters explaining what the institution must rectify'),
});
