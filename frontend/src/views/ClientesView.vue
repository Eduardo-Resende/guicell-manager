<template>
  <div class="clientes-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Cadastre e gerencie os clientes da sua assistência técnica.</p>
      </div>
      <button class="btn" @click="showAddModal = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Novo Cliente</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <div class="card filters-card">
      <div class="search-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Buscar por nome, CPF/CNPJ ou telefone..." 
          class="input-control search-input"
        />
      </div>
    </div>

    <!-- Clientes Table -->
    <div class="card table-card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF/CNPJ</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Endereço</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in filteredClients" :key="client.id">
              <td class="font-semibold text-white">{{ client.nome }}</td>
              <td>{{ client.cpf }}</td>
              <td>{{ client.telefone }}</td>
              <td>{{ client.email }}</td>
              <td>{{ client.endereco }}</td>
              <td class="text-right">
                <div class="actions-wrapper">
                  <button 
                    class="btn btn-secondary btn-xs mr-2" 
                    title="Ver Histórico de OS"
                    @click="viewHistory(client)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    <span>Histórico</span>
                  </button>
                  <button class="btn btn-secondary btn-xs btn-icon-only" title="Editar" @click="editClient(client)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredClients.length === 0">
              <td colspan="6" class="text-center text-muted py-6">Nenhum cliente encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Novo / Editar Cliente -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Cliente' : 'Novo Cliente' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="submitClient">
          <div class="modal-body">
            <div class="form-group">
              <label>Nome Completo *</label>
              <input type="text" v-model="form.nome" required class="input-control" placeholder="Nome do cliente" />
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>CPF / CNPJ</label>
                <input type="text" v-model="form.cpf" class="input-control" placeholder="000.000.000-00" />
              </div>
              <div class="form-group">
                <label>Telefone *</label>
                <input type="text" v-model="form.telefone" required class="input-control" placeholder="(62) 99999-9999" />
              </div>
            </div>

            <div class="form-group">
              <label>E-mail</label>
              <input type="email" v-model="form.email" class="input-control" placeholder="cliente@email.com" />
            </div>

            <div class="form-group">
              <label>Endereço Completo</label>
              <input type="text" v-model="form.endereco" class="input-control" placeholder="Rua, Número, Bairro, Cidade" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Histórico de OS -->
    <div v-if="showHistoryModal" class="modal-overlay">
      <div class="modal-content max-w-lg">
        <div class="modal-header">
          <div>
            <h3 class="m-0">Histórico de Ordens de Serviço</h3>
            <p class="text-muted text-xs m-0">Cliente: {{ selectedClient?.nome }}</p>
          </div>
          <button class="close-btn" @click="showHistoryModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="clientHistory.length === 0" class="text-center text-muted py-4">
            Nenhuma Ordem de Serviço registrada para este cliente.
          </div>
          <div v-else class="history-list">
            <div v-for="os in clientHistory" :key="os.id" class="history-item card">
              <div class="history-item-header">
                <span class="font-semibold text-white">OS #{{ os.numero }}</span>
                <span :class="['badge', getBadgeClass(os.status)]">{{ os.status }}</span>
              </div>
              <div class="history-item-details">
                <p><strong>Aparelho:</strong> {{ os.aparelho }}</p>
                <p><strong>Defeito:</strong> {{ os.defeito }}</p>
                <p><strong>Valor:</strong> {{ os.valor }}</p>
              </div>
              <div class="history-item-footer text-muted">
                Abertura: {{ os.data }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showHistoryModal = false">Fechar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'ClientesView',
  setup() {
    const searchQuery = ref('');
    const showAddModal = ref(false);
    const showHistoryModal = ref(false);
    const selectedClient = ref(null);
    const editingId = ref(null);

    const form = ref({
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      endereco: ''
    });

    const clients = ref([
      { id: 1, nome: 'Eduardo Santana', cpf: '043.233.129-33', telefone: '(62) 98112-4455', email: 'eduardo@email.com', endereco: 'Rua T-30, Setor Bueno, Goiânia - GO' },
      { id: 2, nome: 'Mariana Costa', cpf: '839.294.102-12', telefone: '(62) 99221-5060', email: 'mariana.costa@hotmail.com', endereco: 'Av. 85, Setor Marista, Goiânia - GO' },
      { id: 3, nome: 'Carlos Roberto', cpf: '128.394.029-45', telefone: '(62) 98554-1020', email: 'carlos.roberto@gmail.com', endereco: 'Rua 10, Centro, Goiânia - GO' },
      { id: 4, nome: 'Julia Almeida', cpf: '739.102.348-11', telefone: '(62) 99182-3344', email: 'julia.almeida@gmail.com', endereco: 'Rua C-139, Jardim América, Goiânia - GO' },
      { id: 5, nome: 'Ricardo Alves', cpf: '948.203.492-38', telefone: '(62) 98234-8899', email: 'ricardo.alves@outlook.com', endereco: 'Av. Circular, Setor Pedro Ludovico, Goiânia - GO' }
    ]);

    const mockOS = [
      { id: 1, client_id: 1, numero: '2026-0014', aparelho: 'iPhone 13', defeito: 'Tela Quebrada', status: 'Em Reparo', valor: 'R$ 850,00', data: '10/06/2026' },
      { id: 2, client_id: 3, numero: '2026-0012', aparelho: 'Samsung Galaxy S22', defeito: 'Bateria inchada', status: 'Concluído', valor: 'R$ 350,00', data: '09/06/2026' },
      { id: 3, client_id: 4, numero: '2026-0011', aparelho: 'iPhone 11', defeito: 'Câmera trincada', status: 'Aguard. Peça', valor: 'R$ 480,00', data: '09/06/2026' },
      { id: 4, client_id: 5, numero: '2026-0010', aparelho: 'Xiaomi Poco X3', defeito: 'Não liga', status: 'Cancelado', valor: 'R$ 0,00', data: '09/06/2026' },
      { id: 5, client_id: 1, numero: '2025-0044', aparelho: 'Xiaomi Redmi Note 10', defeito: 'Conector de carga', status: 'Entregue', valor: 'R$ 150,00', data: '12/12/2025' }
    ];

    const filteredClients = computed(() => {
      if (!searchQuery.value) return clients.value;
      const query = searchQuery.value.toLowerCase();
      return clients.value.filter(c => 
        c.nome.toLowerCase().includes(query) || 
        c.cpf.includes(query) || 
        c.telefone.includes(query)
      );
    });

    const clientHistory = computed(() => {
      if (!selectedClient.value) return [];
      return mockOS.filter(os => os.client_id === selectedClient.value.id);
    });

    const closeModal = () => {
      showAddModal.value = false;
      editingId.value = null;
      form.value = { nome: '', cpf: '', telefone: '', email: '', endereco: '' };
    };

    const submitClient = () => {
      if (editingId.value) {
        // Update client
        const idx = clients.value.findIndex(c => c.id === editingId.value);
        if (idx !== -1) {
          clients.value[idx] = { ...clients.value[idx], ...form.value };
        }
      } else {
        // Add client
        clients.value.push({
          id: Date.now(),
          ...form.value
        });
      }
      closeModal();
    };

    const editClient = (client) => {
      editingId.value = client.id;
      form.value = { ...client };
      showAddModal.value = true;
    };

    const viewHistory = (client) => {
      selectedClient.value = client;
      showHistoryModal.value = true;
    };

    const getBadgeClass = (status) => {
      switch (status) {
        case 'Aguardando': return 'badge-warning';
        case 'Em Reparo': return 'badge-info';
        case 'Aguard. Peça': return 'badge-danger';
        case 'Concluído': return 'badge-success';
        case 'Entregue': return 'badge-success';
        case 'Cancelado': return 'badge-muted';
        default: return 'badge-muted';
      }
    };

    return {
      searchQuery,
      showAddModal,
      showHistoryModal,
      selectedClient,
      editingId,
      form,
      filteredClients,
      clientHistory,
      closeModal,
      submitClient,
      editClient,
      viewHistory,
      getBadgeClass
    };
  }
});
</script>

<style scoped>
.clientes-view {
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

.filters-card {
  padding: 16px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  width: 18px;
  height: 18px;
  pointer-events: none;
}

.search-input {
  padding-left: 44px;
  background-color: var(--bg-dark);
}

.actions-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.btn-xs {
  padding: 6px 12px;
  font-size: 0.75rem;
  border-radius: 6px;
}

.action-icon {
  width: 14px;
  height: 14px;
}

.max-w-lg {
  max-width: 600px;
}

/* History Modal Styles */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.history-item {
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.01);
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
}

.history-item-details p {
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.history-item-footer {
  font-size: 0.75rem;
  margin-top: 8px;
}
</style>
