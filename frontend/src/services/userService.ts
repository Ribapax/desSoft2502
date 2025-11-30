export type UserResponse = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  roles: { id: string; name: string }[];
};

export type UserPayload = {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  roles?: string[];
};

const BASE_URL = 'http://localhost:3333/api/users';

export const userService = {
  async list(): Promise<UserResponse[]> {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Erro ao listar usuários');
    return res.json();
  },
  async create(payload: UserPayload): Promise<UserResponse> {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erro ao criar usuário');
    return res.json();
  },
  async update(id: string, payload: UserPayload): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erro ao atualizar usuário');
    return res.json();
  }
};
