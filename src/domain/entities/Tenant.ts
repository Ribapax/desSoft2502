import { Role } from './Role';

export interface Tenant {
  id: string;
  name: string;
  description?: string;
  status: boolean;
  createdAt: string;
  roles?: Role[];
}
