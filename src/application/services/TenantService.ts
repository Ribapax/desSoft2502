import { AppError } from '../../domain/errors/AppError';
import { Tenant } from '../../domain/entities/Tenant';
import { TenantRepository } from '../../infra/repositories/TenantRepository';
import { RoleRepository } from '../../infra/repositories/RoleRepository';
import { RoleTenantRepository } from '../../infra/repositories/RoleTenantRepository';

interface CreateTenantInput {
  name: string;
  description?: string;
  roles?: string[];
  status?: boolean;
}

interface UpdateTenantInput {
  name?: string;
  description?: string;
  roles?: string[];
  status?: boolean;
}

export class TenantService {
  private readonly repository = new TenantRepository();
  private readonly roleRepository = new RoleRepository();
  private readonly roleTenantRepository = new RoleTenantRepository();

  public async list(): Promise<Tenant[]> {
    return this.repository.findAll();
  }

  public async find(id: string): Promise<Tenant> {
    const tenant = await this.repository.findById(id);
    if (!tenant) {
      throw new AppError('Tenant não encontrado.', 404);
    }
    return tenant;
  }

  public async create(input: CreateTenantInput): Promise<Tenant> {
    const existing = await this.repository.findByName(input.name);
    if (existing) {
      throw new AppError('Nome de tenant já existe.', 409);
    }
    const created = await this.repository.create(input);
    if (input.roles?.length) {
      const roles = await this.roleRepository.upsertMany(input.roles.map((name) => ({ name })));
      await this.repository.replaceRoles(created.id, roles.map((r) => r.id));
      for (const role of roles) {
        await this.roleTenantRepository.setStatus(role.id, created.id, input.status ?? true);
      }
      return { ...created, roles };
    }
    return created;
  }

  public async update(id: string, input: UpdateTenantInput): Promise<Tenant> {
    await this.find(id);
    const byName = input.name ? await this.repository.findByName(input.name) : null;
    if (byName && byName.id !== id) {
      throw new AppError('Nome de tenant já existe.', 409);
    }
    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new AppError('Falha ao atualizar tenant.', 500);
    }
    const effectiveStatus = input.status ?? updated.status ?? true;
    if (input.roles) {
      const roles = await this.roleRepository.upsertMany(input.roles.map((name) => ({ name })));
      await this.repository.replaceRoles(id, roles.map((r) => r.id));
      for (const role of roles) {
        await this.roleTenantRepository.setStatus(role.id, id, effectiveStatus);
      }
      return { ...updated, roles };
    }
    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.find(id);
    await this.repository.delete(id);
  }
}
