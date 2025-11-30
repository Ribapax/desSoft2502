import { RoleRepository } from '../../infra/repositories/RoleRepository';
import { Role } from '../../domain/entities/Role';

interface UpsertRoleInput {
  name: string;
  description?: string;
}

export class RoleService {
  private readonly repository = new RoleRepository();

  public async list(): Promise<Role[]> {
    return this.repository.findAll();
  }

  public async upsert(input: UpsertRoleInput): Promise<Role> {
    return this.repository.upsert({ name: input.name, description: input.description });
  }

  public async upsertMany(inputs: UpsertRoleInput[]): Promise<Role[]> {
    return this.repository.upsertMany(inputs);
  }
}
