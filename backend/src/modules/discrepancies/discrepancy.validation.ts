import { z } from 'zod';

export const createDiscrepancySchema = z.object({
  instrumentId: z.string().min(1, 'Instrument ID is required'),
  institutionId: z.string().optional(),
  requirementId: z.string().optional(),
  discrepancyType: z.enum([
    'AMOUNT_MISMATCH',
    'DATE_INVALID',
    'NAME_MISMATCH',
    'DOCUMENT_ILLEGIBLE',
    'DUPLICATE_SUSPECT',
    'MISSING_DOCUMENT',
    'BANK_MISMATCH',
    'OTHER',
  ]),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedTo: z.string().optional(),
});

export const resolveDiscrepancySchema = z.object({
  resolutionStatus: z.enum(['RESOLVED', 'WAIVED']),
  resolutionRemarks: z.string().min(3, 'Resolution remarks must be at least 3 characters'),
});
