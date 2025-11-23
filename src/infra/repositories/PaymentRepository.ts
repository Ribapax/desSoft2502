import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { Payment } from '../../domain/entities/Payment';
import { PaymentStatus } from '../../domain/enums/PaymentStatus';

interface CreatePaymentDTO {
  reservationId: string;
  amount: number;
  status: PaymentStatus;
  paidAt: string;
}

interface UpdatePaymentDTO {
  amount?: number;
  status?: PaymentStatus;
  paidAt?: string;
}

export class PaymentRepository {
  private mapRow(row: any): Payment {
    return {
      id: row.id,
      reservationId: row.reservation_id,
      amount: row.amount,
      status: row.status as PaymentStatus,
      paidAt: row.paid_at,
      createdAt: row.created_at
    };
  }

  public findAll(): Payment[] {
    const stmt = dbConnection.prepare('SELECT * FROM payments ORDER BY paid_at DESC');
    return stmt.all().map((row) => this.mapRow(row));
  }

  public findById(id: string): Payment | null {
    const stmt = dbConnection.prepare('SELECT * FROM payments WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  public findByReservation(reservationId: string): Payment[] {
    const stmt = dbConnection.prepare('SELECT * FROM payments WHERE reservation_id = ? ORDER BY paid_at DESC');
    return stmt.all(reservationId).map((row) => this.mapRow(row));
  }

  public create(data: CreatePaymentDTO): Payment {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const stmt = dbConnection.prepare(
      'INSERT INTO payments (id, reservation_id, amount, status, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );

    stmt.run(id, data.reservationId, data.amount, data.status, data.paidAt, createdAt);
    return this.findById(id)!;
  }

  public update(id: string, data: UpdatePaymentDTO): Payment | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.amount !== undefined) {
      fields.push('amount = ?');
      values.push(data.amount);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.paidAt !== undefined) {
      fields.push('paid_at = ?');
      values.push(data.paidAt);
    }

    if (!fields.length) {
      return this.findById(id);
    }

    const query = `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = dbConnection.prepare(query);
    stmt.run(...values, id);
    return this.findById(id);
  }

  public delete(id: string): void {
    const stmt = dbConnection.prepare('DELETE FROM payments WHERE id = ?');
    stmt.run(id);
  }
}
