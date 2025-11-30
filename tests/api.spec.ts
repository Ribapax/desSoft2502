import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/server';
import { resetDatabase } from '../src/infra/database/reset';
import { ReservationStatus } from '../src/domain/enums/ReservationStatus';
import { PaymentStatus } from '../src/domain/enums/PaymentStatus';

const app = createApp();
let sequence = 0;
const nextId = () => {
  sequence += 1;
  return sequence;
};

const buildUserPayload = () => ({
  name: `Usuário ${nextId()}`,
  email: `user${nextId()}@example.com`,
  password: 'Senha@123',
  phone: '55999999999',
  roles: ['master']
});

const buildSpacePayload = () => ({
  name: `Espaço ${nextId()}`,
  description: 'Salão amplo com área externa e cozinha equipada.',
  capacity: 120,
  pricePerHour: 150,
  coverImageUrl: 'https://example.com/image.jpg'
});

const futureInterval = () => {
  const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
};

describe('Seu Cantinho API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('cria e lista usuários', async () => {
    const userPayload = buildUserPayload();
    const createResponse = await request(app).post('/api/users').send(userPayload);
    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      name: userPayload.name,
      email: userPayload.email
    });

    const listResponse = await request(app).get('/api/users');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
  });

  it('impede double-booking ao criar reserva', async () => {
    const user = (await request(app).post('/api/users').send(buildUserPayload())).body;
    const space = (await request(app).post('/api/spaces').send(buildSpacePayload())).body;
    const { start, end } = futureInterval();

    const firstReservation = await request(app)
      .post('/api/reservations')
      .send({
        userId: user.id,
        spaceId: space.id,
        startDate: start,
        endDate: end,
        totalPrice: 600,
        status: ReservationStatus.Confirmed
      });
    expect(firstReservation.status).toBe(201);
    const listAfterFirst = await request(app).get('/api/reservations');
    expect(listAfterFirst.body).toHaveLength(1);

    const overlapping = await request(app)
      .post('/api/reservations')
      .send({
        userId: user.id,
        spaceId: space.id,
        startDate: start,
        endDate: end,
        totalPrice: 600
      });
    expect(overlapping.status).toBe(409);
  });

  it('registra pagamento para uma reserva existente', async () => {
    const user = (await request(app).post('/api/users').send(buildUserPayload())).body;
    const space = (await request(app).post('/api/spaces').send(buildSpacePayload())).body;
    const { start, end } = futureInterval();

    const reservationResponse = await request(app)
      .post('/api/reservations')
      .send({
        userId: user.id,
        spaceId: space.id,
        startDate: start,
        endDate: end,
        totalPrice: 800
      });
    expect(reservationResponse.status).toBe(201);

    const paymentResponse = await request(app)
      .post('/api/payments')
      .send({
        reservationId: reservationResponse.body.id,
        amount: 400,
        status: PaymentStatus.Signal,
        paidAt: new Date().toISOString()
      });
    expect(paymentResponse.status).toBe(201);

    const listPayments = await request(app)
      .get('/api/payments')
      .query({ reservationId: reservationResponse.body.id });
    expect(listPayments.status).toBe(200);
    expect(listPayments.body).toHaveLength(1);
  });
});
