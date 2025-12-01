<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import { paymentService, PaymentStatus, type PaymentResponse } from '../services/paymentService';

const payments = ref<PaymentResponse[]>([]);
const loading = ref(false);
const showCreate = ref(false);
const form = ref<{ totalAmount: number; payed: number; status: string; paidAt: string; reservationIds?: string }>({
  totalAmount: 0,
  payed: 0,
  status: PaymentStatus.SIGNAL,
  paidAt: new Date().toISOString().slice(0, 16),
  reservationIds: ''
});

const fetchPayments = async () => {
  loading.value = true;
  try {
    payments.value = await paymentService.list();
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    totalAmount: 0,
    payed: 0,
    status: PaymentStatus.SIGNAL,
    paidAt: new Date().toISOString().slice(0, 16),
    reservationIds: ''
  };
};

const handleCreate = async () => {
  if (form.value.totalAmount < 0 || form.value.payed < 0) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Valores inválidos.', timer: 2000, showConfirmButton: false });
    return;
  }
  try {
    await paymentService.create({
      totalAmount: form.value.totalAmount,
      payed: form.value.payed,
      status: form.value.status,
      paidAt: new Date(form.value.paidAt).toISOString(),
      reservationIds: form.value.reservationIds
        ? form.value.reservationIds.split(',').map((id) => id.trim()).filter(Boolean)
        : undefined
    });
    await fetchPayments();
    resetForm();
    showCreate.value = false;
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Pagamento criado.', timer: 2000, showConfirmButton: false });
  } catch (err: any) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: err?.message ?? 'Erro ao criar pagamento', timer: 2000, showConfirmButton: false });
  }
};

const handleDelete = async (id: string) => {
  const confirm = await Swal.fire({
    title: 'Excluir pagamento?',
    text: 'Esta ação não pode ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });
  if (!confirm.isConfirmed) return;
  try {
    await paymentService.delete(id);
    await fetchPayments();
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Pagamento excluído.', timer: 2000, showConfirmButton: false });
  } catch (err: any) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: err?.message ?? 'Erro ao excluir', timer: 2000, showConfirmButton: false });
  }
};

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
      <div class="card-header">
        <div>
          <h2>Financeiro</h2>
          <p class="muted">Pagamentos registrados</p>
        </div>
        <button class="btn btn-primary" type="button" @click="showCreate = true">Novo pagamento</button>
      </div>

      <div v-if="loading" class="muted">Carregando...</div>
      <div v-else class="user-grid">
        <div v-for="payment in payments" :key="payment.id" class="card user-card">
          <h4>{{ payment.status }}</h4>
          <p class="muted">
            Total: R$ {{ payment.totalAmount.toFixed(2) }}<br />
            Pago: R$ {{ payment.payed.toFixed(2) }}<br />
            Data: {{ new Date(payment.paidAt).toLocaleDateString() }}
          </p>
          <div class="cta-row spaced">
            <button class="btn btn-primary" type="button" @click="handleDelete(payment.id)">Excluir</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
    <div class="modal">
      <div class="modal-header">
        <h3>Novo pagamento</h3>
        <button class="close" type="button" @click="showCreate = false">×</button>
      </div>
      <div class="modal-body">
        <label class="form-group">
          <span>Total</span>
          <input v-model.number="form.totalAmount" class="input" type="number" min="0" step="0.01" />
        </label>
        <label class="form-group">
          <span>Pago</span>
          <input v-model.number="form.payed" class="input" type="number" min="0" step="0.01" />
        </label>
        <label class="form-group">
          <span>Status</span>
          <select v-model="form.status" class="input">
            <option :value="PaymentStatus.SIGNAL">SIGNAL</option>
            <option :value="PaymentStatus.FULL">FULL</option>
          </select>
        </label>
        <label class="form-group">
          <span>Data do pagamento</span>
          <input v-model="form.paidAt" class="input" type="datetime-local" />
        </label>
        <label class="form-group">
          <span>Reservas (opcional, IDs separados por vírgula)</span>
          <input v-model="form.reservationIds" class="input" type="text" placeholder="id1,id2" />
        </label>
        <div class="cta-row spaced">
          <button class="btn btn-secondary" type="button" @click="showCreate = false">Cancelar</button>
          <button class="btn btn-primary" type="button" @click="handleCreate">Salvar</button>
        </div>
      </div>
    </div>
  </div>
</template>
