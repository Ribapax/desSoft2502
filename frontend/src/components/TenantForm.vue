<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { TenantPayload } from '../services/tenantService';

const props = defineProps<{
  tenant?: { id: string; name: string; description?: string; status: boolean; roles?: { name: string }[] };
  mode: 'create' | 'edit';
}>();
const emit = defineEmits<{ submit: [payload: TenantPayload] }>();

const form = reactive<TenantPayload>({
  name: props.tenant?.name ?? '',
  description: props.tenant?.description ?? '',
  status: props.tenant?.status ?? true,
  roles: props.tenant?.roles?.map((r) => r.name) ?? ['admin', 'financial', 'backoffice']
});

watch(
  () => props.tenant,
  (tenant) => {
    form.name = tenant?.name ?? '';
    form.description = tenant?.description ?? '';
    form.status = tenant?.status ?? true;
    form.roles = tenant?.roles?.map((r) => r.name) ?? ['admin', 'financial', 'backoffice'];
  }
);

const canSubmit = computed(() => form.name && (form.roles?.length ?? 0) > 0);

const toggleRole = (role: string) => {
  if (!form.roles) form.roles = [];
  if (form.roles.includes(role)) {
    form.roles = form.roles.filter((r) => r !== role);
  } else {
    form.roles = [...form.roles, role];
  }
};

const onSubmit = () => emit('submit', { ...form, roles: [...(form.roles ?? [])] });
</script>

<template>
  <form class="login-form" @submit.prevent="onSubmit">
    <label class="form-group">
      <span>Nome da filial</span>
      <input v-model="form.name" class="input" type="text" required placeholder="seucantinho-PR" />
    </label>
    <label class="form-group">
      <span>Descrição</span>
      <input v-model="form.description" class="input" type="text" placeholder="Filial regional" />
    </label>
    <label class="form-group">
      <span>Status</span>
      <select v-model="form.status" class="input">
        <option :value="true">Ativo</option>
        <option :value="false">Inativo</option>
      </select>
    </label>
    <div class="form-group">
      <span>Roles ativas</span>
      <div class="pill-group">
        <label v-for="role in ['admin', 'financial', 'backoffice']" :key="role" class="checkbox-pill">
          <input type="checkbox" :checked="form.roles?.includes(role)" @change="() => toggleRole(role)" />
          <span>{{ role }}</span>
        </label>
      </div>
    </div>
    <div class="cta-row spaced">
      <button class="btn btn-primary" type="submit" :disabled="!canSubmit">Salvar</button>
    </div>
  </form>
</template>
