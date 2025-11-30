import { dbConnection } from '../database/connection';
import { Role } from '../../domain/entities/Role';

interface UpsertRoleInput {
  name: string;
  description?: string;
}

export class RoleRepository {
  public async findAll(): Promise<Role[]> {
    const result = await dbConnection.query('SELECT id, name, description FROM roles ORDER BY name ASC');
    return result.rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      description: row.description ?? undefined
    }));
  }

  public async findByName(name: string): Promise<Role | null> {
    const result = await dbConnection.query('SELECT id, name, description FROM roles WHERE name = $1', [name]);
    const row = result.rows[0];
    return row ? { id: String(row.id), name: row.name, description: row.description ?? undefined } : null;
  }

  public async findByNames(names: string[]): Promise<Role[]> {
    if (!names.length) return [];
    const placeholders = names.map((_n, idx) => `$${idx + 1}`).join(', ');
    const result = await dbConnection.query(
      `SELECT id, name, description FROM roles WHERE name IN (${placeholders})`,
      names
    );
    return result.rows.map((row) => ({ id: String(row.id), name: row.name, description: row.description ?? undefined }));
  }

  public async findById(id: string): Promise<Role | null> {
    const result = await dbConnection.query('SELECT id, name, description FROM roles WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? { id: String(row.id), name: row.name, description: row.description ?? undefined } : null;
  }

  public async upsert(data: UpsertRoleInput): Promise<Role> {
    const result = await dbConnection.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
       RETURNING id, name, description`,
      [data.name, data.description ?? null]
    );
    const row = result.rows[0];
    return { id: String(row.id), name: row.name, description: row.description ?? undefined };
  }

  public async upsertMany(items: UpsertRoleInput[]): Promise<Role[]> {
    const roles: Role[] = [];
    for (const item of items) {
      roles.push(await this.upsert(item));
    }
    return roles;
  }
}
