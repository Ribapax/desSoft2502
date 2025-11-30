export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  roles: { id: string; name: string; description?: string }[];
}
