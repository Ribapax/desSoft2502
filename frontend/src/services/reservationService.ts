export type ReservationResponse = {
  id: string;
  userId: string;
  spaceId: string;
  reservationDate: string;
  paymentId?: string | null;
  createdAt: string;
  updatedAt: string;
};

const BASE_URL = 'http://localhost:3333/api/reservations';

export const reservationService = {
  async list(params?: { spaceId?: string; userId?: string }): Promise<ReservationResponse[]> {
    const url = new URL(BASE_URL);
    if (params?.spaceId) {
      url.searchParams.set('spaceId', params.spaceId);
    }
    if (params?.userId) {
      url.searchParams.set('userId', params.userId);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error('Erro ao listar reservas');
    }
    return res.json();
  },
  async create(payload: {
    userId: string;
    spaceId: string;
    reservationDate: string;
    paymentId?: string | null;
  }): Promise<ReservationResponse> {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const message = res.status === 409 ? 'Data indisponível.' : 'Erro ao criar reserva';
      throw new Error(message);
    }
    return res.json();
  },
  async update(id: string, payload: Partial<{ userId: string; spaceId: string; reservationDate: string; paymentId?: string | null }>): Promise<ReservationResponse> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error('Erro ao atualizar reserva');
    }
    return res.json();
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('Erro ao excluir reserva');
    }
  }
};
