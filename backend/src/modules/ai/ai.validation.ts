import { z } from 'zod';

export const aiSearchSchema = {
  body: z.object({
    query: z.string().min(2, 'Search query must be at least 2 characters long'),
    targetDomain: z.enum(['FDRS', 'REQUIREMENTS', 'RELEASES', 'ALL']).optional(),
  }),
};

export const aiCompareSchema = {
  body: z.object({
    extractionId: z.string().optional(),
    instrumentId: z.string().optional(),
    formValues: z
      .object({
        bankName: z.string().optional(),
        fdrNumber: z.string().optional(),
        holderName: z.string().optional(),
        depositAmount: z.union([z.string(), z.number()]).optional(),
        issueDate: z.string().optional(),
        maturityDate: z.string().optional(),
        branchInformation: z.string().optional(),
      })
      .optional(),
  }),
};

export const aiManualCorrectionSchema = {
  body: z.object({
    correctedFields: z.object({
      bankName: z.string().optional(),
      fdrNumber: z.string().optional(),
      holderName: z.string().optional(),
      depositAmount: z.string().optional(),
      issueDate: z.string().optional(),
      maturityDate: z.string().optional(),
      branchInformation: z.string().optional(),
    }),
    officerRemarks: z.string().optional(),
    confirmExtraction: z.boolean().optional(),
  }),
};
