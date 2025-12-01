import { randomUUID } from 'node:crypto';
import { dbConnection } from '../database/connection';
import { Payment } from '../../domain/entities/Payment';
import { PaymentStatus } from '../../domain/enums/PaymentStatus';

interface CreatePaymentDTO {
  totalAmount: number;
  payed: number;
  status: PaymentStatus;
  paidAt: string;
  reservationIds?: string[];
}

interface UpdatePaymentDTO {
  totalAmount?: number;
  payed?: number;
  status?: PaymentStatus;
  paidAt?: string;
}

export class PaymentRepository {
  private mapRow(row: any): Payment {
    return {
      id: row.id,
      totalAmount: Number(row.total_amount),
      payed: Number(row.payed),
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

  public async create(data: CreatePaymentDTO): Promise<Payment> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await dbConnection.query(
      'INSERT INTO payments (id, total_amount, payed, status, paid_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, data.totalAmount, data.payed, data.status, data.paidAt, createdAt]
    );
    if (data.reservationIds?.length) {
      await dbConnection.query('UPDATE reservations SET payment_id = $1 WHERE id = ANY($2::uuid[])', [
        id,
        data.reservationIds
      ]);
    }
    const created = await this.findById(id);
    if (!created) {
      throw new Error('Falha ao criar pagamento.');
    }
    return created;
  }

  public async update(id: string, data: UpdatePaymentDTO): Promise<Payment | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.totalAmount !== undefined) {
      fields.push('total_amount = ?');
      values.push(data.totalAmount);
    }
    if (data.payed !== undefined) {
      fields.push('payed = ?');
      values.push(data.payed);
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
