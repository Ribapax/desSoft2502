import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(8).max(20).optional(),
  roles: z.array(z.string().min(1)).optional(),
  tenantIds: z.array(z.string().uuid()).optional()
});

export const updateUserSchema = createUserSchema.partial();
