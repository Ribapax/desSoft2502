<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import { spaceService, type SpacePayload, type SpaceResponse } from '../services/spaceService';
import { tenantService, type TenantResponse } from '../services/tenantService';
import SpaceForm from '../components/SpaceForm.vue';

const loading = ref(false);
const spaces = ref<SpaceResponse[]>([]);
const tenants = ref<TenantResponse[]>([]);
const showCreate = ref(false);
const showEditId = ref<string | null>(null);
const showViewId = ref<string | null>(null);
const selectedSpace = ref<SpaceResponse | null>(null);
const showCompleteId = ref<string | null>(null);

const fetchData = async () => {
  loading.value = true;
  try {
    const [spaceList, tenantList] = await Promise.all([spaceService.list(), tenantService.list()]);
    spaces.value = spaceList;
    tenants.value = tenantList;
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  selectedSpace.value = null;
  showCreate.value = true;
};

const openView = (space: SpaceResponse) => {
  selectedSpace.value = space;
  showViewId.value = space.id;
};

const openEdit = (space: SpaceResponse) => {
  selectedSpace.value = space;
  showEditId.value = space.id;
};

const closeModals = () => {
  showCreate.value = false;
  showEditId.value = null;
  showViewId.value = null;
  showCompleteId.value = null;
  selectedSpace.value = null;
};

const handleCreate = async (payload: SpacePayload) => {
  if (!payload.name || !payload.description || !payload.capacity || payload.pricePerHour === undefined) {
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
    await spaceService.create(payload);
    closeModals();
    await fetchData();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Espaço cadastrado.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao criar espaço.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  }
};

const handleUpdate = async (payload: SpacePayload) => {
  if (!selectedSpace.value) return;
  if (!payload.name || !payload.description || !payload.capacity || payload.pricePerHour === undefined) {
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
    await spaceService.update(selectedSpace.value.id, payload);
    closeModals();
    await fetchData();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Espaço atualizado.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao atualizar espaço.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
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
      </nav>
    </aside>

    <div class="admin-content">
      <div class="card-header">
        <div>
          <h2>Espaços</h2>
          <p class="muted">Cadastre e edite os espaços das filiais.</p>
        </div>
        <button class="btn btn-primary" type="button" @click="openCreate">Novo espaço</button>
      </div>

      <div v-if="loading" class="muted">Carregando...</div>
      <div v-else class="user-grid">
        <div v-for="space in spaces" :key="space.id" class="card user-card">
          <h4>{{ space.name }}</h4>
          <p class="muted">{{ space.description }}</p>
          <div class="pill-group">
            <span class="pill small">Capacidade: {{ space.capacity }}</span>
            <span class="pill small">R$ {{ space.pricePerHour.toFixed(2) }}/h</span>
            <span v-if="space.tenantId" class="pill small">
              {{ tenants.find((t) => t.id === space.tenantId)?.name ?? 'Filial' }}
            </span>
          </div>
          <div class="cta-row spaced">
            <button class="btn btn-secondary" type="button" @click="openView(space)">Ver</button>
            <button class="btn btn-primary" type="button" @click="openEdit(space)">Editar</button>
            <button class="btn btn-secondary" type="button" @click="() => { selectedSpace.value = space; showCompleteId.value = space.id; }">
              Completar cadastro
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div v-if="showCreate" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Novo espaço</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <SpaceForm mode="create" :tenants="tenants" @submit="handleCreate" />
    </div>
  </div>

  <div v-if="showEditId && selectedSpace" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Editar espaço</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <SpaceForm :space="selectedSpace" :tenants="tenants" mode="edit" @submit="handleUpdate" />
    </div>
  </div>

  <div v-if="showViewId && selectedSpace" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Dados do espaço</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <div class="modal-body">
        <p><strong>Nome:</strong> {{ selectedSpace.name }}</p>
        <p><strong>Descrição:</strong> {{ selectedSpace.description }}</p>
        <p><strong>Capacidade:</strong> {{ selectedSpace.capacity }}</p>
        <p><strong>Preço/hora:</strong> R$ {{ selectedSpace.pricePerHour.toFixed(2) }}</p>
        <p><strong>Filial:</strong> {{ tenants.find((t) => t.id === selectedSpace.tenantId)?.name ?? '—' }}</p>
        <p class="muted">Criado em: {{ new Date(selectedSpace.createdAt).toLocaleString() }}</p>
      </div>
    </div>
  </div>

  <div v-if="showCompleteId && selectedSpace" class="modal-backdrop" @click.self="closeModals">
    <div class="modal">
      <div class="modal-header">
        <h3>Completar cadastro do espaço</h3>
        <button class="close" type="button" @click="closeModals">×</button>
      </div>
      <div class="modal-body">
        <p>Upload de imagem de capa (em breve)</p>
        <input class="input" type="file" disabled />
        <p>Upload de demais imagens (em breve)</p>
        <input class="input" type="file" multiple disabled />
      </div>
    </div>
  </div>
</template>
