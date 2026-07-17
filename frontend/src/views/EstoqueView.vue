<template>
  <div class="estoque-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Estoque</h1>
        <p class="page-subtitle">Controle de peças de reposição e acessórios com alerta de nível crítico.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" @click="showAddEntryModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Lançar Entrada</span>
        </button>
        <button class="btn" @click="showAddModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Novo Produto</span>
        </button>
      </div>
    </div>

    <!-- Tabs Menu -->
    <div class="tabs-container">
      <button 
        :class="['tab-btn', { active: activeTab === 'list' }]" 
        @click="activeTab = 'list'"
      >
        Produtos Cadastrados
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'logs' }]" 
        @click="activeTab = 'logs'"
      >
        Histórico de Movimentações
      </button>
    </div>

    <!-- Tab Content: Product List -->
    <div v-if="activeTab === 'list'" class="tab-content">
      <!-- Search -->
      <div class="card filters-card mb-4">
        <div class="search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar produto ou peça pela descrição ou categoria..." 
            class="input-control search-input"
          />
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="card table-card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Categoria</th>
                <th>Estoque Atual</th>
                <th>Mínimo Requerido</th>
                <th>Preço de Custo</th>
                <th>Preço de Venda</th>
                <th>Status</th>
                <th class="text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prod in filteredProducts" :key="prod.id">
                <td>
                  <div class="item-detail">
                    <span class="font-semibold text-white block">{{ prod.descricao }}</span>
                  </div>
                </td>
                <td>{{ prod.categoria }}</td>
                <td class="font-bold" :class="{ 'text-danger': prod.qtd <= prod.min }">{{ prod.qtd }}</td>
                <td>{{ prod.min }}</td>
                <td>R$ {{ prod.custo.toFixed(2) }}</td>
                <td class="font-semibold text-white">R$ {{ prod.venda.toFixed(2) }}</td>
                <td>
                  <span 
                    v-if="prod.qtd <= prod.min" 
                    class="badge badge-danger"
                  >
                    Crítico
                  </span>
                  <span 
                    v-else-if="prod.qtd <= prod.min + 2" 
                    class="badge badge-warning"
                  >
                    Alerta
                  </span>
                  <span 
                    v-else 
                    class="badge badge-success"
                  >
                    Normal
                  </span>
                </td>
                <td class="text-right">
                  <button class="btn btn-secondary btn-xs btn-icon-only" title="Editar" @click="editProduct(prod)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="8" class="text-center text-muted py-6">Nenhum produto em estoque encontrado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab Content: Logs -->
    <div v-else class="tab-content card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Origem/Destino</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in sortedLogs" :key="log.id">
              <td class="text-muted">{{ log.data }}</td>
              <td class="font-semibold text-white">{{ log.produto }}</td>
              <td>
                <span :class="['badge', log.tipo === 'Entrada' ? 'badge-success' : 'badge-danger']">
                  {{ log.tipo }}
                </span>
              </td>
              <td class="font-bold">{{ log.qtd }} un</td>
              <td>{{ log.origem }}</td>
              <td>{{ log.tecnico }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Novo / Editar Produto -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Item' : 'Novo Produto/Peça' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="submitProduct">
          <div class="modal-body">
            <div class="form-group">
              <label>Descrição do Item *</label>
              <input type="text" v-model="form.descricao" required class="input-control" placeholder="Ex: Tela Frontal iPhone 12 OLED" />
            </div>

            <div class="form-group">
              <label>Categoria *</label>
              <select v-model="form.categoria" required class="input-control select-control">
                <option value="Tela">Tela / Frontal</option>
                <option value="Bateria">Bateria</option>
                <option value="Acessório">Acessório</option>
                <option value="Conector">Conector de Carga</option>
                <option value="Câmera">Câmera</option>
                <option value="Outros">Outras peças</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>Estoque Inicial *</label>
                <input type="number" v-model="form.qtd" required min="0" class="input-control" />
              </div>
              <div class="form-group">
                <label>Estoque Mínimo *</label>
                <input type="number" v-model="form.min" required min="1" class="input-control" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group m-0">
                <label>Preço de Custo (Compra) *</label>
                <input type="number" step="0.01" v-model="form.custo" required class="input-control" placeholder="R$ 0,00" />
              </div>
              <div class="form-group m-0">
                <label>Preço de Venda (Cliente) *</label>
                <input type="number" step="0.01" v-model="form.venda" required class="input-control" placeholder="R$ 0,00" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn">Salvar Produto</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Registrar Entrada Manual -->
    <div v-if="showAddEntryModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Lançar Entrada no Estoque</h3>
          <button class="close-btn" @click="showAddEntryModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitEntry">
          <div class="modal-body">
            <div class="form-group">
              <label>Selecione o Item *</label>
              <select v-model="entryForm.produtoId" required class="input-control select-control">
                <option value="">Selecione o Produto</option>
                <option v-for="p in products" :key="p.id" :value="p.id">{{ p.descricao }} (Atual: {{ p.qtd }})</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group m-0">
                <label>Quantidade a Adicionar *</label>
                <input type="number" v-model="entryForm.qtd" required min="1" class="input-control" />
              </div>
              <div class="form-group m-0">
                <label>Origem / Fornecedor *</label>
                <input type="text" v-model="entryForm.origem" required class="input-control" placeholder="Ex: Fornecedor X" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAddEntryModal = false">Cancelar</button>
            <button type="submit" class="btn">Confirmar Entrada</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'EstoqueView',
  setup() {
    const activeTab = ref('list');
    const searchQuery = ref('');
    const showAddModal = ref(false);
    const showAddEntryModal = ref(false);
    const editingId = ref(null);

    const form = ref({
      descricao: '',
      categoria: 'Tela',
      qtd: 5,
      min: 2,
      custo: 0.00,
      venda: 0.00
    });

    const entryForm = ref({
      produtoId: '',
      qtd: 1,
      origem: ''
    });

    const products = ref([
      { id: 1, descricao: 'Tela Frontal iPhone 13 OLED', categoria: 'Tela', qtd: 4, min: 2, custo: 400.00, venda: 650.00 },
      { id: 2, descricao: 'Bateria Compatível S22', categoria: 'Bateria', qtd: 2, min: 2, custo: 100.00, venda: 180.00 },
      { id: 3, descricao: 'Conector de Carga Tipo C', categoria: 'Conector', qtd: 15, min: 5, custo: 15.00, venda: 45.00 },
      { id: 4, descricao: 'Câmera Traseira iPhone 11', categoria: 'Câmera', qtd: 1, min: 2, custo: 210.00, venda: 320.00 },
      { id: 5, descricao: 'Película de Vidro 3D Genérica', categoria: 'Acessório', qtd: 45, min: 10, custo: 3.50, venda: 20.00 },
      { id: 6, descricao: 'Cabo Lightning iPhone 1m', categoria: 'Acessório', qtd: 12, min: 5, custo: 12.00, venda: 40.00 }
    ]);

    const movementLogs = ref([
      { id: 1, data: '10/06/2026 10:15', produto: 'Tela Frontal iPhone 13 OLED', tipo: 'Saída', qtd: 1, origem: 'OS #2026-0014', tecnico: 'Eduardo Santana' },
      { id: 2, data: '09/06/2026 17:45', produto: 'Conector de Carga Tipo C', tipo: 'Saída', qtd: 1, origem: 'OS #2026-0012', tecnico: 'Sandro Gouvea' },
      { id: 3, data: '09/06/2026 15:20', produto: 'Câmera Traseira iPhone 11', tipo: 'Saída', qtd: 1, origem: 'OS #2026-0011', tecnico: 'Eduardo Santana' },
      { id: 4, data: '08/06/2026 14:00', produto: 'Bateria Compatível S22', tipo: 'Entrada', qtd: 5, origem: 'Compra Distribuidora', tecnico: 'Sandro Gouvea' },
      { id: 5, data: '08/06/2026 11:30', produto: 'Película de Vidro 3D Genérica', tipo: 'Saída', qtd: 1, origem: 'Venda PDV #1002', tecnico: 'Gerente Guicell' }
    ]);

    const filteredProducts = computed(() => {
      if (!searchQuery.value) return products.value;
      const query = searchQuery.value.toLowerCase();
      return products.value.filter(p => 
        p.descricao.toLowerCase().includes(query) || 
        p.categoria.toLowerCase().includes(query)
      );
    });

    const sortedLogs = computed(() => {
      return [...movementLogs.value].sort((a, b) => b.id - a.id);
    });

    const closeModal = () => {
      showAddModal.value = false;
      editingId.value = null;
      form.value = { descricao: '', categoria: 'Tela', qtd: 5, min: 2, custo: 0, venda: 0 };
    };

    const submitProduct = () => {
      if (editingId.value) {
        const idx = products.value.findIndex(p => p.id === editingId.value);
        if (idx !== -1) {
          products.value[idx] = { 
            ...products.value[idx], 
            ...form.value,
            custo: parseFloat(form.value.custo),
            venda: parseFloat(form.value.venda)
          };
        }
      } else {
        const newProd = {
          id: Date.now(),
          ...form.value,
          custo: parseFloat(form.value.custo),
          venda: parseFloat(form.value.venda)
        };
        products.value.push(newProd);
        
        // Log entry
        movementLogs.value.unshift({
          id: Date.now(),
          data: new Date().toLocaleString('pt-BR'),
          produto: newProd.descricao,
          tipo: 'Entrada',
          qtd: newProd.qtd,
          origem: 'Cadastro Inicial',
          tecnico: 'Gerente Guicell'
        });
      }
      closeModal();
    };

    const editProduct = (prod) => {
      editingId.value = prod.id;
      form.value = { ...prod };
      showAddModal.value = true;
    };

    const submitEntry = () => {
      const prod = products.value.find(p => p.id === parseInt(entryForm.value.produtoId));
      if (prod) {
        prod.qtd += parseInt(entryForm.value.qtd);
        
        movementLogs.value.unshift({
          id: Date.now(),
          data: new Date().toLocaleString('pt-BR'),
          produto: prod.descricao,
          tipo: 'Entrada',
          qtd: parseInt(entryForm.value.qtd),
          origem: entryForm.value.origem,
          tecnico: 'Gerente Guicell'
        });

        showAddEntryModal.value = false;
        entryForm.value = { produtoId: '', qtd: 1, origem: '' };
      }
    };

    return {
      activeTab,
      searchQuery,
      showAddModal,
      showAddEntryModal,
      editingId,
      form,
      entryForm,
      products,
      filteredProducts,
      sortedLogs,
      closeModal,
      submitProduct,
      editProduct,
      submitEntry
    };
  }
});
</script>

<style scoped>
.estoque-view {
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

/* Tabs */
.tabs-container {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1px;
}

.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  padding: 12px 20px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 0;
  box-shadow: none !important;
  transform: none !important;
}

.tab-btn:hover {
  color: var(--text-white);
  background-color: rgba(255, 255, 255, 0.02);
}

.tab-btn.active {
  color: var(--primary-hover);
  border-bottom-color: var(--primary);
}

.filters-card {
  padding: 16px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
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

.block {
  display: block;
}

.select-control {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
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
</style>
