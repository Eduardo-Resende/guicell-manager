<template>
  <div class="os-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Ordens de Serviço</h1>
        <p class="page-subtitle">Gerencie o fluxo de reparo, orçamentos e garantias.</p>
      </div>
      <button class="btn" @click="showAddModal = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Nova OS</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="card filters-card">
      <div class="filters-grid">
        <div class="form-group m-0">
          <label>Filtro por Status</label>
          <select v-model="filterStatus" class="input-control select-control">
            <option value="">Todos os Status</option>
            <option value="Aguardando">Aguardando Diagnóstico</option>
            <option value="Em Reparo">Em Reparo</option>
            <option value="Aguardando Peça">Aguardando Peça</option>
            <option value="Concluído">Concluído</option>
            <option value="Entregue">Entregue</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div class="form-group m-0">
          <label>Técnico Responsável</label>
          <select v-model="filterTecnico" class="input-control select-control">
            <option value="">Todos os Técnicos</option>
            <option value="Sandro Gouvea">Sandro Gouvea</option>
            <option value="Eduardo Santana">Eduardo Santana</option>
          </select>
        </div>

        <div class="form-group m-0 search-group">
          <label>Buscar OS</label>
          <div class="input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por Nº OS ou Aparelho..." 
              class="input-control search-input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- OS Table -->
    <div class="card table-card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nº OS</th>
              <th>Cliente</th>
              <th>Aparelho</th>
              <th>Técnico</th>
              <th>Prazo</th>
              <th>Status</th>
              <th>Total</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="os in filteredOS" :key="os.id">
              <td class="font-bold text-white">#{{ os.numero }}</td>
              <td>{{ os.cliente }}</td>
              <td>{{ os.aparelho }}</td>
              <td>{{ os.tecnico }}</td>
              <td>{{ os.prazo }}</td>
              <td>
                <span :class="['badge', getBadgeClass(os.status)]">{{ os.status }}</span>
              </td>
              <td class="font-semibold text-white">{{ os.total }}</td>
              <td class="text-right">
                <button class="btn btn-secondary btn-xs mr-2" @click="viewDetail(os)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Detalhes</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredOS.length === 0">
              <td colspan="8" class="text-center text-muted py-6">Nenhuma Ordem de Serviço encontrada.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Nova OS -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content max-w-lg">
        <div class="modal-header">
          <h3>Abertura de Ordem de Serviço</h3>
          <button class="close-btn" @click="closeAddModal">&times;</button>
        </div>
        <form @submit.prevent="submitOS">
          <div class="modal-body">
            <!-- Client selection -->
            <div class="form-group">
              <label>Cliente *</label>
              <select v-model="form.clienteId" required class="input-control select-control">
                <option value="">Selecione o Cliente</option>
                <option v-for="c in mockClients" :key="c.id" :value="c.id">{{ c.nome }} ({{ c.telefone }})</option>
              </select>
            </div>

            <!-- Device specs -->
            <div class="grid grid-cols-3 gap-2">
              <div class="form-group">
                <label>Marca *</label>
                <input type="text" v-model="form.marca" required class="input-control" placeholder="Ex: Apple" />
              </div>
              <div class="form-group">
                <label>Modelo *</label>
                <input type="text" v-model="form.modelo" required class="input-control" placeholder="Ex: iPhone 13" />
              </div>
              <div class="form-group">
                <label>IMEI / Série</label>
                <input type="text" v-model="form.imei" class="input-control" placeholder="15 dígitos" />
              </div>
            </div>

            <!-- Defect / Notes -->
            <div class="form-group">
              <label>Defeito Relatado pelo Cliente *</label>
              <textarea v-model="form.defeito" required class="input-control text-area-control" rows="2" placeholder="Descreva os problemas reportados"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>Técnico Responsável</label>
                <select v-model="form.tecnico" class="input-control select-control">
                  <option value="Sandro Gouvea">Sandro Gouvea</option>
                  <option value="Eduardo Santana">Eduardo Santana</option>
                </select>
              </div>
              <div class="form-group">
                <label>Prazo Estimado</label>
                <input type="date" v-model="form.prazo" class="input-control" />
              </div>
            </div>

            <div class="form-group m-0">
              <label>Orçamento Inicial Estimado (Mão de Obra)</label>
              <input type="number" step="0.01" v-model="form.valorOrcado" class="input-control" placeholder="R$ 0,00" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAddModal">Cancelar</button>
            <button type="submit" class="btn">Abertura de OS</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Detalhe / Gestão da OS -->
    <div v-if="showDetailModal && selectedOS" class="modal-overlay">
      <div class="modal-content max-w-lg">
        <div class="modal-header">
          <div>
            <h3 class="m-0">OS #{{ selectedOS.numero }}</h3>
            <span :class="['badge', getBadgeClass(selectedOS.status), 'mt-1']">{{ selectedOS.status }}</span>
          </div>
          <button class="close-btn" @click="showDetailModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <!-- OS Info tabs -->
          <div class="info-block card mb-4">
            <h4 class="mb-2">Informações Operacionais</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Cliente:</strong> {{ selectedOS.cliente }}</div>
              <div><strong>Aparelho:</strong> {{ selectedOS.aparelho }}</div>
              <div><strong>Técnico:</strong> {{ selectedOS.tecnico }}</div>
              <div><strong>Prazo:</strong> {{ selectedOS.prazo }}</div>
            </div>
            <div class="text-sm mt-2">
              <strong>Defeito Relatado:</strong> {{ selectedOS.defeito }}
            </div>
          </div>

          <!-- Technical Notes -->
          <div class="form-group">
            <label>Diagnóstico Técnico / Observações</label>
            <textarea v-model="selectedOS.diagnostico" class="input-control text-area-control" rows="2" placeholder="Diagnóstico do técnico"></textarea>
          </div>

          <!-- Used Parts Section -->
          <div class="form-group mb-4">
            <label>Peças e Componentes Usados</label>
            <div class="parts-selector flex gap-2 mb-2">
              <select v-model="newPartId" class="input-control select-control flex-1">
                <option value="">Adicionar Peça do Estoque...</option>
                <option v-for="p in mockProducts" :key="p.id" :value="p.id">{{ p.descricao }} (Estoque: {{ p.qtd }} | {{ p.preco }})</option>
              </select>
              <button type="button" class="btn btn-secondary" @click="addPart">Adicionar</button>
            </div>
            <div class="table-responsive select-parts-table" v-if="selectedOS.parts && selectedOS.parts.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Peça</th>
                    <th>Valor</th>
                    <th class="text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(part, index) in selectedOS.parts" :key="index">
                    <td>{{ part.descricao }}</td>
                    <td>R$ {{ part.preco.toFixed(2) }}</td>
                    <td class="text-right">
                      <a href="#" class="text-danger" @click.prevent="removePart(index)">Remover</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Total Cost -->
          <div class="flex justify-between items-center bg-dark p-3 rounded mb-4 border-style">
            <div>
              <span class="text-muted text-xs">MÃO DE OBRA:</span>
              <div class="font-bold text-white">R$ {{ selectedOS.maoObra.toFixed(2) }}</div>
            </div>
            <div>
              <span class="text-muted text-xs">PEÇAS:</span>
              <div class="font-bold text-white">R$ {{ selectedOS.partsTotal.toFixed(2) }}</div>
            </div>
            <div class="text-right">
              <span class="text-muted text-xs">VALOR FINAL:</span>
              <div class="font-bold text-success text-lg">R$ {{ (selectedOS.maoObra + selectedOS.partsTotal).toFixed(2) }}</div>
            </div>
          </div>

          <!-- Action controls inside OS -->
          <div class="grid grid-cols-2 gap-3">
            <div class="form-group m-0">
              <label>Atualizar Status</label>
              <select v-model="selectedOS.status" class="input-control select-control">
                <option value="Aguardando">Aguardando Diagnóstico</option>
                <option value="Em Reparo">Em Reparo</option>
                <option value="Aguardando Peça">Aguardando Peça</option>
                <option value="Concluído">Concluído</option>
                <option value="Entregue">Entregue</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div class="form-group m-0">
              <label>Forma de Pagamento (para Fechamento)</label>
              <select v-model="selectedOS.formaPagamento" class="input-control select-control" :disabled="selectedOS.status !== 'Entregue'">
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão de Crédito/Débito</option>
                <option value="PIX">PIX</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="imprimirComprovante(selectedOS)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Imprimir</span>
          </button>
          <button type="button" class="btn btn-secondary" @click="showDetailModal = false">Cancelar</button>
          <button type="button" class="btn" @click="saveOSChanges">Salvar Alterações</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'OsView',
  setup() {
    const searchQuery = ref('');
    const filterStatus = ref('');
    const filterTecnico = ref('');
    const showAddModal = ref(false);
    const showDetailModal = ref(false);
    const selectedOS = ref(null);
    const newPartId = ref('');

    const form = ref({
      clienteId: '',
      marca: '',
      modelo: '',
      imei: '',
      defeito: '',
      tecnico: 'Sandro Gouvea',
      prazo: '2026-06-15',
      valorOrcado: 120.00
    });

    const mockClients = [
      { id: 1, nome: 'Eduardo Santana', telefone: '(62) 98112-4455' },
      { id: 2, nome: 'Mariana Costa', telefone: '(62) 99221-5060' },
      { id: 3, nome: 'Carlos Roberto', telefone: '(62) 98554-1020' },
      { id: 4, nome: 'Julia Almeida', telefone: '(62) 99182-3344' },
      { id: 5, nome: 'Ricardo Alves', telefone: '(62) 98234-8899' }
    ];

    const mockProducts = [
      { id: 1, descricao: 'Tela Frontal iPhone 13 OLED', preco: 650.00, qtd: 4 },
      { id: 2, descricao: 'Bateria Compatível S22', preco: 180.00, qtd: 2 },
      { id: 3, descricao: 'Conector de Carga Tipo C', preco: 45.00, qtd: 15 },
      { id: 4, descricao: 'Câmera Traseira iPhone 11', preco: 320.00, qtd: 1 }
    ];

    const ordens = ref([
      { id: 1, numero: '2026-0014', cliente: 'Eduardo Santana', aparelho: 'iPhone 13', tecnico: 'Eduardo Santana', defeito: 'Tela Quebrada', status: 'Em Reparo', prazo: '12/06/2026', total: 'R$ 850,00', maoObra: 200.00, partsTotal: 650.00, parts: [{ id: 1, descricao: 'Tela Frontal iPhone 13 OLED', preco: 650.00 }], diagnostico: 'Dispositivo desmontado para análise, tela oled original danificada. Aguardando finalização da substituição.', formaPagamento: 'PIX' },
      { id: 2, numero: '2026-0013', cliente: 'Mariana Costa', aparelho: 'Samsung Galaxy S22', tecnico: 'Sandro Gouvea', defeito: 'Bateria inchada, descarregando rápido', status: 'Aguardando', prazo: '13/06/2026', total: 'R$ 300,00', maoObra: 120.00, partsTotal: 180.00, parts: [{ id: 2, descricao: 'Bateria Compatível S22', preco: 180.00 }], diagnostico: 'Aguardando aprovação do orçamento de bateria original pelo cliente.', formaPagamento: 'Dinheiro' },
      { id: 3, numero: '2026-0012', cliente: 'Carlos Roberto', aparelho: 'Motorola G200', tecnico: 'Sandro Gouvea', defeito: 'Conector de carga quebrado, não reconhece cabo', status: 'Concluído', prazo: '10/06/2026', total: 'R$ 145,00', maoObra: 100.00, partsTotal: 45.00, parts: [{ id: 3, descricao: 'Conector de Carga Tipo C', preco: 45.00 }], diagnostico: 'Conector substituído e soldado com sucesso. Passou no teste de estresse de carga. Pronto para entrega.', formaPagamento: 'Cartão' },
      { id: 4, numero: '2026-0011', cliente: 'Julia Almeida', aparelho: 'iPhone 11', tecnico: 'Eduardo Santana', defeito: 'Câmera traseira trincada, imagem borrada', status: 'Aguardando Peça', prazo: '18/06/2026', total: 'R$ 470,00', maoObra: 150.00, partsTotal: 320.00, parts: [{ id: 4, descricao: 'Câmera Traseira iPhone 11', preco: 320.00 }], diagnostico: 'Aguardando chegada da câmera de reposição do distribuidor local.', formaPagamento: 'PIX' },
      { id: 5, numero: '2026-0010', cliente: 'Ricardo Alves', aparelho: 'Xiaomi Poco X3', tecnico: 'Sandro Gouvea', defeito: 'Não liga, não dá sinal de carga', status: 'Cancelado', prazo: '09/06/2026', total: 'R$ 0,00', maoObra: 0.00, partsTotal: 0.00, parts: [], diagnostico: 'Placa-mãe do dispositivo em curto-circuito geral. Reparo inviável comercialmente. Cliente recusou orçamento.', formaPagamento: 'PIX' }
    ]);

    const filteredOS = computed(() => {
      return ordens.value.filter(os => {
        const matchesStatus = !filterStatus.value || os.status === filterStatus.value;
        const matchesTecnico = !filterTecnico.value || os.tecnico === filterTecnico.value;
        
        let matchesSearch = true;
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          matchesSearch = os.numero.toLowerCase().includes(query) || 
                          os.aparelho.toLowerCase().includes(query) || 
                          os.cliente.toLowerCase().includes(query);
        }
        
        return matchesStatus && matchesTecnico && matchesSearch;
      });
    });

    const getBadgeClass = (status) => {
      switch (status) {
        case 'Aguardando': return 'badge-warning';
        case 'Em Reparo': return 'badge-info';
        case 'Aguardando Peça': return 'badge-danger';
        case 'Concluído': return 'badge-success';
        case 'Entregue': return 'badge-success';
        case 'Cancelado': return 'badge-muted';
        default: return 'badge-muted';
      }
    };

    const closeAddModal = () => {
      showAddModal.value = false;
      form.value = {
        clienteId: '',
        marca: '',
        modelo: '',
        imei: '',
        defeito: '',
        tecnico: 'Sandro Gouvea',
        prazo: '2026-06-15',
        valorOrcado: 120.00
      };
    };

    const submitOS = () => {
      const client = mockClients.find(c => c.id === parseInt(form.value.clienteId));
      if (!client) return;

      const numSeq = ordens.value.length + 10;
      
      ordens.value.unshift({
        id: Date.now(),
        numero: `2026-00${numSeq}`,
        cliente: client.nome,
        aparelho: `${form.value.marca} ${form.value.modelo}`,
        tecnico: form.value.tecnico,
        defeito: form.value.defeito,
        status: 'Aguardando',
        prazo: new Date(form.value.prazo).toLocaleDateString('pt-BR'),
        total: `R$ ${form.value.valorOrcado.toFixed(2)}`,
        maoObra: parseFloat(form.value.valorOrcado),
        partsTotal: 0,
        parts: [],
        diagnostico: '',
        formaPagamento: 'PIX'
      });

      closeAddModal();
    };

    const viewDetail = (os) => {
      selectedOS.value = { ...os };
      showDetailModal.value = true;
    };

    const addPart = () => {
      if (!newPartId.value) return;
      const part = mockProducts.find(p => p.id === parseInt(newPartId.value));
      if (part) {
        if (!selectedOS.value.parts) selectedOS.value.parts = [];
        selectedOS.value.parts.push({
          id: part.id,
          descricao: part.descricao,
          preco: part.preco
        });
        selectedOS.value.partsTotal += part.preco;
        newPartId.value = '';
      }
    };

    const removePart = (index) => {
      const part = selectedOS.value.parts[index];
      selectedOS.value.partsTotal -= part.preco;
      selectedOS.value.parts.splice(index, 1);
    };

    const saveOSChanges = () => {
      const idx = ordens.value.findIndex(o => o.id === selectedOS.value.id);
      if (idx !== -1) {
        const grandTotal = selectedOS.value.maoObra + selectedOS.value.partsTotal;
        selectedOS.value.total = `R$ ${grandTotal.toFixed(2)}`;
        
        ordens.value[idx] = { ...selectedOS.value };
      }
      showDetailModal.value = false;
    };

    const imprimirComprovante = (os) => {
      alert(`Simulação de Impressão de Comprovante da OS #${os.numero} gerada com sucesso.`);
    };

    return {
      searchQuery,
      filterStatus,
      filterTecnico,
      showAddModal,
      showDetailModal,
      selectedOS,
      newPartId,
      form,
      mockClients,
      mockProducts,
      filteredOS,
      getBadgeClass,
      closeAddModal,
      submitOS,
      viewDetail,
      addPart,
      removePart,
      saveOSChanges,
      imprimirComprovante
    };
  }
});
</script>

<style scoped>
.os-view {
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

.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: flex-end;
}

.select-control {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
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

.btn-xs {
  padding: 6px 12px;
  font-size: 0.75rem;
  border-radius: 6px;
}

.action-icon {
  width: 14px;
  height: 14px;
}

.text-area-control {
  resize: vertical;
}

.max-w-lg {
  max-width: 600px;
}

.info-block {
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.01);
}

.select-parts-table {
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-top: 8px;
}

.select-parts-table th, .select-parts-table td {
  padding: 10px 14px;
}

.border-style {
  border: 1px solid var(--border);
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
