export type TenantResponse = {
  id: string;
  name: string;
  description?: string;
  status: boolean;
  createdAt: string;
  roles?: { id: string; name: string }[];
};

export type TenantPayload = {
  name: string;
  description?: string;
  status?: boolean;
  roles?: string[];
};

const BASE_URL = 'http://localhost:3333/api/tenants';

export const tenantService = {
  async list(): Promise<TenantResponse[]> {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Erro ao listar tenants');
    return res.json();
  },
  async create(payload: TenantPayload): Promise<TenantResponse> {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erro ao criar tenant');
    return res.json();
  },
  async update(id: string, payload: TenantPayload): Promise<TenantResponse> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erro ao atualizar tenant');
    return res.json();
  }
};
