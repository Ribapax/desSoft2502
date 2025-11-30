import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { Role } from '../../domain/entities/Role';
import { User } from '../../domain/entities/User';

interface CreateUserDTO {
  name: string;
  email: string;
  phone?: string;
  password: string;
  roles?: string[];
  tenantIds?: string[];
}

interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  roles?: string[];
  tenantIds?: string[];
}

export class UserRepository {
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private mapRow(row: any, roles: Role[] = [], tenantIds: string[] = []): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      createdAt: row.created_at,
      roles,
      tenantIds
    };
  }

  private async fetchRolesByUserIds(userIds: string[]): Promise<Record<string, Role[]>> {
    if (!userIds.length) return {};
    const placeholders = userIds.map((_id, index) => `$${index + 1}`).join(', ');
    const result = await dbConnection.query(
      `SELECT ur.user_id, r.id, r.name, r.description
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id IN (${placeholders})`,
      userIds
    );

    return result.rows.reduce<Record<string, Role[]>>((acc, row) => {
      const key = row.user_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({ id: String(row.id), name: row.name, description: row.description ?? undefined });
      return acc;
    }, {});
  }

  private async ensureRoles(names: string[] = []): Promise<Role[]> {
    const normalized = Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
    const roles: Role[] = [];
    for (const name of normalized) {
      const existing = await dbConnection.query('SELECT id, name, description FROM roles WHERE name = $1', [name]);
      if (existing.rows[0]) {
        const row = existing.rows[0];
        roles.push({ id: String(row.id), name: row.name, description: row.description ?? undefined });
        continue;
      }
      const created = await dbConnection.query(
        'INSERT INTO roles (name) VALUES ($1) RETURNING id, name, description',
        [name]
      );
      const row = created.rows[0];
      roles.push({ id: String(row.id), name: row.name, description: row.description ?? undefined });
    }
    return roles;
  }

  private async replaceUserRoles(userId: string, roleIds: string[]): Promise<void> {
    await dbConnection.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    if (!roleIds.length) return;
    const values: any[] = [];
    const inserts = roleIds.map((roleId, index) => {
      const base = index * 2;
      values.push(userId, roleId);
      return `($${base + 1}, $${base + 2})`;
    });
    const sql = `INSERT INTO user_roles (user_id, role_id) VALUES ${inserts.join(', ')} ON CONFLICT DO NOTHING`;
    await dbConnection.query(sql, values);
  }

  private async fetchTenantIds(userIds: string[]): Promise<Record<string, string[]>> {
    if (!userIds.length) return {};
    const placeholders = userIds.map((_id, index) => `$${index + 1}`).join(', ');
    const result = await dbConnection.query(
      `SELECT ut.user_id, ut.tenant_id FROM user_tenants ut WHERE ut.user_id IN (${placeholders})`,
      userIds
    );
    return result.rows.reduce<Record<string, string[]>>((acc, row) => {
      const key = row.user_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row.tenant_id);
      return acc;
    }, {});
  }

  private async replaceUserTenants(userId: string, tenantIds: string[]): Promise<void> {
    await dbConnection.query('DELETE FROM user_tenants WHERE user_id = $1', [userId]);
    if (!tenantIds.length) return;
    const values: any[] = [];
    const inserts = tenantIds.map((tenantId, index) => {
      const base = index * 2;
      values.push(userId, tenantId);
      return `($${base + 1}, $${base + 2})`;
    });
    const sql = `INSERT INTO user_tenants (user_id, tenant_id) VALUES ${inserts.join(', ')} ON CONFLICT DO NOTHING`;
    await dbConnection.query(sql, values);
  }

  public async findAll(): Promise<User[]> {
    const result = await dbConnection.query('SELECT * FROM users ORDER BY created_at DESC');
    const userIds = result.rows.map((row) => row.id);
    const roleMap = await this.fetchRolesByUserIds(userIds);
    const tenantMap = await this.fetchTenantIds(userIds);
    return result.rows.map((row) => this.mapRow(row, roleMap[row.id] ?? [], tenantMap[row.id] ?? []));
  }

  public async findById(id: string): Promise<User | null> {
    const result = await dbConnection.query('SELECT * FROM users WHERE id = $1', [id]);
    const row = result.rows[0];
    if (!row) return null;
    const roleMap = await this.fetchRolesByUserIds([row.id]);
    const tenantMap = await this.fetchTenantIds([row.id]);
    return this.mapRow(row, roleMap[row.id] ?? [], tenantMap[row.id] ?? []);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const normalized = this.normalizeEmail(email);
    const result = await dbConnection.query('SELECT * FROM users WHERE email = $1', [normalized]);
    const row = result.rows[0];
    if (!row) return null;
    const roleMap = await this.fetchRolesByUserIds([row.id]);
    const tenantMap = await this.fetchTenantIds([row.id]);
    return this.mapRow(row, roleMap[row.id] ?? [], tenantMap[row.id] ?? []);
  }

  public async create(data: CreateUserDTO): Promise<User> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const email = this.normalizeEmail(data.email);
    const allRoles = data.roles?.length ? await this.ensureRoles(data.roles) : [];
    const tenantIds = data.tenantIds ?? [];

    await dbConnection.query(
      'INSERT INTO users (id, name, email, phone, password, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, data.name, email, data.phone ?? null, data.password, createdAt]
    );
    if (allRoles.length) {
      await this.replaceUserRoles(id, allRoles.map((role) => role.id));
    }
    await this.replaceUserTenants(id, tenantIds);
    const created = await this.findById(id);
    if (!created) {
      throw new Error('Falha ao criar usuário.');
    }
    return created;
  }

  public async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(this.normalizeEmail(data.email));
    }

    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }

    if (data.password !== undefined) {
      fields.push('password = ?');
      values.push(data.password);
    }

    if (!fields.length) {
      return this.findById(id);
    }

    const setClause = fields
      .map((field, index) => field.replace('?', `$${index + 1}`))
      .join(', ');
    values.push(id);

    const query = `UPDATE users SET ${setClause} WHERE id = $${values.length}`;
    await dbConnection.query(query, values);

    if (data.roles) {
      const rolesByName = await this.ensureRoles(data.roles);
      await this.replaceUserRoles(id, rolesByName.map((role) => role.id));
    }
    if (data.tenantIds) {
      await this.replaceUserTenants(id, data.tenantIds);
    }

    return this.findById(id);
  }

  public async delete(id: string): Promise<void> {
    await dbConnection.query('DELETE FROM users WHERE id = $1', [id]);
  }
}
