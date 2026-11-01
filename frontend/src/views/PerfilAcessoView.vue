<template>
  <div class="perfil-acesso-view">
    <!-- Header -->
    <div class="header-section">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="page-title m-0">Perfis de Acesso Unificado</h1>
          <span class="badge badge-info">Segurança & Permissões</span>
        </div>
        <p class="page-subtitle">
          Gerencie o que cada cargo pode visualizar e executar, ou configure regras personalizadas para um colaborador específico.
        </p>
      </div>

      <!-- Mode Switcher Tabs -->
      <div class="mode-tabs">
        <button 
          :class="['mode-tab-btn', { active: modoVisualizacao === 'perfil' }]"
          @click="alternarModo('perfil')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Por Perfil de Acesso</span>
        </button>

        <button 
          :class="['mode-tab-btn', { active: modoVisualizacao === 'usuario' }]"
          @click="alternarModo('usuario')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Por Usuário Específico</span>
        </button>
      </div>
    </div>

    <!-- Alert Banner / Feedback Toast -->
    <div v-if="toastMensagem" :class="['alert-feedback', toastTipo]">
      <svg v-if="toastTipo === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{{ toastMensagem }}</span>
    </div>

    <!-- MODO 1: Por Perfil de Acesso -->
    <div v-if="modoVisualizacao === 'perfil'" class="profile-cards-grid">
      <div 
        v-for="p in ['Gerente', 'Atendente', 'Técnico']" 
        :key="p"
        :class="['profile-card card', { selected: perfilSelecionado === p }]"
        @click="selecionarPerfil(p)"
      >
        <div class="flex items-center justify-between mb-3">
          <span :class="['badge', getProfileBadge(p)]">{{ p }}</span>
          <span class="user-count-badge">
            {{ contarUsuariosPerfil(p) }} {{ contarUsuariosPerfil(p) === 1 ? 'colaborador' : 'colaboradores' }}
          </span>
        </div>
        <h3 class="profile-title">{{ p }}</h3>
        <p class="profile-desc">
          <span v-if="p === 'Gerente'">Acesso total irrestrito a configurações, relatórios financeiros e gestão do sistema.</span>
          <span v-else-if="p === 'Atendente'">Foco em atendimento de clientes, abertura de OS, vendas PDV e controle de caixa.</span>
          <span v-else-if="p === 'Técnico'">Foco na bancada técnica, execução de serviços, laudos e requisição de peças.</span>
        </p>
        <div class="profile-card-footer">
          <span class="text-xs font-semibold" :style="{ color: perfilSelecionado === p ? 'var(--primary)' : 'var(--text-muted)' }">
            {{ perfilSelecionado === p ? 'Configurando este perfil' : 'Clique para configurar' }}
          </span>
        </div>
      </div>
    </div>

    <!-- MODO 2: Por Usuário Específico -->
    <div v-else class="card user-selection-panel mb-4">
      <div class="user-select-row">
        <div class="user-picker">
          <label class="block text-xs font-medium text-muted mb-2">Selecione o Colaborador:</label>
          <div class="select-wrapper">
            <select v-model="usuarioIdSelecionado" @change="onUsuarioChange" class="input-control select-control user-select">
              <option v-for="u in listaUsuarios" :key="u.id_usuario" :value="u.id_usuario">
                {{ u.nome }} ({{ u.login }}) — Cargo: {{ u.perfil }}
              </option>
            </select>
          </div>
        </div>

        <!-- Inheritance Status Card -->
        <div v-if="usuarioAtual" class="user-inheritance-box">
          <div class="flex items-center gap-3">
            <div class="avatar-circle-sm">{{ usuarioAtual.nome.charAt(0) }}</div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white">{{ usuarioAtual.nome }}</span>
                <span :class="['badge text-xs', getProfileBadge(usuarioAtual.perfil)]">{{ usuarioAtual.perfil }}</span>
              </div>
              <div class="text-xs text-muted mt-0.5">
                <span v-if="usuarioAtual.temPermissaoPersonalizada" class="text-amber-400 font-semibold flex items-center gap-1">
                  <span class="status-indicator warning"></span>
                  Possui permissões personalizadas exclusivas
                </span>
                <span v-else class="text-emerald-400 font-semibold flex items-center gap-1">
                  <span class="status-indicator success"></span>
                  Herdando permissões do perfil de {{ usuarioAtual.perfil }}
                </span>
              </div>
            </div>
          </div>

          <button 
            v-if="usuarioAtual.temPermissaoPersonalizada"
            class="btn btn-secondary btn-sm"
            @click="abrirModalRestaurar"
            title="Voltar a herdar as permissões do perfil"
          >
            Restaurar herança do perfil
          </button>
        </div>
      </div>
    </div>

    <!-- Search & Summary Bar -->
    <div class="card matrix-toolbar flex items-center justify-between flex-wrap gap-3">
      <!-- Search -->
      <div class="search-input-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input 
          type="text" 
          v-model="filtroBusca" 
          placeholder="Buscar permissão ou módulo (ex: caixa, desconto, excluir)..." 
          class="input-control search-input"
        />
        <button v-if="filtroBusca" class="clear-search-btn" @click="filtroBusca = ''">&times;</button>
      </div>

      <!-- Active Count & Expand/Collapse -->
      <div class="flex items-center gap-4 flex-wrap">
        <div class="permissions-stats">
          <span class="stats-label">Total liberadas:</span>
          <span class="stats-value font-bold text-primary">{{ totalPermissoesAtivas }} / {{ totalPermissoesGerais }}</span>
          <span class="stats-percent">({{ porcentagemAtivas }}%)</span>
        </div>

        <div class="flex items-center gap-2">
          <button class="btn btn-secondary btn-xs" @click="expandirTodos(true)">
            Expandir Todos
          </button>
          <button class="btn btn-secondary btn-xs" @click="expandirTodos(false)">
            Recolher Todos
          </button>
        </div>
      </div>
    </div>

    <!-- Modules Matrix -->
    <div v-if="modulosFiltrados.length > 0" class="modules-container">
      <div 
        v-for="modulo in modulosFiltrados" 
        :key="modulo.id" 
        class="card module-card"
      >
        <!-- Module Header -->
        <div class="module-header" @click="toggleModulo(modulo.id)">
          <div class="flex items-center gap-3">
            <div class="module-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="module-svg" v-html="obterIconeModulo(modulo.icone)"></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="module-title m-0">{{ modulo.nome }}</h3>
                <span class="badge-module-count">
                  {{ contarAtivasModulo(modulo) }} de {{ modulo.permissoes.length }} ativas
                </span>
              </div>
              <p class="module-desc m-0">{{ modulo.descricao }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3" @click.stop>
            <button 
              type="button" 
              class="btn-text-action text-xs" 
              @click="marcarTodosModulo(modulo, true)"
              title="Ativar todas as permissões deste módulo"
            >
              Marcar todos
            </button>
            <span class="text-muted text-xs">|</span>
            <button 
              type="button" 
              class="btn-text-action text-xs text-muted hover-danger" 
              @click="marcarTodosModulo(modulo, false)"
              title="Desativar todas as permissões deste módulo"
            >
              Desmarcar todos
            </button>
            <div class="chevron-wrapper ml-2" @click="toggleModulo(modulo.id)">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2.5" 
                :class="['chevron-icon', { rotated: modulosAbertos[modulo.id] }]"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Permissions List Grid -->
        <div v-show="modulosAbertos[modulo.id]" class="module-body">
          <div class="permissions-grid">
            <div 
              v-for="perm in modulo.permissoes" 
              :key="perm.chave" 
              :class="['permission-item card', { active: !!regrasAtuais[perm.chave] }]"
              @click="togglePermissao(perm.chave)"
            >
              <div class="permission-info">
                <div class="flex items-center justify-between mb-1">
                  <span class="permission-name">{{ perm.nome }}</span>
                  <span class="permission-key">{{ perm.chave }}</span>
                </div>
                <p class="permission-desc">{{ perm.descricao }}</p>
              </div>

              <div class="toggle-switch-wrapper" @click.stop>
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    :checked="!!regrasAtuais[perm.chave]" 
                    @change="togglePermissao(perm.chave)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty search result -->
    <div v-else class="card text-center p-8">
      <p class="text-white font-semibold">Nenhuma permissão encontrada com o termo "{{ filtroBusca }}".</p>
      <button class="btn btn-secondary btn-sm mt-3" @click="filtroBusca = ''">Limpar busca</button>
    </div>

    <!-- Sticky Actions Bottom Bar -->
    <div class="sticky-footer-bar">
      <div class="sticky-footer-content">
        <div class="footer-target-info">
          <span class="text-muted text-xs">Editando permissões para:</span>
          <div class="flex items-center gap-2">
            <span class="font-bold text-white text-sm">
              {{ modoVisualizacao === 'perfil' ? `Perfil: ${perfilSelecionado}` : (usuarioAtual ? `Usuário: ${usuarioAtual.nome} (${usuarioAtual.login})` : '') }}
            </span>
            <span v-if="houveAlteracao" class="badge badge-warning text-xs">Alterações pendentes</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button 
            type="button" 
            class="btn btn-secondary" 
            :disabled="salvando"
            @click="abrirModalRestaurar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Restaurar Padrão</span>
          </button>

          <button 
            v-if="houveAlteracao"
            type="button" 
            class="btn btn-secondary" 
            :disabled="salvando"
            @click="descartarAlteracoes"
          >
            Descartar
          </button>

          <button 
            type="button" 
            class="btn" 
            :disabled="salvando || !houveAlteracao" 
            @click="salvarPermissoes"
          >
            <svg v-if="salvando" class="spinner-icon" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{{ salvando ? 'Salvando...' : 'Salvar Permissões' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Confirmar Restauração de Padrão -->
    <div v-if="modalRestaurarAberto" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="m-0 text-white font-bold">Confirmar Restauração</h3>
          <button class="close-btn" @click="modalRestaurarAberto = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="modoVisualizacao === 'perfil'">
            <p class="text-white mb-2">
              Deseja restaurar as permissões do perfil <strong>{{ perfilSelecionado }}</strong> para os valores padrão de fábrica?
            </p>
            <p class="text-muted text-xs">
              Todos os colaboradores associados a este cargo que não possuem regras personalizadas passarão a ter as permissões originais do sistema.
            </p>
          </div>
          <div v-else>
            <p class="text-white mb-2">
              Deseja remover as permissões personalizadas de <strong>{{ usuarioAtual?.nome }}</strong>?
            </p>
            <p class="text-muted text-xs">
              O colaborador voltará a herdar automaticamente todas as permissões configuradas para o seu perfil base (<strong>{{ usuarioAtual?.perfil }}</strong>).
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="modalRestaurarAberto = false">Cancelar</button>
          <button type="button" class="btn btn-danger" @click="executarRestaurarPadrao">
            <span>Sim, Restaurar Padrão</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { permissoesService } from '../services/index.js';
import { sincronizarComServidor } from '../composables/usePermissoes';

export default defineComponent({
  name: 'PerfilAcessoView',
  setup() {
    const route = useRoute();
    const carregando = ref(true);
    const salvando = ref(false);
    const modoVisualizacao = ref('perfil'); // 'perfil' ou 'usuario'
    const perfilSelecionado = ref('Atendente');
    const usuarioIdSelecionado = ref(null);
    const filtroBusca = ref('');
    const toastMensagem = ref('');
    const toastTipo = ref('success');
    const modalRestaurarAberto = ref(false);

    const catalogo = ref([]);
    const padroes = ref({});
    const perfisSalvos = ref({});
    const listaUsuarios = ref([]);

    // Armazena as regras atualmente editadas
    const regrasAtuais = reactive({});
    // Armazena cópia das regras salvas para detectar alterações
    const regrasSalvasSnapshot = ref({});
    // Controle de expansão dos módulos
    const modulosAbertos = reactive({});

    const mostrarToast = (msg, tipo = 'success') => {
      toastMensagem.value = msg;
      toastTipo.value = tipo;
      setTimeout(() => {
        toastMensagem.value = '';
      }, 4000);
    };

    const usuarioAtual = computed(() => {
      return listaUsuarios.value.find(u => u.id_usuario === Number(usuarioIdSelecionado.value)) || null;
    });

    const carregarMatriz = async () => {
      carregando.value = true;
      try {
        const dados = await permissoesService.obterMatriz();
        catalogo.value = dados.catalogo || [];
        padroes.value = dados.padroes || {};
        perfisSalvos.value = dados.perfis || {};
        listaUsuarios.value = dados.usuarios || [];

        // Inicializa módulos abertos
        catalogo.value.forEach(m => {
          if (modulosAbertos[m.id] === undefined) {
            modulosAbertos[m.id] = true;
          }
        });

        // Se houver query param de usuário
        if (route.query.usuario) {
          const id = Number(route.query.usuario);
          const existe = listaUsuarios.value.some(u => u.id_usuario === id);
          if (existe) {
            modoVisualizacao.value = 'usuario';
            usuarioIdSelecionado.value = id;
            aplicarRegrasDoAlvo();
            return;
          }
        }

        if (listaUsuarios.value.length > 0 && !usuarioIdSelecionado.value) {
          usuarioIdSelecionado.value = listaUsuarios.value[0].id_usuario;
        }

        aplicarRegrasDoAlvo();
      } catch (err) {
        mostrarToast(err.response?.data?.error || 'Erro ao carregar permissões.', 'error');
      } finally {
        carregando.value = false;
      }
    };

    const aplicarRegrasDoAlvo = () => {
      let regrasBase = {};
      if (modoVisualizacao.value === 'perfil') {
        regrasBase = perfisSalvos.value[perfilSelecionado.value] || padroes.value[perfilSelecionado.value] || {};
      } else if (usuarioAtual.value) {
        regrasBase = usuarioAtual.value.regras || {};
      }

      // Limpa e popula objeto reativo
      Object.keys(regrasAtuais).forEach(k => delete regrasAtuais[k]);
      Object.assign(regrasAtuais, JSON.parse(JSON.stringify(regrasBase)));
      regrasSalvasSnapshot.value = JSON.parse(JSON.stringify(regrasBase));
    };

    const alternarModo = (modo) => {
      modoVisualizacao.value = modo;
      aplicarRegrasDoAlvo();
    };

    const selecionarPerfil = (perfil) => {
      perfilSelecionado.value = perfil;
      aplicarRegrasDoAlvo();
    };

    const onUsuarioChange = () => {
      aplicarRegrasDoAlvo();
    };

    const togglePermissao = (chave) => {
      regrasAtuais[chave] = !regrasAtuais[chave];
    };

    const toggleModulo = (idModulo) => {
      modulosAbertos[idModulo] = !modulosAbertos[idModulo];
    };

    const expandirTodos = (expandir) => {
      catalogo.value.forEach(m => {
        modulosAbertos[m.id] = expandir;
      });
    };

    const marcarTodosModulo = (modulo, estado) => {
      modulo.permissoes.forEach(p => {
        regrasAtuais[p.chave] = estado;
      });
    };

    const contarUsuariosPerfil = (perfil) => {
      return listaUsuarios.value.filter(u => u.perfil === perfil).length;
    };

    const contarAtivasModulo = (modulo) => {
      return modulo.permissoes.filter(p => !!regrasAtuais[p.chave]).length;
    };

    const totalPermissoesGerais = computed(() => {
      let total = 0;
      catalogo.value.forEach(m => {
        total += m.permissoes.length;
      });
      return total;
    });

    const totalPermissoesAtivas = computed(() => {
      let ativas = 0;
      catalogo.value.forEach(m => {
        m.permissoes.forEach(p => {
          if (regrasAtuais[p.chave]) ativas++;
        });
      });
      return ativas;
    });

    const porcentagemAtivas = computed(() => {
      if (!totalPermissoesGerais.value) return 0;
      return Math.round((totalPermissoesAtivas.value / totalPermissoesGerais.value) * 100);
    });

    const modulosFiltrados = computed(() => {
      if (!filtroBusca.value.trim()) return catalogo.value;
      const q = filtroBusca.value.toLowerCase().trim();

      return catalogo.value
        .map(modulo => {
          const matchModulo = modulo.nome.toLowerCase().includes(q) || modulo.descricao.toLowerCase().includes(q);
          const permsFiltradas = modulo.permissoes.filter(p => 
            p.nome.toLowerCase().includes(q) || 
            p.descricao.toLowerCase().includes(q) || 
            p.chave.toLowerCase().includes(q)
          );

          if (matchModulo) return modulo;
          if (permsFiltradas.length > 0) {
            return { ...modulo, permissoes: permsFiltradas };
          }
          return null;
        })
        .filter(Boolean);
    });

    const houveAlteracao = computed(() => {
      return JSON.stringify(regrasAtuais) !== JSON.stringify(regrasSalvasSnapshot.value);
    });

    const descartarAlteracoes = () => {
      Object.keys(regrasAtuais).forEach(k => delete regrasAtuais[k]);
      Object.assign(regrasAtuais, JSON.parse(JSON.stringify(regrasSalvasSnapshot.value)));
    };

    const salvarPermissoes = async () => {
      salvando.value = true;
      try {
        if (modoVisualizacao.value === 'perfil') {
          await permissoesService.salvarPerfil(perfilSelecionado.value, regrasAtuais);
          perfisSalvos.value[perfilSelecionado.value] = JSON.parse(JSON.stringify(regrasAtuais));
          mostrarToast(`Permissões do perfil "${perfilSelecionado.value}" salvas com sucesso!`);
        } else if (usuarioAtual.value) {
          await permissoesService.salvarUsuario(usuarioAtual.value.id_usuario, regrasAtuais);
          usuarioAtual.value.temPermissaoPersonalizada = true;
          usuarioAtual.value.regras = JSON.parse(JSON.stringify(regrasAtuais));
          mostrarToast(`Permissões personalizadas de "${usuarioAtual.value.nome}" salvas com sucesso!`);
        }
        regrasSalvasSnapshot.value = JSON.parse(JSON.stringify(regrasAtuais));
        await sincronizarComServidor();
        window.dispatchEvent(new CustomEvent('guicell_permissoes_alteradas'));
      } catch (err) {
        mostrarToast(err.response?.data?.error || 'Erro ao salvar permissões.', 'error');
      } finally {
        salvando.value = false;
      }
    };

    const abrirModalRestaurar = () => {
      modalRestaurarAberto.value = true;
    };

    const executarRestaurarPadrao = async () => {
      modalRestaurarAberto.value = false;
      salvando.value = true;
      try {
        if (modoVisualizacao.value === 'perfil') {
          const res = await permissoesService.restaurarPerfil(perfilSelecionado.value);
          perfisSalvos.value[perfilSelecionado.value] = res.regras;
          Object.keys(regrasAtuais).forEach(k => delete regrasAtuais[k]);
          Object.assign(regrasAtuais, res.regras);
          regrasSalvasSnapshot.value = JSON.parse(JSON.stringify(res.regras));
          mostrarToast(`Perfil "${perfilSelecionado.value}" restaurado para os padrões com sucesso!`);
          await sincronizarComServidor();
          window.dispatchEvent(new CustomEvent('guicell_permissoes_alteradas'));
        } else if (usuarioAtual.value) {
          const res = await permissoesService.restaurarUsuario(usuarioAtual.value.id_usuario);
          usuarioAtual.value.temPermissaoPersonalizada = false;
          usuarioAtual.value.regras = res.regras;
          Object.keys(regrasAtuais).forEach(k => delete regrasAtuais[k]);
          Object.assign(regrasAtuais, res.regras);
          regrasSalvasSnapshot.value = JSON.parse(JSON.stringify(res.regras));
          mostrarToast(`Usuário "${usuarioAtual.value.nome}" agora está herdando do perfil ${usuarioAtual.value.perfil}!`);
          await sincronizarComServidor();
          window.dispatchEvent(new CustomEvent('guicell_permissoes_alteradas'));
        }
      } catch (err) {
        mostrarToast(err.response?.data?.error || 'Erro ao restaurar padrão.', 'error');
      } finally {
        salvando.value = false;
      }
    };

    const getProfileBadge = (profile) => {
      switch (profile) {
        case 'Gerente': return 'badge-danger';
        case 'Técnico': return 'badge-info';
        case 'Atendente': return 'badge-success';
        default: return 'badge-muted';
      }
    };

    const obterIconeModulo = (icone) => {
      switch (icone) {
        case 'dashboard':
          return '<rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />';
        case 'clientes':
          return '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />';
        case 'os':
          return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />';
        case 'estoque':
          return '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />';
        case 'compras':
          return '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />';
        case 'vendas':
          return '<circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />';
        case 'caixa':
          return '<line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />';
        case 'relatorios':
          return '<line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />';
        case 'usuarios':
          return '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" />';
        default:
          return '<circle cx="12" cy="12" r="10" />';
      }
    };

    onMounted(() => {
      carregarMatriz();
    });

    return {
      carregando,
      salvando,
      modoVisualizacao,
      perfilSelecionado,
      usuarioIdSelecionado,
      usuarioAtual,
      filtroBusca,
      toastMensagem,
      toastTipo,
      modalRestaurarAberto,
      catalogo,
      listaUsuarios,
      regrasAtuais,
      modulosAbertos,
      modulosFiltrados,
      totalPermissoesGerais,
      totalPermissoesAtivas,
      porcentagemAtivas,
      houveAlteracao,
      alternarModo,
      selecionarPerfil,
      onUsuarioChange,
      togglePermissao,
      toggleModulo,
      expandirTodos,
      marcarTodosModulo,
      contarUsuariosPerfil,
      contarAtivasModulo,
      descartarAlteracoes,
      salvarPermissoes,
      abrirModalRestaurar,
      executarRestaurarPadrao,
      getProfileBadge,
      obterIconeModulo,
    };
  }
});
</script>

<style scoped>
.perfil-acesso-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 90px; /* Espaço para barra fixa inferior */
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 2rem;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  max-width: 650px;
  margin: 0;
}

/* Mode Switcher Tabs */
.mode-tabs {
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
}

.mode-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-tab-btn:hover {
  color: #ffffff;
}

.mode-tab-btn.active {
  background: var(--primary);
  color: #0b0f19;
  box-shadow: 0 0 12px var(--primary-glow);
}

.tab-icon {
  width: 16px;
  height: 16px;
}

/* Profile Selection Cards */
.profile-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.profile-card {
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.profile-card:hover {
  transform: translateY(-2px);
  border-color: rgba(34, 197, 94, 0.4);
}

.profile-card.selected {
  border-color: var(--primary);
  background: rgba(34, 197, 94, 0.05);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
}

.profile-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 6px 0;
}

.profile-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0 0 16px 0;
  flex: 1;
}

.user-count-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.profile-card-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 12px;
}

