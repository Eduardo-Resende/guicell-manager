<template>
  <div class="dashboard-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Visão geral da assistência técnica em tempo real.</p>
      </div>
      <div class="date-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="calendar-icon">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>Hoje, 10 de Junho de 2026</span>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="metrics-grid">
      <!-- Card 1: OS Abertas -->
      <div class="card metric-card">
        <div class="metric-info">
          <span class="metric-label">OS em Aberto</span>
          <span class="metric-value">14</span>
          <span class="metric-change positive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="arrow-up">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            +12% vs. ontem
          </span>
        </div>
        <div class="metric-icon-wrapper text-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-icon">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
      </div>

      <!-- Card 2: OS Concluídas -->
      <div class="card metric-card">
        <div class="metric-info">
          <span class="metric-label">OS Concluídas Hoje</span>
          <span class="metric-value">8</span>
          <span class="metric-change positive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="arrow-up">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            +25% vs. ontem
          </span>
        </div>
        <div class="metric-icon-wrapper text-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
      </div>

      <!-- Card 3: Valor em Caixa -->
      <div class="card metric-card">
        <div class="metric-info">
          <span class="metric-label">Caixa do Dia</span>
          <span class="metric-value">R$ 1.250,50</span>
          <span class="metric-change positive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="arrow-up">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            +8.3% vs. média
          </span>
        </div>
        <div class="metric-icon-wrapper text-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-icon">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      </div>

      <!-- Card 4: Estoque Mínimo -->
      <div class="card metric-card highlight-danger">
        <div class="metric-info">
          <span class="metric-label">Estoque Crítico</span>
          <span class="metric-value text-danger">3</span>
          <span class="metric-change text-danger font-semibold">
            Requer reposição urgente
          </span>
        </div>
        <div class="metric-icon-wrapper text-danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-icon">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Charts and Table Section -->
    <div class="dashboard-content-grid">
      <!-- Chart Card -->
      <div class="card chart-card">
        <h2 class="section-title">Ordens de Serviço por Status</h2>
        <div class="chart-container">
          <div class="bar-chart">
            <div class="chart-bar-wrapper" v-for="bar in statusBars" :key="bar.label">
              <div class="bar-value">{{ bar.value }}</div>
              <div class="bar-container">
                <div 
                  class="bar-fill" 
                  :style="{ height: bar.percentage + '%', backgroundColor: bar.color }"
                ></div>
              </div>
              <div class="bar-label">{{ bar.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Card -->
      <div class="card recent-os-card">
        <div class="card-header-flex">
          <h2 class="section-title">Últimas OS Abertas</h2>
          <button class="btn btn-secondary btn-sm" @click="$emit('change-view', 'os')">Ver todas</button>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nº OS</th>
                <th>Cliente</th>
                <th>Aparelho</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="os in recentOS" :key="os.id">
                <td class="font-semibold text-white">#{{ os.numero }}</td>
                <td>{{ os.cliente }}</td>
                <td>{{ os.aparelho }}</td>
                <td>
                  <span :class="['badge', getBadgeClass(os.status)]">
                    {{ os.status }}
                  </span>
                </td>
                <td class="text-muted">{{ os.data }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'DashboardView',
  emits: ['change-view'],
  setup() {
    const statusBars = ref([
      { label: 'Aguardando', value: 4, percentage: 40, color: 'var(--warning)' },
      { label: 'Em Reparo', value: 6, percentage: 60, color: 'var(--info)' },
      { label: 'Aguard. Peça', value: 3, percentage: 30, color: '#ec4899' },
      { label: 'Concluído', value: 8, percentage: 80, color: 'var(--success)' },
      { label: 'Entregue', value: 10, percentage: 100, color: 'var(--primary)' },
      { label: 'Cancelado', value: 2, percentage: 20, color: 'var(--danger)' }
    ]);

    const recentOS = ref([
      { id: 1, numero: '2026-0014', cliente: 'Eduardo Santana', aparelho: 'iPhone 13 - Tela Quebrada', status: 'Em Reparo', data: '10/06/2026 10:15' },
      { id: 2, numero: '2026-0013', cliente: 'Mariana Costa', aparelho: 'Samsung Galaxy S22 - Bateria', status: 'Aguardando', data: '10/06/2026 09:30' },
      { id: 3, numero: '2026-0012', cliente: 'Carlos Roberto', aparelho: 'Motorola G200 - Conector Carga', status: 'Concluído', data: '09/06/2026 17:45' },
      { id: 4, numero: '2026-0011', cliente: 'Julia Almeida', aparelho: 'iPhone 11 - Câmera Traseira', status: 'Aguard. Peça', data: '09/06/2026 15:20' },
      { id: 5, numero: '2026-0010', cliente: 'Ricardo Alves', aparelho: 'Xiaomi Poco X3 - Placa Mãe', status: 'Cancelado', data: '09/06/2026 11:00' }
    ]);

    const getBadgeClass = (status) => {
      switch (status) {
        case 'Aguardando': return 'badge-warning';
        case 'Em Reparo': return 'badge-info';
        case 'Aguard. Peça': return 'badge-danger'; // Pink highlight
        case 'Concluído': return 'badge-success';
        case 'Entregue': return 'badge-success';
        case 'Cancelado': return 'badge-muted';
        default: return 'badge-muted';
      }
    };

    return {
      statusBars,
      recentOS,
      getBadgeClass
    };
  }
});
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.date-badge {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  padding: 8px 16px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-normal);
}

.calendar-icon {
  width: 16px;
  height: 16px;
  color: var(--primary);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.metric-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.metric-card.highlight-danger {
  border-color: rgba(239, 68, 68, 0.3);
}

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-white);
  line-height: 1.2;
  font-family: var(--font-heading);
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  margin-top: 6px;
}

.metric-change.positive {
  color: var(--success);
}

.arrow-up {
  width: 12px;
  height: 12px;
}

.metric-icon-wrapper {
  background-color: rgba(255, 255, 255, 0.02);
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
}

.metric-icon {
  width: 22px;
  height: 22px;
}

.text-success { color: var(--success); }
.text-info { color: var(--info); }

/* Content Grid */
.dashboard-content-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 20px;
}

.section-title {
  font-size: 1.15rem;
  margin-bottom: 20px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header-flex .section-title {
  margin-bottom: 0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
  border-radius: 6px;
}

/* Chart Styles */
.chart-container {
  height: 240px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-top: 10px;
}

.bar-chart {
  display: flex;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  align-items: flex-end;
  gap: 12px;
}

.chart-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 14%;
  height: 100%;
}

.bar-value {
  font-size: 0.75rem;
  color: var(--text-white);
  font-weight: 600;
  margin-bottom: 6px;
}

.bar-container {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 4px;
  width: 100%;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 2px 2px 0 0;
  transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 -2px 8px rgba(0,0,0,0.2);
}

.bar-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: 8px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
}

/* Responsiveness */
@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
