<template>
  <div class="vendas-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Vendas (PDV)</h1>
        <p class="page-subtitle">Ponto de Venda ágil para acessórios, produtos e atendimento rápido de balcão.</p>
      </div>
      <button class="btn btn-secondary" @click="activeSubTab = activeSubTab === 'pdv' ? 'history' : 'pdv'">
        {{ activeSubTab === 'pdv' ? 'Ver Histórico de Vendas' : 'Ir para Frente de Caixa' }}
      </button>
    </div>

    <!-- PDV Layout -->
    <div v-if="activeSubTab === 'pdv'" class="pdv-grid">
      <!-- Left: Products Catalog & Search -->
      <div class="card catalog-section">
        <h3 class="mb-4">Adicionar Itens</h3>
        <div class="form-group mb-4">
          <div class="input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              v-model="productQuery" 
              placeholder="Buscar por código ou descrição do acessório..." 
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
            Nenhum produto cadastrado para venda rápida.
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
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p>O cupom de venda está vazio.</p>
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
          <!-- Discount / Payment -->
          <div class="grid grid-cols-2 gap-3 mb-2">
            <div class="form-group m-0">
              <label>Desconto (R$)</label>
              <input type="number" step="0.01" v-model="desconto" class="input-control" placeholder="0,00" />
            </div>
            <div class="form-group m-0">
              <label>Forma de Pagamento</label>
              <select v-model="formaPagamento" class="input-control select-control">
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão Débito/Crédito</option>
                <option value="PIX">PIX</option>
              </select>
            </div>
          </div>

          <!-- Total Calculation -->
          <div class="totals-block">
            <div class="flex justify-between text-xs mb-1 text-muted">
              <span>Subtotal:</span>
              <span>R$ {{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-xs mb-2 text-danger">
              <span>Desconto:</span>
              <span>- R$ {{ parseFloat(desconto || 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm font-bold border-top pt-2">
              <span>TOTAL A PAGAR:</span>
              <span class="text-success text-lg">R$ {{ total.toFixed(2) }}</span>
            </div>
          </div>

          <button class="btn btn-block" :disabled="cart.length === 0" @click="finalizeSale">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Finalizar Venda (F2)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- History Layout -->
    <div v-else class="card history-section">
      <h3 class="mb-4">Histórico de Vendas Avulsas</h3>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Data/Hora</th>
              <th>Operador</th>
              <th>Itens</th>
              <th>Desconto</th>
              <th>Total Recebido</th>
              <th>Pagamento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in sales" :key="sale.id">
              <td class="font-bold text-white">#{{ sale.codigo }}</td>
              <td>{{ sale.data }}</td>
              <td>{{ sale.usuario }}</td>
              <td>
                <div class="text-xs text-muted" v-for="(item, i) in sale.itens" :key="i">
                  • {{ item.descricao }} (x{{ item.qtd }})
                </div>
              </td>
              <td class="text-danger">R$ {{ sale.desconto.toFixed(2) }}</td>
              <td class="font-bold text-success">R$ {{ sale.total.toFixed(2) }}</td>
              <td>
                <span class="badge badge-info">{{ sale.formaPagamento }}</span>
              </td>
            </tr>
            <tr v-if="sales.length === 0">
              <td colspan="7" class="text-center text-muted py-6">Nenhuma venda registrada no período.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { produtosService, vendasService } from '../services/index.js';

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
        console.error('Erro ao buscar catálogo de produtos:', err);
      }
    };

    const fetchSales = async () => {
      try {
        const data = await vendasService.listar();
        sales.value = data.map(s => ({
          id: s.id_venda,
          codigo: s.id_venda.toString().padStart(4, '0'),
          data: new Date(s.data_venda).toLocaleString('pt-BR'),
          usuario: s.atendente?.nome || 'Operador',
          itens: (s.itens || []).map(it => ({
            descricao: it.produto?.descricao || 'Produto/Item',
            qtd: it.quantidade
          })),
          desconto: parseFloat(s.desconto || 0),
          total: parseFloat(s.valor_total),
          formaPagamento: s.forma_pagamento
        }));
      } catch (err) {
        console.error('Erro ao buscar histórico de vendas:', err);
      }
    };

    watch(productQuery, (newVal) => {
      if (newVal) {
        // Se for uma busca exata por código de barras, adiciona direto ao carrinho
        const exactMatch = catalog.value.find(p => p.codigo_barras === newVal.trim());
        if (exactMatch) {
          addToCart(exactMatch);
          productQuery.value = ''; // Limpa para próxima leitura do leitor
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

    const subtotal = computed(() => {
      return cart.value.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
    });

    const total = computed(() => {
      const discountVal = parseFloat(desconto.value || 0);
      const res = subtotal.value - discountVal;
      return res < 0 ? 0 : res;
    });

    const addToCart = (product) => {
      if (product.qtd <= 0) {
        alert('Produto sem saldo em estoque.');
        return;
      }
      const existing = cart.value.find(item => item.id === product.id);
      if (existing) {
        if (existing.qtd < product.qtd) {
          existing.qtd++;
        } else {
          alert('Quantidade máxima em estoque atingida.');
        }
      } else {
        cart.value.push({
          id: product.id,
          descricao: product.descricao,
          preco: product.venda,
          qtd: 1,
          maxStock: product.qtd
        });
      }
    };

    const removeFromCart = (index) => {
      cart.value.splice(index, 1);
    };

    const incrementQty = (index) => {
      const item = cart.value[index];
      if (item.qtd < item.maxStock) {
        item.qtd++;
      } else {
        alert('Estoque esgotado para o item.');
      }
    };

    const decrementQty = (index) => {
      const item = cart.value[index];
      if (item.qtd > 1) {
        item.qtd--;
      } else {
        removeFromCart(index);
      }
    };

    const finalizeSale = async () => {
      if (cart.value.length === 0) return;
      try {
        await vendasService.criar({
          forma_pagamento: formaPagamento.value,
          desconto: parseFloat(desconto.value || 0),
          itens: cart.value.map(item => ({
            id_produto: item.id,
            quantidade: item.qtd
          }))
        });

        // Registrar movimentações no histórico (localStorage)
        const storedLogs = localStorage.getItem('guicell_movement_logs');
        const logs = storedLogs ? JSON.parse(storedLogs) : [];
        const userObj = JSON.parse(localStorage.getItem('guicell_usuario') || 'null');
        const atendenteNome = userObj ? userObj.nome : 'Operador';

        for (const item of cart.value) {
          logs.unshift({
            id: Date.now() + Math.random(),
            data: new Date().toLocaleString('pt-BR'),
            produto: item.descricao,
            tipo: 'Saída',
            qtd: item.qtd,
            origem: 'Venda rápida (PDV)',
            tecnico: atendenteNome
          });
        }
        localStorage.setItem('guicell_movement_logs', JSON.stringify(logs));

        alert(`Venda finalizada com sucesso! Total: R$ ${total.value.toFixed(2)}.`);
        cart.value = [];
        desconto.value = 0;
        await Promise.all([fetchCatalog(), fetchSales()]);
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao processar venda.');
      }
    };

    onMounted(() => {
      fetchCatalog();
      fetchSales();
    });

    return {
      activeSubTab,
      productQuery,
      desconto,
      formaPagamento,
      cart,
      catalog,
      filteredCatalog,
      subtotal,
      total,
      addToCart,
      removeFromCart,
      incrementQty,
      decrementQty,
      finalizeSale,
      sales
    };
  }
});
</script>

<style scoped>
.vendas-view {
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

.pdv-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 20px;
  align-items: stretch;
}

.catalog-section {
  min-height: 500px;
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.product-item {
  background-color: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.product-item:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.product-desc {
  font-size: 0.85rem;
  line-height: 1.3;
}

.product-cat {
  margin-top: 2px;
}

.stock-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.05);
}

.stock-badge.low {
  color: var(--danger);
  background-color: rgba(239, 68, 68, 0.1);
}

.stock-badge.ok {
  color: var(--success);
  background-color: rgba(34, 197, 94, 0.1);
}

.block { display: block; }
.col-span-2 { grid-column: span 2 / span 2; }

/* Cart Section */
.cart-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 520px;
}

.cart-main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.cart-items-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  min-height: 180px;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
}

.empty-cart-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
}

.cart-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.remove-cart-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}
.remove-cart-btn:hover {
  color: var(--danger);
}

.qty-btn {
  background-color: var(--bg-input);
  border: 1px solid var(--border);
  color: var(--text-white);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}
.qty-btn:hover {
  border-color: var(--primary);
  background-color: var(--primary-glow);
}

.cart-totals-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.totals-block {
  background-color: var(--bg-dark);
  border: 1px solid var(--border);
  padding: 10px 12px;
  border-radius: 8px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.btn-block {
  width: 100%;
}

.btn-icon {
  width: 18px;
  height: 18px;
}


.select-control {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
}

@media (max-width: 968px) {
  .pdv-grid {
    grid-template-columns: 1fr;
  }
}
</style>
