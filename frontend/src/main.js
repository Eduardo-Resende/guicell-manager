import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';
import { pode, podeModulo } from './composables/usePermissoes';

const app = createApp(App);
app.config.globalProperties.$pode = pode;
app.config.globalProperties.$podeModulo = podeModulo;
app.use(router);
app.mount('#app');
