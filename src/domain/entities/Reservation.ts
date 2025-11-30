import { ReservationStatus } from '../enums/ReservationStatus';

export interface Reservation {
  id: string;
  userId: string;
  spaceId: string;
  startDate: string;
  endDate: string;
  checkInTime: string;
  checkOutTime: string;
  totalPrice: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}
