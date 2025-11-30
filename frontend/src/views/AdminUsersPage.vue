<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import { userService, type UserPayload, type UserResponse } from '../services/userService';
import UserForm from '../components/UserForm.vue';

const loading = ref(false);
const users = ref<UserResponse[]>([]);
const showCreate = ref(false);
const showEditId = ref<string | null>(null);
const showViewId = ref<string | null>(null);
const selectedUser = ref<UserResponse | null>(null);

const fetchUsers = async () => {
  loading.value = true;
  try {
    users.value = await userService.list();
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  selectedUser.value = null;
  showCreate.value = true;
};

const openView = (user: UserResponse) => {
  selectedUser.value = user;
  showViewId.value = user.id;
};

const openEdit = (user: UserResponse) => {
  selectedUser.value = user;
  showEditId.value = user.id;
};

const closeModals = () => {
  showCreate.value = false;
  showEditId.value = null;
  showViewId.value = null;
  selectedUser.value = null;
};

const handleCreate = async (payload: UserPayload) => {
  const roles = payload.roles ?? [];
  if (!payload.name || !payload.email || !roles.length || (payload.password ?? '').length < 6) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Preencha os campos obrigatórios.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    return;
  }
  try {
    await userService.create(payload);
    closeModals();
    await fetchUsers();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Usuário cadastrado.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } catch (err) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Erro ao criar usuário', timer: 2000, showConfirmButton: false });
  }
};

const handleUpdate = async (payload: UserPayload) => {
  if (!selectedUser.value) return;
  if (!payload.name || !payload.email || !payload.roles?.length) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Preencha os campos obrigatórios.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    return;
  }
  try {
    await userService.update(selectedUser.value.id, payload);
    closeModals();
    await fetchUsers();
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Usuário atualizado', timer: 2000, showConfirmButton: false });
  } catch (err) {
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Erro ao atualizar usuário', timer: 2000, showConfirmButton: false });
  }
};

onMounted(fetchUsers);
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
      </nav>
    </aside>

    <div class="admin-content">
      <div class="card-header">
        <div>
          <h2>Usuários</h2>
          <p class="muted">Apenas admin/master visualizam esta seção.</p>
        </div>
        <button class="btn btn-primary" type="button" @click="openCreate">Novo usuário</button>
      </div>

      <div v-if="loading" class="muted">Carregando...</div>
      <div v-else class="user-grid">
        <div v-for="user in users" :key="user.id" class="card user-card">
          <h4>{{ user.name }}</h4>
          <p class="muted">{{ user.email }}</p>
          <div class="pill-group">
            <span v-for="role in user.roles" :key="role.id" class="pill small">{{ role.name }}</span>
          </div>
          <div class="cta-row spaced">
            <button class="btn btn-secondary" type="button" @click="openView(user)">Ver</button>
            <button class="btn btn-primary" type="button" @click="openEdit(user)">Editar</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div v-if="showCreate" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Novo usuário</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <UserForm mode="create" @submit="handleCreate" />
    </div>
  </div>

  <div v-if="showEditId && selectedUser" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Editar usuário</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <UserForm :user="selectedUser" mode="edit" @submit="handleUpdate" />
    </div>
  </div>

  <div v-if="showViewId && selectedUser" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Dados do usuário</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <div class="modal-body">
        <p><strong>Nome:</strong> {{ selectedUser.name }}</p>
        <p><strong>Email:</strong> {{ selectedUser.email }}</p>
        <p><strong>Telefone:</strong> {{ selectedUser.phone ?? '—' }}</p>
        <p><strong>Roles:</strong> {{ selectedUser.roles.map((r) => r.name).join(', ') || '—' }}</p>
        <p class="muted">Criado em: {{ new Date(selectedUser.createdAt).toLocaleString() }}</p>
      </div>
    </div>
  </div>
</template>
