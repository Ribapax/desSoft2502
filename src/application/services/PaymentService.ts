import { AppError } from '../../domain/errors/AppError';
import { Payment } from '../../domain/entities/Payment';
import { PaymentStatus } from '../../domain/enums/PaymentStatus';
import { PaymentRepository } from '../../infra/repositories/PaymentRepository';
import { ReservationRepository } from '../../infra/repositories/ReservationRepository';

interface CreatePaymentInput {
  reservationIds?: string[];
  totalAmount: number;
  payed: number;
  status: PaymentStatus;
  paidAt: string;
}

interface UpdatePaymentInput {
  totalAmount?: number;
  payed?: number;
  status?: PaymentStatus;
  paidAt?: string;
}

export class PaymentService {
  private readonly repository = new PaymentRepository();
  private readonly reservationRepository = new ReservationRepository();

  public async list(): Promise<Payment[]> {
    return this.repository.findAll();
  }

  public async find(id: string): Promise<Payment> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Pagamento não encontrado.', 404);
    }
    return payment;
  }

  public async create(input: CreatePaymentInput): Promise<Payment> {
    if (input.totalAmount < 0 || input.payed < 0) {
      throw new AppError('Valor do pagamento inválido.', 422);
    }
    if (input.payed > input.totalAmount) {
      throw new AppError('Valor pago acima do total.', 422);
    }
    if (input.reservationIds?.length) {
      for (const reservationId of input.reservationIds) {
        const reservation = await this.reservationRepository.findById(reservationId);
        if (!reservation) {
          throw new AppError('Reserva informada não existe.', 404);
        }
      }
    }
    return this.repository.create(input);
  }

  public async update(id: string, input: UpdatePaymentInput): Promise<Payment> {
    const current = await this.find(id);
    if (input.totalAmount !== undefined && input.totalAmount < 0) {
      throw new AppError('Valor total inválido.', 422);
    }
    if (input.payed !== undefined && input.payed < 0) {
      throw new AppError('Valor do pagamento inválido.', 422);
    }
    const nextTotal = input.totalAmount ?? current.totalAmount;
    const nextPayed = input.payed ?? current.payed;
    if (nextPayed > nextTotal) {
      throw new AppError('Valor pago acima do total.', 422);
    }

    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new AppError('Falha ao atualizar pagamento.', 500);
    }
    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.find(id);
    await this.repository.delete(id);
  }
}
