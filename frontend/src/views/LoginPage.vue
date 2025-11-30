<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

const router = useRouter();
const authStore = useAuthStore();
const statusMessage = ref('');

const form = reactive({
  email: authStore.email,
  password: '',
  remember: authStore.remember
});

const submit = async () => {
  try {
    const result = await authService.login(form.email, form.password);
    authStore.authenticate({ email: result.email, roles: result.roles, tenantIds: (result as any).tenantIds ?? [] });
    statusMessage.value = '';
    const nonClient = result.roles.some((role) => role !== 'CLIENTE');
    setTimeout(() => {
      router.push(nonClient ? { name: 'admin' } : { name: 'home' });
    }, 400);
  } catch (err) {
    statusMessage.value = '';
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Credenciais inválidas.',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
  }
};
</script>

<template>
  <section class="section page-view form-card">
    <div class="badge">Login</div>
    <h2>Entre no painel do Seu Cantinho</h2>
    <p class="muted">Por enquanto salvamos no estado local; depois ligamos na API.</p>
    <form class="login-form" @submit.prevent="submit">
      <label class="form-group">
        <span>Email</span>
        <input v-model="form.email" class="input" type="email" required placeholder="seuemail@exemplo.com" />
      </label>
      <label class="form-group">
        <span>Senha</span>
        <input v-model="form.password" class="input" type="password" required placeholder="••••••••" />
      </label>
      <label class="checkbox-row">
        <input v-model="form.remember" type="checkbox" />
        <span>Lembrar meus dados neste dispositivo</span>
      </label>
      <div class="cta-row spaced">
        <button class="btn btn-primary" type="submit">Entrar</button>
        <router-link class="btn btn-secondary" to="/">Voltar para a home</router-link>
      </div>
      <p v-if="statusMessage" class="status success">{{ statusMessage }}</p>
    </form>
  </section>
</template>
