<template>
  <div class="relatorios-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Relatórios</h1>
        <p class="page-subtitle">Acompanhe métricas consolidadas de vendas, serviços e estoque para tomada de decisão.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" @click="exportData('Excel')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Exportar XLS</span>
        </button>
        <button class="btn" @click="exportData('PDF')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Exportar PDF</span>
        </button>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="card filters-card">
      <div class="filters-grid">
        <div class="form-group m-0">
          <label>Tipo de Relatório</label>
          <select v-model="reportType" class="input-control select-control">
            <option value="os">Relatório de Ordens de Serviço</option>
            <option value="vendas">Relatório de Vendas (PDV)</option>
            <option value="caixa">Relatório de Fluxo de Caixa</option>
            <option value="estoque">Relatório de Estoque Crítico</option>
          </select>
        </div>

        <div class="form-group m-0" v-if="reportType !== 'estoque'">
          <label>Data de Início</label>
          <input type="date" v-model="dateStart" class="input-control" />
        </div>

        <div class="form-group m-0" v-if="reportType !== 'estoque'">
          <label>Data de Fim</label>
          <input type="date" v-model="dateEnd" class="input-control" />
        </div>
      </div>
    </div>

    <!-- Report Preview Area -->
    <div class="card preview-card">
      <div class="preview-header">
        <h3>Pré-visualização do Relatório</h3>
        <span class="badge badge-info">{{ reportTitle }}</span>
      </div>

      <!-- OS Report Preview -->
      <div v-if="reportType === 'os'" class="preview-body">
        <div class="kpis-grid mb-6">
          <div class="kpi-box">
            <span class="kpi-label">OS no Período</span>
            <span class="kpi-val text-white">{{ osReportData.totais.total }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">OS Concluídas</span>
            <span class="kpi-val text-success">{{ osReportData.totais.por_status['Concluído'] || 0 }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">OS Entregues</span>
            <span class="kpi-val text-primary">{{ osReportData.totais.por_status['Entregue'] || 0 }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Faturamento OS</span>
            <span class="kpi-val text-white">R$ {{ parseFloat(osReportData.totais.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>

        <div class="chart-and-table">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nº OS</th>
                  <th>Cliente</th>
                  <th>Aparelho</th>
                  <th>Técnico</th>
                  <th>Valor Final</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="os in osReportData.ordens" :key="os.id_os">
                  <td class="font-semibold text-white">#{{ os.numero_os }}</td>
                  <td>{{ os.cliente?.nome || 'N/A' }}</td>
                  <td>{{ os.aparelho?.marca }} {{ os.aparelho?.modelo }}</td>
                  <td>{{ os.tecnico?.nome || 'N/A' }}</td>
                  <td class="font-bold text-success">R$ {{ parseFloat(os.valor_calculado ?? os.valor_final ?? os.valor_orcado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</td>
                  <td>
                    <span :class="['badge', getBadgeClass(os.status)]">{{ os.status }}</span>
                  </td>
                </tr>
                <tr v-if="osReportData.ordens.length === 0">
                  <td colspan="6" class="text-center text-muted py-6">Nenhuma Ordem de Serviço encontrada no período selecionado.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Vendas Report Preview -->
      <div v-else-if="reportType === 'vendas'" class="preview-body">
        <div class="kpis-grid mb-6">
          <div class="kpi-box">
            <span class="kpi-label">Total Vendas Avulsas</span>
            <span class="kpi-val text-white">{{ vendasReportData.totais.total_vendas }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Ticket Médio</span>
            <span class="kpi-val text-info">R$ {{ (vendasReportData.totais.total_vendas > 0 ? (vendasReportData.totais.valor_total / vendasReportData.totais.total_vendas) : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Faturamento Total</span>
            <span class="kpi-val text-success">R$ {{ parseFloat(vendasReportData.totais.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Código Venda</th>
                <th>Data/Hora</th>
                <th>Operador</th>
                <th>Itens</th>
                <th>Desconto</th>
                <th>Total Recebido</th>
                <th>Pagamento</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in vendasReportData.vendas" :key="v.id_venda">
                <td class="font-semibold text-white">#{{ v.id_venda.toString().padStart(4, '0') }}</td>
                <td>{{ new Date(v.data_venda).toLocaleString('pt-BR') }}</td>
                <td>{{ v.atendente?.nome || 'Operador' }}</td>
                <td>
                  <div class="text-xs text-muted" v-for="(it, idx) in v.itens" :key="idx">
                    • {{ it.produto?.descricao }} (x{{ it.quantidade }})
                  </div>
                </td>
                <td class="text-danger">R$ {{ parseFloat(v.desconto || 0).toFixed(2) }}</td>
                <td class="font-bold text-success">R$ {{ parseFloat(v.valor_total).toFixed(2) }}</td>
                <td>
                  <span class="badge badge-info">{{ v.forma_pagamento }}</span>
                </td>
              </tr>
              <tr v-if="vendasReportData.vendas.length === 0">
                <td colspan="7" class="text-center text-muted py-6">Nenhuma venda avulsa registrada no período selecionado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Caixa Report Preview -->
      <div v-else-if="reportType === 'caixa'" class="preview-body">
        <div class="kpis-grid mb-6">
          <div class="kpi-box">
            <span class="kpi-label">Total de Receitas</span>
            <span class="kpi-val text-success">R$ {{ parseFloat(caixaReportData.totais.entradas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Total de Despesas</span>
            <span class="kpi-val text-danger">R$ {{ parseFloat(caixaReportData.totais.saidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Saldo Acumulado</span>
            <span class="kpi-val text-primary font-bold">R$ {{ parseFloat(caixaReportData.totais.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Transações Efetuadas</span>
            <span class="kpi-val text-white">{{ caixaReportData.movimentacoes.length }}</span>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Categoria de Movimentação</th>
                <th>Nº Operações</th>
                <th>Receitas (+)</th>
                <th>Despesas (-)</th>
                <th>Total Líquido</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in groupedCaixa" :key="cat.nome">
                <td class="font-semibold text-white">{{ cat.nome }}</td>
                <td>{{ cat.count }}</td>
                <td class="text-success">R$ {{ cat.entradas.toFixed(2) }}</td>
                <td class="text-danger">R$ {{ cat.saidas.toFixed(2) }}</td>
                <td class="font-bold" :class="cat.entradas - cat.saidas >= 0 ? 'text-success' : 'text-danger'">
                  R$ {{ (cat.entradas - cat.saidas).toFixed(2) }}
                </td>
              </tr>
              <tr v-if="groupedCaixa.length === 0">
                <td colspan="5" class="text-center text-muted py-6">Nenhuma movimentação registrada no período selecionado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Estoque Report Preview -->
      <div v-else-if="reportType === 'estoque'" class="preview-body">
        <div class="kpis-grid mb-6">
          <div class="kpi-box">
            <span class="kpi-label">Total Itens em Estoque</span>
            <span class="kpi-val text-white">{{ estoqueReportData.totais.total }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Itens com Estoque Crítico</span>
            <span class="kpi-val text-danger">{{ estoqueReportData.totais.em_alerta }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Valor de Custo Acumulado</span>
            <span class="kpi-val text-info">R$ {{ totalCustoEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Retorno Esperado Venda</span>
            <span class="kpi-val text-success">R$ {{ totalVendaEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Peça / Produto</th>
                <th>Categoria</th>
                <th>Estoque Atual</th>
                <th>Mínimo Exigido</th>
                <th>Valor Unitário Venda</th>
                <th>Ação Recomendada</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in estoqueReportData.produtos" :key="p.id_produto">
                <td class="font-semibold text-white">{{ p.descricao }}</td>
                <td>{{ p.categoriaRef ? p.categoriaRef.nome : 'Sem Categoria' }}</td>
                <td :class="{ 'text-danger font-bold': p.estoque_atual <= p.estoque_minimo }">{{ p.estoque_atual }} un</td>
                <td>{{ p.estoque_minimo }} un</td>
                <td>R$ {{ parseFloat(p.valor_venda).toFixed(2) }}</td>
                <td>
                  <span v-if="p.estoque_atual <= p.estoque_minimo" class="badge badge-danger">Repor Urgente</span>
                  <span v-else class="badge badge-success">Estável</span>
                </td>
              </tr>
              <tr v-if="estoqueReportData.produtos.length === 0">
                <td colspan="6" class="text-center text-muted py-6">Nenhum produto cadastrado no estoque.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { relatoriosService } from '../services/index.js';

export default defineComponent({
  name: 'RelatoriosView',
  setup() {
    const reportType = ref('os');

    // Inicializa datas com primeiro dia do mês corrente até a data de hoje
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateStart = ref(firstDay.toISOString().split('T')[0]);
    const dateEnd = ref(today.toISOString().split('T')[0]);

    // Data structures para os relatórios
    const osReportData = ref({ ordens: [], totais: { total: 0, valor_total: 0, por_status: {} } });
    const vendasReportData = ref({ vendas: [], totais: { total_vendas: 0, valor_total: 0 } });
    const caixaReportData = ref({ movimentacoes: [], totais: { entradas: 0, saidas: 0, saldo: 0 } });
    const estoqueReportData = ref({ produtos: [], totais: { total: 0, em_alerta: 0 } });

    const reportTitle = computed(() => {
      switch (reportType.value) {
        case 'os': return 'Módulo: Ordens de Serviço';
        case 'vendas': return 'Módulo: Vendas (PDV)';
        case 'caixa': return 'Módulo: Fluxo de Caixa';
        case 'estoque': return 'Módulo: Controle de Peças Críticas';
        default: return 'Geral';
      }
    });

    const fetchReport = async () => {
      const params = { data_inicio: dateStart.value, data_fim: dateEnd.value };
      try {
        if (reportType.value === 'os') {
          const data = await relatoriosService.os(params);
          osReportData.value = data;
        } else if (reportType.value === 'vendas') {
          const data = await relatoriosService.vendas(params);
          vendasReportData.value = data;
        } else if (reportType.value === 'caixa') {
          const data = await relatoriosService.caixa(params);
          caixaReportData.value = data;
        } else if (reportType.value === 'estoque') {
          const data = await relatoriosService.estoque();
          estoqueReportData.value = data;
        }
      } catch (err) {
        console.error('Erro ao buscar dados do relatório:', err);
      }
    };

    // Recarrega relatório quando mudam as datas ou tipo de relatório
    watch([reportType, dateStart, dateEnd], () => {
      fetchReport();
    });

    // Agrupa dados de caixa em categorias
    const groupedCaixa = computed(() => {
      const categories = {};
      (caixaReportData.value.movimentacoes || []).forEach(mov => {
        const cat = mov.categoria || 'Outros';
        if (!categories[cat]) {
          categories[cat] = { nome: cat, count: 0, entradas: 0, saidas: 0 };
        }
        categories[cat].count++;
        if (mov.tipo === 'entrada') {
          categories[cat].entradas += parseFloat(mov.valor);
        } else {
          categories[cat].saidas += parseFloat(mov.valor);
        }
      });
      return Object.values(categories);
    });

    // Custo acumulado do estoque
    const totalCustoEstoque = computed(() => {
      return (estoqueReportData.value.produtos || []).reduce((sum, p) => sum + parseFloat(p.valor_custo || 0) * p.estoque_atual, 0);
    });

    // Retorno esperado do estoque
    const totalVendaEstoque = computed(() => {
      return (estoqueReportData.value.produtos || []).reduce((sum, p) => sum + parseFloat(p.valor_venda || 0) * p.estoque_atual, 0);
    });

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

    const exportData = (format) => {
      alert(`Exportação do Relatório (${reportTitle.value}) em formato ${format} realizada com sucesso.`);
    };

    onMounted(() => {
      fetchReport();
    });

    return {
      reportType,
      dateStart,
      dateEnd,
      reportTitle,
      osReportData,
      vendasReportData,
      caixaReportData,
      estoqueReportData,
      groupedCaixa,
      totalCustoEstoque,
      totalVendaEstoque,
      getBadgeClass,
      exportData
    };
  }
});
</script>

<style scoped>
.relatorios-view {
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

/* Preview Card */
.preview-card {
  padding: 24px;
  min-height: 400px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
}

/* KPIs Grid */
.kpis-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.kpi-box {
  background-color: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.kpi-val {
  font-size: 1.35rem;
  font-weight: 700;
  font-family: var(--font-heading);
}

@media (max-width: 968px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .kpis-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .kpis-grid {
    grid-template-columns: 1fr;
  }
}
</style>
