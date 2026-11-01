import { createRouter, createWebHistory } from 'vue-router';
import { podeModulo, obterPrimeiraRotaPermitida, atualizarPermissoesLocais } from '../composables/usePermissoes';

import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import ClientesView from '../views/ClientesView.vue';
import OsView from '../views/OsView.vue';
import EstoqueView from '../views/EstoqueView.vue';
import ComprasView from '../views/ComprasView.vue';
import VendasView from '../views/VendasView.vue';
import CaixaView from '../views/CaixaView.vue';
import RelatoriosView from '../views/RelatoriosView.vue';
import UsuariosView from '../views/UsuariosView.vue';
import PerfilAcessoView from '../views/PerfilAcessoView.vue';

const routes = [
  { path: '/', redirect: () => obterPrimeiraRotaPermitida() },
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { modulo: 'dashboard' } },
  { path: '/clientes', name: 'clientes', component: ClientesView, meta: { modulo: 'clientes' } },
  { path: '/os', name: 'os', component: OsView, meta: { modulo: 'os' } },
  { path: '/estoque', name: 'estoque', component: EstoqueView, meta: { modulo: 'estoque' } },
  { path: '/compras', name: 'compras', component: ComprasView, meta: { modulo: 'compras' } },
  { path: '/vendas', name: 'vendas', component: VendasView, meta: { modulo: 'vendas' } },
  { path: '/caixa', name: 'caixa', component: CaixaView, meta: { modulo: 'caixa' } },
  { path: '/relatorios', name: 'relatorios', component: RelatoriosView, meta: { modulo: 'relatorios' } },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: UsuariosView,
    meta: { modulo: 'usuarios' },
  },
  {
    path: '/permissoes',
    name: 'permissoes',
    component: PerfilAcessoView,
    meta: { modulo: 'permissoes' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard de autenticação e permissão por módulo
router.beforeEach((to) => {
  atualizarPermissoesLocais();
  const token = localStorage.getItem('guicell_token');

  if (!to.meta.public && !token) {
    return { name: 'login' };
  }

  if (to.name === 'login' && token) {
    const primeiraRota = obterPrimeiraRotaPermitida();
    if (primeiraRota !== '/login') {
      return { path: primeiraRota };
    }
  }

  if (to.meta.modulo && !podeModulo(to.meta.modulo)) {
    const primeiraRota = obterPrimeiraRotaPermitida();
    if (primeiraRota && primeiraRota !== to.path) {
      return { path: primeiraRota };
    }
  }
});

export default router;
