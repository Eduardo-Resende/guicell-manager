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

        <div class="form-group m-0">
          <label>Data de Início</label>
          <input type="date" v-model="dateStart" class="input-control" />
        </div>

        <div class="form-group m-0">
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
            <span class="kpi-label">OS Abertas no Período</span>
            <span class="kpi-val text-white">45</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">OS Concluídas</span>
            <span class="kpi-val text-success">38</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Média de Dias p/ Reparo</span>
            <span class="kpi-val text-info">2.4 dias</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Faturamento OS</span>
            <span class="kpi-val text-white">R$ 8.940,00</span>
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
                <tr>
                  <td class="font-semibold text-white">#2026-0014</td>
                  <td>Eduardo Santana</td>
                  <td>iPhone 13</td>
                  <td>Eduardo Santana</td>
                  <td>R$ 850,00</td>
                  <td><span class="badge badge-info">Em Reparo</span></td>
                </tr>
                <tr>
                  <td class="font-semibold text-white">#2026-0012</td>
                  <td>Carlos Roberto</td>
                  <td>Motorola G200</td>
                  <td>Sandro Gouvea</td>
                  <td>R$ 145,00</td>
                  <td><span class="badge badge-success">Concluído</span></td>
                </tr>
                <tr>
                  <td class="font-semibold text-white">#2026-0011</td>
                  <td>Julia Almeida</td>
                  <td>iPhone 11</td>
                  <td>Eduardo Santana</td>
                  <td>R$ 470,00</td>
                  <td><span class="badge badge-danger">Aguard. Peça</span></td>
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
            <span class="kpi-val text-white">68</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Ticket Médio</span>
            <span class="kpi-val text-info">R$ 55,20</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Produto mais Vendido</span>
            <span class="kpi-val text-success">Película 3D</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Faturamento Total</span>
            <span class="kpi-val text-white">R$ 3.753,60</span>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Item/Acessório</th>
                <th>Categoria</th>
                <th>Unidades Vendidas</th>
                <th>Ticket Médio</th>
                <th>Total Vendido</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-semibold text-white">Película de Vidro 3D iPhone 13</td>
                <td>Acessório</td>
                <td>32 un</td>
                <td>R$ 25,00</td>
                <td class="font-bold text-success">R$ 800,00</td>
              </tr>
              <tr>
                <td class="font-semibold text-white">Capinha Silicone Anti-Impacto</td>
                <td>Acessório</td>
                <td>24 un</td>
                <td>R$ 35,00</td>
                <td class="font-bold text-success">R$ 840,00</td>
              </tr>
              <tr>
                <td class="font-semibold text-white">Fone de Ouvido Bluetooth JBL</td>
                <td>Acessório</td>
                <td>6 un</td>
                <td>R$ 189,00</td>
                <td class="font-bold text-success">R$ 1.134,00</td>
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
            <span class="kpi-val text-success">R$ 12.693,60</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Total de Despesas</span>
            <span class="kpi-val text-danger">R$ 1.450,00</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Saldo Acumulado</span>
            <span class="kpi-val text-primary font-bold">R$ 11.243,60</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Transações Efetuadas</span>
            <span class="kpi-val text-white">113</span>
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
              <tr>
                <td class="font-semibold text-white">Serviços / OS</td>
                <td>45</td>
                <td class="text-success">R$ 8.940,00</td>
                <td class="text-muted">R$ 0,00</td>
                <td class="font-bold text-success">R$ 8.940,00</td>
              </tr>
              <tr>
                <td class="font-semibold text-white">Venda de Acessórios</td>
                <td>68</td>
                <td class="text-success">R$ 3.753,60</td>
                <td class="text-muted">R$ 0,00</td>
                <td class="font-bold text-success">R$ 3.753,60</td>
              </tr>
              <tr>
                <td class="font-semibold text-white">Fornecedores / Compras</td>
                <td>5</td>
                <td class="text-muted">R$ 0,00</td>
                <td class="text-danger">R$ 1.100,00</td>
                <td class="font-bold text-danger">- R$ 1.100,00</td>
              </tr>
              <tr>
                <td class="font-semibold text-white">Infraestrutura</td>
                <td>2</td>
                <td class="text-muted">R$ 0,00</td>
                <td class="text-danger">R$ 350,00</td>
                <td class="font-bold text-danger">- R$ 350,00</td>
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
            <span class="kpi-val text-white">124</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Itens com Estoque Crítico</span>
            <span class="kpi-val text-danger">3</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Valor de Custo Acumulado</span>
            <span class="kpi-val text-info">R$ 4.850,00</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">Retorno Esperado Venda</span>
            <span class="kpi-val text-success">R$ 8.120,00</span>
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
              <tr>
                <td class="font-semibold text-white">Bateria Compatível S22</td>
                <td>Bateria</td>
                <td class="text-danger font-bold">2 un</td>
                <td>2 un</td>
                <td>R$ 180,00</td>
                <td><span class="badge badge-danger">Repor Urgente</span></td>
              </tr>
              <tr>
                <td class="font-semibold text-white">Câmera Traseira iPhone 11</td>
                <td>Câmera</td>
                <td class="text-danger font-bold">1 un</td>
                <td>2 un</td>
                <td>R$ 320,00</td>
                <td><span class="badge badge-danger">Repor Urgente</span></td>
              </tr>
              <tr>
                <td class="font-semibold text-white">Tela Frontal iPhone 13 OLED</td>
                <td>Tela</td>
                <td class="text-warning font-bold">4 un</td>
                <td>2 un</td>
                <td>R$ 650,00</td>
                <td><span class="badge badge-warning">Acompanhar</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'RelatoriosView',
  setup() {
    const reportType = ref('os');
    const dateStart = ref('2026-06-01');
    const dateEnd = ref('2026-06-10');

    const reportTitle = computed(() => {
      switch (reportType.value) {
        case 'os': return 'Módulo: Ordens de Serviço';
        case 'vendas': return 'Módulo: Vendas (PDV)';
        case 'caixa': return 'Módulo: Fluxo de Caixa';
        case 'estoque': return 'Módulo: Controle de Peças Críticas';
        default: return 'Geral';
      }
    });

    const exportData = (format) => {
      alert(`Exportação do Relatório (${reportTitle.value}) em formato ${format} realizada com sucesso.`);
    };

    return {
      reportType,
      dateStart,
      dateEnd,
      reportTitle,
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
