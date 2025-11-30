import { z } from 'zod';
import { ReservationStatus } from '../../domain/enums/ReservationStatus';

const isoDate = z.string().datetime();
const timeHHMM = z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:mm)');

export const createReservationSchema = z.object({
  userId: z.string().min(1),
  spaceId: z.string().min(1),
  startDate: isoDate,
  endDate: isoDate,
  checkInTime: timeHHMM.optional(),
  checkOutTime: timeHHMM.optional(),
  totalPrice: z.number().nonnegative(),
  status: z.nativeEnum(ReservationStatus).optional()
});

export const updateReservationSchema = createReservationSchema.partial();

export const reservationQuerySchema = z.object({
  userId: z.string().optional(),
  spaceId: z.string().optional(),
  status: z.nativeEnum(ReservationStatus).optional()
});
