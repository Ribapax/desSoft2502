<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { reservationService, type ReservationResponse } from '../services/reservationService';
import { spaceService, type SpaceResponse } from '../services/spaceService';
import { paymentService, PaymentStatus, type PaymentResponse } from '../services/paymentService';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const reservations = ref<ReservationResponse[]>([]);
const spaces = ref<SpaceResponse[]>([]);
const payments = ref<PaymentResponse[]>([]);
const loading = ref(false);
const actionLoading = ref<string | null>(null);
const showPaymentModal = ref(false);
const paymentAmount = ref(0);
const paymentSpaceId = ref<string | null>(null);
const paymentReservationIds = ref<string[]>([]);
const currentPaymentId = ref<string | null>(null);
const paymentMode = ref<'new' | 'existing'>('new');
const minSignal = ref(0);
const remaining = ref(0);

const fetchData = async () => {
  if (!auth.id) {
    router.push({ name: 'login' });
    return;
  }
  loading.value = true;
  try {
    const [reservationList, spaceList, paymentList] = await Promise.all([
      reservationService.list({ userId: auth.id }),
      spaceService.list(),
      paymentService.list()
    ]);
    reservations.value = reservationList;
    spaces.value = spaceList;
    payments.value = paymentList;
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao carregar reservas.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } finally {
    loading.value = false;
  }
};

const todayKey = new Date().toISOString().split('T')[0];
const upcomingReservations = computed(() =>
  reservations.value.filter((reservation) => reservation.reservationDate >= todayKey)
);

const findSpace = (spaceId: string) => spaces.value.find((s) => s.id === spaceId);
const paymentMap = computed<Record<string, PaymentResponse>>(() => {
  const map: Record<string, PaymentResponse> = {};
  payments.value.forEach((payment) => {
    map[payment.id] = payment;
  });
  return map;
});
const paymentRemainingValue = (paymentId: string | null | undefined) => {
  if (!paymentId) return 0;
  const payment = paymentMap.value[paymentId];
  if (!payment) return 0;
  return Math.max(payment.totalAmount - payment.payed, 0);
};
const paymentStatusLabel = (payment?: PaymentResponse | null) =>
  payment?.status === PaymentStatus.SIGNAL ? 'Pagamento parcial' : 'Pagamento registrado';

