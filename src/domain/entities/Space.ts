export interface Space {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price: number;
  coverImageUrl?: string;
  checkInTime: string;
  checkOutTime: string;
  signalPercentage: number;
  tenantId?: string;
  createdAt: string;
}
