import { ReservationStatus } from '../domain/enums/ReservationStatus';
import { PaymentStatus } from '../domain/enums/PaymentStatus';
import { UserRepository } from '../infra/repositories/UserRepository';
import { SpaceRepository } from '../infra/repositories/SpaceRepository';
import { ReservationRepository } from '../infra/repositories/ReservationRepository';
import { PaymentRepository } from '../infra/repositories/PaymentRepository';
import { RoleService } from '../application/services/RoleService';

const userRepository = new UserRepository();
const spaceRepository = new SpaceRepository();
const reservationRepository = new ReservationRepository();
const paymentRepository = new PaymentRepository();
const roleService = new RoleService();

const ensureUser = async () => {
  const existing = await userRepository.findByEmail('maria@seucantinho.com');
  if (existing) {
    if (!existing.roles.length) {
      await userRepository.update(existing.id, { roles: ['admin'] });
      return (await userRepository.findById(existing.id))!;
    }
    return existing;
  }
  return userRepository.create({
    name: 'Maria Souza',
    email: 'maria@seucantinho.com',
    password: 'senha123',
    phone: '41988887777',
    roles: ['admin']
  });
};

const ensureSpaces = async () => {
  const desired = [
    {
      name: 'Chácara Flor do Campo',
      description: 'Ambiente aberto com piscina, quiosque e campo gramado.',
      capacity: 200,
      pricePerHour: 320,
      coverImageUrl: 'https://example.com/images/chacara.jpg'
    },
    {
      name: 'Salão Centro Histórico',
      description: 'Espaço climatizado com palco, cozinha industrial e projetor.',
      capacity: 150,
      pricePerHour: 280,
      coverImageUrl: 'https://example.com/images/salao.jpg'
    }
  ];

  const current = await spaceRepository.findAll();

  const created = [];
  for (const space of desired) {
    const existing = current.find((item) => item.name === space.name);
    created.push(existing ?? (await spaceRepository.create(space)));
  }
  return created;
};

const seedRoles = async () => {
  await roleService.upsertMany([
    { name: 'admin', description: 'Usuário administrativo da filial' },
    { name: 'master', description: 'Usuário administrativo geral' },
    { name: 'financial', description: 'Usuario financeiro da filial' },
    { name: 'client', description: 'Cliente' },
    { name: 'backoffice', description: 'Usuário operador da filial' }
  ]);
};

const ensureReservation = async (userId: string, spaceId: string) => {
  const existingList = await reservationRepository.findAll();
  const existing = existingList.find((reservation) => reservation.userId === userId && reservation.spaceId === spaceId);
  if (existing) {
    return existing;
  }

  const start = new Date();
  start.setDate(start.getDate() + 14);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);

  return reservationRepository.create({
    userId,
    spaceId,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    totalPrice: 1600,
    status: ReservationStatus.Confirmed
  });
};

const ensurePayment = async (reservationId: string) => {
  const existing = (await paymentRepository.findByReservation(reservationId))[0];
  if (existing) {
    return existing;
  }

  return paymentRepository.create({
    reservationId,
    amount: 800,
    status: PaymentStatus.Signal,
    paidAt: new Date().toISOString()
  });
};

const run = async () => {
  console.log('Executando seed do Seu Cantinho...');
  await seedRoles();
  const user = await ensureUser();
  const spaces = await ensureSpaces();
  const reservation = await ensureReservation(user.id, spaces[0].id);
  const payment = await ensurePayment(reservation.id);

  console.log('Usuário base:', user.email);
  console.log('Espaços cadastrados:', spaces.map((space) => space.name).join(', '));
  console.log('Reserva gerada:', reservation.id);
  console.log('Pagamento gerado:', payment.id);
  console.log('Seed concluído com sucesso.');
};

run();
