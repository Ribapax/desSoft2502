<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Swal from 'sweetalert2';
import { spaceService, type SpaceResponse } from '../services/spaceService';
import { tenantService, type TenantResponse } from '../services/tenantService';

const loading = ref(false);
const spaces = ref<SpaceResponse[]>([]);
const tenants = ref<TenantResponse[]>([]);

const fetchCatalog = async () => {
  loading.value = true;
  try {
    const [spaceList, tenantList] = await Promise.all([spaceService.list(), tenantService.list()]);
    spaces.value = spaceList;
    tenants.value = tenantList;
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao carregar catálogo.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } finally {
    loading.value = false;
  }
};

onMounted(fetchCatalog);
</script>

<template>
  <section class="section page-view">
    <div class="badge">Catálogo</div>
    <h2>Encontre o espaço perfeito</h2>
    <p class="muted">Escolha um espaço para reservar; detalhes e disponibilidade serão exibidos na próxima etapa.</p>

    <div v-if="loading" class="muted">Carregando espaços...</div>
      <div v-else class="user-grid">
        <div v-for="space in spaces" :key="space.id" class="card user-card">
        <img
          class="cover-placeholder"
          :src="space.coverImageUrl || 'https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?auto=format&fit=crop&w=900&q=80'"
          alt="Imagem do espaço"
          loading="lazy"
        />
          <h4>{{ space.name }}</h4>
        <div class="pill-group">
          <span class="pill small">Capacidade: {{ space.capacity }}</span>
          <span class="pill small">R$ {{ space.price.toFixed(2) }}</span>
          <span v-if="space.tenantId" class="pill small">
            {{ tenants.find((t) => t.id === space.tenantId)?.name ?? 'Filial' }}
          </span>
        </div>
        <div class="cta-row spaced">
          <RouterLink class="btn btn-primary" :to="`/espacos/${space.id}`">Ver detalhes</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
