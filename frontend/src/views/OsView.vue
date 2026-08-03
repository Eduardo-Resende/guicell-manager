<template>
  <div class="os-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Ordens de Serviço</h1>
        <p class="page-subtitle">Gerencie o fluxo de reparo, orçamentos e garantias.</p>
      </div>
      <div class="flex gap-2 items-center">
        <!-- Toggle de visualização -->
        <div class="view-toggle">
          <button :class="['toggle-btn', { active: viewMode === 'lista' }]" @click="viewMode = 'lista'" title="Visualização em Lista">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          <button :class="['toggle-btn', { active: viewMode === 'kanban' }]" @click="viewMode = 'kanban'" title="Visualização Kanban">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
              <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/><rect x="14" y="17" width="7" height="4" rx="1"/>
            </svg>
          </button>
        </div>
        <button class="btn" @click="showAddModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nova OS</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card filters-card">
      <div class="filters-grid">
        <div class="form-group m-0">
          <label>Filtro por Status</label>
          <select v-model="filterStatus" class="input-control select-control">
            <option value="">Todos os Status</option>
            <option value="Aguardando Diagnóstico">Aguardando Diagnóstico</option>
            <option value="Aguardando Cliente">Aguardando Cliente</option>
            <option value="Aguardando Peça">Aguardando Peça</option>
            <option value="Em Reparo">Em Reparo</option>
            <option value="Concluído">Concluído</option>
            <option value="Entregue">Entregue</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div class="form-group m-0">
          <label>Técnico Responsável</label>
          <select v-model="filterTecnico" class="input-control select-control">
            <option value="">Todos os Técnicos</option>
            <option v-for="t in tecnicos" :key="t.id_usuario" :value="t.id_usuario">{{ t.nome }}</option>
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

    <!-- ======================== VISUALIZAÇÃO LISTA ======================== -->
    <div v-if="viewMode === 'lista'" class="card table-card">
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

    <!-- ======================== VISUALIZAÇÃO KANBAN ======================== -->
    <div v-if="viewMode === 'kanban'" class="kanban-board">
      <div
        v-for="col in kanbanColumns"
        :key="col.status"
        class="kanban-col"
        @dragover.prevent
        @drop="onDrop($event, col.status)"
      >
        <div class="kanban-col-header" :style="{ borderTopColor: col.color }">
          <span class="kanban-col-title">{{ col.label }}</span>
          <span class="kanban-col-count">{{ osForStatus(col.status).length }}</span>
        </div>
        <div class="kanban-col-body">
          <div
            v-for="os in osForStatus(col.status)"
            :key="os.id"
            class="kanban-card"
            :class="{ 'kanban-card--overdue': isOverdue(os) }"
            draggable="true"
            @dragstart="onDragStart($event, os)"
            @click="viewDetail(os)"
          >
            <div class="kanban-card-top">
              <span class="kanban-card-num">#{{ os.numero }}</span>
              <span v-if="isOverdue(os)" class="kanban-tag kanban-tag--late">Atrasada</span>
            </div>
            <div class="kanban-card-cliente">{{ os.cliente }}</div>
            <div class="kanban-card-aparelho">{{ os.aparelho }}</div>
            <div class="kanban-card-footer">
              <span class="kanban-card-tecnico">{{ os.tecnico }}</span>
              <span class="kanban-card-prazo" v-if="os.prazo !== 'Não definido'">{{ os.prazo }}</span>
            </div>
            <div class="kanban-card-valor">{{ os.total }}</div>
          </div>
          <div v-if="osForStatus(col.status).length === 0" class="kanban-col-empty">
            Nenhuma OS
          </div>
        </div>
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
                <option v-for="c in mockClients" :key="c.id_cliente" :value="c.id_cliente">{{ c.nome }} ({{ c.telefone }})</option>
              </select>
            </div>

            <!-- Device selection -->
            <div class="form-group">
              <label>Aparelho para Reparo *</label>
              <div v-if="!form.clienteId" class="aparelho-hint text-muted text-xs">
                Selecione um cliente para ver os aparelhos disponíveis.
              </div>
              <div v-else-if="clientDevices.length === 0" class="aparelho-hint aparelho-hint-warn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Este cliente não tem aparelhos ativos cadastrados. Cadastre um na tela de <strong>Clientes → Aparelhos</strong>.</span>
              </div>
              <select v-else v-model="selectedDeviceOption" required class="input-control select-control">
                <option value="">Selecione o Aparelho</option>
                <option v-for="dev in clientDevices" :key="dev.id_aparelho" :value="dev.id_aparelho">
                  {{ dev.marca }} {{ dev.modelo }}{{ dev.imei ? ` (IMEI: ${dev.imei})` : '' }}
                </option>
              </select>
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
                  <option value="">Nenhum (Deixar em Aberto)</option>
                  <option v-for="t in tecnicos" :key="t.id_usuario" :value="t.id_usuario">{{ t.nome }}</option>
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
          <!-- Banner: OS finalizada (somente leitura) -->
          <div v-if="isClosed" class="closed-banner mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="closed-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>OS com status <strong>{{ selectedOS.originalStatus }}</strong> — somente leitura. Não é possível editar uma OS já finalizada.</span>
          </div>

          <!-- Informações Operacionais (Design Aprimorado) -->
          <div class="os-info-container mb-4">
            <div class="os-info-header">
              <span class="os-info-title">Informações Operacionais</span>
            </div>
            
            <div class="os-info-grid">
              <div class="os-info-card">
                <div class="os-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div class="os-info-data">
                  <span class="os-info-label">Cliente</span>
                  <span class="os-info-val font-semibold">{{ selectedOS.cliente }}</span>
                </div>
              </div>

              <div class="os-info-card">
                <div class="os-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </div>
                <div class="os-info-data">
                  <span class="os-info-label">Aparelho</span>
                  <span class="os-info-val font-semibold">{{ selectedOS.aparelho }}</span>
                </div>
              </div>

              <div class="os-info-card">
                <div class="os-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <div class="os-info-data">
                  <span class="os-info-label">Técnico Responsável</span>
                  <span class="os-info-val">{{ selectedOS.tecnico }}</span>
                </div>
              </div>

              <div class="os-info-card">
                <div class="os-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div class="os-info-data">
                  <span class="os-info-label">Prazo Estimado</span>
                  <span class="os-info-val">{{ selectedOS.prazo }}</span>
                </div>
              </div>
            </div>

            <!-- Defeito Relatado -->
            <div class="os-defeito-card mt-3">
              <div class="os-defeito-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:#f59e0b"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Defeito Relatado pelo Cliente</span>
              </div>
              <p class="os-defeito-text" v-if="selectedOS.defeito">{{ selectedOS.defeito }}</p>
              <p class="os-defeito-text text-muted italic" v-else>Nenhum defeito relatado cadastrado.</p>
            </div>
          </div>

          <!-- Technical Notes -->
          <div class="form-group">
            <label>Diagnóstico Técnico / Observações</label>
            <textarea v-model="selectedOS.diagnostico" class="input-control text-area-control" rows="2" placeholder="Diagnóstico do técnico"></textarea>
          </div>

          <!-- Used Parts Section -->
          <div class="parts-section mb-4">
            <div class="parts-header">
              <span class="parts-title">Peças e Componentes</span>
              <div class="parts-add-row" v-if="!isClosed">
                <select v-model="newPartId" class="input-control select-control parts-select">
                  <option value="">+ Adicionar peça do estoque...</option>
                  <option v-for="p in mockProducts" :key="p.id_produto" :value="p.id_produto">
                    {{ p.descricao }} — R$ {{ parseFloat(p.valor_venda).toFixed(2) }} (Estoque: {{ p.estoque_atual }})
                  </option>
                </select>
                <button type="button" class="btn btn-sm btn-compra" @click="addPart" :disabled="!newPartId">Adicionar</button>
              </div>
            </div>

            <div v-if="selectedOS.parts && selectedOS.parts.length > 0" class="parts-table-wrap">
              <table class="parts-table">
                <thead>
                  <tr>
                    <th>Peça</th>
                    <th class="text-center" style="width:70px">Qtd</th>
                    <th class="text-right" style="width:100px">Unitário</th>
                    <th class="text-right" style="width:100px">Subtotal</th>
                    <th v-if="!isClosed" style="width:60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(part, index) in selectedOS.parts" :key="index">
                    <td class="part-name">{{ part.descricao }}</td>
                    <td class="text-center">
                      <input
                        v-if="!isClosed"
                        type="number"
                        v-model.number="part.qtd"
                        min="1"
                        @change="recalcParts"
                        class="qty-input"
                      />
                      <span v-else>{{ part.qtd }}</span>
                    </td>
                    <td class="text-right">R$ {{ part.preco.toFixed(2) }}</td>
                    <td class="text-right font-bold">R$ {{ (part.preco * (part.qtd || 1)).toFixed(2) }}</td>
                    <td v-if="!isClosed" class="text-center">
                      <button type="button" class="remove-part-btn" @click="removePart(index)" title="Remover">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="parts-empty">Nenhuma peça adicionada.</div>
          </div>

          <!-- Totais -->
          <div class="totais-grid mb-4">
            <div class="totais-row">
              <div class="totais-item">
                <span class="totais-label">Mão de Obra</span>
                <input type="number" step="0.01" v-model.number="selectedOS.maoObra" class="totais-input" :disabled="isClosed" />
              </div>
              <div class="totais-item">
                <span class="totais-label">Peças</span>
                <span class="totais-value">R$ {{ selectedOS.partsTotal.toFixed(2) }}</span>
              </div>
              <div class="totais-item">
                <span class="totais-label">Desconto</span>
                <input type="number" step="0.01" v-model.number="selectedOS.desconto" min="0" class="totais-input" :disabled="isClosed" />
              </div>
              <div class="totais-item totais-total">
                <span class="totais-label">TOTAL FINAL</span>
                <span class="totais-value-big">R$ {{ valorFinal.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Action controls inside OS -->
          <div class="grid grid-cols-2 gap-3">
            <div class="form-group m-0">
              <label>Atualizar Status</label>
              <select v-model="selectedOS.status" class="input-control select-control" :disabled="isClosed">
                <option value="Aguardando Diagnóstico">Aguardando Diagnóstico</option>
                <option value="Aguardando Cliente">Aguardando Cliente</option>
                <option value="Aguardando Peça">Aguardando Peça</option>
                <option value="Em Reparo">Em Reparo</option>
                <option value="Concluído">Concluído</option>
                <option value="Entregue">Entregue</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div class="form-group m-0" v-if="['Concluído', 'Entregue'].includes(selectedOS.status)">
              <label>Forma de Pagamento *</label>
              <select v-model="selectedOS.formaPagamento" class="input-control select-control" :disabled="isClosed">
                <option value="">Selecione a Forma de Pagamento...</option>
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
          <button type="button" class="btn btn-secondary" @click="showDetailModal = false">{{ isClosed ? 'Fechar' : 'Cancelar' }}</button>
          <button v-if="!isClosed" type="button" class="btn" @click="saveOSChanges">Salvar Alterações</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Visualizador de OS (tela cheia) ── -->
  <OsViewer
    v-if="showViewer && osParaViewer"
    :os="osParaViewer"
    @close="showViewer = false"
  />
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { osService, clientesService, produtosService, usuariosService, aparelhosService } from '../services/index.js';
import OsViewer from '../components/OsViewer.vue';

export default defineComponent({
  name: 'OsView',
  components: { OsViewer },
  setup() {
    const searchQuery = ref('');
    const filterStatus = ref('');
    const filterTecnico = ref('');
    const showAddModal = ref(false);
    const showDetailModal = ref(false);
    const selectedOS = ref(null);
    const newPartId = ref('');
    const viewMode = ref('lista'); // 'lista' | 'kanban'
    const draggedOS = ref(null);

    // Visualizador de OS
    const showViewer = ref(false);
    const osParaViewer = ref(null);

    const ordens = ref([]);
    const mockClients = ref([]);
    const mockProducts = ref([]);
    const tecnicos = ref([]);
    const originalParts = ref([]);

    // Computed: OS já finalizada (Entregue ou Cancelada) — bloqueia toda edição no modal
    const isClosed = computed(() => {
      if (!selectedOS.value) return false;
      return ['Entregue', 'Cancelado'].includes(selectedOS.value.originalStatus);
    });

    const form = ref({
      clienteId: '',
      defeito: '',
      tecnico: '',
      prazo: '',
      valorOrcado: 120.00
    });

    const clientDevices = ref([]);
    const selectedDeviceOption = ref('');

    watch(() => form.value.clienteId, async (newVal) => {
      selectedDeviceOption.value = '';
      if (newVal) {
        try {
          const list = await aparelhosService.listarAtivosParaOS(newVal);
          clientDevices.value = list;
          // Pré-seleciona se só houver um
          if (list.length === 1) selectedDeviceOption.value = list[0].id_aparelho;
        } catch (err) {
          console.error('Erro ao buscar aparelhos do cliente:', err);
          clientDevices.value = [];
        }
      } else {
        clientDevices.value = [];
      }
    });

    const fetchOS = async () => {
      try {
        const filtros = {};
        if (filterStatus.value) filtros.status = filterStatus.value;
        if (filterTecnico.value) filtros.id_tecnico = filterTecnico.value;
        if (searchQuery.value) filtros.busca = searchQuery.value;
        const data = await osService.listar(filtros);
        ordens.value = data.map(os => {
          const partsTotal = (os.itens || []).reduce((sum, it) => sum + parseFloat(it.valor_unitario) * it.quantidade, 0);
          const totalVal = os.status === 'Entregue' ? parseFloat(os.valor_final) : (parseFloat(os.valor_orcado || 0) + partsTotal);
          return {
            id: os.id_os,
            numero: os.numero_os,
            cliente: os.cliente?.nome || 'N/A',
            aparelho: `${os.aparelho?.marca} ${os.aparelho?.modelo}`,
            tecnico: os.tecnico?.nome || 'Não atribuído',
            prazo: os.prazo_estimado ? new Date(os.prazo_estimado + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não definido',
            status: os.status,
            total: `R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            maoObra: parseFloat(os.valor_orcado || 0),
            partsTotal: partsTotal,
            parts: (os.itens || []).map(it => ({
              id: it.id_produto,
              descricao: it.produto?.descricao || 'Produto/Peça',
              preco: parseFloat(it.valor_unitario)
            })),
            defeito: os.defeito_relatado || os.defeito || '',
            diagnostico: os.diagnostico || '',
            formaPagamento: os.forma_pagamento || '',
            id_cliente: os.id_cliente,
            id_aparelho: os.id_aparelho,
            id_tecnico: os.id_tecnico,
            id_os: os.id_os
          };
        });
      } catch (err) {
        console.error('Erro ao buscar ordens de serviço:', err);
      }
    };

    const loadFormDependencies = async () => {
      try {
        const [cList, pList, tList] = await Promise.all([
          clientesService.listar(),
          produtosService.listar({ tipo_uso: 'OS' }),
          usuariosService.tecnicos()
        ]);
        mockClients.value = cList;
        mockProducts.value = pList;
        tecnicos.value = tList;
      } catch (err) {
        console.error('Erro ao carregar dependências do formulário:', err);
      }
    };

    const closeAddModal = () => {
      showAddModal.value = false;
      selectedDeviceOption.value = '';
      clientDevices.value = [];
      form.value = {
        clienteId: '',
        defeito: '',
        tecnico: '',
        prazo: '',
        valorOrcado: 120.00
      };
    };

    const submitOS = async () => {
      if (!form.value.clienteId || !selectedDeviceOption.value || !form.value.defeito) {
        alert('Por favor, selecione o cliente, o aparelho e descreva o defeito.');
        return;
      }

      try {
        await osService.criar({
          id_cliente: form.value.clienteId,
          id_aparelho: parseInt(selectedDeviceOption.value),
          id_tecnico: form.value.tecnico || null,
          defeito_relatado: form.value.defeito,
          valor_orcado: form.value.valorOrcado,
          prazo_estimado: form.value.prazo || null
        });

        await fetchOS();
        closeAddModal();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao abrir ordem de serviço.');
      }
    };

    const viewDetail = async (os) => {
      try {
        // Carrega dados completos da OS (incluindo itens/peças)
        const detailedOS = await osService.buscarPorId(os.id_os);
        selectedOS.value = {
          ...os,
          status: detailedOS.status || os.status,
          originalStatus: detailedOS.status || os.status,
          defeito: detailedOS.defeito_relatado || os.defeito || '',
          maoObra: parseFloat(detailedOS.valor_orcado || os.maoObra || 0),
          desconto: parseFloat(detailedOS.desconto || 0),
          formaPagamento: detailedOS.forma_pagamento || os.formaPagamento || '',
          diagnostico: detailedOS.diagnostico || '',
          parts: (detailedOS.itens || []).map(it => ({
            id: it.id_produto,
            descricao: it.produto?.descricao || 'Produto/Peça',
            preco: parseFloat(it.valor_unitario),
            qtd: it.quantidade || 1
          })),
          partsTotal: (detailedOS.itens || []).reduce((sum, it) => sum + parseFloat(it.valor_unitario) * (it.quantidade || 1), 0),
          // Dados extras para o visualizador/impressão
          imei: detailedOS.aparelho?.imei || '',
          email_cliente: detailedOS.cliente?.email || '',
          telefone_cliente: detailedOS.cliente?.telefone || '',
          cpf_cnpj_cliente: detailedOS.cliente?.cpf_cnpj || '',
          data_abertura_raw: detailedOS.data_abertura || new Date().toISOString(),
        };
        originalParts.value = [...selectedOS.value.parts];
        showDetailModal.value = true;
      } catch (err) {
        alert('Erro ao carregar detalhes da ordem de serviço.');
      }
    };

    const addPart = () => {
      if (!newPartId.value) return;
      const part = mockProducts.value.find(p => p.id_produto === parseInt(newPartId.value));
      if (part) {
        if (!selectedOS.value.parts) selectedOS.value.parts = [];
        selectedOS.value.parts.push({
          id: part.id_produto,
          descricao: part.descricao,
          preco: parseFloat(part.valor_venda),
          qtd: 1
        });
        recalcParts();
        newPartId.value = '';
      }
    };

    const recalcParts = () => {
      if (!selectedOS.value) return;
      selectedOS.value.partsTotal = selectedOS.value.parts.reduce(
        (sum, p) => sum + p.preco * (p.qtd || 1), 0
      );
    };

    const removePart = (index) => {
      selectedOS.value.parts.splice(index, 1);
      recalcParts();
    };

    const valorFinal = computed(() => {
      if (!selectedOS.value) return 0;
      const total = (selectedOS.value.maoObra || 0) + (selectedOS.value.partsTotal || 0);
      const desconto = selectedOS.value.desconto || 0;
      return Math.max(0, total - desconto);
    });

    const saveOSChanges = async () => {
      if (isClosed.value) {
        alert('Esta OS já está finalizada e não pode ser alterada.');
        return;
      }

      if (['Concluído', 'Entregue'].includes(selectedOS.value.status) && !selectedOS.value.formaPagamento) {
        alert('Por favor, selecione a Forma de Pagamento.');
        return;
      }

      try {
        const id = selectedOS.value.id_os;
        const desconto = selectedOS.value.desconto || 0;
        const total = valorFinal.value;
        
        // Se mudou o status para 'Entregue', realiza o fluxo de fechamento/faturamento
        if (selectedOS.value.status === 'Entregue') {
          await osService.fechar(id, {
            valor_final: total,
            forma_pagamento: selectedOS.value.formaPagamento,
            itens: selectedOS.value.parts.map(p => ({
              id_produto: p.id,
              quantidade: p.qtd || 1,
              valor_unitario: p.preco
            }))
          });
        } else {
          // Atualiza status, diagnóstico técnico e a lista de peças/itens
          await osService.atualizarStatus(
            id,
            selectedOS.value.status,
            selectedOS.value.diagnostico,
            selectedOS.value.parts.map(p => ({
              id_produto: p.id,
              quantidade: p.qtd || 1,
              valor_unitario: p.preco
            })),
            selectedOS.value.maoObra,
            selectedOS.value.formaPagamento
          );
        }

        // Registrar logs de movimentações em localStorage
        const storedLogs = localStorage.getItem('guicell_movement_logs');
        const logs = storedLogs ? JSON.parse(storedLogs) : [];
        const userObj = JSON.parse(localStorage.getItem('guicell_usuario') || 'null');
        const tecnicoNome = userObj ? userObj.nome : 'Operador';

        // 1. Contar quantidades originais
        const originalCounts = {};
        originalParts.value.forEach(p => {
          originalCounts[p.id] = (originalCounts[p.id] || 0) + 1;
        });

        // 2. Contar quantidades novas
        const newCounts = {};
        selectedOS.value.parts.forEach(p => {
          newCounts[p.id] = (newCounts[p.id] || 0) + 1;
        });

        // 3. Gerar logs baseados na diferença
        const allIds = new Set([...Object.keys(originalCounts), ...Object.keys(newCounts)]);
        let logsUpdated = false;

        allIds.forEach(idStr => {
          const id = parseInt(idStr);
          const oldQtd = originalCounts[id] || 0;
          const newQtd = newCounts[id] || 0;
          const diff = newQtd - oldQtd;

          if (diff !== 0) {
            const prodDesc = selectedOS.value.parts.find(p => p.id === id)?.descricao || originalParts.value.find(p => p.id === id)?.descricao || 'Peça Desconhecida';
            
            logs.unshift({
              id: Date.now() + Math.random(),
              data: new Date().toLocaleString('pt-BR'),
              produto: prodDesc,
              tipo: diff > 0 ? 'Saída' : 'Entrada',
              qtd: Math.abs(diff),
              origem: diff > 0 ? `OS #${selectedOS.value.numero}` : `OS #${selectedOS.value.numero} (Removido)`,
              tecnico: tecnicoNome
            });
            logsUpdated = true;
          }
        });

        if (logsUpdated) {
          localStorage.setItem('guicell_movement_logs', JSON.stringify(logs));
        }

        await fetchOS();
        showDetailModal.value = false;
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao salvar alterações da OS.');
      }
    };

    const imprimirComprovante = (os) => {
      osParaViewer.value = os;
      showViewer.value = true;
    };

    const getBadgeClass = (status) => {
      switch (status) {
        case 'Aguardando Diagnóstico': return 'badge-warning';
        case 'Aguardando Cliente': return 'badge-purple';
        case 'Em Reparo': return 'badge-info';
        case 'Aguardando Peça': return 'badge-danger';
        case 'Concluído': return 'badge-success';
        case 'Entregue': return 'badge-success';
        case 'Cancelado': return 'badge-muted';
        default: return 'badge-muted';
      }
    };

    // ── Kanban ──────────────────────────────────────────────────────────────────
    const kanbanColumns = [
      { status: 'Aguardando Diagnóstico', label: 'Aguardando Diagnóstico', color: '#f4a429' },
      { status: 'Aguardando Cliente',     label: 'Aguardando Cliente',     color: '#a78bfa' },
      { status: 'Aguardando Peça',        label: 'Aguardando Peça',        color: '#f87171' },
      { status: 'Em Reparo',              label: 'Em Reparo',              color: '#38bdf8' },
      { status: 'Concluído',              label: 'Concluído',              color: '#4ade80' },
      { status: 'Entregue',               label: 'Entregue',               color: '#22c55e' },
      { status: 'Cancelado',              label: 'Cancelado',              color: '#6b7280' },
    ];

    const osForStatus = (status) => ordens.value.filter(os => os.status === status);

    const isOverdue = (os) => {
      if (!os.prazo || os.prazo === 'Não definido') return false;
      const parts = os.prazo.split('/');
      if (parts.length !== 3) return false;
      const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      return date < new Date();
    };

    const onDragStart = (event, os) => {
      draggedOS.value = os;
      event.dataTransfer.effectAllowed = 'move';
    };

    const onDrop = async (event, newStatus) => {
      if (!draggedOS.value || draggedOS.value.status === newStatus) return;
      if (['Entregue', 'Cancelado'].includes(draggedOS.value.status)) {
        alert('Não é possível mover uma OS já finalizada.');
        draggedOS.value = null;
        return;
      }

      const targetOS = draggedOS.value;
      draggedOS.value = null;

      if (['Concluído', 'Entregue'].includes(newStatus)) {
        await viewDetail(targetOS);
        if (selectedOS.value) {
          selectedOS.value.status = newStatus;
        }
      } else {
        try {
          await osService.atualizarStatus(
            targetOS.id_os,
            newStatus,
            targetOS.diagnostico,
            targetOS.parts.map(p => ({ id_produto: p.id, quantidade: p.qtd || 1, valor_unitario: p.preco })),
            targetOS.maoObra
          );
          await fetchOS();
        } catch (err) {
          alert('Erro ao mover OS: ' + (err.response?.data?.error || err.message));
        }
      }
    };

    watch([filterStatus, filterTecnico, searchQuery], () => {
      fetchOS();
    });

    onMounted(() => {
      fetchOS();
      loadFormDependencies();
    });

    return {
      searchQuery,
      filterStatus,
      filterTecnico,
      showAddModal,
      showDetailModal,
      selectedOS,
      newPartId,
      viewMode,
      form,
      mockClients,
      mockProducts,
      tecnicos,
      ordens,
      filteredOS: ordens,
      getBadgeClass,
      closeAddModal,
      submitOS,
      viewDetail,
      addPart,
      removePart,
      saveOSChanges,
      imprimirComprovante,
      fetchOS,
      clientDevices,
      selectedDeviceOption,
      valorFinal,
      recalcParts,
      isClosed,
      kanbanColumns,
      osForStatus,
      isOverdue,
      onDragStart,
      onDrop,
      showViewer,
      osParaViewer,
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

/* Informações Operacionais (Novo Design) */
.os-info-container {
  background: var(--bg-card, #0f1322);
  border: 1px solid var(--border, #1e293b);
  border-radius: 12px;
  padding: 16px;
}

.os-info-header {
  margin-bottom: 12px;
}

.os-info-title {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted, #8892b0);
}

.os-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.os-info-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px 12px;
}

.os-info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 143, 57, 0.12);
  color: var(--primary-hover, #00aa44);
  flex-shrink: 0;
}

.os-info-data {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.os-info-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted, #8892b0);
  font-weight: 600;
}

.os-info-val {
  font-size: 0.88rem;
  color: var(--text-white, #ffffff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Defeito Relatado Card */
.os-defeito-card {
  background: rgba(245, 158, 11, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.os-defeito-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #f59e0b;
  margin-bottom: 6px;
}

.os-defeito-text {
  font-size: 0.875rem;
  color: var(--text-normal, #e2e8f0);
  line-height: 1.5;
  margin: 0;
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

/* Defeito box */
.defeito-box {
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  line-height: 1.5;
}
.defeito-vazio {
  color: var(--text-muted);
  border-style: dashed;
}

/* Parts Section */
.parts-section {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.parts-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid var(--border);
}

.parts-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.parts-add-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.parts-select {
  flex: 1;
  font-size: 0.85rem;
}

.parts-table-wrap {
  overflow-x: auto;
}

.parts-table {
  width: 100%;
  border-collapse: collapse;
}

.parts-table th {
  padding: 8px 12px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,0.01);
}

.parts-table td {
  padding: 8px 12px;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  color: var(--text-primary);
}

.parts-table tr:last-child td {
  border-bottom: none;
}

.part-name {
  font-weight: 500;
  color: var(--text-white);
}

.qty-input {
  width: 52px;
  text-align: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 6px;
  color: var(--text-white);
  font-size: 0.875rem;
}

.qty-input:focus {
  outline: none;
  border-color: var(--primary);
}

.remove-part-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #f87171;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.remove-part-btn:hover { opacity: 1; }

.parts-empty {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 0.85rem;
  opacity: 0.6;
}

/* Totais */
.totais-grid {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
}

.totais-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.3fr;
  gap: 12px;
  align-items: center;
}

.totais-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.totais-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
}

.totais-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 8px;
  color: var(--text-white);
  font-size: 0.9rem;
  font-weight: 600;
  width: 100%;
}
.totais-input:focus {
  outline: none;
  border-color: var(--primary);
}
.totais-input:disabled {
  opacity: 0.6;
}

.totais-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-white);
}

.totais-total {
  background: rgba(var(--primary-rgb, 34, 197, 94), 0.08);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 8px;
  padding: 8px 12px;
}

.totais-value-big {
  font-size: 1.15rem;
  font-weight: 800;
  color: #4ade80;
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.closed-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(250, 180, 50, 0.08);
  border: 1px solid rgba(250, 180, 50, 0.35);
  border-radius: 8px;
  padding: 10px 14px;
  color: #f4a429;
  font-size: 0.875rem;
}

.closed-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #f4a429;
}

.aparelho-hint {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.aparelho-hint-warn {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(239, 160, 50, 0.08);
  border-color: rgba(239, 160, 50, 0.35);
  color: #f4a429;
}

.aparelho-hint-warn strong {
  color: #f4a429;
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 2px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  color: var(--text-white);
  background: rgba(255,255,255,0.05);
}

.toggle-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 0 0 0 transparent;
}

/* Kanban */
.kanban-board {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 16px;
  align-items: flex-start;
  min-height: 400px;
}

.kanban-col {
  flex: 0 0 230px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 280px);
}

.kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-top: 3px solid var(--primary);
  border-radius: 12px 12px 0 0;
  gap: 8px;
}

.kanban-col-title {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.kanban-col-count {
  background: rgba(255,255,255,0.08);
  color: var(--text-white);
  font-size: 0.78rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  flex-shrink: 0;
}

.kanban-col-body {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
}

.kanban-col-empty {
  text-align: center;
  padding: 24px 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  opacity: 0.6;
}

.kanban-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  cursor: grab;
  transition: all 0.18s;
  user-select: none;
}

.kanban-card:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.15);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}

