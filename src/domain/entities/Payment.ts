import { PaymentStatus } from '../enums/PaymentStatus';

export interface Payment {
  id: string;
  reservationId: string;
  amount: number;
  status: PaymentStatus;
  paidAt: string;
  createdAt: string;
}
