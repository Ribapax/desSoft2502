import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { Reservation } from '../../domain/entities/Reservation';

interface CreateReservationDTO {
  userId: string;
  spaceId: string;
  reservationDate: string;
  paymentId?: string | null;
}

interface UpdateReservationDTO {
  userId?: string;
  spaceId?: string;
  reservationDate?: string;
  paymentId?: string | null;
}

interface ReservationFilters {
  userId?: string;
  spaceId?: string;
}

export class ReservationRepository {
  private formatDate(value: any): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    return String(value).slice(0, 10);
  }

  private mapRow(row: any): Reservation {
    return {
      id: row.id,
      userId: row.user_id,
      spaceId: row.space_id,
      reservationDate: this.formatDate(row.reservation_date),
      paymentId: row.payment_id ?? null,
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
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const stmt = await dbConnection.query(
      `SELECT * FROM reservations ${whereClause} ORDER BY reservation_date DESC`,
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
        id, user_id, space_id, reservation_date, payment_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        data.userId,
        data.spaceId,
        data.reservationDate,
        data.paymentId ?? null,
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
    if (data.reservationDate !== undefined) {
      fields.push('reservation_date = ?');
      values.push(data.reservationDate);
    }
    if (data.paymentId !== undefined) {
      fields.push('payment_id = ?');
      values.push(data.paymentId);
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

  public async findBySpaceAndDate(spaceId: string, date: string): Promise<Reservation | null> {
    const stmt = await dbConnection.query(
      'SELECT * FROM reservations WHERE space_id = $1 AND reservation_date = $2',
      [spaceId, date]
    );
    const row = stmt.rows[0];
    return row ? this.mapRow(row) : null;
  }
}
