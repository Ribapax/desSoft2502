import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { Space } from '../../domain/entities/Space';

interface CreateSpaceDTO {
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  coverImageUrl?: string;
}

interface UpdateSpaceDTO {
  name?: string;
  description?: string;
  capacity?: number;
  pricePerHour?: number;
  coverImageUrl?: string;
}

export class SpaceRepository {
  private mapRow(row: any): Space {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      capacity: row.capacity,
      pricePerHour: row.price_per_hour,
      coverImageUrl: row.cover_image_url ?? undefined,
      createdAt: row.created_at
    };
  }

  public findAll(): Space[] {
    const stmt = dbConnection.prepare('SELECT * FROM spaces ORDER BY created_at DESC');
    return stmt.all().map((row) => this.mapRow(row));
  }

  public findById(id: string): Space | null {
    const stmt = dbConnection.prepare('SELECT * FROM spaces WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  public create(data: CreateSpaceDTO): Space {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const stmt = dbConnection.prepare(
      'INSERT INTO spaces (id, name, description, capacity, price_per_hour, cover_image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      id,
      data.name,
      data.description,
      data.capacity,
      data.pricePerHour,
      data.coverImageUrl ?? null,
      createdAt
    );

    return this.findById(id)!;
  }

  public update(id: string, data: UpdateSpaceDTO): Space | null {
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
    if (data.capacity !== undefined) {
      fields.push('capacity = ?');
      values.push(data.capacity);
    }
    if (data.pricePerHour !== undefined) {
      fields.push('price_per_hour = ?');
      values.push(data.pricePerHour);
    }
    if (data.coverImageUrl !== undefined) {
      fields.push('cover_image_url = ?');
      values.push(data.coverImageUrl);
    }

    if (!fields.length) {
      return this.findById(id);
    }

    const query = `UPDATE spaces SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = dbConnection.prepare(query);
    stmt.run(...values, id);

    return this.findById(id);
  }

  public delete(id: string): void {
    const stmt = dbConnection.prepare('DELETE FROM spaces WHERE id = ?');
    stmt.run(id);
  }
}
