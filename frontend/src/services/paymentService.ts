export type PaymentResponse = {
  id: string;
  totalAmount: number;
  payed: number;
  status: string;
  paidAt: string;
  createdAt: string;
};

export const PaymentStatus = {
  SIGNAL: 'SIGNAL',
  FULL: 'FULL'
} as const;

const BASE_URL = 'http://localhost:3333/api/payments';

export const paymentService = {
  async list(): Promise<PaymentResponse[]> {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Erro ao listar pagamentos');
    return res.json();
  },
  async create(payload: {
    reservationIds?: string[];
    totalAmount: number;
    payed: number;
    status: string;
    paidAt: string;
  }): Promise<PaymentResponse> {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error('Erro ao criar pagamento');
    }
    return res.json();
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('Erro ao excluir pagamento');
    }
  }
};
