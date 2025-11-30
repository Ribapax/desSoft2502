import { AppError } from '../../domain/errors/AppError';
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../infra/repositories/UserRepository';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roles?: string[];
  tenantIds?: string[];
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  roles?: string[];
  tenantIds?: string[];
}

export class UserService {
  private readonly repository = new UserRepository();

  public async list(): Promise<User[]> {
    return this.repository.findAll();
  }

  public async find(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }
    return user;
  }

  public async create(input: CreateUserInput): Promise<User> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new AppError('E-mail já cadastrado.', 409);
    }
    if (input.roles && input.roles.some((r) => r !== 'client' && r !== 'master')) {
      if (!input.tenantIds || input.tenantIds.length === 0) {
        throw new AppError('Usuário precisa estar associado a pelo menos uma filial.', 400);
      }
    }
    return this.repository.create(input);
  }

  public async update(id: string, input: UpdateUserInput): Promise<User> {
    await this.find(id);
    if (input.email) {
      const existing = await this.repository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new AppError('E-mail já cadastrado.', 409);
      }
    }
    if (input.roles && input.roles.some((r) => r !== 'client' && r !== 'master')) {
      if (!input.tenantIds || input.tenantIds.length === 0) {
        throw new AppError('Usuário precisa estar associado a pelo menos uma filial.', 400);
      }
    }

    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new AppError('Falha ao atualizar usuário.', 500);
    }
    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.find(id);
    await this.repository.delete(id);
  }
}
