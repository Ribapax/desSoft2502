import { z } from 'zod';

export const createSpaceSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  capacity: z.number().int().positive(),
  pricePerHour: z.number().nonnegative(),
  coverImageUrl: z.string().url().optional()
});

export const updateSpaceSchema = createSpaceSchema.partial();
