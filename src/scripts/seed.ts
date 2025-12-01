import { PaymentStatus } from '../domain/enums/PaymentStatus';
import { UserRepository } from '../infra/repositories/UserRepository';
import { SpaceRepository } from '../infra/repositories/SpaceRepository';
import { ReservationRepository } from '../infra/repositories/ReservationRepository';
import { PaymentRepository } from '../infra/repositories/PaymentRepository';
import { RoleService } from '../application/services/RoleService';
import { TenantService } from '../application/services/TenantService';

const userRepository = new UserRepository();
const spaceRepository = new SpaceRepository();
const reservationRepository = new ReservationRepository();
const paymentRepository = new PaymentRepository();
const roleService = new RoleService();
const tenantService = new TenantService();

const ensureMasterUser = async () => {
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
    roles: ['master']
  });
};

const ensureSpaces = async () => {
  const desired = [
    {
      name: 'Chácara Flor do Campo',
      description: 'Ambiente aberto com piscina, quiosque e campo gramado.',
      capacity: 200,
      price: 320,
      coverImageUrl: 'https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Salão Centro Histórico',
      description: 'Espaço climatizado com palco, cozinha industrial e projetor.',
      capacity: 150,
      price: 280,
      coverImageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
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

const seedTenants = async () => {
  const tenants = [
    { name: 'seucantinho-PR', description: 'Filial Paraná', roles: ['admin', 'financial', 'backoffice'] },
    { name: 'seucantinho-SC', description: 'Filial Santa Catarina', roles: ['admin', 'financial', 'backoffice'] },
    { name: 'seucantinho-RS', description: 'Filial Rio Grande do Sul', roles: ['admin', 'financial', 'backoffice'] }
  ];
  const existingTenants = await tenantService.list();
  for (const tenant of tenants) {
    const existing = existingTenants.find((t) => t.name === tenant.name);
    if (!existing) {
      await tenantService.create({ ...tenant, status: true });
    }
  }
};

const ensureUserWithRole = async (name: string, email: string, role: string, tenantId?: string) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) return existing;
  return userRepository.create({
    name,
    email,
    password: 'senha123',
    roles: [role],
    tenantIds: tenantId ? [tenantId] : []
  });
};

const seedTenantUsers = async () => {
  const tenants = await tenantService.list();
  for (const tenant of tenants) {
    await ensureUserWithRole(`Admin ${tenant.name}`, `admin+${tenant.name}@seucantinho.com`, 'admin', tenant.id);
    await ensureUserWithRole(
      `Financeiro ${tenant.name}`,
      `financeiro+${tenant.name}@seucantinho.com`,
      'financial',
      tenant.id
    );
    await ensureUserWithRole(
      `Backoffice ${tenant.name}`,
      `backoffice+${tenant.name}@seucantinho.com`,
      'backoffice',
      tenant.id
    );
  }
};

const ensureClientUser = async () => {
  const email = 'cliente@seucantinho.com';
  const existing = await userRepository.findByEmail(email);
  if (existing) return existing;
  return userRepository.create({
    name: 'Cliente Teste',
    email,
    password: 'senha123',
    roles: ['client']
  });
};

const ensureReservation = async (userId: string, spaceId: string) => {
  const existingList = await reservationRepository.findAll();
  const existing = existingList.find((reservation) => reservation.userId === userId && reservation.spaceId === spaceId);
  if (existing) {
    return existing;
  }

  const date = new Date();
  date.setDate(date.getDate() + 14);

  return reservationRepository.create({
    userId,
    spaceId,
    reservationDate: date.toISOString().split('T')[0]
  });
};

const ensurePayment = async (reservationIds: string[]) => {
  const existingPayments = await paymentRepository.findAll();
  const alreadyLinked = existingPayments.find((payment) =>
    reservationIds.some((rid) => rid && payment.totalAmount && payment.payed >= 0)
  );
  if (alreadyLinked) return alreadyLinked;

  return paymentRepository.create({
    reservationIds,
    totalAmount: 1600,
    payed: 800,
    status: PaymentStatus.Signal,
    paidAt: new Date().toISOString()
  });
};

export const runSeed = async () => {
  console.log('Executando seed do Seu Cantinho...');
  await seedRoles();
  await seedTenants();
  const user = await ensureMasterUser();
  await seedTenantUsers();
  const clientUser = await ensureClientUser();
  const spaces = await ensureSpaces();
  const reservation = await ensureReservation(user.id, spaces[0].id);
  const payment = await ensurePayment([reservation.id]);

  console.log('Usuário base:', user.email);
  console.log('Usuário cliente:', clientUser.email);
  console.log('Espaços cadastrados:', spaces.map((space) => space.name).join(', '));
  console.log('Reserva gerada:', reservation.id);
  console.log('Pagamento gerado:', payment.id);
  console.log('Seed concluído com sucesso.');
};

// Run seed directly when executed as a script
if (require.main === module) {
  runSeed();
}
