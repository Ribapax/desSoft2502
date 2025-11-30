import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  roles: z.array(z.string()).optional()
});

export const updateTenantSchema = createTenantSchema.partial();
