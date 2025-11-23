import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8).max(20).optional()
});

export const updateUserSchema = createUserSchema.partial();
