import { z } from 'zod';
import { PaymentStatus } from '../../domain/enums/PaymentStatus';

const isoDate = z.string().datetime();

export const createPaymentSchema = z.object({
  reservationId: z.string().min(1),
  amount: z.number().nonnegative(),
  status: z.nativeEnum(PaymentStatus),
  paidAt: isoDate
});

export const updatePaymentSchema = z.object({
  amount: z.number().nonnegative().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  paidAt: isoDate.optional()
});
