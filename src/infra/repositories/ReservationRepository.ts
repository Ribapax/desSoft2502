import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { Reservation } from '../../domain/entities/Reservation';
import { ReservationStatus } from '../../domain/enums/ReservationStatus';

interface CreateReservationDTO {
  userId: string;
  spaceId: string;
  startDate: string;
  endDate: string;
  checkInTime: string;
  checkOutTime: string;
  totalPrice: number;
  status: ReservationStatus;
}

interface UpdateReservationDTO {
  userId?: string;
  spaceId?: string;
  startDate?: string;
  endDate?: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalPrice?: number;
  status?: ReservationStatus;
}

interface ReservationFilters {
  userId?: string;
  spaceId?: string;
  status?: ReservationStatus;
}

export class ReservationRepository {
  private mapRow(row: any): Reservation {
    return {
      id: row.id,
      userId: row.user_id,
      spaceId: row.space_id,
      startDate: row.start_date,
      endDate: row.end_date,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      totalPrice: Number(row.total_price),
      status: row.status as ReservationStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  public async findAll(filters: ReservationFilters = {}): Promise<Reservation[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.userId) {
      params.push(filters.userId);
      conditions.push(`user_id = $${params.length}`);
    }
    if (filters.spaceId) {
      params.push(filters.spaceId);
      conditions.push(`space_id = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const stmt = await dbConnection.query(
      `SELECT * FROM reservations ${whereClause} ORDER BY start_date DESC`,
      params
    );
    return stmt.rows.map((row) => this.mapRow(row));
  }

  public async findById(id: string): Promise<Reservation | null> {
    const stmt = await dbConnection.query('SELECT * FROM reservations WHERE id = $1', [id]);
    const row = stmt.rows[0];
    return row ? this.mapRow(row) : null;
  }

  public async create(data: CreateReservationDTO): Promise<Reservation> {
    const id = randomUUID();
    const now = new Date().toISOString();
    await dbConnection.query(
      `INSERT INTO reservations (
        id, user_id, space_id, start_date, end_date, check_in_time, check_out_time, total_price, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        data.userId,
        data.spaceId,
        data.startDate,
        data.endDate,
        data.checkInTime,
        data.checkOutTime,
        data.totalPrice,
        data.status,
        now,
        now
      ]
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error('Falha ao criar reserva.');
    }
    return created;
  }

  public async update(id: string, data: UpdateReservationDTO): Promise<Reservation | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.userId !== undefined) {
      fields.push('user_id = ?');
      values.push(data.userId);
    }
    if (data.spaceId !== undefined) {
      fields.push('space_id = ?');
      values.push(data.spaceId);
    }
    if (data.startDate !== undefined) {
      fields.push('start_date = ?');
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      fields.push('end_date = ?');
      values.push(data.endDate);
    }
    if (data.checkInTime !== undefined) {
      fields.push('check_in_time = ?');
      values.push(data.checkInTime);
    }
    if (data.checkOutTime !== undefined) {
      fields.push('check_out_time = ?');
      values.push(data.checkOutTime);
    }
    if (data.totalPrice !== undefined) {
      fields.push('total_price = ?');
      values.push(data.totalPrice);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (!fields.length) {
      return this.findById(id);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    const setClause = fields
      .map((field, index) => field.replace('?', `$${index + 1}`))
      .join(', ');
    values.push(id);

    const query = `UPDATE reservations SET ${setClause} WHERE id = $${values.length}`;
    await dbConnection.query(query, values);

    return this.findById(id);
  }

  public async delete(id: string): Promise<void> {
    await dbConnection.query('DELETE FROM reservations WHERE id = $1', [id]);
  }

  public async countOverlaps(
    spaceId: string,
    startDate: string,
    endDate: string,
    checkInTime: string,
    checkOutTime: string,
    excludeId?: string
  ): Promise<number> {
    const params: any[] = [spaceId, startDate, endDate, checkInTime, checkOutTime];
    let query = `
      SELECT COUNT(*) as count FROM reservations
      WHERE space_id = $1
        AND status != 'CANCELLED'
        AND NOT (
          (end_date::date + check_out_time <= ($2::date + $4::time))
          OR (start_date::date + check_in_time >= ($3::date + $5::time))
        )
    `;

    if (excludeId) {
      query += ' AND id != $6';
      params.push(excludeId);
    }

    const stmt = await dbConnection.query(query, params);
    const result = stmt.rows[0] as { count: string } | undefined;
    return result ? Number(result.count) : 0;
  }
}
