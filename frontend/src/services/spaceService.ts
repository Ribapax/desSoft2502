export type SpaceResponse = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price: number;
  coverImageUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  signalPercentage?: number;
  tenantId?: string;
  createdAt: string;
};

export type SpacePayload = {
  name: string;
  description: string;
  capacity: number;
  price: number;
  coverImageUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  signalPercentage?: number;
  tenantId?: string;
};

const BASE_URL = 'http://localhost:3333/api/spaces';

export const spaceService = {
  async list(): Promise<SpaceResponse[]> {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Erro ao listar espaços');
    return res.json();
  },
  async create(payload: SpacePayload): Promise<SpaceResponse> {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erro ao criar espaço');
    return res.json();
  },
  async update(id: string, payload: SpacePayload): Promise<SpaceResponse> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erro ao atualizar espaço');
    return res.json();
  }
};