/* User Selection Panel */
.user-selection-panel {
  padding: 20px;
}

.user-select-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 20px;
  align-items: center;
}

.user-select {
  width: 100%;
}

.user-inheritance-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.avatar-circle-sm {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--border);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.success {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.status-indicator.warning {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

/* Matrix Toolbar */
.matrix-toolbar {
  padding: 14px 20px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 450px;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.search-input {
  padding-left: 38px;
  padding-right: 32px;
  width: 100%;
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
}

.permissions-stats {
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-value {
  color: var(--primary);
}

/* Modules Container */
.modules-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.module-card {
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border);
}

.module-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.2s ease;
  user-select: none;
}

.module-header:hover {
  background: rgba(255, 255, 255, 0.04);
}

.module-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.1);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-svg {
  width: 20px;
  height: 20px;
}

.module-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
}

.module-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.badge-module-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--primary);
  background: rgba(34, 197, 94, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.btn-text-action {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 4px 6px;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-text-action:hover {
  text-decoration: underline;
}

.btn-text-action.hover-danger:hover {
  color: var(--danger);
}

.chevron-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  transition: transform 0.25s ease;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

/* Permissions Grid */
.module-body {
  padding: 16px 20px 20px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.015);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.permission-item:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.12);
}

.permission-item.active {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.03);
}

