<template>
  <div class="compras-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Compras</h1>
        <p class="page-subtitle">Registro de compras, gestão de fornecedores e histórico de aquisições.</p>
      </div>
      <div class="flex gap-2" v-if="activeTab === 'historico'">
        <button class="btn" @click="activeTab = 'nova'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nova Compra</span>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <button :class="['tab-btn', { active: activeTab === 'nova' }]" @click="activeTab = 'nova'">
        Nova Compra
      </button>
      <button :class="['tab-btn', { active: activeTab === 'historico' }]" @click="goToHistorico">
        Histórico de Compras
      </button>
      <button :class="['tab-btn', { active: activeTab === 'fornecedores' }]" @click="goToFornecedores">
        Fornecedores
      </button>
    </div>

    <!-- ===================== TAB: NOVA COMPRA ===================== -->
    <div v-if="activeTab === 'nova'" class="tab-content">
      <form @submit.prevent="registrarCompra">
        <!-- Cabeçalho da Compra -->
        <div class="card mb-4">
          <h3 class="section-title mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Dados da Compra
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label>Data da Compra *</label>
              <input type="date" v-model="compraForm.data_compra" required class="input-control" />
            </div>
            <div class="form-group">
              <label>Fornecedor *</label>
              <select
                v-model="compraForm.id_fornecedor"
                required
                class="input-control select-control"
              >
                <option value="">Selecione o Fornecedor</option>
                <option v-for="f in fornecedoresAtivos" :key="f.id_fornecedor" :value="f.id_fornecedor">
                  {{ f.nome }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group m-0">
            <label>Observação</label>
            <textarea v-model="compraForm.observacao" class="input-control textarea-control" rows="2" placeholder="Nota fiscal, condições de pagamento, etc."></textarea>
          </div>
        </div>

        <!-- Itens da Compra -->
        <div class="card mb-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
              Itens da Compra
            </h3>
            <div class="flex gap-2">
              <button type="button" class="btn btn-secondary btn-sm" @click="adicionarItemEstoque">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon-sm">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Produto do Estoque
              </button>
              <button type="button" class="btn btn-compra btn-sm" @click="abrirModalProduto">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon-sm">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Novo Produto
              </button>
            </div>
          </div>

          <!-- Tabela de Itens -->
          <div v-if="compraForm.itens.length > 0" class="items-table-wrapper">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Produto / Descrição</th>
                  <th style="width:90px">Qtd</th>
                  <th style="width:140px">Custo Unit.</th>
                  <th style="width:140px" class="text-right">Subtotal</th>
                  <th style="width:40px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in compraForm.itens" :key="idx" class="item-row">
                  <td>
                    <div class="item-produto-cell">
                      <select v-model="item.id_produto" @change="onSelectProduto(item)" required class="input-control input-sm select-control">
                        <option value="">Selecione o produto</option>
                        <option v-for="p in products" :key="p.id_produto" :value="p.id_produto">
                          {{ p.descricao }} (Atual: {{ p.estoque_atual }})
                        </option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <input type="number" v-model="item.quantidade" min="1" required class="input-control input-sm" />
                  </td>
                  <td>
                    <div class="input-prefix-wrapper">
                      <span class="input-prefix">R$</span>
                      <input type="number" step="0.01" v-model="item.valor_custo_unitario" min="0.01" required class="input-control input-sm has-prefix" />
                    </div>
                  </td>
                  <td class="text-right font-bold subtotal-cell">
                    R$ {{ subtotalItem(item).toFixed(2) }}
                  </td>
                  <td>
                    <button type="button" class="btn btn-danger btn-xs btn-icon-only" @click="removerItem(idx)" title="Remover">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-items">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            </svg>
            <p>Nenhum item adicionado.</p>
            <p class="text-xs text-muted">Use os botões acima para adicionar produtos do estoque ou criar novos.</p>
          </div>

          <!-- Total -->
          <div v-if="compraForm.itens.length > 0" class="total-section">
            <div class="total-row">
              <span class="text-muted">Total de Itens:</span>
              <span class="font-semibold">{{ totalItens }} un</span>
            </div>
            <div class="total-row total-main">
              <span>Valor Total da Compra:</span>
              <span class="total-value">R$ {{ totalCompra.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="flex gap-3 justify-end">
          <button type="button" class="btn btn-secondary" @click="resetarFormulario">
            Limpar Formulário
          </button>
          <button type="submit" class="btn btn-compra" :disabled="salvando || compraForm.itens.length === 0">
            <span v-if="salvando">Registrando...</span>
            <span v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Registrar Compra
            </span>
          </button>
        </div>
      </form>
    </div>

    <!-- ===================== TAB: HISTÓRICO ===================== -->
    <div v-else-if="activeTab === 'historico'" class="tab-content">
      <!-- Filtros -->
      <div class="card filters-card mb-4">
        <div class="flex gap-3 flex-wrap">
          <div class="flex gap-2 items-center">
            <label class="label-inline">De:</label>
            <input type="date" v-model="filtros.data_inicio" class="input-control" style="width:170px" />
          </div>
          <div class="flex gap-2 items-center">
            <label class="label-inline">Até:</label>
            <input type="date" v-model="filtros.data_fim" class="input-control" style="width:170px" />
          </div>
          <div style="width:220px">
            <select v-model="filtros.id_fornecedor" class="input-control select-control">
              <option value="">Todos os Fornecedores</option>
              <option v-for="f in fornecedores" :key="f.id_fornecedor" :value="f.id_fornecedor">{{ f.nome }}</option>
            </select>
          </div>
          <button class="btn btn-secondary" @click="buscarCompras">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Filtrar
          </button>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Fornecedor</th>
                <th>Itens</th>
                <th>Valor Total</th>
                <th>Registrado por</th>
                <th class="text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in compras" :key="c.id_compra">
                <td class="text-muted font-mono">#{{ String(c.id_compra).padStart(4, '0') }}</td>
                <td>{{ formatarData(c.data_compra) }}</td>
                <td class="font-semibold text-white">{{ nomeFornecedor(c) }}</td>
                <td>{{ c.itens?.length || 0 }} item(ns)</td>
                <td class="font-bold text-success">R$ {{ parseFloat(c.valor_total).toFixed(2) }}</td>
                <td class="text-muted">{{ c.usuario?.nome || '—' }}</td>
                <td class="text-right">
                  <button class="btn btn-secondary btn-xs" @click="verDetalhes(c)">
                    Detalhes
                  </button>
                </td>
              </tr>
              <tr v-if="compras.length === 0">
                <td colspan="7" class="text-center text-muted py-6">Nenhuma compra encontrada.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Totalizador -->
        <div v-if="compras.length > 0" class="historico-total">
          <span class="text-muted">Total no período:</span>
          <span class="total-value">R$ {{ totalHistorico.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- ===================== TAB: FORNECEDORES ===================== -->
    <div v-else-if="activeTab === 'fornecedores'" class="tab-content">
      <div class="card table-card">
        <div class="flex justify-between items-center mb-4">
          <h3>Fornecedores Cadastrados</h3>
          <div class="flex gap-3">
            <div class="search-wrapper" style="width:280px">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" v-model="buscaFornecedor" @input="buscarFornecedores" placeholder="Buscar fornecedor..." class="input-control search-input" />
            </div>
            <button class="btn btn-compra" @click="abrirNovoFornecedor">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Novo Fornecedor</span>
            </button>
          </div>
        </div>
        <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>Telefone</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th class="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in fornecedores" :key="f.id_fornecedor">
                  <td class="font-semibold text-white">{{ f.nome }}</td>
                  <td class="text-muted font-mono text-sm">{{ f.cnpj || '—' }}</td>
                  <td>{{ f.telefone || '—' }}</td>
                  <td>{{ f.contato || '—' }}</td>
                  <td>
                    <span :class="['badge', f.ativo ? 'badge-success' : 'badge-muted']">
                      {{ f.ativo ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="flex gap-2 justify-end">
                      <button class="btn btn-secondary btn-xs btn-icon-only" title="Editar" @click="editarFornecedor(f)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="btn btn-xs btn-icon-only" :class="f.ativo ? 'btn-danger' : 'btn-secondary'" :title="f.ativo ? 'Desativar' : 'Reativar'" @click="toggleFornecedor(f)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                          <circle cx="12" cy="12" r="10"/>
                          <line v-if="f.ativo" x1="15" y1="9" x2="9" y2="15"/>
                          <line v-if="f.ativo" x1="9" y1="9" x2="15" y2="15"/>
                          <polyline v-else points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="fornecedores.length === 0">
                  <td colspan="6" class="text-center text-muted py-6">Nenhum fornecedor cadastrado.</td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
    </div>

    <!-- Modal: Novo / Editar Fornecedor -->
    <div v-if="showFornecedorModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editandoFornecedorId ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h3>
          <button class="close-btn" @click="cancelarEdicaoFornecedor">&times;</button>
        </div>
        <form @submit.prevent="salvarFornecedor">
          <div class="modal-body">
            <div class="form-group">
              <label>Nome / Razão Social *</label>
              <input type="text" v-model="fornForm.nome" required class="input-control" placeholder="Ex: Distribuidora ABC Ltda" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>CNPJ</label>
                <input type="text" v-model="fornForm.cnpj" class="input-control" placeholder="00.000.000/0000-00" />
              </div>
              <div class="form-group">
                <label>Telefone</label>
                <input type="text" v-model="fornForm.telefone" class="input-control" placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>E-mail</label>
                <input type="email" v-model="fornForm.email" class="input-control" placeholder="comercial@empresa.com" />
              </div>
              <div class="form-group">
                <label>Contato (Responsável)</label>
                <input type="text" v-model="fornForm.contato" class="input-control" placeholder="Nome do vendedor" />
              </div>
            </div>
            <div class="form-group">
              <label>Endereço</label>
              <input type="text" v-model="fornForm.endereco" class="input-control" placeholder="Rua, número, cidade" />
            </div>
            <div class="form-group m-0">
              <label>Observações</label>
              <textarea v-model="fornForm.observacoes" class="input-control textarea-control" rows="2" placeholder="Prazo de entrega, condições, etc."></textarea>
            </div>
          </div>
          <div class="modal-footer flex gap-2">
            <button type="button" class="btn btn-secondary flex-1" @click="cancelarEdicaoFornecedor">Cancelar</button>
            <button type="submit" class="btn flex-1">{{ editandoFornecedorId ? 'Salvar Alterações' : 'Cadastrar Fornecedor' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Detalhes da Compra -->
    <div v-if="compraDetalhes" class="modal-overlay" @click.self="compraDetalhes = null">
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>Compra #{{ String(compraDetalhes.id_compra).padStart(4, '0') }}</h3>
          <button class="close-btn" @click="compraDetalhes = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detalhe-grid mb-4">
            <div class="detalhe-item">
              <span class="detalhe-label">Data</span>
              <span class="detalhe-valor">{{ formatarData(compraDetalhes.data_compra) }}</span>
            </div>
            <div class="detalhe-item">
              <span class="detalhe-label">Fornecedor</span>
              <span class="detalhe-valor">{{ nomeFornecedor(compraDetalhes) }}</span>
            </div>
            <div class="detalhe-item">
              <span class="detalhe-label">Registrado por</span>
              <span class="detalhe-valor">{{ compraDetalhes.usuario?.nome || '—' }}</span>
            </div>
            <div class="detalhe-item">
              <span class="detalhe-label">Valor Total</span>
              <span class="detalhe-valor text-success font-bold">R$ {{ parseFloat(compraDetalhes.valor_total).toFixed(2) }}</span>
            </div>
          </div>
          <div v-if="compraDetalhes.observacao" class="observacao-box mb-4">
            <span class="detalhe-label">Observação:</span> {{ compraDetalhes.observacao }}
          </div>
          <h4 class="mb-3">Itens da Compra</h4>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Custo Unit.</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in compraDetalhes.itens" :key="item.id_item_compra">
                  <td>
                    <span class="font-semibold text-white">{{ item.descricao_item }}</span>
                  </td>
                  <td>{{ item.quantidade }}</td>
                  <td>R$ {{ parseFloat(item.valor_custo_unitario).toFixed(2) }}</td>
                  <td class="text-right font-bold">R$ {{ (parseFloat(item.valor_custo_unitario) * item.quantidade).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="compraDetalhes = null">Fechar</button>
        </div>
      </div>
    </div>
    <!-- Modal: Novo Produto -->
    <div v-if="showNovoProdutoModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Novo Produto/Peça</h3>
          <button class="close-btn" @click="showNovoProdutoModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitNovoProduto">
          <div class="modal-body">
            <div class="form-group">
              <label>Código de Barras</label>
              <input type="text" v-model="prodForm.codigo_barras" class="input-control" placeholder="EAN-13 / GTIN ou código interno" />
            </div>
            <div class="form-group">
              <label>Descrição do Item *</label>
              <input type="text" v-model="prodForm.descricao" required class="input-control" placeholder="Ex: Tela Frontal iPhone 12 OLED" />
            </div>
            <div class="form-group">
              <label>Categoria *</label>
              <select v-model="prodForm.id_categoria" required class="input-control select-control">
                <option value="">Selecione a Categoria</option>
                <optgroup v-for="parent in categoriesHierarchical" :key="parent.id_categoria" :label="parent.nome">
                  <option v-for="sub in parent.subcategorias" :key="sub.id_categoria" :value="sub.id_categoria">
                    {{ sub.nome }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>Estoque Inicial *</label>
                <input type="number" v-model="prodForm.qtd" required min="0" class="input-control" />
              </div>
              <div class="form-group">
                <label>Estoque Mínimo <span class="text-xs text-muted font-normal">(0 ou em branco = sem aviso)</span></label>
                <input type="number" v-model="prodForm.min" min="0" class="input-control" placeholder="0 = Sem aviso" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group m-0">
                <label>Preço de Custo (Compra) *</label>
                <input type="number" step="0.01" v-model="prodForm.custo" required class="input-control" placeholder="R$ 0,00" />
              </div>
              <div class="form-group m-0">
                <label>Preço de Venda (Cliente) *</label>
                <input type="number" step="0.01" v-model="prodForm.venda" required class="input-control" placeholder="R$ 0,00" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showNovoProdutoModal = false">Cancelar</button>
            <button type="submit" class="btn">Salvar e Adicionar à Compra</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import { comprasService, fornecedoresService, produtosService, categoriasService } from '../services/index.js';

export default defineComponent({
  name: 'ComprasView',
  setup() {
    const activeTab = ref('nova');
    const salvando = ref(false);

    // ── Dados ──────────────────────────────────────────────────────────────────
    const compras = ref([]);
    const fornecedores = ref([]);
    const products = ref([]);
    const compraDetalhes = ref(null);
    const buscaFornecedor = ref('');

    // ── Form Nova Compra ───────────────────────────────────────────────────────
    const hoje = new Date().toISOString().split('T')[0];
    const novoCompraForm = () => ({
      data_compra: hoje,
      id_fornecedor: '',
      observacao: '',
      itens: [],
    });
    const compraForm = ref(novoCompraForm());

    // ── Form Novo Produto ──────────────────────────────────────────────────────
    const showNovoProdutoModal = ref(false);
    const categoriesHierarchical = ref([]);
    const prodForm = ref({
      codigo_barras: '',
      descricao: '',
      id_categoria: '',
      qtd: 0,
      min: 0,
      custo: 0.00,
      venda: 0.00
    });

    // ── Form Fornecedor ────────────────────────────────────────────────────────
    const showFornecedorModal = ref(false);
    const editandoFornecedorId = ref(null);
    const novoFornForm = () => ({ nome: '', cnpj: '', telefone: '', email: '', contato: '', endereco: '', observacoes: '' });
    const fornForm = ref(novoFornForm());

    // ── Filtros histórico ──────────────────────────────────────────────────────
    const filtros = ref({ data_inicio: '', data_fim: '', id_fornecedor: '' });

    // ── Computados ─────────────────────────────────────────────────────────────
    const fornecedoresAtivos = computed(() => fornecedores.value.filter(f => f.ativo));

    const subtotalItem = (item) => {
      const qtd = parseFloat(item.quantidade) || 0;
      const custo = parseFloat(item.valor_custo_unitario) || 0;
      return qtd * custo;
    };

    const totalItens = computed(() => compraForm.value.itens.reduce((acc, i) => acc + (parseInt(i.quantidade) || 0), 0));
    const totalCompra = computed(() => compraForm.value.itens.reduce((acc, i) => acc + subtotalItem(i), 0));
    const totalHistorico = computed(() => compras.value.reduce((acc, c) => acc + parseFloat(c.valor_total || 0), 0));

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const buscarFornecedores = async () => {
      try {
        const params = buscaFornecedor.value ? { busca: buscaFornecedor.value } : {};
        fornecedores.value = await fornecedoresService.listar(params);
      } catch (err) {
        console.error('Erro ao buscar fornecedores:', err);
      }
    };

    const buscarProdutos = async () => {
      try {
        const data = await produtosService.listar({});
        products.value = data;
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
      }
    };

    const buscarCompras = async () => {
      try {
        const params = {};
        if (filtros.value.data_inicio) params.data_inicio = filtros.value.data_inicio;
        if (filtros.value.data_fim) params.data_fim = filtros.value.data_fim;
        if (filtros.value.id_fornecedor) params.id_fornecedor = filtros.value.id_fornecedor;
        compras.value = await comprasService.listar(params);
      } catch (err) {
        console.error('Erro ao buscar compras:', err);
      }
    };

    const buscarCategorias = async () => {
      try {
        categoriesHierarchical.value = await categoriasService.listar('true');
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
      }
    };

    // ── Navegação de tabs ──────────────────────────────────────────────────────
    const goToHistorico = () => {
      activeTab.value = 'historico';
      buscarCompras();
    };

    const goToFornecedores = () => {
      activeTab.value = 'fornecedores';
      buscarFornecedores();
    };

    // ── Itens da Compra ────────────────────────────────────────────────────────
    const adicionarItemEstoque = () => {
      compraForm.value.itens.push({
        id_produto: '',
        descricao_item: '',
        quantidade: 1,
        valor_custo_unitario: '',
      });
    };

    const abrirModalProduto = () => {
      prodForm.value = { codigo_barras: '', descricao: '', id_categoria: '', qtd: 0, min: 0, custo: 0, venda: 0 };
      showNovoProdutoModal.value = true;
    };

    const submitNovoProduto = async () => {
      if (!prodForm.value.descricao || !prodForm.value.venda) {
        alert('Descrição e preço de venda são obrigatórios.');
        return;
      }
      try {
        const payload = {
          codigo_barras: prodForm.value.codigo_barras || null,
          descricao: prodForm.value.descricao,
          id_categoria: prodForm.value.id_categoria ? parseInt(prodForm.value.id_categoria) : null,
          estoque_atual: parseInt(prodForm.value.qtd) || 0,
          estoque_minimo: parseInt(prodForm.value.min) || 0,
          valor_custo: parseFloat(prodForm.value.custo) || 0,
          valor_venda: parseFloat(prodForm.value.venda)
        };
        const novoProduto = await produtosService.criar(payload);
        await buscarProdutos();
        showNovoProdutoModal.value = false;
        
        compraForm.value.itens.push({
          id_produto: novoProduto.id_produto,
          descricao_item: novoProduto.descricao,
          quantidade: 1,
          valor_custo_unitario: novoProduto.valor_custo || 0,
        });
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao criar produto.');
      }
    };

    const onSelectProduto = (item) => {
      const prod = products.value.find(p => p.id_produto === parseInt(item.id_produto));
      if (prod) {
        item.descricao_item = prod.descricao;
        item.valor_custo_unitario = parseFloat(prod.valor_custo || 0);
      }
    };

    const removerItem = (idx) => {
      compraForm.value.itens.splice(idx, 1);
    };

    const resetarFormulario = () => {
      compraForm.value = novoCompraForm();
    };

    // ── Registrar Compra ───────────────────────────────────────────────────────
    const registrarCompra = async () => {
      if (compraForm.value.itens.length === 0) {
        alert('Adicione ao menos um item à compra.');
        return;
      }

      if (!compraForm.value.id_fornecedor) {
        alert('Selecione um fornecedor.');
        return;
      }

      // Validar itens
      for (const item of compraForm.value.itens) {
        if (!item.id_produto) {
          alert('Selecione o produto para todos os itens.');
          return;
        }
        if (!item.valor_custo_unitario || parseFloat(item.valor_custo_unitario) <= 0) {
          alert('Informe o custo unitário para todos os itens.');
          return;
        }
      }

      salvando.value = true;
      try {
        const payload = {
          data_compra: compraForm.value.data_compra,
          id_fornecedor: compraForm.value.id_fornecedor,
          observacao: compraForm.value.observacao || null,
          itens: compraForm.value.itens.map(item => ({
            id_produto: parseInt(item.id_produto),
            descricao_item: item.descricao_item,
            quantidade: parseInt(item.quantidade),
            valor_custo_unitario: parseFloat(item.valor_custo_unitario),
          })),
        };

        await comprasService.criar(payload);
        resetarFormulario();
        await buscarProdutos(); // Atualiza estoque local
        activeTab.value = 'historico';
        await buscarCompras();
        alert('✅ Compra registrada com sucesso! Estoque atualizado e despesa lançada no caixa.');
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao registrar compra.');
      } finally {
        salvando.value = false;
      }
    };

    // ── Fornecedores CRUD ──────────────────────────────────────────────────────
    const abrirNovoFornecedor = () => {
      editandoFornecedorId.value = null;
      fornForm.value = novoFornForm();
      showFornecedorModal.value = true;
    };

    const salvarFornecedor = async () => {
      try {
        if (editandoFornecedorId.value) {
          await fornecedoresService.atualizar(editandoFornecedorId.value, fornForm.value);
        } else {
          await fornecedoresService.criar(fornForm.value);
        }
        fornForm.value = novoFornForm();
        editandoFornecedorId.value = null;
        showFornecedorModal.value = false;
        await buscarFornecedores();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao salvar fornecedor.');
      }
    };

    const editarFornecedor = (f) => {
      editandoFornecedorId.value = f.id_fornecedor;
      fornForm.value = {
        nome: f.nome,
        cnpj: f.cnpj || '',
        telefone: f.telefone || '',
        email: f.email || '',
        contato: f.contato || '',
        endereco: f.endereco || '',
        observacoes: f.observacoes || '',
      };
      showFornecedorModal.value = true;
    };

    const cancelarEdicaoFornecedor = () => {
      editandoFornecedorId.value = null;
      fornForm.value = novoFornForm();
      showFornecedorModal.value = false;
    };

    const toggleFornecedor = async (f) => {
      const acao = f.ativo ? 'desativar' : 'reativar';
      if (!confirm(`Deseja ${acao} o fornecedor "${f.nome}"?`)) return;
      try {
        await fornecedoresService.toggleAtivo(f.id_fornecedor);
        await buscarFornecedores();
      } catch (err) {
        alert('Erro ao alterar status do fornecedor.');
      }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const nomeFornecedor = (c) => c.fornecedor?.nome || 'Avulso';

    const formatarData = (dateStr) => {
      if (!dateStr) return '—';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    };

    const verDetalhes = (c) => {
      compraDetalhes.value = c;
    };

    onMounted(async () => {
      await buscarFornecedores();
      await buscarProdutos();
      await buscarCategorias();
    });

    return {
      activeTab,
      salvando,
      compras,
      fornecedores,
      fornecedoresAtivos,
      products,
      compraDetalhes,
      buscaFornecedor,
      compraForm,
      categoriesHierarchical,
      showNovoProdutoModal,
      prodForm,
      showFornecedorModal,
      fornForm,
      editandoFornecedorId,
      filtros,
      subtotalItem,
      totalItens,
      totalCompra,
      totalHistorico,
      buscarFornecedores,
      buscarCompras,
      goToHistorico,
      goToFornecedores,
      adicionarItemEstoque,
      abrirModalProduto,
      submitNovoProduto,
      onSelectProduto,
      removerItem,
      resetarFormulario,
      registrarCompra,
      abrirNovoFornecedor,
      salvarFornecedor,
      editarFornecedor,
      cancelarEdicaoFornecedor,
      toggleFornecedor,
      nomeFornecedor,
      formatarData,
      verDetalhes,
    };
  }
});
</script>

<style scoped>
.compras-view {
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

.tab-btn:hover { color: var(--text-white); background-color: rgba(255,255,255,0.02); }
.tab-btn.active { color: var(--primary-hover); border-bottom-color: var(--primary); }

/* Botões extras */
.btn-icon { width: 18px; height: 18px; }
.btn-icon-sm { width: 15px; height: 15px; }

.btn-sm {
  padding: 8px 14px;
  font-size: 0.85rem;
}

.btn-compra {
  background: linear-gradient(135deg, var(--primary), #00a846);
  color: white;
  padding: 12px 28px;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-compra:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-outline-accent {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
}

.btn-outline-accent:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.6);
}

/* Section title */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-white);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.section-icon { width: 18px; height: 18px; color: var(--primary-hover); }

/* Fornecedor selector */
.fornecedor-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fornecedor-tipo {
  font-size: 0.8rem;
}

/* Tabela de itens */
.items-table-wrapper {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table thead th {
  background: rgba(255,255,255,0.03);
  padding: 10px 14px;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}

.items-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  vertical-align: middle;
}

.items-table tbody tr:last-child td { border-bottom: none; }

.items-table tbody tr:hover { background: rgba(255,255,255,0.02); }

.item-row { transition: background 0.15s; }

.item-produto-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-tipo-badge {
  align-self: flex-start;
  font-size: 0.6rem;
  padding: 2px 7px;
}

.input-sm {
  padding: 6px 10px;
  font-size: 0.88rem;
  height: 34px;
}

.input-prefix-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-input);
}

.input-prefix {
  padding: 0 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  background: rgba(255,255,255,0.04);
  border-right: 1px solid var(--border);
  height: 34px;
  display: flex;
  align-items: center;
}

.has-prefix {
  border: none;
  border-radius: 0;
  background: transparent;
  flex: 1;
}

.subtotal-cell {
  color: var(--text-white);
  font-size: 0.95rem;
}

.empty-items {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.3;
  margin-bottom: 4px;
}

/* Total */
.total-section {
  border-top: 1px solid var(--border);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.total-row {
  display: flex;
  gap: 20px;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.total-main {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-white);
}

.total-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary-hover);
}

/* Histórico */
.historico-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid var(--border);
  font-size: 0.95rem;
  color: var(--text-muted);
}

.historico-total .total-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-hover);
}

/* Filtros */
.filters-card { padding: 16px 20px; }
.label-inline {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Search */
.search-wrapper { position: relative; }
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}
.search-input { padding-left: 34px; }

/* Detalhe modal */
.modal-lg { max-width: 680px; }

.detalhe-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detalhe-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detalhe-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.detalhe-valor {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-white);
}

.observacao-box {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.9rem;
  color: var(--text-normal);
}

.text-success { color: var(--primary-hover); }
.font-mono { font-family: monospace; }
.ml-2 { margin-left: 8px; }
.flex-1 { flex: 1; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }

.textarea-control {
  min-height: 60px;
  resize: vertical;
}
</style>
