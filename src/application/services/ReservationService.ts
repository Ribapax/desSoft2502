import { AppError } from '../../domain/errors/AppError';
import { Reservation } from '../../domain/entities/Reservation';
import { ReservationRepository } from '../../infra/repositories/ReservationRepository';
import { UserRepository } from '../../infra/repositories/UserRepository';
import { SpaceRepository } from '../../infra/repositories/SpaceRepository';

interface ReservationFilters {
  userId?: string;
  spaceId?: string;
}

interface CreateReservationInput {
  userId: string;
  spaceId: string;
  reservationDate: string;
  paymentId?: string | null;
}

interface UpdateReservationInput {
  userId?: string;
  spaceId?: string;
  reservationDate?: string;
  paymentId?: string | null;
}

export class ReservationService {
  private readonly repository = new ReservationRepository();
  private readonly userRepository = new UserRepository();
  private readonly spaceRepository = new SpaceRepository();

  public async list(filters: ReservationFilters = {}): Promise<Reservation[]> {
    return this.repository.findAll(filters);
  }

  public async find(id: string): Promise<Reservation> {
    const reservation = await this.repository.findById(id);
    if (!reservation) {
      throw new AppError('Reserva não encontrada.', 404);
    }
    return reservation;
  }

  public async create(input: CreateReservationInput): Promise<Reservation> {
    await this.ensureSpaceExists(input.spaceId);
    await this.ensureUserExists(input.userId);
    await this.ensureAvailability(input.spaceId, input.reservationDate);

    return await this.repository.create({ ...input });
  }

  public async update(id: string, input: UpdateReservationInput): Promise<Reservation> {
    const current = await this.find(id);

    if (input.userId) {
      await this.ensureUserExists(input.userId);
    }
    const space = input.spaceId ? await this.ensureSpaceExists(input.spaceId) : await this.ensureSpaceExists(current.spaceId);
    const nextSpace = input.spaceId ?? current.spaceId;
    const nextDate = input.reservationDate ?? current.reservationDate;
    await this.ensureAvailability(nextSpace, nextDate, id);

    const updated = await this.repository.update(id, {
      ...input
    });
    if (!updated) {
      throw new AppError('Falha ao atualizar reserva.', 500);
    }
    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.find(id);
    await this.repository.delete(id);
  }

  private async ensureAvailability(
    spaceId: string,
    reservationDate: string,
    excludeId?: string
  ) {
    const existing = await this.repository.findBySpaceAndDate(spaceId, reservationDate);
    if (existing && existing.id !== excludeId) {
      throw new AppError('Espaço já reservado nesse dia.', 409);
    }
  }

  private async ensureUserExists(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuário informado não existe.', 404);
    }
  }

  private async ensureSpaceExists(spaceId: string) {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new AppError('Espaço informado não existe.', 404);
    }
    return space;
  }
}
