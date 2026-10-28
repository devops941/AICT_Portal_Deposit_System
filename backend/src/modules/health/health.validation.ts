import { z } from 'zod';

export const healthQuerySchema = {
  query: z.object({
    detailed: z.enum(['true', 'false']).optional(),
  }),
};

export type HealthQuery = z.infer<typeof healthQuerySchema.query>;
