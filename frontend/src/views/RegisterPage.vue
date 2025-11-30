<script setup lang="ts">
import { reactive, ref } from 'vue';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';
import { userService } from '../services/userService';

const router = useRouter();
const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
});
const loading = ref(false);

const submit = async () => {
  if (!form.name || !form.email || !form.password || form.password.length < 6 || form.password !== form.confirmPassword) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Preencha os campos obrigatórios e senhas iguais.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    return;
  }
  loading.value = true;
  try {
    await userService.create({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      roles: ['client']
    });
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Cadastro realizado.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    router.push({ name: 'login' });
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Erro ao registrar.',
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section class="section page-view form-card">
    <div class="badge">Registro</div>
    <h2>Crie sua conta de cliente</h2>
    <p class="muted">Use este formulário para registrar-se como cliente.</p>
    <form class="login-form" @submit.prevent="submit">
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
      <label class="form-group">
        <span>Senha</span>
        <input v-model="form.password" class="input" type="password" required placeholder="••••••••" />
      </label>
      <label class="form-group">
        <span>Confirmar senha</span>
        <input v-model="form.confirmPassword" class="input" type="password" required placeholder="••••••••" />
      </label>
      <div class="cta-row spaced">
        <button class="btn btn-primary" type="submit" :disabled="loading">Registrar</button>
        <router-link class="btn btn-secondary" to="/login">Já tenho conta</router-link>
      </div>
    </form>
  </section>
</template>
