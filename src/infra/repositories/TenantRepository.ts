import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { Tenant } from '../../domain/entities/Tenant';
import { Role } from '../../domain/entities/Role';

interface CreateTenantDTO {
  name: string;
  description?: string;
  status?: boolean;
}

interface UpdateTenantDTO {
  name?: string;
  description?: string;
  status?: boolean;
}

export class TenantRepository {
  private mapRow(row: any, roles: Role[] = []): Tenant {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      status: row.status ?? true,
      createdAt: row.created_at,
      roles
    };
  }

  private async fetchRolesByTenantIds(ids: string[]): Promise<Record<string, Role[]>> {
    if (!ids.length) return {};
    const placeholders = ids.map((_id, idx) => `$${idx + 1}`).join(', ');
    const result = await dbConnection.query(
      `SELECT rt.tenant_id, r.id, r.name, r.description
       FROM roles_tenants rt
       JOIN roles r ON r.id = rt.role_id
       WHERE rt.tenant_id IN (${placeholders})`,
      ids
    );
    return result.rows.reduce<Record<string, Role[]>>((acc, row) => {
      const key = row.tenant_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push({ id: String(row.id), name: row.name, description: row.description ?? undefined });
      return acc;
    }, {});
  }

  public async replaceRoles(tenantId: string, roleIds: string[]): Promise<void> {
    await dbConnection.query('DELETE FROM roles_tenants WHERE tenant_id = $1', [tenantId]);
    if (!roleIds.length) return;
    const values: any[] = [];
    const inserts = roleIds.map((roleId, idx) => {
      const base = idx * 2;
      values.push(roleId, tenantId);
      return `($${base + 1}, $${base + 2})`;
    });
    const sql = `INSERT INTO roles_tenants (role_id, tenant_id) VALUES ${inserts.join(', ')} ON CONFLICT DO NOTHING`;
    await dbConnection.query(sql, values);
  }

  public async findAll(): Promise<Tenant[]> {
    const result = await dbConnection.query('SELECT * FROM tenants ORDER BY created_at DESC');
    const roleMap = await this.fetchRolesByTenantIds(result.rows.map((row) => row.id));
    return result.rows.map((row) => this.mapRow(row, roleMap[row.id] ?? []));
  }

  public async findById(id: string): Promise<Tenant | null> {
    const result = await dbConnection.query('SELECT * FROM tenants WHERE id = $1', [id]);
    const row = result.rows[0];
    if (!row) return null;
    const roleMap = await this.fetchRolesByTenantIds([row.id]);
    return this.mapRow(row, roleMap[row.id] ?? []);
  }

  public async findByName(name: string): Promise<Tenant | null> {
    const result = await dbConnection.query('SELECT * FROM tenants WHERE LOWER(name) = LOWER($1)', [name]);
    const row = result.rows[0];
    return row ? this.mapRow(row) : null;
  }

  public async create(data: CreateTenantDTO): Promise<Tenant> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await dbConnection.query(
      'INSERT INTO tenants (id, name, description, status, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, data.name, data.description ?? null, data.status ?? true, createdAt]
    );
    const created = await this.findById(id);
    if (!created) {
      throw new Error('Falha ao criar tenant.');
    }
    return created;
  }

  public async update(id: string, data: UpdateTenantDTO): Promise<Tenant | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (!fields.length) {
      return this.findById(id);
    }

    const setClause = fields
      .map((field, index) => field.replace('?', `$${index + 1}`))
      .join(', ');
    values.push(id);

    const query = `UPDATE tenants SET ${setClause} WHERE id = $${values.length}`;
    await dbConnection.query(query, values);

    return this.findById(id);
  }

  public async delete(id: string): Promise<void> {
    await dbConnection.query('DELETE FROM tenants WHERE id = $1', [id]);
  }
}
