export interface Reservation {
  id: string;
  userId: string;
  spaceId: string;
  reservationDate: string;
  paymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}
