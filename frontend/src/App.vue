<template>
  <div class="app-layout" :class="{ 'logged-in': isLoggedIn }">
    
    <!-- Navigation Sidebar (Only shown when logged in) -->
    <Sidebar 
      v-if="isLoggedIn" 
      :active-view="currentView" 
      @change-view="changeView"
      @logout="handleLogout"
    />

    <!-- Main Content Panel -->
    <main :class="['main-content', { 'full-width': !isLoggedIn }]">
      
      <!-- Login View -->
      <LoginView 
        v-if="currentView === 'login'" 
        @login-success="handleLoginSuccess"
      />

      <!-- App Views -->
      <DashboardView 
        v-else-if="currentView === 'dashboard'" 
        @change-view="changeView"
      />
      
      <ClientesView 
        v-else-if="currentView === 'clientes'" 
      />
      
      <OsView 
        v-else-if="currentView === 'os'" 
      />
      
      <EstoqueView 
        v-else-if="currentView === 'estoque'" 
      />
      
      <VendasView 
        v-else-if="currentView === 'vendas'" 
      />
      
      <CaixaView 
        v-else-if="currentView === 'caixa'" 
      />
      
      <RelatoriosView 
        v-else-if="currentView === 'relatorios'" 
      />
      
      <UsuariosView 
        v-else-if="currentView === 'usuarios'" 
      />

    </main>

    <!-- Floating Screenshot Selector Control Bar -->
    <div class="developer-helper" v-if="showSelector">
      <div class="helper-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="helper-icon">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Seletor de Prints (TCC)</span>
      </div>
      <div class="helper-actions">
        <button 
          v-for="btn in selectorButtons" 
          :key="btn.view" 
          :class="['helper-btn', { active: currentView === btn.view }]"
          @click="forceView(btn.view, btn.loginState)"
        >
          {{ btn.label }}
        </button>
        <button class="helper-btn hide-btn" @click="showSelector = false">Ocultar</button>
      </div>
    </div>
    
    <!-- Small Toggle Button to bring selector back -->
    <button 
      class="selector-toggle-trigger" 
      v-else 
      @click="showSelector = true"
      title="Mostrar Seletor de Telas"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trigger-icon">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>

  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import Sidebar from './components/Sidebar.vue';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';
import ClientesView from './views/ClientesView.vue';
import OsView from './views/OsView.vue';
import EstoqueView from './views/EstoqueView.vue';
import VendasView from './views/VendasView.vue';
import CaixaView from './views/CaixaView.vue';
import RelatoriosView from './views/RelatoriosView.vue';
import UsuariosView from './views/UsuariosView.vue';

export default defineComponent({
  name: 'App',
  components: {
    Sidebar,
    LoginView,
    DashboardView,
    ClientesView,
    OsView,
    EstoqueView,
    VendasView,
    CaixaView,
    RelatoriosView,
    UsuariosView
  },
  setup() {
    const isLoggedIn = ref(false);
    const currentView = ref('login');
    const showSelector = ref(true);

    const selectorButtons = [
      { view: 'login', label: '1. Login', loginState: false },
      { view: 'dashboard', label: '2. Dashboard', loginState: true },
      { view: 'clientes', label: '3. Clientes', loginState: true },
      { view: 'os', label: '4. OS', loginState: true },
      { view: 'estoque', label: '5. Estoque', loginState: true },
      { view: 'vendas', label: '6. Vendas', loginState: true },
      { view: 'caixa', label: '7. Caixa', loginState: true },
      { view: 'relatorios', label: '8. Relatórios', loginState: true },
      { view: 'usuarios', label: '9. Usuários', loginState: true }
    ];

    const handleLoginSuccess = () => {
      isLoggedIn.value = true;
      currentView.value = 'dashboard';
    };

    const handleLogout = () => {
      isLoggedIn.value = false;
      currentView.value = 'login';
    };

    const changeView = (view) => {
      currentView.value = view;
    };

    const forceView = (view, loginState) => {
      isLoggedIn.value = loginState;
      currentView.value = view;
    };

    return {
      isLoggedIn,
      currentView,
      showSelector,
      selectorButtons,
      handleLoginSuccess,
      handleLogout,
      changeView,
      forceView
    };
  }
});
</script>

<style>
/* Reset App standard margin styles */
#app {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
}

.app-layout {
  min-height: 100vh;
  display: flex;
}

.main-content {
  flex: 1;
  padding: 40px;
  background-color: var(--bg-dark);
  min-height: 100vh;
  transition: padding-left var(--transition-normal);
}

.app-layout.logged-in .main-content {
  padding-left: 300px; /* Leave space for fixed sidebar (260px width + 40px gap) */
}

.main-content.full-width {
  padding-left: 0;
  padding-right: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* Floating helper styles for printing screenshots */
.developer-helper {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(15, 19, 34, 0.95);
  border: 1.5px solid var(--primary);
  border-radius: 50px;
  padding: 8px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  z-index: 10000;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.helper-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary-hover);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-right: 1px solid var(--border);
  padding-right: 14px;
}

.helper-icon {
  width: 16px;
  height: 16px;
}

.helper-actions {
  display: flex;
  gap: 6px;
}

.helper-btn {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 30px;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: none !important;
  transform: none !important;
}

.helper-btn:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--text-white);
}

.helper-btn.active {
  background-color: var(--primary);
  border-color: var(--primary);
  color: var(--text-white);
  box-shadow: 0 0 10px var(--primary-glow) !important;
}

.helper-btn.hide-btn {
  background-color: var(--danger-glow);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--danger);
}
.helper-btn.hide-btn:hover {
  background-color: var(--danger);
  color: var(--text-white);
  border-color: var(--danger);
}

.selector-toggle-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--primary);
  border: 1px solid var(--primary-hover);
  color: var(--text-white);
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 15px var(--primary-glow);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.selector-toggle-trigger:hover {
  background-color: var(--primary-hover);
  transform: scale(1.05);
}

.trigger-icon {
  width: 20px;
  height: 20px;
}

@keyframes slideUp {
  from { transform: translate(-50%, 30px); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

@media (max-width: 900px) {
  .app-layout.logged-in .main-content {
    padding-left: 20px; /* Sidebar goes over content or hides in mobile */
  }
}
</style>
