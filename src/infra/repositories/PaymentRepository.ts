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
      amount: Number(row.amount),
      status: row.status as PaymentStatus,
      paidAt: row.paid_at,
      createdAt: row.created_at
    };
  }

  public async findAll(): Promise<Payment[]> {
    const result = await dbConnection.query('SELECT * FROM payments ORDER BY paid_at DESC');
    return result.rows.map((row) => this.mapRow(row));
  }

  public async findById(id: string): Promise<Payment | null> {
    const result = await dbConnection.query('SELECT * FROM payments WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? this.mapRow(row) : null;
  }

  public async findByReservation(reservationId: string): Promise<Payment[]> {
    const result = await dbConnection.query(
      'SELECT * FROM payments WHERE reservation_id = $1 ORDER BY paid_at DESC',
      [reservationId]
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  public async create(data: CreatePaymentDTO): Promise<Payment> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await dbConnection.query(
      'INSERT INTO payments (id, reservation_id, amount, status, paid_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, data.reservationId, data.amount, data.status, data.paidAt, createdAt]
    );
    const created = await this.findById(id);
    if (!created) {
      throw new Error('Falha ao criar pagamento.');
    }
    return created;
  }

  public async update(id: string, data: UpdatePaymentDTO): Promise<Payment | null> {
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

    const setClause = fields
      .map((field, index) => field.replace('?', `$${index + 1}`))
      .join(', ');
    values.push(id);

    const query = `UPDATE payments SET ${setClause} WHERE id = $${values.length}`;
    await dbConnection.query(query, values);
    return this.findById(id);
  }

  public async delete(id: string): Promise<void> {
    await dbConnection.query('DELETE FROM payments WHERE id = $1', [id]);
  }
}
