<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Swal from 'sweetalert2';
import { spaceService, type SpaceResponse } from '../services/spaceService';
import { tenantService, type TenantResponse } from '../services/tenantService';
import { useAuthStore } from '../stores/auth';
import { reservationService, type ReservationResponse } from '../services/reservationService';

const route = useRoute();
const space = ref<SpaceResponse | null>(null);
const tenant = ref<TenantResponse | null>(null);
const loading = ref(false);
const auth = useAuthStore();
const isAuthenticated = computed(() => Boolean(auth.id || auth.email));
const isClient = computed(() => auth.roles.map((r) => r.toLowerCase()).includes('client'));
const reservations = ref<ReservationResponse[]>([]);
const calendarLoading = ref(false);
const currentMonth = ref(new Date());
const activeIndex = ref(0);
const slideTimer = ref<number | undefined>();
const showReserveModal = ref(false);
const selectedDates = ref<Set<string>>(new Set());
const submittingReservation = ref(false);
const fallbackImages = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?auto=format&fit=crop&w=1200&q=80'
];

const fetchDetail = async () => {
  loading.value = true;
  try {
    const [spaceList, tenantList] = await Promise.all([spaceService.list(), tenantService.list()]);
    const found = spaceList.find((s) => s.id === route.params.id);
    if (!found) {
      throw new Error('Espaço não encontrado');
    }
    space.value = found;
    tenant.value = tenantList.find((t) => t.id === found.tenantId) ?? null;
    if (isAuthenticated.value) {
      await fetchReservations(found.id);
    }
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao carregar espaço.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } finally {
    loading.value = false;
  }
};

const carouselImages = computed(() => {
  if (!space.value?.coverImageUrl) return fallbackImages;
  return [space.value.coverImageUrl, ...fallbackImages.slice(0, 2)];
});

const fetchReservations = async (spaceId: string) => {
  calendarLoading.value = true;
  try {
    reservations.value = await reservationService.list({ spaceId });
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao carregar calendário.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } finally {
    calendarLoading.value = false;
  }
};

const nextSlide = () => {
  activeIndex.value = (activeIndex.value + 1) % carouselImages.value.length;
};

const prevSlide = () => {
  activeIndex.value = (activeIndex.value - 1 + carouselImages.value.length) % carouselImages.value.length;
};

const goToSlide = (index: number) => {
  activeIndex.value = index;
  startAutoplay();
};

const stopAutoplay = () => {
  if (slideTimer.value !== undefined) {
    window.clearInterval(slideTimer.value);
    slideTimer.value = undefined;
  }
};

const startAutoplay = () => {
  stopAutoplay();
  slideTimer.value = window.setInterval(nextSlide, 6000);
};

watch(
  () => carouselImages.value.length,
  () => {
    activeIndex.value = 0;
    startAutoplay();
  }
);

watch(
  () => isAuthenticated.value,
  (logged) => {
    if (logged && space.value) {
      fetchReservations(space.value.id);
    }
  }
);

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentMonth.value)
);

const normalizedDate = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseReservationDate = (dateString: string) => {
  const [y, m, d] = dateString.split('-').map((part) => Number(part));
  if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
    return new Date(y, m - 1, d);
  }
  const base = new Date(dateString);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
};

const isDayReserved = (date: Date) => {
  const target = normalizedDate(date);
  return reservations.value.some((reservation) => {
    const resDate = normalizedDate(parseReservationDate(reservation.reservationDate));
    return target === resDate;
  });
};

const monthDays = computed(() => {
  const refDate = currentMonth.value;
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayKey = formatDateKey(new Date());
  const days: { label: number | null; reserved?: boolean; isToday?: boolean }[] = [];

  for (let i = 0; i < startWeekday; i++) {
    days.push({ label: null });
  }

  for (let day = 1; day <= totalDays; day++) {
    const current = new Date(year, month, day);
    days.push({ label: day, reserved: isDayReserved(current), isToday: formatDateKey(current) === todayKey });
  }

  while (days.length % 7 !== 0) {
    days.push({ label: null });
  }

  return days;
});

const dateFromDay = (day: number) => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  return new Date(year, month, day);
};

