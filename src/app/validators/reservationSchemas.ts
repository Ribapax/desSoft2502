import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)');

export const createReservationSchema = z.object({
  userId: z.string().min(1),
  spaceId: z.string().min(1),
  reservationDate: dateOnly,
  paymentId: z.string().optional()
});

export const updateReservationSchema = createReservationSchema.partial();

export const reservationQuerySchema = z.object({
  userId: z.string().optional(),
  spaceId: z.string().optional()
});
