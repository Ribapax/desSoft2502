import { z } from 'zod';
import { PaymentStatus } from '../../domain/enums/PaymentStatus';

const isoDate = z.string().datetime();

export const createPaymentSchema = z.object({
  reservationIds: z.array(z.string().min(1)).optional(),
  totalAmount: z.number().nonnegative(),
  payed: z.number().nonnegative(),
  status: z.nativeEnum(PaymentStatus),
  paidAt: isoDate
});

export const updatePaymentSchema = z.object({
  totalAmount: z.number().nonnegative().optional(),
  payed: z.number().nonnegative().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  paidAt: isoDate.optional()
});