const toggleSelectDay = (day: number | null) => {
  if (day === null || !showReserveModal.value) return;
  const date = dateFromDay(day);
  const today = normalizedDate(new Date());
  if (normalizedDate(date) < today) return;
  if (isDayReserved(date)) return;
  const dateKey = formatDateKey(date);
  const next = new Set(selectedDates.value);
  if (next.has(dateKey)) {
    next.delete(dateKey);
  } else {
    next.add(dateKey);
  }
  selectedDates.value = next;
};

const isSelectedDay = (day: number | null) => {
  if (day === null) return false;
  const date = dateFromDay(day);
  return selectedDates.value.has(formatDateKey(date));
};

const visibleReservations = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const monthStart = normalizedDate(new Date(year, month, 1));
  const monthEnd = normalizedDate(new Date(year, month + 1, 0));

  return reservations.value.filter((reservation) => {
    const day = normalizedDate(parseReservationDate(reservation.reservationDate));
    return day >= monthStart && day <= monthEnd;
  });
});

const changeMonth = (delta: number) => {
  const next = new Date(currentMonth.value);
  next.setMonth(next.getMonth() + delta);
  currentMonth.value = next;
};

const selectedDateList = computed(() => Array.from(selectedDates.value).sort());

const submitReservations = async () => {
  if (!space.value || !auth.id) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Faça login para reservar.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    return;
  }
  if (!selectedDates.value.size) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: 'Selecione ao menos uma data.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    return;
  }

  submittingReservation.value = true;
  try {
    for (const date of selectedDateList.value) {
      await reservationService.create({
        userId: auth.id,
        spaceId: space.value.id,
        reservationDate: date
      });
    }
    await fetchReservations(space.value.id);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Reserva criada!',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    selectedDates.value = new Set();
    showReserveModal.value = false;
  } catch (err: any) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: err?.message ?? 'Erro ao criar reserva.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    if (space.value) {
      await fetchReservations(space.value.id);
    }
    // Remove any dates that are now reserved
    if (space.value) {
      const reservedKeys = new Set(
        reservations.value.map((reservation) => formatDateKey(parseReservationDate(reservation.reservationDate)))
      );
      const next = new Set<string>();
      selectedDates.value.forEach((date) => {
        if (!reservedKeys.has(date)) {
          next.add(date);
        }
      });
      selectedDates.value = next;
    }
  } finally {
    submittingReservation.value = false;
  }
};

onMounted(() => {
  fetchDetail();
  startAutoplay();
});

onUnmounted(stopAutoplay);

const handleReserve = () => {
  if (!auth.email || !isClient.value) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Para reservar, entre como cliente.',
      timer: 5000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    return;
  }
  Swal.fire({
    toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Selecione as datas no modal.',
      timer: 5000,
    showConfirmButton: false,
    timerProgressBar: true
  });
  selectedDates.value = new Set();
  showReserveModal.value = true;
};
</script>

