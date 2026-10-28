import { z } from 'zod';

const replacementDetailsSchema = z.object({
  instrumentType: z.string().default('FDR'),
  bankName: z.string().min(1, 'Bank name is required'),
  bankBranch: z.string().min(1, 'Bank branch is required'),
  fdrNumber: z.string().min(1, 'FDR number is required'),
  holderName: z.string().min(1, 'Holder name is required'),
  depositAmount: z
    .union([z.string(), z.number()])
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Deposit amount must be a positive number',
    })
    .transform((val) => String(val)),
  issueDate: z.coerce.date({
    required_error: 'Valid issue date is required',
  }),
  maturityDate: z.coerce.date({
    required_error: 'Valid maturity date is required',
  }),
  documentReferences: z.array(z.string()).default([]),
  isJointAccount: z.boolean().default(true),
  autoRenewal: z.boolean().default(true),
  interestRate: z.number().optional(),
  remarks: z.string().optional(),
}).refine(
  (data) => new Date(data.maturityDate).getTime() > new Date(data.issueDate).getTime(),
  {
    message: 'Maturity date must be after issue date',
    path: ['maturityDate'],
  }
);

export const createRenewalSchema = {
  body: z.object({
    previousInstrumentId: z.string().min(1, 'Previous Instrument ID is required'),
    renewalReason: z.string().min(3, 'Renewal reason must be at least 3 characters'),
    replacementDetails: replacementDetailsSchema.optional(),
  }),
};

export const submitRenewalSchema = {
  body: z.object({
    replacementDetails: replacementDetailsSchema,
  }),
};

export const approveRenewalSchema = {
  body: z.object({
    remarks: z.string().min(1, 'Approval remarks are required'),
  }),
};
