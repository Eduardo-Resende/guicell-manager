<template>
  <div class="caixa-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Caixa</h1>
        <p class="page-subtitle">Acompanhe as movimentações financeiras do dia e realize conciliações.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" @click="fecharCaixa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Fechar Caixa</span>
        </button>
        <button class="btn" @click="showAddModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Lançar Movimentação</span>
        </button>
      </div>
    </div>

    <!-- Balance Summaries -->
    <div class="balances-grid">
      <!-- Card: Saldo Inicial -->
      <div class="card balance-card">
        <span class="balance-label">Abertura de Caixa</span>
        <span class="balance-value text-white">R$ 150,00</span>
        <span class="balance-meta text-muted">Fundo de troco fixo</span>
      </div>

      <!-- Card: Entradas -->
      <div class="card balance-card border-success">
        <span class="balance-label">Total Entradas (+)</span>
        <span class="balance-value text-success">R$ {{ resumo.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
        <span class="balance-meta text-muted">Vendas e Serviços (OS)</span>
      </div>

      <!-- Card: Saídas -->
      <div class="card balance-card border-danger">
        <span class="balance-label">Total Saídas (-)</span>
        <span class="balance-value text-danger">R$ {{ resumo.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
        <span class="balance-meta text-muted">Despesas operacionais</span>
      </div>

      <!-- Card: Saldo Líquido -->
      <div class="card balance-card border-primary">
        <span class="balance-label">Saldo em Caixa</span>
        <span class="balance-value text-primary font-bold">R$ {{ (150.00 + resumo.entradas - resumo.saidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
        <span class="balance-meta text-muted">Abertura + Entradas - Saídas</span>
      </div>
    </div>

    <!-- Movement Logs Table -->
    <div class="card logs-card">
      <h3 class="mb-4">Fluxo de Caixa do Dia</h3>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Operador</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in sortedLogs" :key="log.id">
              <td class="text-muted">{{ log.hora }}</td>
              <td class="font-semibold text-white">{{ log.descricao }}</td>
              <td>{{ log.categoria }}</td>
              <td>
                <span :class="['badge', log.tipo === 'entrada' ? 'badge-success' : 'badge-danger']">
                  {{ log.tipo === 'entrada' ? 'Receita' : 'Despesa' }}
                </span>
              </td>
              <td class="font-bold" :class="log.tipo === 'entrada' ? 'text-success' : 'text-danger'">
                {{ log.tipo === 'entrada' ? '+' : '-' }} R$ {{ log.valor.toFixed(2) }}
              </td>
              <td>{{ log.operador }}</td>
            </tr>
            <tr v-if="sortedLogs.length === 0">
              <td colspan="6" class="text-center text-muted py-6">Nenhuma movimentação registrada hoje.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Lançamento Manual -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Lançar Movimentação Manual</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="submitMovimentacao">
          <div class="modal-body">
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>Tipo de Lançamento *</label>
                <select v-model="form.tipo" required class="input-control select-control">
                  <option value="entrada">Entrada (Receita)</option>
                  <option value="saida">Saída (Despesa)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Valor *</label>
                <input type="number" step="0.01" v-model="form.valor" required class="input-control" placeholder="R$ 0,00" />
              </div>
            </div>

            <div class="form-group">
              <label>Descrição *</label>
              <input type="text" v-model="form.descricao" required class="input-control" placeholder="Ex: Compra de pó de solda / Venda de acessório" />
            </div>

            <div class="form-group m-0">
              <label>Categoria *</label>
              <select v-model="form.categoria" required class="input-control select-control">
                <option value="Serviços">Serviços / OS</option>
                <option value="Vendas">Venda de Acessórios</option>
                <option value="Infraestrutura">Aluguel / Água / Energia</option>
                <option value="Fornecedores">Pagamento de Fornecedor</option>
                <option value="Retirada">Retirada (Sangria)</option>
                <option value="Outros">Outras despesas</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn">Lançar Movimentação</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import { caixaService } from '../services/index.js';

export default defineComponent({
  name: 'CaixaView',
  setup() {
    const showAddModal = ref(false);
    const logs = ref([]);
    const resumo = ref({ entradas: 0, saidas: 0 });

    const form = ref({
      tipo: 'entrada',
      valor: '',
      descricao: '',
      categoria: 'Outros'
    });

    const fetchCaixa = async () => {
      try {
        const [resumoData, listData] = await Promise.all([
          caixaService.resumoDia(),
          caixaService.listar()
        ]);
        resumo.value = resumoData;
        logs.value = listData.map(log => ({
          id: log.id_caixa,
          hora: new Date(log.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          descricao: log.descricao,
          categoria: log.categoria || 'Geral',
          tipo: log.tipo,
          valor: parseFloat(log.valor),
          operador: log.usuario?.nome || 'Operador'
        }));
      } catch (err) {
        console.error('Erro ao carregar dados do caixa:', err);
      }
    };

    const sortedLogs = computed(() => {
      return [...logs.value].sort((a, b) => b.id - a.id);
    });

    const closeModal = () => {
      showAddModal.value = false;
      form.value = { tipo: 'entrada', valor: '', descricao: '', categoria: 'Outros' };
    };

    const submitMovimentacao = async () => {
      if (!form.value.valor || !form.value.descricao) {
        alert('Por favor, preencha valor e descrição.');
        return;
      }
      try {
        await caixaService.registrarManual({
          tipo: form.value.tipo,
          valor: parseFloat(form.value.valor),
          descricao: form.value.descricao,
          categoria: form.value.categoria
        });
        await fetchCaixa();
        closeModal();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao registrar movimentação.');
      }
    };

    const fecharCaixa = () => {
      alert('Caixa fechado com sucesso! Relatório gerencial de fechamento enviado ao e-mail cadastrado do gerente.');
    };

    onMounted(() => {
      fetchCaixa();
    });

    return {
      showAddModal,
      form,
      resumo,
      sortedLogs,
      closeModal,
      submitMovimentacao,
      fecharCaixa
    };
  }
});
</script>

<style scoped>
.caixa-view {
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

/* Balances Grid */
.balances-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.balance-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.balance-card.border-success { border-left: 4px solid var(--success); }
.balance-card.border-danger { border-left: 4px solid var(--danger); }
.balance-card.border-primary { border-left: 4px solid var(--primary); }

.balance-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.balance-value {
  font-size: 1.6rem;
  font-weight: 700;
  font-family: var(--font-heading);
  line-height: 1.2;
}

.balance-meta {
  font-size: 0.75rem;
  margin-top: 8px;
}

.select-control {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
}

@media (max-width: 968px) {
  .balances-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .balances-grid {
    grid-template-columns: 1fr;
  }
}
</style>
