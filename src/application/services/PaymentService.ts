import { AppError } from '../../domain/errors/AppError';
import { Payment } from '../../domain/entities/Payment';
import { PaymentStatus } from '../../domain/enums/PaymentStatus';
import { PaymentRepository } from '../../infra/repositories/PaymentRepository';
import { ReservationRepository } from '../../infra/repositories/ReservationRepository';

interface CreatePaymentInput {
  reservationId: string;
  amount: number;
  status: PaymentStatus;
  paidAt: string;
}

interface UpdatePaymentInput {
  amount?: number;
  status?: PaymentStatus;
  paidAt?: string;
}

export class PaymentService {
  private readonly repository = new PaymentRepository();
  private readonly reservationRepository = new ReservationRepository();

  public async list(reservationId?: string): Promise<Payment[]> {
    if (reservationId) {
      return this.repository.findByReservation(reservationId);
    }
    return this.repository.findAll();
  }

  public async find(id: string): Promise<Payment> {
    const payment = this.repository.findById(id);
    if (!payment) {
      throw new AppError('Pagamento não encontrado.', 404);
    }
    return payment;
  }

  public async create(input: CreatePaymentInput): Promise<Payment> {
    const reservation = this.reservationRepository.findById(input.reservationId);
    if (!reservation) {
      throw new AppError('Reserva informada não existe.', 404);
    }
    if (input.amount < 0) {
      throw new AppError('Valor do pagamento inválido.', 422);
    }
    return this.repository.create(input);
  }

  public async update(id: string, input: UpdatePaymentInput): Promise<Payment> {
    await this.find(id);
    if (input.amount !== undefined && input.amount < 0) {
      throw new AppError('Valor do pagamento inválido.', 422);
    }
    const updated = this.repository.update(id, input);
    if (!updated) {
      throw new AppError('Falha ao atualizar pagamento.', 500);
    }
    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.find(id);
    this.repository.delete(id);
  }
}
