<template>
  <div class="app-layout" :class="{ 'logged-in': isLoggedIn }">
    
    <!-- Navigation Sidebar (Only shown when logged in) -->
    <Sidebar 
      v-if="isLoggedIn" 
      :active-view="currentRoute" 
      @change-view="navigateTo"
      @logout="handleLogout"
    />

    <!-- Main Content Panel -->
    <main :class="['main-content', { 'full-width': !isLoggedIn }]">
      <RouterView />
    </main>

  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import { authService } from './services/index.js';

export default defineComponent({
  name: 'App',
  components: { Sidebar },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const isLoggedIn = ref(authService.isAuthenticated());
    const currentRoute = computed(() => route.name?.toLowerCase() || 'dashboard');

    // Sincroniza estado de login ao mudar de rota
    watch(route, () => {
      isLoggedIn.value = authService.isAuthenticated();
    });

    const navigateTo = (view) => {
      router.push(`/${view}`);
    };

    const handleLogout = () => {
      authService.logout();
      isLoggedIn.value = false;
      router.push('/login');
    };

    return { isLoggedIn, currentRoute, navigateTo, handleLogout };
  },
});
</script>

<style>
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
  padding-left: 300px;
}

.main-content.full-width {
  padding-left: 0;
  padding-right: 0;
  padding-top: 0;
  padding-bottom: 0;
}

@media (max-width: 900px) {
  .app-layout.logged-in .main-content {
    padding-left: 20px;
  }
}
</style>