<template>
  <section class="section page-view">
    <div class="badge">Espaço</div>
    <h2 v-if="space">{{ space.name }}</h2>
    <p v-if="tenant" class="muted">Filial: {{ tenant.name }}</p>
    <div class="space-hero" v-if="carouselImages.length">
      <div class="carousel">
        <div class="carousel-window">
          <div class="carousel-track" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
            <div v-for="(img, index) in carouselImages" :key="img + index" class="carousel-slide">
              <img :src="img" :alt="`Imagem ${index + 1} do espaço ${space?.name ?? 'Espaço'}`" loading="lazy" />
            </div>
          </div>
          <button
            v-if="carouselImages.length > 1"
            class="carousel-nav prev"
            type="button"
            aria-label="Imagem anterior"
            @click="prevSlide"
          >
            &lsaquo;
          </button>
          <button
            v-if="carouselImages.length > 1"
            class="carousel-nav next"
            type="button"
            aria-label="Próxima imagem"
            @click="nextSlide"
          >
            &rsaquo;
          </button>
        </div>
        <div v-if="carouselImages.length > 1" class="carousel-dots">
          <button
            v-for="(img, index) in carouselImages"
            :key="img + 'dot' + index"
            :class="{ active: index === activeIndex }"
            type="button"
            :aria-label="`Ir para imagem ${index + 1}`"
            @click="goToSlide(index)"
          ></button>
        </div>
      </div>
    </div>
    <div v-if="loading" class="muted">Carregando...</div>
    <div v-else-if="space" class="space-detail-grid">
      <div class="card">
        <img
          class="cover-placeholder large"
          :src="space.coverImageUrl || 'https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?auto=format&fit=crop&w=1200&q=80'"
          alt="Imagem de capa do espaço"
          loading="lazy"
        />
        <p><strong>Descrição:</strong> {{ space.description }}</p>
        <p><strong>Capacidade:</strong> {{ space.capacity }}</p>
        <p><strong>Preço:</strong> R$ {{ space.price.toFixed(2) }}</p>
        <p><strong>Imagem:</strong> {{ space.coverImageUrl ?? '—' }}</p>
      </div>
      <aside class="card calendar-card">
        <div class="card-header calendar-header">
          <h3>Calendário de reservas</h3>
          <div class="calendar-switcher">
            <button type="button" class="ghost-btn" aria-label="Mês anterior" @click="changeMonth(-1)">&lsaquo;</button>
            <span class="month-label">{{ monthLabel }}</span>
            <button type="button" class="ghost-btn" aria-label="Próximo mês" @click="changeMonth(1)">&rsaquo;</button>
          </div>
        </div>
        <div class="calendar-body">
          <div v-if="!isAuthenticated" class="muted">
            Faça login para ver a disponibilidade.
            <RouterLink class="btn btn-secondary full" to="/login">Entrar</RouterLink>
          </div>
          <div v-else>
            <div v-if="calendarLoading" class="muted">Carregando calendário...</div>
            <div v-else>
              <div class="calendar-grid">
                <div class="weekday">Dom</div>
                <div class="weekday">Seg</div>
                <div class="weekday">Ter</div>
                <div class="weekday">Qua</div>
                <div class="weekday">Qui</div>
                <div class="weekday">Sex</div>
                <div class="weekday">Sáb</div>
                <div
                  v-for="(day, index) in monthDays"
                  :key="index"
                  class="day-cell"
              :class="{ reserved: day.reserved, empty: day.label === null }"
            >
              <span v-if="day.label !== null" class="day-number">{{ day.label }}</span>
              <span v-if="day.reserved" class="dot reserved"></span>
              <span v-else-if="day.isToday" class="dot today"></span>
            </div>
          </div>
              <p v-if="!visibleReservations.length" class="muted">Sem reservas neste mês.</p>
            </div>
          </div>
        </div>
        <button class="btn btn-primary full" type="button" @click="handleReserve">Reservar</button>
      </aside>
    </div>
  </section>

  <div v-if="showReserveModal" class="modal-backdrop" @click.self="showReserveModal = false">
    <div class="modal large">
      <div class="modal-header">
        <h3>Selecionar datas</h3>
        <button class="close" type="button" @click="showReserveModal = false">×</button>
      </div>
      <div class="modal-body">
        <p class="muted">Clique nos dias disponíveis para incluir na solicitação.</p>
        <div class="calendar-card">
          <div class="card-header calendar-header">
            <h4>{{ monthLabel }}</h4>
            <div class="calendar-switcher">
              <button type="button" class="ghost-btn" aria-label="Mês anterior" @click="changeMonth(-1)">&lsaquo;</button>
              <button type="button" class="ghost-btn" aria-label="Próximo mês" @click="changeMonth(1)">&rsaquo;</button>
            </div>
          </div>
          <div class="calendar-grid">
            <div class="weekday">Dom</div>
            <div class="weekday">Seg</div>
            <div class="weekday">Ter</div>
            <div class="weekday">Qua</div>
            <div class="weekday">Qui</div>
            <div class="weekday">Sex</div>
            <div class="weekday">Sáb</div>
            <div
              v-for="(day, index) in monthDays"
              :key="'select-' + index"
              class="day-cell"
              :class="{
                reserved: day.reserved,
                empty: day.label === null,
                selectable: day.label !== null && !day.reserved,
                selected: isSelectedDay(day.label)
              }"
              @click="toggleSelectDay(day.label)"
            >
              <span v-if="day.label !== null" class="day-number">{{ day.label }}</span>
            </div>
          </div>
        </div>
        <div class="pill-group" v-if="selectedDateList.length">
          <span class="pill" v-for="date in selectedDateList" :key="date">
            {{ parseReservationDate(date).toLocaleDateString() }}
          </span>
        </div>
        <div class="cta-row spaced">
          <button class="btn btn-secondary" type="button" @click="showReserveModal = false">Cancelar</button>
          <button class="btn btn-primary" type="button" :disabled="submittingReservation" @click="submitReservations">
            {{ submittingReservation ? 'Enviando...' : 'Confirmar reservas' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
