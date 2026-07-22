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
              <select v-model="newPartId" class="input-control select-control flex-1" :disabled="isClosed">
                <option value="">Adicionar Peça do Estoque...</option>
                <option v-for="p in mockProducts" :key="p.id_produto" :value="p.id_produto">
                  {{ p.descricao }} {{ p.codigo_barras ? `(EAN: ${p.codigo_barras})` : '' }} (Estoque: {{ p.estoque_atual }} | R$ {{ parseFloat(p.valor_venda).toFixed(2) }})
                </option>
              </select>
              <button type="button" class="btn btn-secondary" @click="addPart" :disabled="isClosed">Adicionar</button>
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
              <div class="flex items-center gap-1 font-bold text-white">
                 <input type="number" step="0.01" v-model.number="selectedOS.maoObra" class="input-control text-white" :disabled="isClosed" style="width: 100px; padding: 2px 5px; height: auto; background-color: transparent; border: 1px solid #444;" />
              </div>
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
              <select v-model="selectedOS.status" class="input-control select-control" :disabled="isClosed">
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
              <select v-model="selectedOS.formaPagamento" class="input-control select-control" :disabled="isClosed || selectedOS.status !== 'Entregue'">
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
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { osService, clientesService, produtosService, usuariosService, aparelhosService } from '../services/index.js';

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
            diagnostico: os.diagnostico || '',
            formaPagamento: os.forma_pagamento || 'PIX',
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
          originalStatus: detailedOS.status || os.status, // Status real do banco (imutável durante o modal)
          maoObra: parseFloat(detailedOS.valor_orcado || os.maoObra || 0),
          formaPagamento: detailedOS.forma_pagamento || os.formaPagamento || 'PIX',
          diagnostico: detailedOS.diagnostico || '',
          parts: (detailedOS.itens || []).map(it => ({
            id: it.id_produto,
            descricao: it.produto?.descricao || 'Produto/Peça',
            preco: parseFloat(it.valor_unitario)
          })),
          partsTotal: (detailedOS.itens || []).reduce((sum, it) => sum + parseFloat(it.valor_unitario) * it.quantidade, 0)
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
          preco: parseFloat(part.valor_venda)
        });
        selectedOS.value.partsTotal += parseFloat(part.valor_venda);
        newPartId.value = '';
      }
    };

    const removePart = (index) => {
      const part = selectedOS.value.parts[index];
      selectedOS.value.partsTotal -= part.preco;
      selectedOS.value.parts.splice(index, 1);
    };

    const saveOSChanges = async () => {
      // Bloquear edição de OS já finalizada (Entregue ou Cancelada)
      if (isClosed.value) {
        alert('Esta OS já está finalizada e não pode ser alterada.');
        return;
      }

      try {
        const id = selectedOS.value.id_os;
        
        // Se mudou o status para 'Entregue', realiza o fluxo de fechamento/faturamento
        if (selectedOS.value.status === 'Entregue') {
          await osService.fechar(id, {
            valor_final: selectedOS.value.maoObra + selectedOS.value.partsTotal,
            forma_pagamento: selectedOS.value.formaPagamento,
            itens: selectedOS.value.parts.map(p => ({
              id_produto: p.id,
              quantidade: 1,
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
              quantidade: 1,
              valor_unitario: p.preco
            })),
            selectedOS.value.maoObra
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
      alert(`Simulação de Impressão de Comprovante da OS #${os.numero} gerada com sucesso.`);
    };

    const getBadgeClass = (status) => {
      switch (status) {
        case 'Aguardando': return 'badge-warning';
        case 'Em Reparo': return 'badge-info';
        case 'Aguardando Peça':
        case 'Aguard. Peça': return 'badge-danger';
        case 'Concluído': return 'badge-success';
        case 'Entregue': return 'badge-success';
        case 'Cancelado': return 'badge-muted';
        default: return 'badge-muted';
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
      form,
      mockClients,
      mockProducts,
      tecnicos,
      ordens,
      filteredOS: ordens, // Use direct list from API
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
      isClosed
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
</style>
