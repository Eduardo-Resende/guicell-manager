<template>
  <div class="relatorios-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Relatórios</h1>
        <p class="page-subtitle">Acompanhe métricas consolidadas de vendas, serviços e estoque para tomada de decisão.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-export" @click="showExportModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Exportar Relatório</span>
        </button>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="card filters-card">
      <div class="filters-grid">
        <div class="form-group m-0">
          <label>Tipo de Relatório</label>
          <select v-model="reportType" class="input-control select-control">
            <option value="os">Ordens de Serviço</option>
            <option value="vendas">Vendas (PDV)</option>
            <option value="caixa">Fluxo de Caixa</option>
            <option value="estoque">Estoque</option>
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
                <tr v-for="os in osReportData.ordens" :key="os.id_movimentacao">
                  <td class="font-semibold text-white">#{{ os.numero_os }}</td>
                  <td>{{ os.cliente?.nome || 'N/A' }}</td>
                  <td>{{ os.aparelho?.marca }} {{ os.aparelho?.modelo }}</td>
                  <td>{{ os.tecnico?.nome || 'N/A' }}</td>
                  <td class="font-bold text-success">R$ {{ parseFloat(os.valor_calculado ?? os.valor_total ?? os.valor_orcado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</td>
                  <td>
                    <span :class="['badge', getBadgeClass(os.status_os)]">{{ os.status_os }}</span>
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
              <tr v-for="v in vendasReportData.vendas" :key="v.id_movimentacao">
                <td class="font-semibold text-white">#{{ v.id_movimentacao.toString().padStart(4, '0') }}</td>
                <td>{{ formatarDataHora(v.data_movimentacao) }}</td>
                <td>{{ v.usuario?.nome || 'Operador' }}</td>
                <td>
                  <div class="text-xs text-muted" v-for="(it, idx) in v.itens" :key="idx">
                    • {{ it.produto?.descricao }} (x{{ it.quantidade }})
                  </div>
                </td>
                <td class="text-danger">R$ {{ parseFloat(v.desconto || 0).toFixed(2) }}</td>
                <td :class="['font-bold', v.status_pagamento === 'cancelado' ? 'text-muted' : 'text-success']" :style="v.status_pagamento === 'cancelado' ? 'text-decoration: line-through;' : ''">
                  R$ {{ parseFloat(v.valor_total).toFixed(2) }}
                </td>
                <td>
                  <span v-if="v.status_pagamento === 'cancelado'" class="badge badge-danger">Cancelada ({{ v.forma_pagamento }})</span>
                  <span v-else class="badge badge-info">{{ v.forma_pagamento }}</span>
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
                <th>Custo Unitário</th>
                <th>Valor Unitário Venda</th>
                <th>Ação Recomendada</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in estoqueReportData.produtos" :key="p.id_produto">
                <td class="font-semibold text-white">{{ p.descricao }}</td>
                <td>{{ p.categoriaRef ? p.categoriaRef.nome : 'Sem Categoria' }}</td>
                <td :class="{ 'text-danger font-bold': p.estoque_minimo > 0 && p.estoque_atual <= p.estoque_minimo }">{{ p.estoque_atual }} un</td>
                <td>{{ p.estoque_minimo > 0 ? p.estoque_minimo + ' un' : '—' }}</td>
                <td class="text-muted">R$ {{ parseFloat(p.valor_custo || 0).toFixed(2) }}</td>
                <td>R$ {{ parseFloat(p.valor_venda).toFixed(2) }}</td>
                <td>
                  <span v-if="p.estoque_minimo > 0 && p.estoque_atual <= p.estoque_minimo" class="badge badge-danger">Repor Urgente</span>
                  <span v-else class="badge badge-success">Estável</span>
                </td>
              </tr>
              <tr v-if="estoqueReportData.produtos.length === 0">
                <td colspan="7" class="text-center text-muted py-6">Nenhum produto cadastrado no estoque.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal: Escolher Formato de Exportação -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="!isExporting && (showExportModal = false)">
      <div class="modal-content export-modal">
        <div class="modal-header">
          <div>
            <h3 class="m-0">Exportar Relatório</h3>
            <p class="text-muted text-xs m-0 mt-1">{{ reportNameClean }} • {{ periodoLabel }}</p>
          </div>
          <button class="close-btn" @click="showExportModal = false" :disabled="isExporting">&times;</button>
        </div>

        <div class="modal-body">
          <p class="export-prompt">Escolha o formato em que deseja exportar os dados:</p>

          <div class="export-options-grid">
            <button
              type="button"
              class="export-option-card export-option-xls"
              :disabled="isExporting"
              @click="exportData('Excel')"
            >
              <div class="export-option-icon xls-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="16" y2="17" />
                  <line x1="10" y1="9" x2="10" y2="21" />
                </svg>
              </div>
              <div class="export-option-info">
                <span class="export-option-title">Planilha Excel (.XLS)</span>
                <span class="export-option-desc">Ideal para filtros, cálculos e manipulação de dados em planilhas.</span>
              </div>
              <span class="export-option-arrow">→</span>
            </button>

            <button
              type="button"
              class="export-option-card export-option-pdf"
              :disabled="isExporting"
              @click="exportData('PDF')"
            >
              <div class="export-option-icon pdf-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15h6" />
                  <path d="M12 12v6" />
                </svg>
              </div>
              <div class="export-option-info">
                <span class="export-option-title">Documento PDF (.PDF)</span>
                <span class="export-option-desc">Documento formatado pronto para impressão, envio ou arquivamento.</span>
              </div>
              <span class="export-option-arrow">→</span>
            </button>
          </div>

          <div v-if="isExporting" class="export-loading">
            <span class="export-spinner"></span>
            <span>Gerando arquivo de exportação, aguarde...</span>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showExportModal = false" :disabled="isExporting">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { relatoriosService } from '../services/index.js';
import { formatarData, formatarDataHora } from '../utils/formatDate.js';

async function loadJsPDF() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadHtml2Canvas() {
  if (window.html2canvas) return window.html2canvas;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default defineComponent({
  name: 'RelatoriosView',
  setup() {
    const reportType = ref('os');
    const showExportModal = ref(false);
    const isExporting = ref(false);

    const toLocalDateStr = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Inicializa datas com primeiro dia do mês corrente até a data de hoje
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateStart = ref(toLocalDateStr(firstDay));
    const dateEnd = ref(toLocalDateStr(today));

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

    const reportNameClean = computed(() => {
      switch (reportType.value) {
        case 'os': return 'Relatório de Ordens de Serviço';
        case 'vendas': return 'Relatório de Vendas (PDV)';
        case 'caixa': return 'Relatório de Fluxo de Caixa';
        case 'estoque': return 'Relatório de Estoque';
        default: return 'Relatório Geral';
      }
    });

    const periodoLabel = computed(() => {
      if (reportType.value === 'estoque') return 'Posição Atual do Estoque';
      return `Período: ${formatarData(dateStart.value)} até ${formatarData(dateEnd.value)}`;
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
        case 'Aguardando':
        case 'Aguardando Diagnóstico': return 'badge-warning';
        case 'Aguardando Cliente': return 'badge-warning';
        case 'Em Reparo': return 'badge-info';
        case 'Aguardando Peça':
        case 'Aguard. Peça': return 'badge-danger';
        case 'Concluído': return 'badge-success';
        case 'Entregue': return 'badge-success';
        case 'Cancelado': return 'badge-muted';
        default: return 'badge-muted';
      }
    };

    const fmtMoney = (v) =>
      `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const escapeHtml = (val) =>
      String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const getReportExportConfig = () => {
      const dateSuffix = reportType.value === 'estoque'
        ? toLocalDateStr(new Date())
        : `${dateStart.value}_a_${dateEnd.value}`;

      if (reportType.value === 'os') {
        return {
          title: reportNameClean.value,
          periodo: periodoLabel.value,
          filename: `relatorio-os-${dateSuffix}`,
          kpis: [
            { label: 'OS no Período', value: String(osReportData.value.totais.total || 0) },
            { label: 'OS Concluídas', value: String(osReportData.value.totais.por_status?.['Concluído'] || 0) },
            { label: 'OS Entregues', value: String(osReportData.value.totais.por_status?.['Entregue'] || 0) },
            { label: 'Faturamento OS', value: fmtMoney(osReportData.value.totais.valor_total) },
          ],
          columns: ['Nº OS', 'Data Abertura', 'Cliente', 'Aparelho', 'Técnico', 'Valor Final', 'Status'],
          rows: (osReportData.value.ordens || []).map(os => [
            `#${os.numero_os}`,
            formatarDataHora(os.data_movimentacao),
            os.cliente?.nome || 'N/A',
            `${os.aparelho?.marca || ''} ${os.aparelho?.modelo || ''}`.trim() || 'N/A',
            os.tecnico?.nome || 'N/A',
            fmtMoney(os.valor_calculado ?? os.valor_total ?? os.valor_orcado ?? 0),
            os.status_os || '-',
          ]),
        };
      }

      if (reportType.value === 'vendas') {
        const totalVendas = vendasReportData.value.totais.total_vendas || 0;
        const valorTotal = parseFloat(vendasReportData.value.totais.valor_total || 0);
        const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

        return {
          title: reportNameClean.value,
          periodo: periodoLabel.value,
          filename: `relatorio-vendas-${dateSuffix}`,
          kpis: [
            { label: 'Total Vendas Avulsas', value: String(totalVendas) },
            { label: 'Ticket Médio', value: fmtMoney(ticketMedio) },
            { label: 'Faturamento Total', value: fmtMoney(valorTotal) },
          ],
          columns: ['Código Venda', 'Data/Hora', 'Operador', 'Itens', 'Desconto', 'Total Recebido', 'Pagamento'],
          rows: (vendasReportData.value.vendas || []).map(v => [
            `#${v.id_movimentacao.toString().padStart(4, '0')}`,
            formatarDataHora(v.data_movimentacao),
            v.usuario?.nome || 'Operador',
            (v.itens || []).map(it => `${it.produto?.descricao || 'Item'} (x${it.quantidade})`).join(', ') || '-',
            fmtMoney(v.desconto || 0),
            fmtMoney(v.valor_total || 0),
            v.status_pagamento === 'cancelado' ? `Cancelada (${v.forma_pagamento || '-'})` : (v.forma_pagamento || '-'),
          ]),
        };
      }

      if (reportType.value === 'caixa') {
        return {
          title: reportNameClean.value,
          periodo: periodoLabel.value,
          filename: `relatorio-caixa-${dateSuffix}`,
          kpis: [
            { label: 'Total de Receitas', value: fmtMoney(caixaReportData.value.totais.entradas) },
            { label: 'Total de Despesas', value: fmtMoney(caixaReportData.value.totais.saidas) },
            { label: 'Saldo Acumulado', value: fmtMoney(caixaReportData.value.totais.saldo) },
            { label: 'Transações Efetuadas', value: String((caixaReportData.value.movimentacoes || []).length) },
          ],
          columns: ['Categoria de Movimentação', 'Nº Operações', 'Receitas (+)', 'Despesas (-)', 'Total Líquido'],
          rows: groupedCaixa.value.map(cat => [
            cat.nome,
            String(cat.count),
            fmtMoney(cat.entradas),
            fmtMoney(cat.saidas),
            fmtMoney(cat.entradas - cat.saidas),
          ]),
        };
      }

      // estoque
      return {
        title: reportNameClean.value,
        periodo: periodoLabel.value,
        filename: `relatorio-estoque-${dateSuffix}`,
        kpis: [
          { label: 'Total Itens em Estoque', value: String(estoqueReportData.value.totais.total || 0) },
          { label: 'Itens com Estoque Crítico', value: String(estoqueReportData.value.totais.em_alerta || 0) },
          { label: 'Valor de Custo Acumulado', value: fmtMoney(totalCustoEstoque.value) },
          { label: 'Retorno Esperado Venda', value: fmtMoney(totalVendaEstoque.value) },
        ],
        columns: ['Peça / Produto', 'Categoria', 'Estoque Atual', 'Mínimo Exigido', 'Custo Unitário', 'Valor Unitário Venda', 'Ação Recomendada'],
        rows: (estoqueReportData.value.produtos || []).map(p => [
          p.descricao,
          p.categoriaRef ? p.categoriaRef.nome : 'Sem Categoria',
          `${p.estoque_atual} un`,
          p.estoque_minimo > 0 ? `${p.estoque_minimo} un` : '—',
          fmtMoney(p.valor_custo || 0),
          fmtMoney(p.valor_venda || 0),
          p.estoque_minimo > 0 && p.estoque_atual <= p.estoque_minimo ? 'Repor Urgente' : 'Estável',
        ]),
      };
    };

    const exportToExcel = (cfg) => {
      const colSpan = cfg.columns.length;
      const emissao = new Date().toLocaleString('pt-BR');

      const kpisRowsHtml = cfg.kpis
        .map(
          k => `
          <tr>
            <td colspan="2" style="font-weight:bold;background:#f1f5f9;border:1px solid #cbd5e1;padding:6px;">${escapeHtml(k.label)}</td>
            <td colspan="${Math.max(1, colSpan - 2)}" style="border:1px solid #cbd5e1;padding:6px;">${escapeHtml(k.value)}</td>
          </tr>`
        )
        .join('');

      const headerCellsHtml = cfg.columns
        .map(
          col => `<th style="background:#008f39;color:#ffffff;font-weight:bold;border:1px solid #006829;padding:8px;text-align:left;">${escapeHtml(col)}</th>`
        )
        .join('');

      const bodyRowsHtml = cfg.rows.length > 0
        ? cfg.rows
            .map(
              (row, idx) => `
              <tr>
                ${row
                  .map(
                    cell => `<td style="border:1px solid #cbd5e1;padding:6px;background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${escapeHtml(cell)}</td>`
                  )
                  .join('')}
              </tr>`
            )
            .join('')
        : `<tr><td colspan="${colSpan}" style="border:1px solid #cbd5e1;padding:12px;text-align:center;">Nenhum registro encontrado no período selecionado.</td></tr>`;

      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>${escapeHtml(cfg.title.slice(0, 30))}</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
            <tr>
              <td colspan="${colSpan}" style="font-size:16px;font-weight:bold;background:#0f172a;color:#ffffff;padding:10px;">
                GUICELL MANAGER — ${escapeHtml(cfg.title.toUpperCase())}
              </td>
            </tr>
            <tr>
              <td colspan="${colSpan}" style="font-size:11px;background:#e2e8f0;color:#334155;padding:6px;">
                ${escapeHtml(cfg.periodo)} | Emitido em: ${escapeHtml(emissao)}
              </td>
            </tr>
            <tr><td colspan="${colSpan}"></td></tr>
            ${kpisRowsHtml}
            <tr><td colspan="${colSpan}"></td></tr>
            <thead>
              <tr>${headerCellsHtml}</tr>
            </thead>
            <tbody>
              ${bodyRowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cfg.filename}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    const exportToPDF = async (cfg) => {
      const emissao = new Date().toLocaleString('pt-BR');
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#ffffff;color:#0f172a;padding:32px;font-family:Arial,sans-serif;box-sizing:border-box;z-index:-1;';

      const kpisHtml = cfg.kpis
        .map(
          k => `
          <div style="flex:1;min-width:140px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #008f39;border-radius:6px;padding:10px 12px;">
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:bold;margin-bottom:4px;">${escapeHtml(k.label)}</div>
            <div style="font-size:15px;color:#0f172a;font-weight:bold;">${escapeHtml(k.value)}</div>
          </div>`
        )
        .join('');

      const thHtml = cfg.columns
        .map(
          col => `<th style="background:#0f172a;color:#ffffff;font-size:11px;font-weight:bold;padding:8px 6px;text-align:left;border:1px solid #0f172a;">${escapeHtml(col)}</th>`
        )
        .join('');

      const trHtml = cfg.rows.length > 0
        ? cfg.rows
            .map(
              (row, i) => `
              <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                ${row
                  .map(
                    cell => `<td style="font-size:10.5px;color:#1e293b;padding:7px 6px;border-bottom:1px solid #e2e8f0;">${escapeHtml(cell)}</td>`
                  )
                  .join('')}
              </tr>`
            )
            .join('')
        : `<tr><td colspan="${cfg.columns.length}" style="padding:16px;text-align:center;color:#64748b;font-size:11px;">Nenhum registro encontrado no período selecionado.</td></tr>`;

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #008f39;padding-bottom:14px;margin-bottom:18px;">
          <div>
            <div style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:0.5px;">GUICELL</div>
            <div style="font-size:11px;color:#64748b;">Assistência Técnica e Acessórios</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:15px;font-weight:bold;color:#008f39;">${escapeHtml(cfg.title)}</div>
            <div style="font-size:11px;color:#475569;margin-top:2px;">${escapeHtml(cfg.periodo)}</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
          ${kpisHtml}
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead><tr>${thHtml}</tr></thead>
          <tbody>${trHtml}</tbody>
        </table>
        <div style="border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;">
          <span>GUICELL Manager — Sistema de Gestão</span>
          <span>Emitido em ${escapeHtml(emissao)}</span>
        </div>
      `;

      document.body.appendChild(container);
      try {
        const [JsPDF, html2canvas] = await Promise.all([loadJsPDF(), loadHtml2Canvas()]);
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = 210;
        const pageH = 297;
        const imgW = pageW;
        const imgH = (canvas.height / canvas.width) * imgW;

        let yOffset = 0;
        let remaining = imgH;
        while (remaining > 0) {
          pdf.addImage(imgData, 'JPEG', 0, -yOffset, imgW, imgH);
          remaining -= pageH;
          if (remaining > 0) {
            pdf.addPage();
            yOffset += pageH;
          }
        }
        pdf.save(`${cfg.filename}.pdf`);
      } finally {
        document.body.removeChild(container);
      }
    };

    const exportData = async (format) => {
      if (isExporting.value) return;
      isExporting.value = true;
      try {
        await fetchReport();
        const cfg = getReportExportConfig();
        if (format === 'Excel') {
          exportToExcel(cfg);
        } else if (format === 'PDF') {
          await exportToPDF(cfg);
        }
        showExportModal.value = false;
      } catch (err) {
        console.error('Erro ao exportar relatório:', err);
        alert('Erro ao gerar o arquivo de exportação.');
      } finally {
        isExporting.value = false;
      }
    };

    onMounted(() => {
      fetchReport();
      loadJsPDF().catch(() => {});
      loadHtml2Canvas().catch(() => {});
    });

    return {
      reportType,
      dateStart,
      dateEnd,
      reportTitle,
      reportNameClean,
      periodoLabel,
      showExportModal,
      isExporting,
      osReportData,
      vendasReportData,
      caixaReportData,
      estoqueReportData,
      groupedCaixa,
      totalCustoEstoque,
      totalVendaEstoque,
      getBadgeClass,
      exportData,
      formatarDataHora
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

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(0, 143, 57, 0.25);
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

/* Modal de Exportação */
.export-modal {
  max-width: 480px;
}

.export-prompt {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.export-options-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-option-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-white);
}

.export-option-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
}

.export-option-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-option-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.export-option-icon svg {
  width: 22px;
  height: 22px;
}

.xls-icon {
  background: rgba(34, 197, 94, 0.14);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.pdf-icon {
  background: rgba(239, 68, 68, 0.14);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.export-option-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.export-option-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-white);
}

.export-option-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.export-option-arrow {
  font-size: 1.1rem;
  color: var(--text-muted);
  font-weight: 700;
  transition: transform 0.2s ease, color 0.2s ease;
}

.export-option-card:hover:not(:disabled) .export-option-arrow {
  transform: translateX(3px);
  color: var(--primary);
}

.export-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.export-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
