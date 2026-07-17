import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import ClientesView from '../views/ClientesView.vue';
import OsView from '../views/OsView.vue';
import EstoqueView from '../views/EstoqueView.vue';
import VendasView from '../views/VendasView.vue';
import CaixaView from '../views/CaixaView.vue';
import RelatoriosView from '../views/RelatoriosView.vue';
import UsuariosView from '../views/UsuariosView.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView, meta: { public: true } },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/clientes', name: 'Clientes', component: ClientesView, meta: { requiresAuth: true } },
  { path: '/os', name: 'OS', component: OsView, meta: { requiresAuth: true } },
  { path: '/estoque', name: 'Estoque', component: EstoqueView, meta: { requiresAuth: true } },
  { path: '/vendas', name: 'Vendas', component: VendasView, meta: { requiresAuth: true } },
  { path: '/caixa', name: 'Caixa', component: CaixaView, meta: { requiresAuth: true } },
  { path: '/relatorios', name: 'Relatorios', component: RelatoriosView, meta: { requiresAuth: true } },
  {
    path: '/usuarios',
    name: 'Usuarios',
    component: UsuariosView,
    meta: { requiresAuth: true, roles: ['Gerente'] },
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard de autenticação JWT
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('guicell_token');
  const usuario = JSON.parse(localStorage.getItem('guicell_usuario') || 'null');

  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  if (to.meta.public && token) {
    return next('/dashboard');
  }

  // Verificar permissão por perfil
  if (to.meta.roles && usuario && !to.meta.roles.includes(usuario.perfil)) {
    return next('/dashboard');
  }

  next();
});

export default router;
