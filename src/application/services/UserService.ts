import { AppError } from '../../domain/errors/AppError';
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../infra/repositories/UserRepository';

interface CreateUserInput {
  name: string;
  email: string;
  phone?: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
}

export class UserService {
  private readonly repository = new UserRepository();

  public async list(): Promise<User[]> {
    return this.repository.findAll();
  }

  public async find(id: string): Promise<User> {
    const user = this.repository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }
    return user;
  }

  public async create(input: CreateUserInput): Promise<User> {
    const existing = this.repository.findByEmail(input.email);
    if (existing) {
      throw new AppError('E-mail já cadastrado.', 409);
    }
    return this.repository.create(input);
  }

  public async update(id: string, input: UpdateUserInput): Promise<User> {
    await this.find(id);
    if (input.email) {
      const existing = this.repository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new AppError('E-mail já cadastrado.', 409);
      }
    }

    const updated = this.repository.update(id, input);
    if (!updated) {
      throw new AppError('Falha ao atualizar usuário.', 500);
    }
    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.find(id);
    this.repository.delete(id);
  }
}
