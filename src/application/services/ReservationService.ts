import { AppError } from '../../domain/errors/AppError';
import { Reservation } from '../../domain/entities/Reservation';
import { ReservationRepository } from '../../infra/repositories/ReservationRepository';
import { ReservationStatus } from '../../domain/enums/ReservationStatus';
import { UserRepository } from '../../infra/repositories/UserRepository';
import { SpaceRepository } from '../../infra/repositories/SpaceRepository';

interface ReservationFilters {
  userId?: string;
  spaceId?: string;
  status?: ReservationStatus;
}

interface CreateReservationInput {
  userId: string;
  spaceId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status?: ReservationStatus;
}

interface UpdateReservationInput {
  userId?: string;
  spaceId?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  status?: ReservationStatus;
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
    this.ensureDateRange(input.startDate, input.endDate);
    await this.ensureUserExists(input.userId);
    await this.ensureSpaceExists(input.spaceId);
    await this.ensureAvailability(input.spaceId, input.startDate, input.endDate);

    const status = input.status ?? ReservationStatus.Pending;
    return await this.repository.create({ ...input, status });
  }

  public async update(id: string, input: UpdateReservationInput): Promise<Reservation> {
    const current = await this.find(id);

    if (input.userId) {
      await this.ensureUserExists(input.userId);
    }
    if (input.spaceId) {
      await this.ensureSpaceExists(input.spaceId);
    }

    const nextStart = input.startDate ?? current.startDate;
    const nextEnd = input.endDate ?? current.endDate;
    const nextSpace = input.spaceId ?? current.spaceId;
    this.ensureDateRange(nextStart, nextEnd);
    await this.ensureAvailability(nextSpace, nextStart, nextEnd, id);

    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new AppError('Falha ao atualizar reserva.', 500);
    }
    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.find(id);
    await this.repository.delete(id);
  }

  private ensureDateRange(start: string, end: string) {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    if (Number.isNaN(startDate) || Number.isNaN(endDate) || startDate >= endDate) {
      throw new AppError('Intervalo de datas inválido.', 422);
    }
  }

  private async ensureAvailability(spaceId: string, start: string, end: string, excludeId?: string) {
    const conflicts = await this.repository.countOverlaps(spaceId, start, end, excludeId);
    if (conflicts > 0) {
      throw new AppError('Espaço já reservado nesse período.', 409);
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
  }
}
