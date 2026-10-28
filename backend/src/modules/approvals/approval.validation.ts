import { z } from 'zod';

export const createApprovalSchema = z.object({
  instrumentId: z.string().min(1, 'Instrument ID is required'),
  workflowType: z.enum(['FDR_REGISTRATION', 'FINANCIAL_RELEASE', 'CORRECTION_OVERRIDE']).optional(),
  configuredSteps: z
    .array(
      z.object({
        stepNumber: z.number().int().positive(),
        title: z.string().min(2),
        roleRequired: z.string().min(2),
        assignedApproverEmail: z.string().email().optional(),
      })
    )
    .optional(),
});

export const approveStepSchema = z.object({
  remarks: z.string().min(3, 'Approval remarks must be at least 3 characters'),
});

export const rejectStepSchema = z.object({
  remarks: z.string().min(3, 'Rejection remarks must be at least 3 characters'),
});

export const returnStepSchema = z.object({
  remarks: z.string().min(3, 'Clarification/Return remarks must be at least 3 characters'),
  returnToStep: z.number().int().positive().optional(),
});

export const escalateStepSchema = z.object({
  remarks: z.string().min(3, 'Escalation remarks must be at least 3 characters'),
  escalateToRole: z.string().optional(),
  assignedApproverEmail: z.string().email().optional(),
});
