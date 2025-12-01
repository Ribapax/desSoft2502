import { PaymentStatus } from '../enums/PaymentStatus';

export interface Payment {
  id: string;
  totalAmount: number;
  payed: number;
  status: PaymentStatus;
  paidAt: string;
  createdAt: string;
}
