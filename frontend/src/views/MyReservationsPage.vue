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
const loading = ref(false);
const actionLoading = ref<string | null>(null);
const showPaymentModal = ref(false);
const paymentAmount = ref(0);
const paymentSpaceId = ref<string | null>(null);
const paymentReservationIds = ref<string[]>([]);
const minSignal = ref(0);
const remaining = ref(0);

const fetchData = async () => {
  if (!auth.id) {
    router.push({ name: 'login' });
    return;
  }
  loading.value = true;
  try {
    const [reservationList, spaceList] = await Promise.all([
      reservationService.list({ userId: auth.id }),
      spaceService.list()
    ]);
    reservations.value = reservationList;
    spaces.value = spaceList;
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

const parseReservationDate = (dateString: string) => {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const groupedBySpace = computed(() => {
  const groups: Record<
    string,
    {
      space: SpaceResponse | null;
      reservations: (ReservationResponse & { checkIn: string })[];
    }
  > = {};
  for (const reservation of upcomingReservations.value) {
    const space = findSpace(reservation.spaceId) ?? null;
    const checkIn = space?.checkInTime ?? '08:00';
    const key = reservation.spaceId;
    if (!groups[key]) {
      groups[key] = { space, reservations: [] };
    }
    const remaining = space ? Math.max(space.price, 0) : 0;
    groups[key].reservations.push({ ...reservation, checkIn });
  }
  return Object.values(groups);
});

const payReservation = async (spaceId: string, reservationIds: string[]) => {
  const space = findSpace(spaceId);
  if (!space || !reservationIds.length) return;
  paymentSpaceId.value = spaceId;
  // sempre considerar todas as reservas do espaço para permitir completar pagamento
  const group = groupedBySpace.value.find((g) => g.space?.id === spaceId);
  paymentReservationIds.value = group?.reservations.map((r) => r.id) ?? reservationIds;
  const total = space.price * (group?.reservations.length ?? reservationIds.length);
  minSignal.value = total * (space.signalPercentage ?? 0) / 100;
  remaining.value = total;
  paymentAmount.value = Math.max(minSignal.value, remaining.value);
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
  if (!paymentSpaceId.value || !paymentReservationIds.value.length) return;
  const space = findSpace(paymentSpaceId.value);
  if (!space) return;
  const total = space.price * paymentReservationIds.value.length;
  const amount = paymentAmount.value;
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
  actionLoading.value = paymentReservationIds.value[0];
  try {
    await paymentService.create({
      reservationIds: paymentReservationIds.value,
      totalAmount: total,
      payed: Math.min(amount, remaining.value),
      status: amount >= remaining.value ? PaymentStatus.FULL : PaymentStatus.SIGNAL,
      paidAt: new Date().toISOString()
    });
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
      <div v-for="group in groupedBySpace" :key="group.space?.id ?? 'sem-espaco'" class="card">
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
