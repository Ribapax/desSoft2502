<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { UserPayload } from '../services/userService';
import { useAuthStore } from '../stores/auth';

type Mode = 'create' | 'edit';

const props = defineProps<{
  user?: { id: string; name: string; email: string; phone?: string; roles: { name: string }[] };
  mode: Mode;
}>();
const emit = defineEmits<{ submit: [payload: UserPayload] }>();

const auth = useAuthStore();
const hasRole = (name: string) => auth.roles.map((r) => r.toLowerCase()).includes(name.toLowerCase());
const isAuthenticated = computed(() => !!auth.email);
const availableRoles = computed(() => {
  const base = ['admin', 'financial', 'client', 'backoffice'];
  if (hasRole('master')) {
    base.push('master');
  }
  return base;
});

const form = reactive<UserPayload>({
  name: props.user?.name ?? '',
  email: props.user?.email ?? '',
  phone: props.user?.phone ?? '',
  password: '',
  roles: props.user?.roles?.map((r) => r.name) ?? ['client']
});

watch(
  () => props.user,
  (user) => {
    form.name = user?.name ?? '';
    form.email = user?.email ?? '';
    form.phone = user?.phone ?? '';
    form.password = '';
    form.roles = user?.roles?.map((r) => r.name) ?? ['client'];
  }
);

const canSubmit = computed(() => {
  const hasRoles = form.roles.length > 0;
  const hasRequired =
    form.name && form.email && hasRoles && (props.mode === 'edit' || (form.password && form.password.length >= 6));
  return Boolean(hasRequired);
});

const toggleRole = (role: string) => {
  form.roles = [role];
};

const onSubmit = () => {
  emit('submit', { ...form, roles: [...form.roles] });
};
</script>

<template>
  <form class="login-form" @submit.prevent="onSubmit">
    <label class="form-group">
      <span>Nome</span>
      <input v-model="form.name" class="input" type="text" required placeholder="Nome completo" />
    </label>
    <label class="form-group">
      <span>Email</span>
      <input v-model="form.email" class="input" type="email" required placeholder="seuemail@exemplo.com" />
    </label>
    <label class="form-group">
      <span>Telefone</span>
      <input v-model="form.phone" class="input" type="text" placeholder="55XXXXXXXXXX" />
    </label>
    <label class="form-group" :class="{ muted: mode === 'edit' }">
      <span>Senha <small v-if="mode === 'edit'">(preencha para trocar)</small></span>
      <input v-model="form.password" class="input" :required="mode === 'create'" type="password" placeholder="••••••••" />
    </label>
    <div v-if="isAuthenticated" class="form-group">
      <span>Role</span>
      <div class="pill-group">
        <label v-for="role in availableRoles" :key="role" class="checkbox-pill">
          <input
            type="radio"
            name="role"
            :value="role"
            :checked="form.roles.includes(role)"
            required
            @change="() => toggleRole(role)"
          />
          <span>{{ role }}</span>
        </label>
      </div>
    </div>
    <div class="cta-row spaced">
      <button class="btn btn-primary" type="submit" :disabled="!canSubmit">Salvar</button>
    </div>
  </form>
</template>
