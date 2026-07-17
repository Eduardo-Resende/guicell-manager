<template>
  <div class="usuarios-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Configurações de Usuários</h1>
        <p class="page-subtitle">Gerencie as credenciais e níveis de acesso (Perfis) dos colaboradores.</p>
      </div>
      <button class="btn" @click="showAddModal = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Novo Usuário</span>
      </button>
    </div>

    <!-- Restrictions Warning Badge (Academic Detail) -->
    <div class="alert-info card flex items-center gap-3">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <div>
        <h4 class="text-white m-0">Acesso Restrito ao Gerente</h4>
        <p class="text-muted text-xs m-0">Este módulo só pode ser acessado por usuários com perfil de Gerente no sistema de permissões.</p>
      </div>
    </div>

    <!-- Users Table -->
    <div class="card table-card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nome Completo</th>
              <th>Login/Usuário</th>
              <th>Perfil de Acesso</th>
              <th>Status</th>
              <th>Data de Cadastro</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>
                <div class="user-avatar-row flex items-center gap-3">
                  <div class="avatar-circle">{{ u.nome.charAt(0) }}</div>
                  <span class="font-semibold text-white">{{ u.nome }}</span>
                </div>
              </td>
              <td>{{ u.login }}</td>
              <td>
                <span :class="['badge', getProfileBadge(u.perfil)]">{{ u.perfil }}</span>
              </td>
              <td>
                <button 
                  class="btn-toggle-status" 
                  :class="{ active: u.ativo }"
                  @click="toggleStatus(u)"
                  title="Alterar Status"
                >
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">{{ u.ativo ? 'Ativo' : 'Inativo' }}</span>
                </button>
              </td>
              <td class="text-muted">{{ u.criado }}</td>
              <td class="text-right">
                <button class="btn btn-secondary btn-xs mr-2" @click="openResetPassword(u)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Alterar Senha</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Novo Usuário -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Cadastrar Novo Usuário</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="submitUser">
          <div class="modal-body">
            <div class="form-group">
              <label>Nome Completo *</label>
              <input type="text" v-model="form.nome" required class="input-control" placeholder="Ex: Emilly Gabrielly" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>Login de Acesso *</label>
                <input type="text" v-model="form.login" required class="input-control" placeholder="usuario.acesso" />
              </div>
              <div class="form-group">
                <label>Perfil de Acesso *</label>
                <select v-model="form.perfil" required class="input-control select-control">
                  <option value="Atendente">Atendente</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Gerente">Gerente</option>
                </select>
              </div>
            </div>

            <div class="form-group m-0">
              <label>Senha Provisória *</label>
              <input type="password" v-model="form.senha" required class="input-control" placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn">Criar Conta</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Alterar Senha -->
    <div v-if="showResetModal && selectedUser" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h3 class="m-0">Redefinir Senha</h3>
            <p class="text-muted text-xs m-0">Usuário: {{ selectedUser.nome }}</p>
          </div>
          <button class="close-btn" @click="showResetModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitPasswordReset">
          <div class="modal-body">
            <div class="form-group m-0">
              <label>Nova Senha *</label>
              <input type="password" v-model="newPassword" required class="input-control" placeholder="Digite a nova senha de acesso" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showResetModal = false">Cancelar</button>
            <button type="submit" class="btn">Salvar Senha</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'UsuariosView',
  setup() {
    const showAddModal = ref(false);
    const showResetModal = ref(false);
    const selectedUser = ref(null);
    const newPassword = ref('');

    const form = ref({
      nome: '',
      login: '',
      perfil: 'Atendente',
      senha: ''
    });

    const users = ref([
      { id: 1, nome: 'Gerente Guicell', login: 'gerente.guicell', perfil: 'Gerente', ativo: true, criado: '10/01/2026' },
      { id: 2, nome: 'Sandro Gouvea', login: 'sandro.tecnico', perfil: 'Técnico', ativo: true, criado: '15/01/2026' },
      { id: 3, nome: 'Eduardo Santana', login: 'eduardo.tecnico', perfil: 'Técnico', ativo: true, criado: '20/02/2026' },
      { id: 4, nome: 'Emilly Gabrielly', login: 'emilly.atendente', perfil: 'Atendente', ativo: true, criado: '15/03/2026' }
    ]);

    const getProfileBadge = (profile) => {
      switch (profile) {
        case 'Gerente': return 'badge-danger';
        case 'Técnico': return 'badge-info';
        case 'Atendente': return 'badge-success';
        default: return 'badge-muted';
      }
    };

    const toggleStatus = (user) => {
      user.ativo = !user.ativo;
    };

    const closeModal = () => {
      showAddModal.value = false;
      form.value = { nome: '', login: '', perfil: 'Atendente', senha: '' };
    };

    const submitUser = () => {
      users.value.push({
        id: Date.now(),
        nome: form.value.nome,
        login: form.value.login,
        perfil: form.value.perfil,
        ativo: true,
        criado: new Date().toLocaleDateString('pt-BR')
      });
      closeModal();
    };

    const openResetPassword = (user) => {
      selectedUser.value = user;
      newPassword.value = '';
      showResetModal.value = true;
    };

    const submitPasswordReset = () => {
      alert(`Senha do usuário ${selectedUser.value.nome} redefinida com sucesso para o protótipo.`);
      showResetModal.value = false;
    };

    return {
      showAddModal,
      showResetModal,
      selectedUser,
      newPassword,
      form,
      users,
      getProfileBadge,
      toggleStatus,
      closeModal,
      submitUser,
      openResetPassword,
      submitPasswordReset
    };
  }
});
</script>

<style scoped>
.usuarios-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  margin-bottom: 4px;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Alert Box */
.alert-info {
  background-color: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
  padding: 16px 20px;
  display: flex;
  gap: 16px;
}

.alert-icon {
  width: 24px;
  height: 24px;
  color: var(--info);
  flex-shrink: 0;
}

/* Table Avatar Row */
.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--border);
  color: var(--text-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Toggle Status Button */
.btn-toggle-status {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-dark);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 0.75rem;
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  width: fit-content;
  color: var(--text-muted);
  box-shadow: none !important;
  transform: none !important;
}

.btn-toggle-status::before {
  content: '';
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--danger);
  transition: all var(--transition-fast);
}

.btn-toggle-status.active {
  color: var(--success);
  border-color: rgba(34, 197, 94, 0.2);
  background-color: rgba(34, 197, 94, 0.02);
}

.btn-toggle-status.active::before {
  background-color: var(--success);
}

.action-icon {
  width: 14px;
  height: 14px;
}

.btn-xs {
  padding: 6px 12px;
  font-size: 0.75rem;
  border-radius: 6px;
}

.select-control {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
}
</style>
