export interface Space {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  coverImageUrl?: string;
  createdAt: string;
}
