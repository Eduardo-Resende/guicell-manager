<template>
  <aside class="sidebar">
    <div class="brand-container">
      <div class="logo-wrapper">
        <img src="/logo-new.png" alt="Guicell Manager Logo" class="brand-icon-img" />
        <div class="brand-text">
          <span class="brand-name">GUICELL</span>
          <span class="brand-sub">MANAGER</span>
          <span class="brand-badge">ERP</span>
        </div>
      </div>
    </div>

    <nav class="nav-menu">
      <button 
        v-for="item in menuItems" 
        :key="item.view" 
        :class="['nav-item', { active: activeView === item.view }]"
        @click="$emit('change-view', item.view)"
      >
        <component :is="item.icon" class="nav-icon" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="user-footer">
      <div class="user-info">
        <div class="user-avatar">{{ usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'O' }}</div>
        <div class="user-details">
          <span class="user-name">{{ usuario.nome || 'Operador' }}</span>
          <span class="user-role">{{ usuario.perfil || 'Atendente' }}</span>
        </div>
      </div>
      <button class="logout-btn" @click="$emit('logout')">
        <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>Sair</span>
      </button>
    </div>
  </aside>
</template>

<script>
import { defineComponent, ref, computed, onMounted, markRaw } from 'vue';

// Small inline icon components using SVGs to prevent dependency issues
const DashboardIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  `
};

const ClientesIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  `
};

const OsIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  `
};

const EstoqueIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  `
};

const VendasIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  `
};

const CaixaIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  `
};

const RelatoriosIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  `
};

const UsuariosIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </svg>
  `
};

export default defineComponent({
  name: 'Sidebar',
  props: {
    activeView: {
      type: String,
      required: true
    }
  },
  emits: ['change-view', 'logout'],
  setup() {
    const usuario = ref({ nome: 'Operador', perfil: 'Atendente' });

    const menuItems = computed(() => {
      const items = [
        { view: 'dashboard', label: 'Dashboard', icon: markRaw(DashboardIcon) },
        { view: 'clientes', label: 'Clientes', icon: markRaw(ClientesIcon) },
        { view: 'os', label: 'Ordens de Serviço', icon: markRaw(OsIcon) },
        { view: 'estoque', label: 'Estoque', icon: markRaw(EstoqueIcon) },
        { view: 'vendas', label: 'Vendas (PDV)', icon: markRaw(VendasIcon) },
        { view: 'caixa', label: 'Caixa', icon: markRaw(CaixaIcon) },
        { view: 'relatorios', label: 'Relatórios', icon: markRaw(RelatoriosIcon) },
      ];

      // Exibe tela de usuários somente para perfil Gerente
      if (usuario.value.perfil === 'Gerente') {
        items.push({ view: 'usuarios', label: 'Usuários', icon: markRaw(UsuariosIcon) });
      }

      return items;
    });

    onMounted(() => {
      const cached = localStorage.getItem('guicell_usuario');
      if (cached) {
        usuario.value = JSON.parse(cached);
      }
    });

    return {
      usuario,
      menuItems
    };
  }
});
</script>

<style scoped>
.sidebar {
  width: 260px;
  background-color: var(--bg-card);
  border-right: 1px solid var(--border);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.brand-container {
  padding: 24px;
  border-bottom: 1px solid var(--border);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  position: relative;
}

.brand-name {
  font-family: var(--font-heading);
  font-weight: 800;
  color: var(--text-white);
  font-size: 1.3rem;
  letter-spacing: 0.5px;
}

.brand-sub {
  font-family: var(--font-heading);
  font-weight: 300;
  color: var(--text-normal);
  font-size: 0.9rem;
  letter-spacing: 1.5px;
}

.brand-badge {
  position: absolute;
  top: 0;
  right: -32px;
  background-color: var(--primary-glow);
  color: var(--primary-hover);
  border: 1px solid var(--primary);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
}

.nav-menu {
  flex: 1;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: none;
  border: 1px solid transparent;
  color: var(--text-muted);
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  color: var(--text-white);
  background-color: rgba(255, 255, 255, 0.03);
}

.nav-item.active {
  color: var(--text-white);
  background-color: var(--primary-glow);
  border-color: rgba(0, 143, 57, 0.2);
  box-shadow: 0 0 15px rgba(0, 143, 57, 0.05);
}

.nav-item.active .nav-icon {
  color: var(--primary-hover);
}

.nav-icon {
  width: 20px;
  height: 20px;
  transition: color var(--transition-fast);
}

.user-footer {
  padding: 16px;
  border-top: 1px solid var(--border);
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary);
  color: var(--text-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-white);
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.logout-btn {
  background-color: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  width: 100%;
  padding: 8px 12px;
  font-size: 0.85rem;
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: var(--danger);
  color: var(--danger);
  box-shadow: none;
}

.logout-icon {
  width: 16px;
  height: 16px;
}
</style>
