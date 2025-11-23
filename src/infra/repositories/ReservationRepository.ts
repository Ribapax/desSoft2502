import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { Reservation } from '../../domain/entities/Reservation';
import { ReservationStatus } from '../../domain/enums/ReservationStatus';

interface CreateReservationDTO {
  userId: string;
  spaceId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: ReservationStatus;
}

interface UpdateReservationDTO {
  userId?: string;
  spaceId?: string;
  startDate?: string;
  endDate?: string;
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
      totalPrice: row.total_price,
      status: row.status as ReservationStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  public findAll(filters: ReservationFilters = {}): Reservation[] {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.userId) {
      conditions.push('user_id = ?');
      params.push(filters.userId);
    }
    if (filters.spaceId) {
      conditions.push('space_id = ?');
      params.push(filters.spaceId);
    }
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const stmt = dbConnection.prepare(`SELECT * FROM reservations ${whereClause} ORDER BY start_date DESC`);
    return stmt.all(...params).map((row) => this.mapRow(row));
  }

  public findById(id: string): Reservation | null {
    const stmt = dbConnection.prepare('SELECT * FROM reservations WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  public create(data: CreateReservationDTO): Reservation {
    const id = randomUUID();
    const now = new Date().toISOString();
    const stmt = dbConnection.prepare(
      `INSERT INTO reservations (
        id, user_id, space_id, start_date, end_date, total_price, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    stmt.run(
      id,
      data.userId,
      data.spaceId,
      data.startDate,
      data.endDate,
      data.totalPrice,
      data.status,
      now,
      now
    );

    return this.findById(id)!;
  }

  public update(id: string, data: UpdateReservationDTO): Reservation | null {
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

    const query = `UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = dbConnection.prepare(query);
    stmt.run(...values, id);

    return this.findById(id);
  }

  public delete(id: string): void {
    const stmt = dbConnection.prepare('DELETE FROM reservations WHERE id = ?');
    stmt.run(id);
  }

  public countOverlaps(spaceId: string, startDate: string, endDate: string, excludeId?: string): number {
    const params: any[] = [spaceId, startDate, endDate];
    let query = `
      SELECT COUNT(*) as count FROM reservations
      WHERE space_id = ?
        AND status != 'CANCELLED'
        AND NOT (end_date <= ? OR start_date >= ?)
    `;

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const stmt = dbConnection.prepare(query);
    const result = stmt.get(...params) as { count: number } | undefined;
    return result?.count ?? 0;
  }
}
