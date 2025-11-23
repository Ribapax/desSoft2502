import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { User } from '../../domain/entities/User';

interface CreateUserDTO {
  name: string;
  email: string;
  phone?: string;
}

interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
}

export class UserRepository {
  private mapRow(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      createdAt: row.created_at
    };
  }

  public findAll(): User[] {
    const stmt = dbConnection.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all().map((row) => this.mapRow(row));
  }

  public findById(id: string): User | null {
    const stmt = dbConnection.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  public findByEmail(email: string): User | null {
    const stmt = dbConnection.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email);
    return row ? this.mapRow(row) : null;
  }

  public create(data: CreateUserDTO): User {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const stmt = dbConnection.prepare(
      'INSERT INTO users (id, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?)' 
    );
    stmt.run(id, data.name, data.email, data.phone ?? null, createdAt);
    return this.findById(id)!;
  }

  public update(id: string, data: UpdateUserDTO): User | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }

    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }

    if (!fields.length) {
      return this.findById(id);
    }

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = dbConnection.prepare(query);
    stmt.run(...values, id);

    return this.findById(id);
  }

  public delete(id: string): void {
    const stmt = dbConnection.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }
}