.permission-info {
  flex: 1;
  padding-right: 14px;
}

.permission-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
}

.permission-key {
  font-size: 0.7rem;
  font-family: monospace;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 6px;
  border-radius: 4px;
}

.permission-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.35;
}

/* Toggle Switch Control */
.toggle-switch-wrapper {
  flex-shrink: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.15);
  transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--primary);
  box-shadow: 0 0 10px var(--primary-glow);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
  background-color: #0b0f19;
}

/* Sticky Action Footer */
.sticky-footer-bar {
  position: fixed;
  bottom: 0;
  left: 76px;
  right: 0;
  background: rgba(18, 24, 38, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border);
  padding: 14px 40px;
  z-index: 90;
  box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.4);
}

.sticky-footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.footer-target-info {
  display: flex;
  flex-direction: column;
}

.action-icon {
  width: 16px;
  height: 16px;
}

.spinner-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Alert Feedback Toast */
.alert-feedback {
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  animation: fadeIn 0.2s ease-out;
}

.alert-feedback.success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid #10b981;
  color: #10b981;
}

.alert-feedback.error {
  background: var(--danger-glow);
  border: 1px solid var(--danger);
  color: var(--danger);
}

.toast-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-danger {
  background: var(--danger);
  color: white;
  border: none;
}

.btn-danger:hover {
  background: #dc2626;
}

@media (max-width: 1024px) {
  .profile-cards-grid {
    grid-template-columns: 1fr;
  }
  .permissions-grid {
    grid-template-columns: 1fr;
  }
  .user-select-row {
    grid-template-columns: 1fr;
  }
  .sticky-footer-bar {
    left: 0;
    padding: 12px 20px;
  }
}
</style>

