<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Swal from 'sweetalert2';
import { spaceService, type SpaceResponse } from '../services/spaceService';
import { tenantService, type TenantResponse } from '../services/tenantService';

const route = useRoute();
const space = ref<SpaceResponse | null>(null);
const tenant = ref<TenantResponse | null>(null);
const loading = ref(false);

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
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao carregar espaço.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } finally {
    loading.value = false;
  }
};

onMounted(fetchDetail);
</script>

<template>
  <section class="section page-view">
    <div class="badge">Espaço</div>
    <h2 v-if="space">{{ space.name }}</h2>
    <p v-if="tenant" class="muted">Filial: {{ tenant.name }}</p>
    <div v-if="loading" class="muted">Carregando...</div>
    <div v-else-if="space" class="space-detail-grid">
      <div class="card">
        <div class="cover-placeholder large"></div>
        <p><strong>Descrição:</strong> {{ space.description }}</p>
        <p><strong>Capacidade:</strong> {{ space.capacity }}</p>
        <p><strong>Preço por hora:</strong> R$ {{ space.pricePerHour.toFixed(2) }}</p>
        <p><strong>Imagem:</strong> {{ space.coverImageUrl ?? '—' }}</p>
      </div>
      <aside class="card calendar-card">
        <div class="card-header">
          <h3>Datas disponíveis</h3>
        </div>
        <div class="calendar-placeholder tall">
          <p class="muted">Calendário em breve</p>
        </div>
        <button class="btn btn-primary full" type="button">Reservar</button>
      </aside>
    </div>
  </section>
</template>
