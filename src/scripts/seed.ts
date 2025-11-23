import { ReservationStatus } from '../domain/enums/ReservationStatus';
import { PaymentStatus } from '../domain/enums/PaymentStatus';
import { UserRepository } from '../infra/repositories/UserRepository';
import { SpaceRepository } from '../infra/repositories/SpaceRepository';
import { ReservationRepository } from '../infra/repositories/ReservationRepository';
import { PaymentRepository } from '../infra/repositories/PaymentRepository';

const userRepository = new UserRepository();
const spaceRepository = new SpaceRepository();
const reservationRepository = new ReservationRepository();
const paymentRepository = new PaymentRepository();

const ensureUser = () => {
  const existing = userRepository.findByEmail('maria@seucantinho.com');
  if (existing) {
    return existing;
  }
  return userRepository.create({
    name: 'Maria Souza',
    email: 'maria@seucantinho.com',
    phone: '41988887777'
  });
};

const ensureSpaces = () => {
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

  const current = spaceRepository.findAll();

  return desired.map((space) => {
    const existing = current.find((item) => item.name === space.name);
    return existing ?? spaceRepository.create(space);
  });
};

const ensureReservation = (userId: string, spaceId: string) => {
  const existing = reservationRepository
    .findAll()
    .find((reservation) => reservation.userId === userId && reservation.spaceId === spaceId);
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

const ensurePayment = (reservationId: string) => {
  const existing = paymentRepository.findByReservation(reservationId)[0];
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

const run = () => {
  console.log('Executando seed do Seu Cantinho...');
  const user = ensureUser();
  const spaces = ensureSpaces();
  const reservation = ensureReservation(user.id, spaces[0].id);
  const payment = ensurePayment(reservation.id);

  console.log('Usuário base:', user.email);
  console.log('Espaços cadastrados:', spaces.map((space) => space.name).join(', '));
  console.log('Reserva gerada:', reservation.id);
  console.log('Pagamento gerado:', payment.id);
  console.log('Seed concluído com sucesso.');
};

run();
