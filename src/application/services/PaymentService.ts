import { AppError } from '../../domain/errors/AppError';
import { Payment } from '../../domain/entities/Payment';
import { PaymentStatus } from '../../domain/enums/PaymentStatus';
import { PaymentRepository } from '../../infra/repositories/PaymentRepository';
import { ReservationRepository } from '../../infra/repositories/ReservationRepository';
import { SpaceRepository } from '../../infra/repositories/SpaceRepository';

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
  private readonly spaceRepository = new SpaceRepository();

  public async list(reservationId?: string): Promise<Payment[]> {
    if (reservationId) {
      return this.repository.findByReservation(reservationId);
    }
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
    const reservation = await this.reservationRepository.findById(input.reservationId);
    if (!reservation) {
      throw new AppError('Reserva informada não existe.', 404);
    }
    const space = await this.spaceRepository.findById(reservation.spaceId);
    if (!space) {
      throw new AppError('Espaço da reserva não encontrado.', 404);
    }
    if (input.amount < 0) {
      throw new AppError('Valor do pagamento inválido.', 422);
    }
    if (input.status === PaymentStatus.Signal) {
      const minSignal = reservation.totalPrice * (space.signalPercentage / 100);
      if (input.amount < minSignal) {
        throw new AppError('Valor do sinal abaixo do mínimo permitido.', 422);
      }
    }
    if (input.amount > reservation.totalPrice) {
      throw new AppError('Valor do pagamento acima do total da reserva.', 422);
    }
    return this.repository.create(input);
  }

  public async update(id: string, input: UpdatePaymentInput): Promise<Payment> {
    const current = await this.find(id);
    const reservation = await this.reservationRepository.findById(current.reservationId);
    const space = reservation ? await this.spaceRepository.findById(reservation.spaceId) : null;

    if (input.amount !== undefined && input.amount < 0) {
      throw new AppError('Valor do pagamento inválido.', 422);
    }
    if (reservation && input.amount !== undefined) {
      if (input.status === PaymentStatus.Signal || current.status === PaymentStatus.Signal) {
        const minSignal = reservation.totalPrice * ((space?.signalPercentage ?? 0) / 100);
        if (input.amount < minSignal) {
          throw new AppError('Valor do sinal abaixo do mínimo permitido.', 422);
        }
      }
      if (input.amount > reservation.totalPrice) {
        throw new AppError('Valor do pagamento acima do total da reserva.', 422);
      }
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