const parseReservationDate = (dateString: string) => {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const groupReservations = (list: ReservationResponse[]) => {
  const groups: Record<
    string,
    {
      space: SpaceResponse | null;
      reservations: (ReservationResponse & { checkIn: string })[];
    }
  > = {};
  for (const reservation of list) {
    const space = findSpace(reservation.spaceId) ?? null;
    const checkIn = space?.checkInTime ?? '08:00';
    const key = reservation.spaceId;
    if (!groups[key]) {
      groups[key] = { space, reservations: [] };
    }
    groups[key].reservations.push({ ...reservation, checkIn });
  }
  return Object.values(groups);
};

const groupReservationsByPayment = (list: ReservationResponse[]) => {
  const groups: Record<
    string,
    {
      paymentId: string;
      payment: PaymentResponse | null;
      space: SpaceResponse | null;
      reservations: (ReservationResponse & { checkIn: string })[];
    }
  > = {};
  for (const reservation of list) {
    const key = reservation.paymentId ?? `sem-pagamento-${reservation.id}`;
    const space = findSpace(reservation.spaceId) ?? null;
    const checkIn = space?.checkInTime ?? '08:00';
    if (!groups[key]) {
      groups[key] = {
        paymentId: reservation.paymentId ?? '',
        payment: reservation.paymentId ? paymentMap.value[reservation.paymentId] ?? null : null,
        space,
        reservations: []
      };
    }
    groups[key].reservations.push({ ...reservation, checkIn });
  }
  return Object.values(groups);
};

const groupedPending = computed(() =>
  groupReservations(upcomingReservations.value.filter((reservation) => !reservation.paymentId))
);
const groupedPaid = computed(() =>
  groupReservationsByPayment(upcomingReservations.value.filter((reservation) => reservation.paymentId))
);

const payReservation = async (spaceId: string, reservationIds: string[]) => {
  const space = findSpace(spaceId);
  if (!space || !reservationIds.length) return;
  currentPaymentId.value = null;
  paymentMode.value = 'new';
  paymentSpaceId.value = spaceId;
  // considerar apenas reservas pendentes para não somar valores já pagos
  const pendingGroup = groupedPending.value.find((g) => g.space?.id === spaceId);
  const pendingReservations = pendingGroup?.reservations.filter((r) => !r.paymentId) ?? [];
  paymentReservationIds.value = pendingReservations.map((r) => r.id);
  if (!paymentReservationIds.value.length) return;
  const total = space.price * pendingReservations.length;
  minSignal.value = total * (space.signalPercentage ?? 0) / 100;
  remaining.value = total;
  paymentAmount.value = Math.max(minSignal.value, remaining.value);
  showPaymentModal.value = true;
};

const payRemaining = (group: {
  paymentId: string;
  payment: PaymentResponse | null;
  space: SpaceResponse | null;
  reservations: (ReservationResponse & { checkIn: string })[];
}) => {
  if (!group.paymentId || !group.payment) return;
  currentPaymentId.value = group.paymentId;
  paymentMode.value = 'existing';
  paymentSpaceId.value = group.space?.id ?? null;
  paymentReservationIds.value = group.reservations.map((r) => r.id);
  const total = group.payment.totalAmount;
  const alreadyPayed = group.payment.payed;
  const remainingValue = Math.max(total - alreadyPayed, 0);
  if (remainingValue <= 0) return;
  remaining.value = remainingValue;
  minSignal.value = 0;
  paymentAmount.value = remainingValue;
  showPaymentModal.value = true;
};

const cancelReservation = async (reservationId: string) => {
  actionLoading.value = reservationId;
  try {
    await reservationService.delete(reservationId);
    await fetchData();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Reserva cancelada.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } catch (err: any) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: err?.message ?? 'Erro ao cancelar.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } finally {
    actionLoading.value = null;
  }
};

const confirmPayment = async () => {
  if (paymentMode.value === 'new' && (!paymentSpaceId.value || !paymentReservationIds.value.length)) return;
  const space = paymentSpaceId.value ? findSpace(paymentSpaceId.value) : null;
  if (paymentMode.value === 'new' && !space) return;
  const amount = paymentAmount.value;
  if (paymentMode.value === 'new') {
    const total = space!.price * paymentReservationIds.value.length;
    if (amount < minSignal.value && remaining.value === total) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Valor abaixo do sinal mínimo.',
        timer: 5000,
        showConfirmButton: false,
        timerProgressBar: true
      });
      return;
    }
  }
  if (amount <= 0) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Informe um valor válido.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    return;
  }
  actionLoading.value = paymentReservationIds.value[0] ?? null;
  try {
    if (paymentMode.value === 'existing' && currentPaymentId.value) {
      const payment = paymentMap.value[currentPaymentId.value];
      if (!payment) {
        throw new Error('Pagamento não encontrado.');
      }
      const newPayed = Math.min(payment.payed + amount, payment.totalAmount);
      await paymentService.update(currentPaymentId.value, {
        payed: newPayed,
        status: newPayed >= payment.totalAmount ? PaymentStatus.FULL : PaymentStatus.SIGNAL,
        paidAt: new Date().toISOString()
      });
    } else {
      const total = space!.price * paymentReservationIds.value.length;
      await paymentService.create({
        reservationIds: paymentReservationIds.value,
        totalAmount: total,
        payed: Math.min(amount, remaining.value),
        status: amount >= remaining.value ? PaymentStatus.FULL : PaymentStatus.SIGNAL,
        paidAt: new Date().toISOString()
      });
    }
    await fetchData();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Pagamento registrado.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    showPaymentModal.value = false;
    currentPaymentId.value = null;
    paymentMode.value = 'new';
  } catch (err: any) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: err?.message ?? 'Erro ao pagar.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } finally {
    actionLoading.value = null;
  }
};

onMounted(fetchData);
</script>

