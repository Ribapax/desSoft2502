import { z } from 'zod';

export const createSpaceSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  capacity: z.number().int().positive(),
  price: z.number().nonnegative(),
  coverImageUrl: z.string().url().optional(),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  signalPercentage: z.number().min(0).max(100).optional(),
  tenantId: z.string().uuid().optional()
});

export const updateSpaceSchema = createSpaceSchema.partial();