.kanban-card:active {
  cursor: grabbing;
  opacity: 0.7;
}

.kanban-card--overdue {
  border-color: rgba(248, 113, 113, 0.5);
  background: rgba(248, 113, 113, 0.05);
}

.kanban-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.kanban-card-num {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  font-family: monospace;
}

.kanban-tag {
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 20px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kanban-tag--late {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.35);
}

.kanban-card-cliente {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-white);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kanban-card-aparelho {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kanban-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.kanban-card-tecnico {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.kanban-card-prazo {
  font-size: 0.7rem;
  color: var(--text-muted);
  background: rgba(255,255,255,0.05);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.kanban-card-valor {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary-hover);
  text-align: right;
}

/* Badge purple para Aguardando Cliente */
:deep(.badge-purple), .badge-purple {
  background: rgba(167, 139, 250, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(167, 139, 250, 0.3);
}

.aparelho-hint {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.aparelho-hint-warn {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(239, 160, 50, 0.08);
  border-color: rgba(239, 160, 50, 0.35);
  color: #f4a429;
}

.aparelho-hint-warn strong {
  color: #f4a429;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.8rem;
  border-radius: 7px;
}

.btn-compra {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  border: none;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  padding: 8px 16px;
  transition: opacity 0.2s;
}
.btn-compra:hover { opacity: 0.88; }
.btn-compra:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
