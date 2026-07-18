<template>
  <div class="caixa-view">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="header-section">
      <div>
        <h1 class="page-title">Caixa</h1>
        <p class="page-subtitle">Acompanhe as movimentações financeiras do dia e realize conciliações.</p>
      </div>
      <div class="flex gap-2">
        <template v-if="caixaAberto">
          <button class="btn btn-secondary" @click="showFecharModal = true">
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
        </template>
        <template v-else>
          <button class="btn" @click="showAbrirModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 1 1 9.9-1" />
            </svg>
            <span>Abrir Caixa</span>
          </button>
        </template>
      </div>
    </div>

    <!-- ── Estado: Caixa Fechado ────────────────────────────────────────────── -->
    <div v-if="!caixaAberto && !loading" class="card caixa-fechado-card">
      <div class="caixa-fechado-content">
        <div class="caixa-fechado-icon">🔒</div>
        <h3>Caixa Fechado</h3>
        <p class="text-muted">Informe o fundo de troco para abrir o caixa de hoje.</p>
        <button class="btn mt-4" @click="showAbrirModal = true">Abrir Caixa do Dia</button>
      </div>
    </div>

    <!-- ── Cards de Resumo (visível apenas quando aberto) ───────────────────── -->
    <div v-if="caixaAberto" class="balances-grid">
      <div class="card balance-card">
        <span class="balance-label">Abertura de Caixa</span>
        <span class="balance-value text-white">R$ {{ fmt(resumo.abertura) }}</span>
        <span class="balance-meta text-muted">Fundo de troco do dia</span>
      </div>
      <div class="card balance-card border-success">
        <span class="balance-label">Total Entradas (+)</span>
        <span class="balance-value text-success">R$ {{ fmt(resumo.entradas) }}</span>
        <span class="balance-meta text-muted">Vendas e Serviços (OS)</span>
      </div>
      <div class="card balance-card border-danger">
        <span class="balance-label">Total Saídas (-)</span>
        <span class="balance-value text-danger">R$ {{ fmt(resumo.saidas) }}</span>
        <span class="balance-meta text-muted">Despesas operacionais</span>
      </div>
      <div class="card balance-card border-primary">
        <span class="balance-label">Saldo em Caixa</span>
        <span class="balance-value font-bold" :class="resumo.saldo >= 0 ? 'text-primary' : 'text-danger'">
          R$ {{ fmt(resumo.saldo) }}
        </span>
        <span class="balance-meta text-muted">Abertura + Entradas − Saídas</span>
      </div>
    </div>

    <!-- ── Tabela de Movimentações ───────────────────────────────────────────── -->
    <div v-if="caixaAberto" class="card logs-card">
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

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  MODAL: Abrir Caixa                                                   -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="showAbrirModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Abrir Caixa do Dia</h3>
          <button class="close-btn" @click="showAbrirModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitAbrirCaixa">
          <div class="modal-body">
            <p class="text-muted mb-4">
              Informe o valor em dinheiro disponível no caixa no início do dia (fundo de troco).
              <br><strong>Pode ser R$ 0,00</strong> caso não haja troco.
            </p>
            <div class="form-group m-0">
              <label>Valor de Abertura (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                v-model="formAbertura.valor"
                required
                class="input-control"
                placeholder="Ex: 100,00"
                autofocus
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAbrirModal = false">Cancelar</button>
            <button type="submit" class="btn" :disabled="abrindo">
              {{ abrindo ? 'Abrindo...' : '🔓 Abrir Caixa' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  MODAL: Lançar Movimentação Manual                                    -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
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

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  MODAL: Fechamento de Caixa (Resumo)                                  -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="showFecharModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔒 Fechamento de Caixa</h3>
          <button class="close-btn" @click="showFecharModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="text-muted mb-4">Resumo do dia — {{ dataHoje }}</p>
          <div class="fechamento-resumo">
            <div class="resumo-row">
              <span class="text-muted">Abertura de Caixa</span>
              <span>R$ {{ fmt(resumo.abertura) }}</span>
            </div>
            <div class="resumo-row">
              <span class="text-success">Total de Entradas</span>
              <span class="text-success">+ R$ {{ fmt(resumo.entradas) }}</span>
            </div>
            <div class="resumo-row">
              <span class="text-danger">Total de Saídas</span>
              <span class="text-danger">− R$ {{ fmt(resumo.saidas) }}</span>
            </div>
            <div class="resumo-row resumo-total">
              <span>Saldo Final em Caixa</span>
              <span :class="resumo.saldo >= 0 ? 'text-success' : 'text-danger'">
                R$ {{ fmt(resumo.saldo) }}
              </span>
            </div>
            <div class="resumo-row text-muted">
              <span>Movimentações registradas</span>
              <span>{{ sortedLogs.length }}</span>
            </div>
          </div>
          <p class="text-muted mt-4" style="font-size:0.85rem;">
            ⚠️ O fechamento é apenas um registro do resumo. O caixa poderá ser aberto novamente amanhã.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showFecharModal = false">Cancelar</button>
          <button class="btn btn-danger-solid" @click="confirmarFechamento">Confirmar Fechamento</button>
        </div>
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
    const loading = ref(true);
    const caixaAberto = ref(false);
    const showAddModal = ref(false);
    const showAbrirModal = ref(false);
    const showFecharModal = ref(false);
    const abrindo = ref(false);

    const logs = ref([]);
    const resumo = ref({ abertura: 0, entradas: 0, saidas: 0, saldo: 0, caixaAberto: false });

    const form = ref({ tipo: 'entrada', valor: '', descricao: '', categoria: 'Outros' });
    const formAbertura = ref({ valor: '' });

    // Formata número como moeda pt-BR
    const fmt = (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Data de hoje formatada
    const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    const fetchCaixa = async () => {
      loading.value = true;
      try {
        const [resumoData, listData] = await Promise.all([
          caixaService.resumoDia(),
          caixaService.listar(),
        ]);
        resumo.value = resumoData;
        caixaAberto.value = resumoData.caixaAberto;
        logs.value = listData
          .filter(log => log.categoria !== 'Abertura de Caixa')
          .map(log => ({
            id: log.id_caixa,
            hora: new Date(log.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            descricao: log.descricao,
            categoria: log.categoria || 'Geral',
            tipo: log.tipo,
            valor: parseFloat(log.valor),
            operador: log.usuario?.nome || 'Operador',
          }));
      } catch (err) {
        console.error('Erro ao carregar dados do caixa:', err);
      } finally {
        loading.value = false;
      }
    };

    const sortedLogs = computed(() => [...logs.value].sort((a, b) => b.id - a.id));

    // ── Abrir Caixa ───────────────────────────────────────────────────────────
    const submitAbrirCaixa = async () => {
      if (formAbertura.value.valor === '') {
        alert('Informe o valor de abertura.');
        return;
      }
      abrindo.value = true;
      try {
        await caixaService.abrir(parseFloat(formAbertura.value.valor));
        showAbrirModal.value = false;
        formAbertura.value = { valor: '' };
        await fetchCaixa();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao abrir caixa.');
      } finally {
        abrindo.value = false;
      }
    };

    // ── Lançar Movimentação ───────────────────────────────────────────────────
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
          categoria: form.value.categoria,
        });
        await fetchCaixa();
        closeModal();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao registrar movimentação.');
      }
    };

    // ── Fechar Caixa ──────────────────────────────────────────────────────────
    const confirmarFechamento = () => {
      showFecharModal.value = false;
      alert(`✅ Caixa fechado!\n\nResumo do dia:\n• Abertura: R$ ${fmt(resumo.value.abertura)}\n• Entradas: R$ ${fmt(resumo.value.entradas)}\n• Saídas: R$ ${fmt(resumo.value.saidas)}\n• Saldo Final: R$ ${fmt(resumo.value.saldo)}`);
    };

    onMounted(fetchCaixa);

    return {
      loading, caixaAberto,
      showAddModal, showAbrirModal, showFecharModal,
      abrindo, form, formAbertura,
      resumo, logs, sortedLogs,
      fmt, dataHoje,
      submitAbrirCaixa, closeModal, submitMovimentacao, confirmarFechamento,
    };
  },
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