<template>
  <section class="section page-view">
    <div class="badge">Minhas reservas</div>
    <h2>Próximas reservas</h2>
    <p class="muted">Gerencie suas reservas futuras: cancele ou registre o pagamento.</p>

    <div v-if="loading" class="muted">Carregando reservas...</div>
    <div v-else-if="!upcomingReservations.length" class="muted">Nenhuma reserva futura.</div>
    <div v-else class="user-grid">
      <div v-for="group in groupedPending" :key="`pendente-${group.space?.id ?? 'sem-espaco'}`" class="card">
        <div class="card-header">
          <h3>{{ group.space?.name ?? 'Espaço' }}</h3>
          <span class="muted">Próximas reservas</span>
        </div>
        <ul class="list">
          <li
            v-for="reservation in group.reservations"
            :key="reservation.id"
            class="reservation-row"
          >
            <div class="reservation-meta">
              <strong>{{ reservation.checkIn }} — {{ parseReservationDate(reservation.reservationDate).toLocaleDateString() }}</strong>
              <span class="pill small">{{ reservation.paymentId ? 'Pagamento registrado' : 'Pagamento pendente' }}</span>
            </div>
            <div class="cta-row spaced">
              <button
                v-if="!reservation.paymentId"
                class="btn btn-secondary"
                type="button"
                :disabled="actionLoading === reservation.id"
                @click="cancelReservation(reservation.id)"
              >
                Cancelar
              </button>
              <span class="pill small">R$ {{ (group.space?.price ?? 0).toFixed(2) }}</span>
            </div>
          </li>
        </ul>
        <div class="cta-row spaced">
          <button
            class="btn btn-primary"
            type="button"
            :disabled="actionLoading === (group.reservations[0]?.id ?? null)"
            @click="
              payReservation(
                group.space?.id ?? '',
                group.reservations.filter((r) => !r.paymentId).map((r) => r.id)
              )
            "
          >
            Pagar
          </button>
        </div>
      </div>
      <div v-for="group in groupedPaid" :key="`pago-${group.paymentId || group.reservations[0]?.id}`" class="card">
        <div class="card-header">
          <h3>{{ group.space?.name ?? 'Espaço' }}</h3>
          <span class="muted">Pagamento registrado</span>
        </div>
        <ul class="list">
          <li
            v-for="reservation in group.reservations"
            :key="reservation.id"
            class="reservation-row"
          >
            <div class="reservation-meta">
              <strong>{{ reservation.checkIn }} — {{ parseReservationDate(reservation.reservationDate).toLocaleDateString() }}</strong>
              <span class="pill small">{{ paymentStatusLabel(group.payment) }}</span>
            </div>
            <div class="cta-row spaced">
              <span class="pill small">R$ {{ (group.space?.price ?? 0).toFixed(2) }}</span>
            </div>
          </li>
        </ul>
        <div
          v-if="group.payment?.status === PaymentStatus.SIGNAL"
          class="cta-row spaced"
        >
          <span class="pill small">Restante: R$ {{ paymentRemainingValue(group.paymentId).toFixed(2) }}</span>
          <button
            class="btn btn-primary"
            type="button"
            :disabled="actionLoading === (group.reservations[0]?.id ?? null)"
            @click="payRemaining(group)"
          >
            Pagar
          </button>
        </div>
      </div>
    </div>
  </section>

  <div v-if="showPaymentModal" class="modal-backdrop" @click.self="showPaymentModal = false">
    <div class="modal">
      <div class="modal-header">
        <h3>Pagamento</h3>
        <button class="close" type="button" @click="showPaymentModal = false">×</button>
      </div>
      <div class="modal-body">
        <p class="muted">Valor sugerido: restante ou sinal mínimo.</p>
        <label class="form-group">
          <span>Valor a pagar</span>
          <input v-model.number="paymentAmount" class="input" type="number" min="0" step="0.01" />
        </label>
        <p class="muted">Restante: R$ {{ remaining.toFixed(2) }} · Sinal mínimo: R$ {{ minSignal.toFixed(2) }}</p>
        <div class="cta-row spaced">
          <button class="btn btn-secondary" type="button" @click="showPaymentModal = false">Cancelar</button>
          <button class="btn btn-primary" type="button" :disabled="paymentAmount <= 0" @click="confirmPayment">
            Confirmar pagamento
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
