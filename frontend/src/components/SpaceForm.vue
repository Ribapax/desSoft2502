<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { SpacePayload } from '../services/spaceService';
import type { TenantResponse } from '../services/tenantService';

const props = defineProps<{
  space?: {
    id: string;
    name: string;
    description: string;
    capacity: number;
    pricePerHour: number;
    coverImageUrl?: string;
    tenantId?: string;
  };
  tenants?: TenantResponse[];
  mode: 'create' | 'edit';
}>();
const emit = defineEmits<{ submit: [payload: SpacePayload] }>();

const form = reactive<SpacePayload>({
  name: props.space?.name ?? '',
  description: props.space?.description ?? '',
  capacity: props.space?.capacity ?? 0,
  pricePerHour: props.space?.pricePerHour ?? 0,
  coverImageUrl: undefined,
  checkInTime: props.space?.checkInTime ?? '08:00',
  checkOutTime: props.space?.checkOutTime ?? '18:00',
  signalPercentage: props.space?.signalPercentage ?? 50,
  tenantId: props.space?.tenantId
});

watch(
  () => props.space,
  (space) => {
    form.name = space?.name ?? '';
    form.description = space?.description ?? '';
    form.capacity = space?.capacity ?? 0;
    form.pricePerHour = space?.pricePerHour ?? 0;
    form.coverImageUrl = space?.coverImageUrl ?? undefined;
    form.checkInTime = space?.checkInTime ?? '08:00';
    form.checkOutTime = space?.checkOutTime ?? '18:00';
    form.signalPercentage = space?.signalPercentage ?? 50;
    form.tenantId = space?.tenantId;
  }
);

const canSubmit = computed(
  () => form.name && form.description && form.capacity > 0 && form.pricePerHour >= 0
);

const onSubmit = () => emit('submit', { ...form });
</script>

<template>
  <form class="login-form" @submit.prevent="onSubmit">
    <label class="form-group">
      <span>Nome</span>
      <input v-model="form.name" class="input" type="text" required placeholder="Sala Principal" />
    </label>
    <label class="form-group">
      <span>Descrição</span>
      <input v-model="form.description" class="input" type="text" required placeholder="Descrição do espaço" />
    </label>
    <label class="form-group">
      <span>Capacidade</span>
      <input v-model.number="form.capacity" class="input" type="number" min="1" required />
    </label>
    <label class="form-group">
      <span>Preço por hora</span>
      <input v-model.number="form.pricePerHour" class="input" type="number" min="0" step="0.01" required />
    </label>
    <label class="form-group">
      <span>Filial</span>
      <select v-model="form.tenantId" class="input">
        <option :value="undefined">Sem vincular</option>
        <option v-for="tenant in tenants ?? []" :key="tenant.id" :value="tenant.id">
          {{ tenant.name }}
        </option>
      </select>
    </label>
    <label class="form-group">
      <span>Check-in</span>
      <input v-model="form.checkInTime" class="input" type="time" required />
    </label>
    <label class="form-group">
      <span>Check-out</span>
      <input v-model="form.checkOutTime" class="input" type="time" required />
    </label>
    <label class="form-group">
      <span>Percentual de sinal (%)</span>
      <input v-model.number="form.signalPercentage" class="input" type="number" min="0" max="100" step="1" required />
    </label>
    <div class="cta-row spaced">
      <button class="btn btn-primary" type="submit" :disabled="!canSubmit">Salvar</button>
    </div>
  </form>
</template>