.page-title { font-size: 2rem; margin-bottom: 4px; }
.page-subtitle { color: var(--text-muted); font-size: 0.95rem; }
.btn-icon { width: 18px; height: 18px; }
.mt-4 { margin-top: 16px; }

/* ── Caixa Fechado ──────────────────────────────────────────────────────── */
.caixa-fechado-card {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}
.caixa-fechado-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}
.caixa-fechado-icon { font-size: 3.5rem; line-height: 1; }
.caixa-fechado-content h3 { font-size: 1.5rem; font-weight: 700; }

/* ── Balances Grid ──────────────────────────────────────────────────────── */
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
.balance-card.border-danger  { border-left: 4px solid var(--danger); }
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
.balance-meta { font-size: 0.75rem; margin-top: 8px; }

/* ── Fechamento Resumo ──────────────────────────────────────────────────── */
.fechamento-resumo {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.resumo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 0.95rem;
  border-bottom: 1px solid var(--border);
}
.resumo-row:last-child { border-bottom: none; }
.resumo-total {
  font-size: 1.05rem;
  font-weight: 700;
  background: rgba(255,255,255,0.04);
}

.btn-danger-solid {
  background: var(--danger);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-danger-solid:hover { opacity: 0.85; }

.select-control {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
}

@media (max-width: 968px) {
  .balances-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 500px) {
  .balances-grid { grid-template-columns: 1fr; }
}
</style>
