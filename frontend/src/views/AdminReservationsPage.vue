<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import { reservationService, type ReservationResponse } from '../services/reservationService';
import { spaceService, type SpaceResponse } from '../services/spaceService';
import { userService, type UserResponse } from '../services/userService';

const loading = ref(false);
const reservations = ref<ReservationResponse[]>([]);
const spaces = ref<SpaceResponse[]>([]);
const users = ref<UserResponse[]>([]);
const form = ref<{ id?: string; userId: string; spaceId: string; reservationDate: string }>({
  userId: '',
  spaceId: '',
  reservationDate: ''
});
const showCreate = ref(false);
const showEdit = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const [resList, spaceList, userList] = await Promise.all([
      reservationService.list(),
      spaceService.list(),
      userService.list()
    ]);
    reservations.value = resList;
    spaces.value = spaceList;
    users.value = userList;
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = { userId: '', spaceId: '', reservationDate: '' };
};

const openCreate = () => {
  resetForm();
  showCreate.value = true;
};

const openEdit = (reservation: ReservationResponse) => {
  form.value = {
    id: reservation.id,
    userId: reservation.userId,
    spaceId: reservation.spaceId,
    reservationDate: reservation.reservationDate
  };
  showEdit.value = true;
};

const handleCreate = async () => {
  if (!form.value.userId || !form.value.spaceId || !form.value.reservationDate) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Preencha os campos.', timer: 2000, showConfirmButton: false });
    return;
  }
  try {
    await reservationService.create(form.value);
    showCreate.value = false;
    resetForm();
    await fetchData();
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Reserva criada.', timer: 2000, showConfirmButton: false });
  } catch (err: any) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: err?.message ?? 'Erro ao criar.', timer: 2000, showConfirmButton: false });
  }
};

const handleUpdate = async () => {
  if (!form.value.id) return;
  if (!form.value.userId || !form.value.spaceId || !form.value.reservationDate) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Preencha os campos.', timer: 2000, showConfirmButton: false });
    return;
  }
  try {
    await reservationService.update(form.value.id, {
      userId: form.value.userId,
      spaceId: form.value.spaceId,
      reservationDate: form.value.reservationDate
    });
    showEdit.value = false;
    resetForm();
    await fetchData();
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Reserva atualizada.', timer: 2000, showConfirmButton: false });
  } catch (err: any) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: err?.message ?? 'Erro ao atualizar.', timer: 2000, showConfirmButton: false });
  }
};

const handleDelete = async (id: string) => {
  const confirm = await Swal.fire({
    title: 'Excluir reserva?',
    text: 'Esta ação não pode ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });
  if (!confirm.isConfirmed) return;
  try {
    await reservationService.delete(id);
    await fetchData();
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Reserva excluída.', timer: 2000, showConfirmButton: false });
  } catch (err: any) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: err?.message ?? 'Erro ao excluir.', timer: 2000, showConfirmButton: false });
  }
};

onMounted(fetchData);
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
          <h2>Reservas</h2>
          <p class="muted">Gerencie reservas diárias.</p>
        </div>
        <button class="btn btn-primary" type="button" @click="openCreate">Nova reserva</button>
      </div>

      <div v-if="loading" class="muted">Carregando...</div>
      <div v-else class="user-grid">
        <div v-for="reservation in reservations" :key="reservation.id" class="card user-card">
          <h4>{{ spaces.find((s) => s.id === reservation.spaceId)?.name ?? 'Espaço' }}</h4>
          <p class="muted">
            Cliente: {{ users.find((u) => u.id === reservation.userId)?.name ?? 'Usuário' }} <br />
            Data: {{ reservation.reservationDate }}
          </p>
          <div class="cta-row spaced">
            <button class="btn btn-secondary" type="button" @click="openEdit(reservation)">Editar</button>
            <button class="btn btn-primary" type="button" @click="handleDelete(reservation.id)">Excluir</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
    <div class="modal">
      <div class="modal-header">
        <h3>Nova reserva</h3>
        <button class="close" type="button" @click="showCreate = false">×</button>
      </div>
      <div class="modal-body">
        <label class="form-group">
          <span>Usuário</span>
          <select v-model="form.userId" class="input">
            <option value="">Selecione</option>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
          </select>
        </label>
        <label class="form-group">
          <span>Espaço</span>
          <select v-model="form.spaceId" class="input">
            <option value="">Selecione</option>
            <option v-for="space in spaces" :key="space.id" :value="space.id">{{ space.name }}</option>
          </select>
        </label>
        <label class="form-group">
          <span>Data</span>
          <input v-model="form.reservationDate" class="input" type="date" />
        </label>
        <div class="cta-row spaced">
          <button class="btn btn-secondary" type="button" @click="showCreate = false">Cancelar</button>
          <button class="btn btn-primary" type="button" @click="handleCreate">Criar</button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showEdit" class="modal-backdrop" @click.self="showEdit = false">
    <div class="modal">
      <div class="modal-header">
        <h3>Editar reserva</h3>
        <button class="close" type="button" @click="showEdit = false">×</button>
      </div>
      <div class="modal-body">
        <label class="form-group">
          <span>Usuário</span>
          <select v-model="form.userId" class="input">
            <option value="">Selecione</option>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
          </select>
        </label>
        <label class="form-group">
          <span>Espaço</span>
          <select v-model="form.spaceId" class="input">
            <option value="">Selecione</option>
            <option v-for="space in spaces" :key="space.id" :value="space.id">{{ space.name }}</option>
          </select>
        </label>
        <label class="form-group">
          <span>Data</span>
          <input v-model="form.reservationDate" class="input" type="date" />
        </label>
        <div class="cta-row spaced">
          <button class="btn btn-secondary" type="button" @click="showEdit = false">Cancelar</button>
          <button class="btn btn-primary" type="button" @click="handleUpdate">Salvar</button>
        </div>
      </div>
    </div>
  </div>
</template>
