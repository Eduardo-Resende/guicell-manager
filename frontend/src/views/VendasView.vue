<template>
  <div class="vendas-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Vendas (PDV)</h1>
        <p class="page-subtitle">Ponto de Venda ágil para acessórios, produtos e atendimento rápido de balcão.</p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-fiado-header"
          :class="{ active: activeSubTab === 'fiado' }"
          @click="activeSubTab = activeSubTab === 'fiado' ? 'pdv' : 'fiado'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Vendas em Aberto
          <span v-if="pendentes.length > 0" class="badge-count">{{ pendentes.length }}</span>
        </button>
        <button class="btn btn-secondary" @click="activeSubTab = activeSubTab === 'pdv' ? 'history' : 'pdv'">
          {{ activeSubTab === 'pdv' ? 'Ver Historico de Vendas' : 'Ir para Frente de Caixa' }}
        </button>
      </div>
    </div>

    <!-- PDV Layout -->
    <div v-if="activeSubTab === 'pdv'" class="pdv-grid">
      <!-- Left: Products Catalog & Search -->
      <div class="card catalog-section">
        <h3 class="mb-4">Adicionar Itens</h3>
        <div class="form-group mb-4">
          <div class="input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              v-model="productQuery"
              placeholder="Buscar por codigo ou descricao do acessorio..."
              class="input-control search-input"
            />
          </div>
        </div>

        <div class="products-grid">
          <div
            v-for="p in filteredCatalog"
            :key="p.id"
            class="product-item"
            @click="addToCart(p)"
          >
            <div class="product-info-wrap">
              <span class="product-desc font-semibold text-white block">{{ p.descricao }}</span>
              <span class="product-cat text-muted text-xs block">{{ p.categoria }} <span v-if="p.codigo_barras">| EAN: {{ p.codigo_barras }}</span></span>
            </div>
            <div class="product-price-add flex justify-between items-center mt-3">
              <span class="price-label text-success font-semibold">R$ {{ p.venda.toFixed(2) }}</span>
              <span class="stock-badge" :class="p.qtd <= 5 ? 'low' : 'ok'">Estoque: {{ p.qtd }}</span>
            </div>
          </div>
          <div v-if="filteredCatalog.length === 0" class="text-center text-muted col-span-2 py-6">
            Nenhum produto cadastrado para venda rapida.
          </div>
        </div>
      </div>

      <!-- Right: Cart / Bill Details -->
      <div class="card cart-section">
        <div class="cart-main-content">
          <h3 class="mb-4 flex justify-between items-center">
            <span>Cupom de Venda</span>
            <span class="badge badge-info">{{ cart.length }} Itens</span>
          </h3>

          <div class="cart-items-wrapper">
            <div v-if="cart.length === 0" class="empty-cart text-center text-muted py-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-cart-icon mb-2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p>O cupom de venda esta vazio.</p>
            </div>
            <div v-else class="cart-list">
              <div v-for="(item, index) in cart" :key="index" class="cart-item">
                <div class="flex justify-between items-start mb-2">
                  <span class="font-semibold text-white text-sm">{{ item.descricao }}</span>
                  <button class="remove-cart-btn" @click="removeFromCart(index)">&times;</button>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <div class="quantity-controller flex items-center gap-2">
                    <button class="qty-btn" @click="decrementQty(index)">-</button>
                    <span class="qty-val font-semibold text-white">{{ item.qtd }}</span>
                    <button class="qty-btn" @click="incrementQty(index)">+</button>
                  </div>
                  <div class="cart-item-prices">
                    <span class="text-xs text-muted mr-2">x R$ {{ item.preco.toFixed(2) }}</span>
                    <span class="font-semibold text-white">R$ {{ (item.preco * item.qtd).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="cart-totals-section">
          <!-- Campo de cliente -->
          <div class="form-group mb-2" style="position:relative">
            <label>
              Cliente
              <span v-if="formaPagamento === 'Fiado'" class="required-star">*</span>
              <span v-else class="optional-label">(opcional)</span>
            </label>
            <div class="client-search-wrapper">
              <input
                type="text"
                v-model="clienteQuery"
                @input="onClienteInput"
                @blur="onClienteBlur"
                :placeholder="formaPagamento === 'Fiado' ? 'Digite o nome do cliente (obrigatorio)...' : 'Buscar cliente...' "
                class="input-control"
                autocomplete="off"
              />
              <button v-if="clienteSelecionado" class="clear-client-btn" @click="clearCliente" title="Remover cliente">&times;</button>
              <div v-if="clienteSelecionado" class="client-selected-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {{ clienteSelecionado.nome }}
              </div>
              <ul v-if="clientesSugestoes.length > 0 && !clienteSelecionado" class="client-dropdown">
                <li v-for="c in clientesSugestoes" :key="c.id_cliente" @mousedown.prevent="selectCliente(c)">
                  <span class="text-white font-semibold">{{ c.nome }}</span>
                  <span class="text-muted text-xs">{{ c.telefone }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-2">
            <div class="form-group m-0">
              <label>Desconto (R$)</label>
              <input type="number" step="0.01" v-model="desconto" class="input-control" placeholder="0,00" />
            </div>
            <div class="form-group m-0">
              <label>Forma de Pagamento</label>
              <select v-model="formaPagamento" class="input-control select-control">
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartao">Cartao Debito/Credito</option>
                <option value="PIX">PIX</option>
                <option value="Fiado">Fiado (Pagar Depois)</option>
              </select>
            </div>
          </div>

          <div v-if="formaPagamento === 'Fiado'" class="fiado-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0;">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>O estoque sera debitado agora. O saldo so entrara no caixa ao receber o pagamento.</span>
          </div>

          <div class="totals-block">
            <div class="flex justify-between text-xs mb-1 text-muted">
              <span>Subtotal:</span><span>R$ {{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-xs mb-2 text-danger">
              <span>Desconto:</span><span>- R$ {{ parseFloat(desconto || 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-bold border-top pt-2">
              <span>{{ formaPagamento === 'Fiado' ? 'TOTAL A RECEBER:' : 'TOTAL A PAGAR:' }}</span>
              <span class="text-lg" :class="formaPagamento === 'Fiado' ? 'text-warning' : 'text-success'">
                R$ {{ total.toFixed(2) }}
              </span>
            </div>
          </div>

          <button
            class="btn btn-block"
            :class="{ 'btn-fiado': formaPagamento === 'Fiado' }"
            :disabled="cart.length === 0"
            @click="finalizeSale"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <polyline v-if="formaPagamento !== 'Fiado'" points="20 6 9 17 4 12" />
              <template v-else>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </template>
            </svg>
            <span>{{ formaPagamento === 'Fiado' ? 'Registrar Fiado (F2)' : 'Finalizar Venda (F2)' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Vendas em Aberto (Pendentes / Fiado) -->
    <div v-else-if="activeSubTab === 'fiado'" class="card fiado-section">
      <div class="fiado-header">
        <div>
          <h3>Vendas em Aberto</h3>
          <p class="text-muted" style="font-size:0.875rem;margin-top:4px;">
            Estas vendas estao com pagamento pendente. O estoque ja foi debitado.
          </p>
        </div>
        <span class="badge-pendentes" v-if="pendentes.length > 0">{{ pendentes.length }} pendente{{ pendentes.length > 1 ? 's' : '' }}</span>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Data da Venda</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Total a Receber</th>
              <th>Acao</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in pendentes" :key="sale.id" class="fiado-row">
              <td class="font-bold text-white">#{{ sale.codigo }}</td>
              <td class="text-muted">{{ sale.data }}</td>
              <td>
                <span v-if="sale.cliente" class="text-white font-semibold">{{ sale.cliente }}</span>
                <span v-else class="text-muted" style="font-style:italic">Sem cliente</span>
              </td>
              <td>
                <div class="text-xs text-muted" v-for="(item, i) in sale.itens" :key="i">
                  * {{ item.descricao }} (x{{ item.qtd }})
                </div>
              </td>
              <td class="font-bold text-warning">R$ {{ sale.total.toFixed(2) }}</td>
              <td>
                <button class="btn-success-outline" @click="openPagarModal(sale)">
                  Marcar como Pago
                </button>
              </td>
            </tr>
            <tr v-if="pendentes.length === 0">
              <td colspan="6" class="text-center text-muted py-6">
                Nenhuma venda pendente de pagamento.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Historico de Vendas -->
    <div v-else class="card history-section">
      <h3 class="mb-4">Historico de Vendas Avulsas</h3>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Data/Hora</th>
              <th>Operador</th>
              <th>Itens</th>
              <th>Desconto</th>
              <th>Total</th>
              <th>Pagamento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in sales" :key="sale.id">
              <td class="font-bold text-white">#{{ sale.codigo }}</td>
              <td>{{ sale.data }}</td>
              <td>{{ sale.usuario }}</td>
              <td>
                <div class="text-xs text-muted" v-for="(item, i) in sale.itens" :key="i">
                  * {{ item.descricao }} (x{{ item.qtd }})
                </div>
              </td>
              <td class="text-danger">R$ {{ sale.desconto.toFixed(2) }}</td>
              <td class="font-bold text-white">R$ {{ sale.total.toFixed(2) }}</td>
              <td><span class="badge badge-info">{{ sale.formaPagamento }}</span></td>
              <td>
                <span v-if="sale.status === 'pendente'" class="badge-pendentes">Pendente</span>
                <span v-else class="badge badge-success">Pago</span>
              </td>
            </tr>
            <tr v-if="sales.length === 0">
              <td colspan="8" class="text-center text-muted py-6">Nenhuma venda registrada no periodo.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: Confirmar Pagamento do Fiado -->
    <div v-if="showPagarModal && vendaSelecionada" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Receber Pagamento</h3>
          <button class="close-btn" @click="closePagarModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="text-muted mb-4">
            Venda <strong class="text-white">#{{ vendaSelecionada.codigo }}</strong> -
            <span v-if="vendaSelecionada.cliente">{{ vendaSelecionada.cliente }}</span>
            <span v-else>Sem cliente</span>
          </p>

          <div class="resumo-pagar">
            <div v-for="(item, i) in vendaSelecionada.itens" :key="i" class="resumo-item">
              <span class="text-muted">* {{ item.descricao }}</span>
              <span class="text-white">x{{ item.qtd }}</span>
            </div>
            <div class="resumo-total-row">
              <span class="font-bold">Total a Receber</span>
              <span class="text-warning font-bold text-lg">R$ {{ vendaSelecionada.total.toFixed(2) }}</span>
            </div>
          </div>

          <div class="form-group mt-4 m-0">
            <label>Forma de Pagamento *</label>
            <select v-model="formaPagamentoFiado" class="input-control select-control">
              <option value="">Selecione...</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartao">Cartao Debito/Credito</option>
              <option value="PIX">PIX</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closePagarModal">Cancelar</button>
          <button class="btn-success-solid" :disabled="!formaPagamentoFiado || pagando" @click="confirmarPagamento">
            {{ pagando ? 'Registrando...' : 'Confirmar Recebimento' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { produtosService, vendasService, clientesService } from '../services/index.js';

export default defineComponent({
  name: 'VendasView',
  setup() {
    const activeSubTab = ref('pdv');
    const productQuery = ref('');
    const desconto = ref(0);
    const formaPagamento = ref('PIX');
    const cart = ref([]);
    const catalog = ref([]);
    const sales = ref([]);
    const pendentes = ref([]);

    const showPagarModal = ref(false);
    const vendaSelecionada = ref(null);
    const formaPagamentoFiado = ref('');
    const pagando = ref(false);

    // Estado do campo de cliente
    const clienteQuery = ref('');
    const clienteSelecionado = ref(null);
    const clientesSugestoes = ref([]);
    let clienteSearchTimer = null;

    const onClienteInput = () => {
      clienteSelecionado.value = null;
      clearTimeout(clienteSearchTimer);
      if (clienteQuery.value.trim().length < 2) { clientesSugestoes.value = []; return; }
      clienteSearchTimer = setTimeout(async () => {
        try {
          const data = await clientesService.listar(clienteQuery.value.trim());
          clientesSugestoes.value = data.slice(0, 6);
        } catch { clientesSugestoes.value = []; }
      }, 250);
    };

    const selectCliente = (c) => {
      clienteSelecionado.value = c;
      clienteQuery.value = c.nome;
      clientesSugestoes.value = [];
    };

    const clearCliente = () => {
      clienteSelecionado.value = null;
      clienteQuery.value = '';
      clientesSugestoes.value = [];
    };

    const onClienteBlur = () => {
      // Small delay so mousedown on dropdown fires first
      setTimeout(() => { clientesSugestoes.value = []; }, 200);
    };

    const mapVenda = (s) => ({
      id: s.id_venda,
      codigo: s.id_venda.toString().padStart(4, '0'),
      data: new Date(s.data_venda).toLocaleString('pt-BR'),
      usuario: s.atendente?.nome || 'Operador',
      cliente: s.cliente?.nome || null,
      itens: (s.itens || []).map(it => ({
        descricao: it.produto?.descricao || 'Item',
        qtd: it.quantidade,
      })),
      desconto: parseFloat(s.desconto || 0),
      total: parseFloat(s.valor_total),
      formaPagamento: s.forma_pagamento,
      status: s.status,
    });

    const fetchCatalog = async () => {
      try {
        const data = await produtosService.listar({ tipo_uso: 'Venda' });
        catalog.value = data.map(p => ({
          id: p.id_produto,
          codigo_barras: p.codigo_barras,
          descricao: p.descricao,
          categoria: p.categoriaRef ? p.categoriaRef.nome : 'Sem Categoria',
          venda: parseFloat(p.valor_venda),
          qtd: p.estoque_atual
        }));
      } catch (err) {
        console.error('Erro ao buscar catalogo de produtos:', err);
      }
    };

    const fetchSales = async () => {
      try {
        const data = await vendasService.listar();
        sales.value = data.map(mapVenda);
      } catch (err) {
        console.error('Erro ao buscar historico de vendas:', err);
      }
    };

    const fetchPendentes = async () => {
      try {
        const data = await vendasService.listarPendentes();
        pendentes.value = data.map(mapVenda);
      } catch (err) {
        console.error('Erro ao buscar vendas pendentes:', err);
      }
    };

    watch(productQuery, (newVal) => {
      if (newVal) {
        const exactMatch = catalog.value.find(p => p.codigo_barras === newVal.trim());
        if (exactMatch) {
          addToCart(exactMatch);
          productQuery.value = '';
        }
      }
    });

    const filteredCatalog = computed(() => {
      if (!productQuery.value) return catalog.value;
      const q = productQuery.value.toLowerCase();
      return catalog.value.filter(p =>
        p.descricao.toLowerCase().includes(q) ||
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q))
      );
    });

    const subtotal = computed(() => cart.value.reduce((acc, item) => acc + (item.preco * item.qtd), 0));

    const total = computed(() => {
      const discountVal = parseFloat(desconto.value || 0);
      const res = subtotal.value - discountVal;
      return res < 0 ? 0 : res;
    });

    const addToCart = (product) => {
      if (product.qtd <= 0) { alert('Produto sem saldo em estoque.'); return; }
      const existing = cart.value.find(item => item.id === product.id);
      if (existing) {
        if (existing.qtd < product.qtd) { existing.qtd++; }
        else { alert('Quantidade maxima em estoque atingida.'); }
      } else {
        cart.value.push({ id: product.id, descricao: product.descricao, preco: product.venda, qtd: 1, maxStock: product.qtd });
      }
    };

    const removeFromCart = (index) => cart.value.splice(index, 1);

    const incrementQty = (index) => {
      const item = cart.value[index];
      if (item.qtd < item.maxStock) { item.qtd++; }
      else { alert('Estoque esgotado para o item.'); }
    };

    const decrementQty = (index) => {
      const item = cart.value[index];
      if (item.qtd > 1) { item.qtd--; } else { removeFromCart(index); }
    };

    const finalizeSale = async () => {
      if (cart.value.length === 0) return;
      const isFiado = formaPagamento.value === 'Fiado';
      if (isFiado && !clienteSelecionado.value) {
        alert('Para venda fiado, o cliente e obrigatorio. Selecione um cliente antes de continuar.');
        return;
      }
      try {
        await vendasService.criar({
          forma_pagamento: formaPagamento.value,
          desconto: parseFloat(desconto.value || 0),
          id_cliente: clienteSelecionado.value?.id_cliente || null,
          itens: cart.value.map(item => ({ id_produto: item.id, quantidade: item.qtd }))
        });

        if (isFiado) {
          alert('Venda registrada como fiado!\n\nCliente: ' + clienteSelecionado.value.nome + '\nTotal: R$ ' + total.value.toFixed(2) + '\nO estoque foi debitado. O saldo entrara no caixa ao receber o pagamento.');
        } else {
          alert('Venda finalizada! Total: R$ ' + total.value.toFixed(2) + '.');
        }

        cart.value = [];
        desconto.value = 0;
        clearCliente();
        await Promise.all([fetchCatalog(), fetchSales(), fetchPendentes()]);
        if (isFiado) activeSubTab.value = 'fiado';
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao processar venda.');
      }
    };

    const openPagarModal = (sale) => {
      vendaSelecionada.value = sale;
      formaPagamentoFiado.value = '';
      showPagarModal.value = true;
    };

    const closePagarModal = () => {
      showPagarModal.value = false;
      vendaSelecionada.value = null;
    };

    const confirmarPagamento = async () => {
      if (!formaPagamentoFiado.value) return;
      pagando.value = true;
      try {
        await vendasService.pagar(vendaSelecionada.value.id, formaPagamentoFiado.value);
        alert('Pagamento registrado! R$ ' + vendaSelecionada.value.total.toFixed(2) + ' via ' + formaPagamentoFiado.value + ' lancado no caixa.');
        closePagarModal();
        await Promise.all([fetchPendentes(), fetchSales()]);
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao registrar pagamento.');
      } finally {
        pagando.value = false;
      }
    };

    onMounted(() => {
      fetchCatalog();
      fetchSales();
      fetchPendentes();
    });

    return {
      activeSubTab, productQuery, desconto, formaPagamento,
      cart, catalog, filteredCatalog, subtotal, total,
      addToCart, removeFromCart, incrementQty, decrementQty, finalizeSale,
      sales, pendentes,
      showPagarModal, vendaSelecionada, formaPagamentoFiado, pagando,
      openPagarModal, closePagarModal, confirmarPagamento,
      clienteQuery, clienteSelecionado, clientesSugestoes,
      onClienteInput, selectCliente, clearCliente, onClienteBlur,
    };
  }
});
</script>

<style scoped>
.vendas-view { display: flex; flex-direction: column; gap: 20px; }
.header-section { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.page-title { font-size: 2rem; margin-bottom: 4px; }
.page-subtitle { color: var(--text-muted); font-size: 0.95rem; }

/* Client search autocomplete */
.client-search-wrapper { position: relative; }
.client-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 100;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px;
  list-style: none; padding: 4px; margin: 0; max-height: 220px; overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.client-dropdown li {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; border-radius: 6px; cursor: pointer; gap: 8px;
}
.client-dropdown li:hover { background: var(--bg-dark); }
.client-selected-badge {
  display: inline-flex; align-items: center; gap: 5px; margin-top: 6px;
  background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);
  color: #818cf8; border-radius: 20px; padding: 3px 10px; font-size: 0.78rem; font-weight: 600;
}
.clear-client-btn {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--text-muted); font-size: 1.1rem;
  cursor: pointer; line-height: 1; padding: 0;
}
.clear-client-btn:hover { color: var(--danger); }
.required-star { color: var(--danger); margin-left: 3px; font-weight: 700; }
.optional-label { color: var(--text-muted); font-size: 0.75rem; margin-left: 4px; font-weight: 400; }

.btn-fiado-header {
  position: relative; border: 1px solid #f59e0b; color: #f59e0b;
  background: rgba(245,158,11,0.08); display: flex; align-items: center; gap: 6px;
}
.btn-fiado-header:hover, .btn-fiado-header.active { background: rgba(245,158,11,0.18); }
.badge-count {
  background: #f59e0b; color: #000; font-size: 0.7rem; font-weight: 700;
  padding: 1px 6px; border-radius: 999px; line-height: 1.5;
}

.pdv-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; align-items: stretch; }
.catalog-section { min-height: 500px; }

.search-icon { position: absolute; left: 14px; color: var(--text-muted); width: 18px; height: 18px; pointer-events: none; }
.search-input { padding-left: 44px; background-color: var(--bg-dark); }

.products-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-height: 420px; overflow-y: auto; padding-right: 4px; }
.product-item { background-color: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 16px; cursor: pointer; transition: all var(--transition-fast); }
.product-item:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.product-desc { font-size: 0.85rem; line-height: 1.3; }
.product-cat { margin-top: 2px; }
.stock-badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background-color: rgba(255,255,255,0.05); }
.stock-badge.low { color: var(--danger); background-color: rgba(239,68,68,0.1); }
.stock-badge.ok { color: var(--success); background-color: rgba(34,197,94,0.1); }
.block { display: block; }
.col-span-2 { grid-column: span 2 / span 2; }

.cart-section { display: flex; flex-direction: column; height: 100%; min-height: 520px; }
.cart-main-content { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.cart-items-wrapper { display: flex; flex-direction: column; flex: 1; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; padding: 12px; background-color: rgba(0,0,0,0.1); margin-bottom: 12px; min-height: 180px; }
.empty-cart { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; height: 100%; }
.empty-cart-icon { width: 48px; height: 48px; color: var(--text-muted); }
.cart-list { display: flex; flex-direction: column; gap: 12px; }
.cart-item { border-bottom: 1px solid var(--border); padding-bottom: 10px; }
.cart-item:last-child { border-bottom: none; padding-bottom: 0; }
.remove-cart-btn { background: none; border: none; color: var(--text-muted); font-size: 1.25rem; cursor: pointer; line-height: 1; padding: 0 4px; }
.remove-cart-btn:hover { color: var(--danger); }
.qty-btn { background-color: var(--bg-input); border: 1px solid var(--border); color: var(--text-white); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
.qty-btn:hover { border-color: var(--primary); background-color: var(--primary-glow); }

.cart-totals-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }

.fiado-warning {
  display: flex; align-items: flex-start; gap: 8px;
  background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3);
  border-radius: 8px; padding: 10px 12px; font-size: 0.8rem; color: #f59e0b;
  margin-bottom: 8px; line-height: 1.4;
}

.totals-block { background-color: var(--bg-dark); border: 1px solid var(--border); padding: 10px 12px; border-radius: 8px; margin-top: 8px; margin-bottom: 12px; }

.btn-block { width: 100%; }
.btn-icon { width: 18px; height: 18px; }

.btn-fiado { background: linear-gradient(135deg, #d97706, #f59e0b) !important; color: #000 !important; border: none !important; }
.btn-fiado:hover { opacity: 0.9; }
.text-warning { color: #f59e0b; }

.fiado-section { }
.fiado-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.badge-pendentes { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.35); font-size: 0.8rem; font-weight: 600; padding: 4px 12px; border-radius: 999px; white-space: nowrap; }
.fiado-row:hover td { background: rgba(245,158,11,0.04); }

.btn-success-outline {
  background: transparent; border: 1px solid var(--success, #22c55e); color: var(--success, #22c55e);
  border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.15s;
  white-space: nowrap; padding: 6px 14px; font-size: 0.8rem;
}
.btn-success-outline:hover { background: rgba(34,197,94,0.15); }

.resumo-pagar { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.resumo-item { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 0.875rem; border-bottom: 1px solid var(--border); }
.resumo-total-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: rgba(255,255,255,0.04); }
.btn-success-solid { background: var(--success, #22c55e); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: opacity 0.2s; }
.btn-success-solid:hover { opacity: 0.85; }
.btn-success-solid:disabled { opacity: 0.5; cursor: not-allowed; }

.select-control { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px; }

@media (max-width: 968px) {
  .pdv-grid { grid-template-columns: 1fr; }
  .header-actions { width: 100%; justify-content: flex-end; }
}
</style>
