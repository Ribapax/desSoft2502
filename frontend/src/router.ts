import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './views/HomePage.vue';
import AboutPage from './views/AboutPage.vue';
import DevsPage from './views/DevsPage.vue';
import LoginPage from './views/LoginPage.vue';
import RegisterPage from './views/RegisterPage.vue';
import AdminPage from './views/AdminPage.vue';
import AdminUsersPage from './views/AdminUsersPage.vue';
import { useAuthStore } from './stores/auth';

const adminRoles = ['admin', 'master', 'financial', 'backoffice'];

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/sobre', name: 'sobre', component: AboutPage },
    { path: '/devs', name: 'devs', component: DevsPage },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/register', name: 'register', component: RegisterPage },
    { path: '/admin', name: 'admin', component: AdminPage, meta: { requiresAdmin: true } },
    { path: '/admin/users', name: 'admin-users', component: AdminUsersPage, meta: { requiresAdmin: true } }
  ]
});

router.beforeEach((to) => {
  if (to.meta.requiresAdmin) {
    const auth = useAuthStore();
    const normalized = auth.roles.map((r) => r.toLowerCase());
    const allowed = normalized.some((role) => adminRoles.includes(role));
    if (!allowed) {
      return { name: 'login' };
    }
  }
});

export default router;
