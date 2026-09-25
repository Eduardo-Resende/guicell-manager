<template>
  <aside class="sidebar">
    <div class="brand-container">
      <div class="logo-wrapper">
        <img src="/logo-new.png" alt="Guicell Manager Logo" class="brand-icon-img" title="GUICELL MANAGER" />
        <div class="brand-text">
          <span class="brand-name">GUICELL</span>
          <span class="brand-sub">MANAGER</span>
          <span class="brand-badge">PRO</span>
        </div>
      </div>
    </div>

    <nav class="nav-menu">
      <button 
        v-for="item in menuItems" 
        :key="item.view" 
        :class="['nav-item', { active: activeView === item.view }]"
        :title="item.label"
        @click="$emit('change-view', item.view)"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.iconContent"></svg>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </nav>

    <div class="user-footer">
      <div class="user-info">
        <div class="user-avatar" :title="usuario.nome || 'Operador'">
          {{ usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'O' }}
        </div>
        <div class="user-details">
          <span class="user-name">{{ usuario.nome || 'Operador' }}</span>
          <span class="user-role">{{ usuario.perfil || 'Atendente' }}</span>
        </div>
      </div>
      <button class="logout-btn" title="Sair" @click="$emit('logout')">
        <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span class="logout-label">Sair</span>
      </button>
    </div>
  </aside>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';

const iconDashboard = `
  <rect x="3" y="3" width="7" height="9" />
  <rect x="14" y="3" width="7" height="5" />
  <rect x="14" y="12" width="7" height="9" />
  <rect x="3" y="16" width="7" height="5" />
`;

const iconClientes = `
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
`;

const iconOs = `
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
  <polyline points="14 2 14 8 20 8" />
  <line x1="16" y1="13" x2="8" y2="13" />
  <line x1="16" y1="17" x2="8" y2="17" />
  <polyline points="10 9 9 9 8 9" />
`;

const iconEstoque = `
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
  <line x1="12" y1="22.08" x2="12" y2="12" />
`;

const iconCompras = `
  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
  <line x1="3" y1="6" x2="21" y2="6" />
  <path d="M16 10a4 4 0 0 1-8 0" />
`;

const iconVendas = `
  <circle cx="9" cy="21" r="1" />
  <circle cx="20" cy="21" r="1" />
  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
`;

const iconCaixa = `
  <line x1="12" y1="1" x2="12" y2="23" />
  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
`;

const iconRelatorios = `
  <line x1="18" y1="20" x2="18" y2="10" />
  <line x1="12" y1="20" x2="12" y2="4" />
  <line x1="6" y1="20" x2="6" y2="14" />
`;

const iconUsuarios = `
  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M20 8v6" />
  <path d="M23 11h-6" />
`;

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
        { view: 'dashboard', label: 'Dashboard', iconContent: iconDashboard },
        { view: 'clientes', label: 'Clientes', iconContent: iconClientes },
        { view: 'os', label: 'Ordens de Serviço', iconContent: iconOs },
        { view: 'estoque', label: 'Estoque', iconContent: iconEstoque },
        { view: 'compras', label: 'Compras', iconContent: iconCompras },
        { view: 'vendas', label: 'Vendas (PDV)', iconContent: iconVendas },
        { view: 'caixa', label: 'Caixa', iconContent: iconCaixa },
        { view: 'relatorios', label: 'Relatórios', iconContent: iconRelatorios },
      ];

      if (usuario.value.perfil === 'Gerente') {
        items.push({ view: 'usuarios', label: 'Usuários', iconContent: iconUsuarios });
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
  width: 76px;
  background-color: var(--bg-card);
  border-right: 1px solid var(--border);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease;
  overflow: hidden;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.2);
}

.sidebar:hover {
  width: 260px;
  box-shadow: 10px 0 30px rgba(0, 0, 0, 0.4);
}

.brand-container {
  padding: 20px 19px;
  border-bottom: 1px solid var(--border);
  min-width: 260px;
  flex-shrink: 0;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  flex-shrink: 0;
  cursor: pointer;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  position: relative;
  opacity: 0;
  white-space: nowrap;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.sidebar:hover .brand-text {
  opacity: 1;
  pointer-events: auto;
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
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}

.nav-menu::-webkit-scrollbar {
  display: none;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  background: none;
  border: 1px solid transparent;
  color: var(--text-muted);
  width: 100%;
  min-width: 236px;
  text-align: left;
  padding: 12px 15px;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  white-space: nowrap;
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

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 15%;
  height: 70%;
  width: 4px;
  background-color: var(--primary);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 10px var(--primary);
}

.nav-item.active .nav-icon {
  color: var(--primary-hover);
}

.nav-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-label {
  opacity: 0;
  white-space: nowrap;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.sidebar:hover .nav-label {
  opacity: 1;
  pointer-events: auto;
}

.user-footer {
  padding: 16px 12px;
  border-top: 1px solid var(--border);
  background-color: rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 260px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 7px;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: var(--primary);
  color: var(--text-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  opacity: 0;
  white-space: nowrap;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.sidebar:hover .user-details {
  opacity: 1;
  pointer-events: auto;
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
  min-width: 236px;
  padding: 10px 14px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: var(--danger);
  color: var(--danger);
  box-shadow: none;
}

.logout-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.logout-label {
  opacity: 0;
  white-space: nowrap;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.sidebar:hover .logout-label {
  opacity: 1;
  pointer-events: auto;
}
</style>

