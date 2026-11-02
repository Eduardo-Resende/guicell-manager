<template>
  <div class="compras-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Compras</h1>
        <p class="page-subtitle">Registro de compras, gestão de fornecedores e histórico de aquisições.</p>
      </div>
      <div class="flex gap-2" v-if="activeTab === 'historico'">
        <button v-if="$pode('compras.criar')" class="btn" @click="activeTab = 'nova'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nova Compra</span>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <button v-if="$pode('compras.criar')" :class="['tab-btn', { active: activeTab === 'nova' }]" @click="activeTab = 'nova'">
        Nova Compra
      </button>
      <button v-if="$pode('compras.ver') || $pode('compras.cancelar')" :class="['tab-btn', { active: activeTab === 'historico' }]" @click="goToHistorico">
        Histórico de Compras
      </button>
      <button v-if="$pode('compras.fornecedores') || $pode('compras.ver')" :class="['tab-btn', { active: activeTab === 'fornecedores' }]" @click="goToFornecedores">
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

        <!-- Condições de Pagamento e Formas Financeiras -->
        <div v-if="compraForm.itens.length > 0" class="card mb-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Condições & Formas de Pagamento
            </h3>
            <div class="flex gap-2">
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" v-model="compraForm.a_prazo" @change="onToggleAPrazo" />
                <span>Compra a Prazo (Pagar Depois / Pendente)</span>
              </label>
            </div>
          </div>

          <div v-if="!compraForm.a_prazo">
            <div class="flex justify-between items-center mb-3">
              <p class="text-sm text-muted">
                Informe a forma de pagamento ou divida o valor entre múltiplos métodos:
              </p>
              <button type="button" class="btn btn-secondary btn-xs" @click="adicionarPagamentoCompra">
                + Adicionar Forma de Pagamento
              </button>
            </div>

            <div v-for="(p, idx) in compraForm.pagamentos" :key="idx" class="pagamento-compra-row mb-2">
              <div class="grid grid-cols-12 gap-2 items-center">
                <div class="col-span-5">
                  <select v-model="p.forma" @change="onFormaCompraChange(p)" required class="input-control select-control input-sm">
                    <option value="dinheiro">Dinheiro em Espécie</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                  </select>
                </div>
                <div class="col-span-4">
                  <select v-model="p.conta" required class="input-control select-control input-sm">
                    <option value="gaveta" v-if="p.forma === 'dinheiro'">Caixa (gaveta)</option>
                    <option value="cofre" v-if="p.forma === 'dinheiro'">Cofre</option>
                    <option value="loja" v-if="p.forma !== 'dinheiro'">Conta da loja (eletrônica)</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    v-model.number="p.valor"
                    required
                    class="input-control input-sm font-bold"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div class="col-span-1 text-right" v-if="compraForm.pagamentos.length > 1">
                  <button type="button" class="btn btn-danger btn-xs btn-icon-only" @click="removerPagamentoCompra(idx)">
                    &times;
                  </button>
                </div>
              </div>
            </div>

            <!-- Resumo Financeiro da Compra -->
            <div class="pagamento-resumo mt-3">
              <div class="flex justify-between text-sm">
                <span class="text-muted">Total Pago Imediatamente:</span>
                <span class="font-bold text-white">R$ {{ totalPagoCompra.toFixed(2) }}</span>
              </div>
              <div v-if="saldoPendenteCompra > 0" class="flex justify-between text-sm mt-1">
                <span class="text-warning">Saldo Pendente (a pagar futuramente):</span>
                <span class="font-bold text-warning">R$ {{ saldoPendenteCompra.toFixed(2) }}</span>
              </div>
              <div v-if="saldoPendenteCompra < 0" class="flex justify-between text-sm mt-1">
                <span class="text-danger font-bold">Aviso: Total distribuído excede o valor da compra!</span>
              </div>
            </div>
          </div>
          <div v-else class="prazo-box">
            <p class="text-sm text-warning font-semibold">
              📌 Compra a prazo: nenhum valor será retirado do caixa neste momento.
            </p>
            <p class="text-xs text-muted mt-1">
              O valor total de R$ {{ totalCompra.toFixed(2) }} ficará registrado como saldo pendente e os pagamentos poderão ser liquidados pelo histórico de compras.
            </p>
          </div>
        </div>

        <!-- Banner de Caixa Fechado -->
        <div v-if="!caixaAberto" class="p-3 mb-3" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px;">
          <div class="text-danger font-semibold text-sm flex items-center gap-1">
            <span>⚠️ Caixa Fechado</span>
          </div>
          <div class="text-xs text-muted mt-1">É necessário abrir o caixa antes de registrar compras ou pagamentos.</div>
          <router-link to="/caixa" class="text-xs text-info font-medium block mt-1 hover:underline">Abrir Caixa &rarr;</router-link>
        </div>

        <!-- Botões de Ação -->
        <div class="flex gap-3 justify-end">
          <button type="button" class="btn btn-secondary" @click="resetarFormulario">
            Limpar Formulário
          </button>
          <button type="submit" class="btn btn-compra" :disabled="salvando || compraForm.itens.length === 0 || !caixaAberto">
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
                <th>Status</th>
                <th class="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in compras" :key="c.id_movimentacao">
                <td class="text-muted font-mono">#{{ String(c.id_movimentacao).padStart(4, '0') }}</td>
                <td>{{ formatarData(c.data_movimentacao) }}</td>
                <td class="font-semibold text-white">{{ nomeFornecedor(c) }}</td>
                <td>{{ c.itens?.length || 0 }} item(ns)</td>
                <td :class="['font-bold', c.status_pagamento === 'cancelado' ? 'text-muted' : 'text-white']" :style="c.status_pagamento === 'cancelado' ? 'text-decoration: line-through;' : ''">
                  R$ {{ parseFloat(c.valor_total).toFixed(2) }}
                  <div v-if="c.status_pagamento !== 'cancelado' && c.valor_pendente > 0" class="text-xs text-warning font-normal">
                    Pago: R$ {{ (parseFloat(c.valor_pago) || 0).toFixed(2) }}
                  </div>
                </td>
                <td class="text-muted">{{ c.usuario?.nome || '—' }}</td>
                <td>
                  <span v-if="c.status_pagamento === 'cancelado'" class="badge badge-danger">Cancelada</span>
                  <span v-else-if="c.valor_pendente > 0" class="badge badge-warning">
                    Pendente (Falta R$ {{ c.valor_pendente.toFixed(2) }})
                  </span>
                  <span v-else class="badge badge-success">Pago</span>
                  <div v-if="c.status_pagamento === 'cancelado' && c.motivo_cancelamento" class="text-xs text-muted mt-1" style="max-width: 220px; white-space: normal;">
                    Motivo: {{ c.motivo_cancelamento }}
                  </div>
                </td>
                <td class="text-right">
                  <div class="flex gap-2 justify-end">
                    <button
                      v-if="c.status_pagamento !== 'cancelado' && c.valor_pendente > 0 && $pode('compras.criar')"
                      class="btn btn-success btn-xs"
                      @click="abrirModalPagarCompra(c)"
                      title="Liquidar valor pendente"
                    >
                      Pagar Saldo
                    </button>
                    <button class="btn btn-secondary btn-xs" @click="verDetalhes(c)">
                      Detalhes
                    </button>
                    <button v-if="c.status_pagamento !== 'cancelado' && $pode('compras.cancelar')" class="btn btn-danger btn-xs" @click="abrirModalCancelarCompra(c)">
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="compras.length === 0">
                <td colspan="8" class="text-center text-muted py-6">Nenhuma compra encontrada.</td>
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
            <button v-if="$pode('compras.fornecedores')" class="btn btn-compra" @click="abrirNovoFornecedor">
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
                  <td class="text-muted font-mono text-sm">{{ formatCNPJ(f.cnpj) || '—' }}</td>
                  <td>{{ formatPhone(f.telefone) || '—' }}</td>
                  <td>{{ f.contato || '—' }}</td>
                  <td>
                    <span :class="['badge', f.ativo ? 'badge-success' : 'badge-muted']">
                      {{ f.ativo ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div v-if="$pode('compras.fornecedores')" class="flex gap-2 justify-end">
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
                <input type="text" :value="fornForm.cnpj" @input="onCnpjInput" class="input-control" placeholder="00.000.000/0000-00" maxlength="18" />
              </div>
              <div class="form-group">
                <label>Telefone</label>
                <input type="text" :value="fornForm.telefone" @input="onPhoneInput" class="input-control" placeholder="(00) 00000-0000" maxlength="15" />
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
          <h3>Compra #{{ String(compraDetalhes.id_movimentacao).padStart(4, '0') }}</h3>
          <button class="close-btn" @click="compraDetalhes = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detalhe-grid mb-4">
            <div class="detalhe-item">
              <span class="detalhe-label">Data</span>
              <span class="detalhe-valor">{{ formatarData(compraDetalhes.data_movimentacao) }}</span>
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
          <div v-if="compraDetalhes.status_pagamento === 'cancelado'" class="observacao-box mb-4" style="border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.08); color: #fca5a5;">
            <strong>Compra Cancelada</strong><br />
            Motivo: {{ compraDetalhes.motivo_cancelamento || 'Não informado' }}
          </div>
          <div v-if="compraDetalhes.observacao" class="observacao-box mb-4">
            <span class="detalhe-label">Observação:</span> {{ compraDetalhes.observacao }}
          </div>
          <h4 class="mb-3">Itens da Compra</h4>
          <div class="table-responsive mb-4">
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
                <tr v-for="item in compraDetalhes.itens" :key="item.id_item_movimentacao">
                  <td>
                    <span class="font-semibold text-white">{{ item.descricao_item }}</span>
                  </td>
                  <td>{{ item.quantidade }}</td>
                  <td>R$ {{ parseFloat(item.valor_unitario).toFixed(2) }}</td>
                  <td class="text-right font-bold">R$ {{ (parseFloat(item.valor_unitario) * item.quantidade).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Histórico de Pagamentos de Caixa -->
          <div v-if="compraDetalhes.pagamentos_caixa && compraDetalhes.pagamentos_caixa.length > 0">
            <h4 class="mb-2">Pagamentos Efetuados no Caixa</h4>
            <div class="pagamentos-lista mb-4">
              <div v-for="lanc in compraDetalhes.pagamentos_caixa" :key="lanc.id_caixa" class="pagamento-card-item">
                <div class="flex justify-between items-center text-sm">
                  <div>
                    <span class="font-semibold text-white">{{ formatarDataHora(lanc.data) }}</span>
                    <span v-for="(p, i) in lanc.pagamentos" :key="i" class="ml-2 badge badge-muted">
                      {{ p.forma }} ({{ p.conta }}) &bull; R$ {{ p.valor.toFixed(2) }}
                    </span>
                  </div>
                  <span class="font-bold text-success">
                    R$ {{ lanc.pagamentos.reduce((acc, p) => acc + p.valor, 0).toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="compraDetalhes.status_pagamento !== 'cancelado'" class="text-sm text-warning mb-4">
            Nenhum pagamento registrado no caixa ainda (compra a prazo / pendente).
          </div>
        </div>
        <div class="modal-footer flex gap-2 justify-end">
          <button
            v-if="compraDetalhes.status_pagamento !== 'cancelado' && compraDetalhes.valor_pendente > 0 && $pode('compras.criar')"
            class="btn btn-success"
            @click="abrirModalPagarCompra(compraDetalhes)"
          >
            Pagar Saldo Pendente (R$ {{ compraDetalhes.valor_pendente.toFixed(2) }})
          </button>
          <button v-if="compraDetalhes.status_pagamento !== 'cancelado' && $pode('compras.cancelar')" class="btn btn-danger" @click="abrirModalCancelarCompra(compraDetalhes)">
            Cancelar Compra
          </button>
          <button class="btn btn-secondary" @click="compraDetalhes = null">Fechar</button>
        </div>
      </div>
    </div>

    <!-- Modal: Pagar Saldo Pendente da Compra -->
    <div v-if="showPagarCompraModal" class="modal-overlay" @click.self="showPagarCompraModal = false">
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3>Pagar Compra #{{ compraParaPagar ? String(compraParaPagar.id_movimentacao).padStart(4, '0') : '' }}</h3>
          <button class="close-btn" @click="showPagarCompraModal = false">&times;</button>
        </div>
        <form @submit.prevent="confirmarPagamentoCompra">
          <div class="modal-body">
            <div class="conferencia-box mb-4">
              <div class="conferencia-item">
                <span class="text-muted">Fornecedor:</span>
                <span class="font-bold text-white">{{ nomeFornecedor(compraParaPagar) }}</span>
              </div>
              <div class="conferencia-item mt-1">
                <span class="text-muted">Valor Total da Compra:</span>
                <span>R$ {{ parseFloat(compraParaPagar?.valor_total || 0).toFixed(2) }}</span>
              </div>
              <div class="conferencia-item mt-1">
                <span class="text-muted">Já Pago:</span>
                <span class="text-success">R$ {{ (parseFloat(compraParaPagar?.valor_pago) || 0).toFixed(2) }}</span>
              </div>
              <div class="conferencia-item mt-1 font-bold">
                <span class="text-warning">Saldo Pendente:</span>
                <span class="text-warning text-lg">R$ {{ (compraParaPagar?.valor_pendente || 0).toFixed(2) }}</span>
              </div>
            </div>

            <p class="text-sm text-muted mb-3">
              Informe a forma e conta financeira para quitar o saldo (ou parte dele):
            </p>

            <div v-for="(p, idx) in pagamentosQuitar" :key="idx" class="pagamento-compra-row mb-2">
              <div class="grid grid-cols-12 gap-2 items-center">
                <div class="col-span-5">
                  <select v-model="p.forma" @change="onFormaCompraChange(p)" required class="input-control select-control input-sm">
                    <option value="dinheiro">Dinheiro em Espécie</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                  </select>
                </div>
                <div class="col-span-4">
                  <select v-model="p.conta" required class="input-control select-control input-sm">
                    <option value="gaveta" v-if="p.forma === 'dinheiro'">Caixa (gaveta)</option>
                    <option value="cofre" v-if="p.forma === 'dinheiro'">Cofre</option>
                    <option value="loja" v-if="p.forma !== 'dinheiro'">Conta da loja</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    v-model.number="p.valor"
                    required
                    class="input-control input-sm font-bold"
                    placeholder="Valor R$"
                  />
                </div>
                <div class="col-span-1 text-right" v-if="pagamentosQuitar.length > 1">
                  <button type="button" class="btn btn-danger btn-xs btn-icon-only" @click="removerPagamentoQuitar(idx)">
                    &times;
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-between items-center mt-2">
              <button type="button" class="btn btn-secondary btn-xs" @click="adicionarPagamentoQuitar">
                + Adicionar Outra Forma
              </button>
              <div class="text-right text-xs">
                <span class="text-muted">Total a Pagar Agora: </span>
                <span class="font-bold text-white">R$ {{ totalPagarAgora.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer flex gap-2">
            <button type="button" class="btn btn-secondary flex-1" @click="showPagarCompraModal = false" :disabled="pagandoCompra">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success flex-1" :disabled="pagandoCompra || totalPagarAgora <= 0 || totalPagarAgora > (compraParaPagar?.valor_pendente || 0) || !caixaAberto">
              {{ pagandoCompra ? 'Registrando...' : 'Confirmar Pagamento' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Cancelar Compra -->
    <div v-if="showCancelarCompraModal" class="modal-overlay" @click.self="fecharModalCancelarCompra">
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3>Cancelar Compra #{{ compraParaCancelar ? String(compraParaCancelar.id_movimentacao).padStart(4, '0') : '' }}</h3>
          <button class="close-btn" @click="fecharModalCancelarCompra">&times;</button>
        </div>
        <form @submit.prevent="confirmarCancelamentoCompra">
          <div class="modal-body">
            <div class="mb-4" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 12px; font-size: 0.85rem; color: #fca5a5;">
              <strong>Atenção:</strong> O cancelamento irá <strong>subtrair os itens do estoque</strong> (validando se há saldo disponível) e lançar uma <strong>entrada de estorno no Caixa</strong> no valor de <strong>R$ {{ compraParaCancelar ? parseFloat(compraParaCancelar.valor_total).toFixed(2) : '0.00' }}</strong>. A compra continuará visível no histórico como <em>Cancelada</em>.
            </div>
            <div class="form-group m-0">
              <label>Motivo do Cancelamento *</label>
              <textarea
                v-model="motivoCancelamentoCompra"
                required
                rows="3"
                class="input-control textarea-control"
                placeholder="Informe o motivo do cancelamento desta compra..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer flex gap-2">
            <button type="button" class="btn btn-secondary flex-1" @click="fecharModalCancelarCompra" :disabled="cancelandoCompra">Voltar</button>
            <button type="submit" class="btn btn-danger flex-1" :disabled="cancelandoCompra">
              {{ cancelandoCompra ? 'Cancelando...' : 'Confirmar Cancelamento' }}
            </button>
          </div>
        </form>
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
                <input type="number" v-model="prodForm.qtd" required min="0" disabled class="input-control" />
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
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { comprasService, fornecedoresService, produtosService, categoriasService, caixaService } from '../services/index.js';
import { formatCNPJ, formatPhone, unmask, validateCpfCnpj, validatePhone } from '../utils/formatters.js';
import { formatarData } from '../utils/formatDate.js';
import { pode } from '../composables/usePermissoes';

export default defineComponent({
  name: 'ComprasView',
  setup() {
    const abaInicial = pode('compras.criar')
      ? 'nova'
      : (pode('compras.ver') || pode('compras.cancelar'))
        ? 'historico'
        : 'fornecedores';
    const activeTab = ref(abaInicial);
    const salvando = ref(false);
    const caixaAberto = ref(true);
    const checandoCaixa = ref(false);

    const verificarStatusCaixa = async () => {
      try {
        checandoCaixa.value = true;
        const res = await caixaService.status();
        caixaAberto.value = !!res.caixaAberto;
      } catch (e) {
        console.error('Erro ao verificar status do caixa:', e);
      } finally {
        checandoCaixa.value = false;
      }
    };

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
      a_prazo: false,
      pagamentos: [{ forma: 'dinheiro', conta: 'gaveta', valor: '' }],
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
    const totalPagoCompra = computed(() => {
      if (compraForm.value.a_prazo) return 0;
      return compraForm.value.pagamentos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    });
    const saldoPendenteCompra = computed(() => {
      return Math.round((totalCompra.value - totalPagoCompra.value) * 100) / 100;
    });

    const totalHistorico = computed(() =>
      compras.value
        .filter(c => c.status_pagamento !== 'cancelado')
        .reduce((acc, c) => acc + parseFloat(c.valor_total || 0), 0)
    );

    const onToggleAPrazo = () => {
      if (compraForm.value.a_prazo) {
        compraForm.value.pagamentos = [];
      } else {
        compraForm.value.pagamentos = [{ forma: 'dinheiro', conta: 'gaveta', valor: totalCompra.value > 0 ? totalCompra.value : '' }];
      }
    };

    const onFormaCompraChange = (p) => {
      if (p.forma === 'dinheiro') p.conta = 'gaveta';
      else p.conta = 'loja';
    };

    const adicionarPagamentoCompra = () => {
      compraForm.value.pagamentos.push({
        forma: 'pix',
        conta: 'loja',
        valor: saldoPendenteCompra.value > 0 ? saldoPendenteCompra.value : '',
      });
    };

    const removerPagamentoCompra = (idx) => {
      compraForm.value.pagamentos.splice(idx, 1);
    };

    // ── Pagamento de Compra Pendente ───────────────────────────────────────────
    const showPagarCompraModal = ref(false);
    const compraParaPagar = ref(null);
    const pagandoCompra = ref(false);
    const pagamentosQuitar = ref([]);

    const totalPagarAgora = computed(() => {
      return pagamentosQuitar.value.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    });

    const abrirModalPagarCompra = (compra) => {
      if (!caixaAberto.value) {
        alert('O caixa está fechado. Abra uma sessão de caixa antes de realizar pagamentos de compras.');
        return;
      }
      compraParaPagar.value = compra;
      pagamentosQuitar.value = [{
        forma: 'dinheiro',
        conta: 'gaveta',
        valor: compra.valor_pendente > 0 ? compra.valor_pendente : '',
      }];
      showPagarCompraModal.value = true;
    };

    const adicionarPagamentoQuitar = () => {
      const restante = Math.max((compraParaPagar.value?.valor_pendente || 0) - totalPagarAgora.value, 0);
      pagamentosQuitar.value.push({
        forma: 'pix',
        conta: 'loja',
        valor: restante > 0 ? Math.round(restante * 100) / 100 : '',
      });
    };

    const removerPagamentoQuitar = (idx) => {
      pagamentosQuitar.value.splice(idx, 1);
    };

    const confirmarPagamentoCompra = async () => {
      if (!caixaAberto.value) {
        alert('O caixa está fechado. Abra uma sessão de caixa antes de registrar o pagamento.');
        return;
      }
      if (totalPagarAgora.value <= 0) {
        alert('Informe ao menos uma forma de pagamento com valor.');
        return;
      }
      if (totalPagarAgora.value > (compraParaPagar.value?.valor_pendente || 0)) {
        alert('O valor informado excede o saldo pendente desta compra.');
        return;
      }

      pagandoCompra.value = true;
      try {
        const payload = pagamentosQuitar.value.map(p => ({
          forma: p.forma,
          conta: p.conta,
          valor: Number(p.valor),
        }));
        await comprasService.pagar(compraParaPagar.value.id_movimentacao, payload);
        showPagarCompraModal.value = false;
        await buscarCompras();
        alert('✅ Pagamento registrado com sucesso! O valor foi lançado como saída no Caixa.');
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao registrar pagamento da compra.');
      } finally {
        pagandoCompra.value = false;
      }
    };

    // ── Cancelamento de Compra ─────────────────────────────────────────────────
    const showCancelarCompraModal = ref(false);
    const compraParaCancelar = ref(null);
    const motivoCancelamentoCompra = ref('');
    const cancelandoCompra = ref(false);

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
          estoque_atual: 0,
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
      if (!caixaAberto.value) {
        alert('O caixa está fechado. Abra uma sessão de caixa antes de registrar compras.');
        return;
      }
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

      // Validar pagamentos se não for a prazo
      if (!compraForm.value.a_prazo) {
        if (compraForm.value.pagamentos.length === 0) {
          alert('Informe ao menos uma forma de pagamento ou marque a compra como "A Prazo".');
          return;
        }
        for (const p of compraForm.value.pagamentos) {
          if (!p.valor || Number(p.valor) <= 0) {
            alert('Informe um valor válido maior que zero para todas as formas de pagamento.');
            return;
          }
        }
        if (saldoPendenteCompra.value < 0) {
          alert('O valor total pago não pode ser maior que o valor total da compra.');
          return;
        }
      }

      salvando.value = true;
      try {
        const payload = {
          data_compra: compraForm.value.data_compra,
          id_fornecedor: compraForm.value.id_fornecedor,
          observacao: compraForm.value.observacao || null,
          a_prazo: compraForm.value.a_prazo,
          pagamentos: compraForm.value.a_prazo ? [] : compraForm.value.pagamentos.map(p => ({
            forma: p.forma,
            conta: p.conta,
            valor: Number(p.valor),
          })),
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
        alert('✅ Compra registrada com sucesso! Estoque atualizado.');
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

    const onCnpjInput = (e) => {
      fornForm.value.cnpj = formatCNPJ(e.target.value);
    };

    const onPhoneInput = (e) => {
      fornForm.value.telefone = formatPhone(e.target.value);
    };

    const salvarFornecedor = async () => {
      const cleanCnpj = unmask(fornForm.value.cnpj);
      if (cleanCnpj && !validateCpfCnpj(cleanCnpj)) {
        alert('CNPJ inválido. Verifique se possui 14 dígitos.');
        return;
      }

      const cleanPhone = unmask(fornForm.value.telefone);
      if (cleanPhone && !validatePhone(cleanPhone)) {
        alert('Telefone inválido. Informe DDD e número completo (10 ou 11 dígitos).');
        return;
      }

      try {
        const payload = {
          ...fornForm.value,
          nome: fornForm.value.nome ? fornForm.value.nome.trim() : '',
          cnpj: cleanCnpj || null,
          telefone: cleanPhone || null,
        };

        if (editandoFornecedorId.value) {
          await fornecedoresService.atualizar(editandoFornecedorId.value, payload);
        } else {
          await fornecedoresService.criar(payload);
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
        cnpj: formatCNPJ(f.cnpj || ''),
        telefone: formatPhone(f.telefone || ''),
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


    const verDetalhes = (c) => {
      compraDetalhes.value = c;
    };

    const abrirModalCancelarCompra = (c) => {
      compraParaCancelar.value = c;
      motivoCancelamentoCompra.value = '';
      showCancelarCompraModal.value = true;
    };

    const fecharModalCancelarCompra = () => {
      showCancelarCompraModal.value = false;
      compraParaCancelar.value = null;
      motivoCancelamentoCompra.value = '';
    };

    const confirmarCancelamentoCompra = async () => {
      if (!compraParaCancelar.value) return;
      if (!motivoCancelamentoCompra.value || !motivoCancelamentoCompra.value.trim()) {
        alert('Informe o motivo do cancelamento.');
        return;
      }

      cancelandoCompra.value = true;
      try {
        await comprasService.cancelar(compraParaCancelar.value.id_movimentacao, motivoCancelamentoCompra.value.trim());
        if (compraDetalhes.value && compraDetalhes.value.id_movimentacao === compraParaCancelar.value.id_movimentacao) {
          compraDetalhes.value = null;
        }
        fecharModalCancelarCompra();
        await buscarCompras();
        await buscarProdutos();
        alert('✅ Compra cancelada com sucesso! O estoque e o caixa foram estornados.');
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao cancelar compra.');
      } finally {
        cancelandoCompra.value = false;
      }
    };

    const formatarDataHora = (dataStr) => {
      if (!dataStr) return '—';
      const d = new Date(dataStr);
      return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    onMounted(async () => {
      verificarStatusCaixa();
      await buscarFornecedores();
      await buscarProdutos();
      await buscarCategorias();
      if (activeTab.value === 'historico') {
        await buscarCompras();
      }
    });

    watch(activeTab, (tab) => {
      if (tab === 'nova' || tab === 'historico') {
        verificarStatusCaixa();
      }
    });

    return {
      caixaAberto,
      checandoCaixa,
      verificarStatusCaixa,
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
      totalPagoCompra,
      saldoPendenteCompra,
      totalHistorico,
      onToggleAPrazo,
      onFormaCompraChange,
      adicionarPagamentoCompra,
      removerPagamentoCompra,
      showPagarCompraModal,
      compraParaPagar,
      pagandoCompra,
      pagamentosQuitar,
      totalPagarAgora,
      abrirModalPagarCompra,
      adicionarPagamentoQuitar,
      removerPagamentoQuitar,
      confirmarPagamentoCompra,
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
      onCnpjInput,
      onPhoneInput,
      formatCNPJ,
      formatPhone,
      cancelarEdicaoFornecedor,
      toggleFornecedor,
      nomeFornecedor,
      formatarData,
      formatarDataHora,
      verDetalhes,
      showCancelarCompraModal,
      compraParaCancelar,
      motivoCancelamentoCompra,
      cancelandoCompra,
      abrirModalCancelarCompra,
      fecharModalCancelarCompra,
      confirmarCancelamentoCompra,
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
.action-icon { width: 14px; height: 14px; }
.btn-xs { padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; }
.btn-xs.btn-icon-only { padding: 8px; }

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

/* Formas de pagamento na compra */
.pagamento-compra-row {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px;
}
.pagamento-resumo {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  padding: 10px 14px;
}
.prazo-box {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 6px;
  padding: 12px;
}
.pagamentos-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pagamento-card-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
}
.conferencia-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}
.conferencia-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}


.input-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
