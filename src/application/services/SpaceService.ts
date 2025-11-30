import { AppError } from '../../domain/errors/AppError';
import { Space } from '../../domain/entities/Space';
import { SpaceRepository } from '../../infra/repositories/SpaceRepository';

interface CreateSpaceInput {
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  coverImageUrl?: string;
}

interface UpdateSpaceInput {
  name?: string;
  description?: string;
  capacity?: number;
  pricePerHour?: number;
  coverImageUrl?: string;
}

export class SpaceService {
  private readonly repository = new SpaceRepository();

  public async list(): Promise<Space[]> {
    return this.repository.findAll();
  }

  public async find(id: string): Promise<Space> {
    const space = await this.repository.findById(id);
    if (!space) {
      throw new AppError('Espaço não encontrado.', 404);
    }
    return space;
  }

  public async create(input: CreateSpaceInput): Promise<Space> {
    return this.repository.create(input);
  }

  public async update(id: string, input: UpdateSpaceInput): Promise<Space> {
    await this.find(id);
    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new AppError('Falha ao atualizar espaço.', 500);
    }
    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.find(id);
    await this.repository.delete(id);
  }
}
