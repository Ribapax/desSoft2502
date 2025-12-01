<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { paymentService, type PaymentResponse } from '../services/paymentService';

const loading = ref(false);
const payments = ref<PaymentResponse[]>([]);

const fetchPayments = async () => {
  loading.value = true;
  try {
    // No list endpoint parameters; assume payments include status/amounts
    const res = await fetch('http://localhost:3333/api/payments');
    payments.value = res.ok ? await res.json() : [];
  } finally {
    loading.value = false;
  }
};

const totalExpected = computed(() =>
  payments.value.reduce((sum, p) => sum + Number(p.totalAmount ?? 0), 0)
);
const totalPaid = computed(() => payments.value.reduce((sum, p) => sum + Number(p.payed ?? 0), 0));
const totalOpen = computed(() => Math.max(totalExpected.value - totalPaid.value, 0));

onMounted(fetchPayments);
</script>

<template>
  <section class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="dot"></span>
        <div>
          <strong>Dashboard</strong>
          <small>Seu Cantinho</small>
        </div>
      </div>
      <nav class="sidebar-menu">
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin' }" to="/admin">Visão geral</RouterLink>
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin-users' }" to="/admin/users">
          Usuários
        </RouterLink>
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin-tenants' }" to="/admin/tenants">
          Filiais
        </RouterLink>
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin-spaces' }" to="/admin/spaces">
          Espaços
        </RouterLink>
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin-reservations' }" to="/admin/reservations">
          Reservas
        </RouterLink>
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin-financial' }" to="/admin/financeiro">
          Financeiro
        </RouterLink>
      </nav>
    </aside>

    <div class="admin-content">
      <div class="admin-grid">
        <div class="card">
          <div class="card-header">
            <h3>Faturamento</h3>
            <span class="muted">Resumo dos pagamentos</span>
          </div>
          <div v-if="loading" class="muted">Carregando...</div>
          <div v-else class="stats-grid">
            <div class="stat">
              <span class="muted">Pago</span>
              <strong>R$ {{ totalPaid.toFixed(2) }}</strong>
            </div>
            <div class="stat">
              <span class="muted">Esperado</span>
              <strong>R$ {{ totalExpected.toFixed(2) }}</strong>
            </div>
            <div class="stat">
              <span class="muted">Em aberto</span>
              <strong>R$ {{ totalOpen.toFixed(2) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
