import { z } from 'zod';
import { ReservationStatus } from '../../domain/enums/ReservationStatus';

const isoDate = z.string().datetime();

export const createReservationSchema = z.object({
  userId: z.string().min(1),
  spaceId: z.string().min(1),
  startDate: isoDate,
  endDate: isoDate,
  totalPrice: z.number().nonnegative(),
  status: z.nativeEnum(ReservationStatus).optional()
});

export const updateReservationSchema = createReservationSchema.partial();

export const reservationQuerySchema = z.object({
  userId: z.string().optional(),
  spaceId: z.string().optional(),
  status: z.nativeEnum(ReservationStatus).optional()
});
