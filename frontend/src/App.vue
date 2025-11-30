<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const dropdownOpen = ref(false);

const isActive = (name: string) => route.name === name;
const isStaff = computed(() => auth.roles.some((role) => role !== 'CLIENTE'));
const isAuthenticated = computed(() => !!auth.email);

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const closeDropdown = () => {
  dropdownOpen.value = false;
};

const logout = () => {
  auth.authenticate({ email: '', roles: [] });
  router.push({ name: 'home' });
};
</script>

<template>
  <main class="page">
    <header class="nav">
      <RouterLink class="brand" :to="isStaff ? '/admin' : '/'">
        <span class="dot"></span>
        <span>Seu Cantinho</span>
      </RouterLink>
      <nav class="nav-links">
        <template v-if="isStaff">
          <button class="btn btn-secondary" type="button" @click="logout">Sair</button>
        </template>
        <template v-else>
        <RouterLink :class="{ active: isActive('sobre') }" to="/sobre">Sobre</RouterLink>
        <RouterLink :class="{ active: isActive('devs') }" to="/devs">Desenvolvedores</RouterLink>
        <RouterLink :class="{ active: isActive('catalog') }" to="/catalogo">Catálogo</RouterLink>
        <div v-if="!isAuthenticated" class="dropdown" :class="{ open: dropdownOpen }">
          <button class="btn btn-secondary" type="button" @click="toggleDropdown">Acessar ▾</button>
          <div class="dropdown-menu">
            <RouterLink :class="{ active: isActive('login') }" to="/login" @click="closeDropdown">Entrar</RouterLink>
              <RouterLink :class="{ active: isActive('register') }" to="/register" @click="closeDropdown">
                Registre-se
              </RouterLink>
            </div>
          </div>
          <button v-else class="btn btn-secondary" type="button" @click="logout">Sair</button>
        </template>
      </nav>
    </header>

    <RouterView />

    <footer class="footer">
      A interface consome as rotas em <code>http://localhost:3333/api</code>. Ajuste variáveis e roles para o fluxo
      que você precisa.
    </footer>
  </main>
</template>
