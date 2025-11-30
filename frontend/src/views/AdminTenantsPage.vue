<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import TenantForm from '../components/TenantForm.vue';
import { tenantService, type TenantPayload, type TenantResponse } from '../services/tenantService';
import { useAuthStore } from '../stores/auth';

const loading = ref(false);
const tenants = ref<TenantResponse[]>([]);
const showCreate = ref(false);
const showEditId = ref<string | null>(null);
const showViewId = ref<string | null>(null);
const selectedTenant = ref<TenantResponse | null>(null);
const auth = useAuthStore();

const fetchTenants = async () => {
  loading.value = true;
  try {
    tenants.value = await tenantService.list();
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  if (!canCreate()) return;
  selectedTenant.value = null;
  showCreate.value = true;
};

const openView = (tenant: TenantResponse) => {
  selectedTenant.value = tenant;
  showViewId.value = tenant.id;
};

const openEdit = (tenant: TenantResponse) => {
  if (!canEdit(tenant)) return;
  selectedTenant.value = tenant;
  showEditId.value = tenant.id;
};

const closeModals = () => {
  showCreate.value = false;
  showEditId.value = null;
  showViewId.value = null;
  selectedTenant.value = null;
};

const isMaster = () => auth.roles.map((r) => r.toLowerCase()).includes('master');
const tenantIdsUser = () => auth.tenantIds ?? [];
const canCreate = () => isMaster();
const canEdit = (tenant: TenantResponse) => isMaster() || tenantIdsUser().includes(tenant.id);
const filteredTenants = () =>
  isMaster() ? tenants.value : tenants.value.filter((t) => tenantIdsUser().includes(t.id));

const handleCreate = async (payload: TenantPayload) => {
  if (!payload.name || !payload.roles?.length) {
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
    await tenantService.create(payload);
    closeModals();
    await fetchTenants();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Filial cadastrada.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao criar filial.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  }
};

const handleUpdate = async (payload: TenantPayload) => {
  if (!selectedTenant.value) return;
  if (!payload.name || !payload.roles?.length) {
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
    await tenantService.update(selectedTenant.value.id, payload);
    closeModals();
    await fetchTenants();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Filial atualizada.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao atualizar filial.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  }
};

onMounted(fetchTenants);
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
      </nav>
    </aside>

    <div class="admin-content">
      <div class="card-header">
        <div>
          <h2>Filiais</h2>
          <p class="muted">Gerencie tenants e roles ativas por filial.</p>
        </div>
        <button v-if="canCreate()" class="btn btn-primary" type="button" @click="openCreate">Nova filial</button>
      </div>

      <div v-if="loading" class="muted">Carregando...</div>
      <div v-else class="user-grid">
        <div v-for="tenant in filteredTenants()" :key="tenant.id" class="card user-card">
          <h4>{{ tenant.name }}</h4>
          <p class="muted">{{ tenant.description ?? '—' }}</p>
          <span class="pill small" :class="{ 'pill-success': tenant.status }">
            {{ tenant.status ? 'Ativa' : 'Inativa' }}
          </span>
          <div class="pill-group">
            <span v-for="role in tenant.roles ?? []" :key="role.id" class="pill small">{{ role.name }}</span>
          </div>
          <div class="cta-row spaced">
            <button class="btn btn-secondary" type="button" @click="openView(tenant)">Ver</button>
            <button class="btn btn-primary" type="button" :disabled="!canEdit(tenant)" @click="openEdit(tenant)">
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div v-if="showCreate" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Nova filial</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <TenantForm mode="create" @submit="handleCreate" />
    </div>
  </div>

  <div v-if="showEditId && selectedTenant" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Editar filial</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <TenantForm :tenant="selectedTenant" mode="edit" @submit="handleUpdate" />
    </div>
  </div>

  <div v-if="showViewId && selectedTenant" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Dados da filial</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <div class="modal-body">
        <p><strong>Nome:</strong> {{ selectedTenant.name }}</p>
        <p><strong>Descrição:</strong> {{ selectedTenant.description ?? '—' }}</p>
        <p><strong>Status:</strong> {{ selectedTenant.status ? 'Ativa' : 'Inativa' }}</p>
        <p><strong>Roles:</strong> {{ (selectedTenant.roles ?? []).map((r) => r.name).join(', ') || '—' }}</p>
        <p class="muted">Criado em: {{ new Date(selectedTenant.createdAt).toLocaleString() }}</p>
      </div>
    </div>
  </div>
</template>
