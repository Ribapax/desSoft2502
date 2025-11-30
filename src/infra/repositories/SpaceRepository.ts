import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { Space } from '../../domain/entities/Space';

interface CreateSpaceDTO {
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  coverImageUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  signalPercentage?: number;
  tenantId?: string;
}

interface UpdateSpaceDTO {
  name?: string;
  description?: string;
  capacity?: number;
  pricePerHour?: number;
  coverImageUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  signalPercentage?: number;
  tenantId?: string;
}

export class SpaceRepository {
  private mapRow(row: any): Space {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      capacity: row.capacity,
      pricePerHour: Number(row.price_per_hour),
      coverImageUrl: row.cover_image_url ?? undefined,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      signalPercentage: Number(row.signal_percentage),
      tenantId: row.tenant_id ?? undefined,
      createdAt: row.created_at
    };
  }

  public async findAll(): Promise<Space[]> {
    const result = await dbConnection.query('SELECT * FROM spaces ORDER BY created_at DESC');
    return result.rows.map((row) => this.mapRow(row));
  }

  public async findById(id: string): Promise<Space | null> {
    const result = await dbConnection.query('SELECT * FROM spaces WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? this.mapRow(row) : null;
  }

  public async create(data: CreateSpaceDTO): Promise<Space> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await dbConnection.query(
      `INSERT INTO spaces (
        id, name, description, capacity, price_per_hour, cover_image_url, tenant_id,
        check_in_time, check_out_time, signal_percentage, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        data.name,
        data.description,
        data.capacity,
        data.pricePerHour,
        data.coverImageUrl ?? null,
        data.tenantId ?? null,
        data.checkInTime ?? '08:00',
        data.checkOutTime ?? '18:00',
        data.signalPercentage ?? 50,
        createdAt
      ]
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error('Falha ao criar espaço.');
    }
    return created;
  }

  public async update(id: string, data: UpdateSpaceDTO): Promise<Space | null> {
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
    if (data.checkInTime !== undefined) {
      fields.push('check_in_time = ?');
      values.push(data.checkInTime);
    }
    if (data.checkOutTime !== undefined) {
      fields.push('check_out_time = ?');
      values.push(data.checkOutTime);
    }
    if (data.signalPercentage !== undefined) {
      fields.push('signal_percentage = ?');
      values.push(data.signalPercentage);
    }
    if (data.tenantId !== undefined) {
      fields.push('tenant_id = ?');
      values.push(data.tenantId);
    }

    if (!fields.length) {
      return this.findById(id);
    }

    const setClause = fields
      .map((field, index) => field.replace('?', `$${index + 1}`))
      .join(', ');
    values.push(id);

    const query = `UPDATE spaces SET ${setClause} WHERE id = $${values.length}`;
    await dbConnection.query(query, values);

    return this.findById(id);
  }

  public async delete(id: string): Promise<void> {
    await dbConnection.query('DELETE FROM spaces WHERE id = $1', [id]);
  }
}
