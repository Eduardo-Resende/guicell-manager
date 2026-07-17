<template>
  <div class="estoque-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Estoque</h1>
        <p class="page-subtitle">Controle de peças de reposição e acessórios com alerta de nível crítico.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" @click="showAddEntryModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Lançar Entrada</span>
        </button>
        <button class="btn" @click="showAddModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Novo Produto</span>
        </button>
      </div>
    </div>

    <!-- Tabs Menu -->
    <div class="tabs-container">
      <button 
        :class="['tab-btn', { active: activeTab === 'list' }]" 
        @click="activeTab = 'list'"
      >
        Produtos Cadastrados
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'logs' }]" 
        @click="activeTab = 'logs'"
      >
        Histórico de Movimentações
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'categories' }]" 
        @click="activeTab = 'categories'"
      >
        Gerenciar Categorias
      </button>
    </div>

    <!-- Tab Content: Product List -->
    <div v-if="activeTab === 'list'" class="tab-content">
      <!-- Search & Filters -->
      <div class="card filters-card mb-4">
        <div class="flex gap-3">
          <div class="search-wrapper w-full">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar produto ou peça pela descrição..." 
              class="input-control search-input"
            />
          </div>
          <div style="width: 250px; flex-shrink: 0;">
            <select v-model="selectedCategoryFilter" class="input-control select-control">
              <option value="">Todas as Categorias</option>
              <template v-for="parent in categoriesHierarchical" :key="parent.id_categoria">
                <option :value="parent.id_categoria" class="font-bold">{{ parent.nome }}</option>
                <option v-for="sub in parent.subcategorias" :key="sub.id_categoria" :value="sub.id_categoria">
                  &nbsp;&nbsp;— {{ sub.nome }}
                </option>
              </template>
            </select>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="card table-card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Categoria</th>
                <th>Estoque Atual</th>
                <th>Mínimo Requerido</th>
                <th>Preço de Custo</th>
                <th>Preço de Venda</th>
                <th>Status</th>
                <th class="text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prod in filteredProducts" :key="prod.id">
                <td>
                  <div class="item-detail">
                    <span class="font-semibold text-white block">{{ prod.descricao }}</span>
                    <span class="text-xs text-muted block" v-if="prod.codigo_barras">EAN: {{ prod.codigo_barras }}</span>
                  </div>
                </td>
                <td>
                  <span v-if="prod.categoriaRef">
                    <span class="text-muted text-xs block" v-if="prod.categoriaRef.pai">{{ prod.categoriaRef.pai.nome }} &gt;</span>
                    <span class="font-semibold text-white">{{ prod.categoriaRef.nome }}</span>
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="font-bold" :class="{ 'text-danger': prod.qtd <= prod.min }">{{ prod.qtd }}</td>
                <td>{{ prod.min }}</td>
                <td>R$ {{ prod.custo.toFixed(2) }}</td>
                <td class="font-semibold text-white">R$ {{ prod.venda.toFixed(2) }}</td>
                <td>
                  <span 
                    v-if="prod.qtd <= prod.min" 
                    class="badge badge-danger"
                  >
                    Crítico
                  </span>
                  <span 
                    v-else-if="prod.qtd <= prod.min + 2" 
                    class="badge badge-warning"
                  >
                    Alerta
                  </span>
                  <span 
                    v-else 
                    class="badge badge-success"
                  >
                    Normal
                  </span>
                </td>
                <td class="text-right">
                  <button class="btn btn-secondary btn-xs btn-icon-only" title="Editar" @click="editProduct(prod)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="8" class="text-center text-muted py-6">Nenhum produto em estoque encontrado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab Content: Logs -->
    <div v-else-if="activeTab === 'logs'" class="tab-content card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Origem/Destino</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in sortedLogs" :key="log.id">
              <td class="text-muted">{{ log.data }}</td>
              <td class="font-semibold text-white">{{ log.produto }}</td>
              <td>
                <span :class="['badge', log.tipo === 'Entrada' ? 'badge-success' : 'badge-danger']">
                  {{ log.tipo }}
                </span>
              </td>
              <td class="font-bold">{{ log.qtd }} un</td>
              <td>{{ log.origem }}</td>
              <td>{{ log.tecnico }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab Content: Categories Management -->
    <div v-else-if="activeTab === 'categories'" class="tab-content categories-management">
      <div class="grid grid-cols-2 gap-4">
        <!-- List of Categories -->
        <div class="card">
          <h3 class="mb-4">Categorias Cadastradas</h3>
          
          <div class="categories-list">
            <div v-for="parent in categoriesHierarchical" :key="parent.id_categoria" class="category-tree-node mb-4">
              <div class="parent-node flex justify-between items-center py-2 border-b">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-lg">{{ parent.nome }}</span>
                  <span :class="['badge', getTipoUsoBadge(parent.tipo_uso)]" style="font-size: 0.65rem; padding: 2px 8px;">{{ parent.tipo_uso }}</span>
                </div>
                <div class="flex gap-2">
                  <button class="btn btn-secondary btn-xs btn-icon-only" title="Editar" @click="openEditCategory(parent)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="btn btn-danger btn-xs btn-icon-only" title="Remover" @click="deleteCategory(parent.id_categoria)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div class="sub-nodes ml-4 pl-3 border-l" style="border-color: var(--border);">
                <div v-for="sub in parent.subcategorias" :key="sub.id_categoria" class="sub-node flex justify-between items-center py-2 border-b border-dashed" style="border-color: var(--border);">
                  <div class="flex items-center gap-2">
                    <span class="text-normal">{{ sub.nome }}</span>
                    <span :class="['badge', getTipoUsoBadge(sub.tipo_uso)]" style="font-size: 0.6rem; padding: 1px 6px;">{{ sub.tipo_uso }}</span>
                  </div>
                  <div class="flex gap-2">
                    <button class="btn btn-secondary btn-xs btn-icon-only" title="Editar" @click="openEditCategory(sub)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button class="btn btn-danger btn-xs btn-icon-only" title="Remover" @click="deleteCategory(sub.id_categoria)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div v-if="parent.subcategorias.length === 0" class="py-2 text-xs text-muted">
                  Nenhuma subcategoria vinculada.
                </div>
              </div>
            </div>
            <div v-if="categoriesHierarchical.length === 0" class="text-center text-muted py-6">
              Nenhuma categoria cadastrada.
            </div>
          </div>
        </div>
        
        <!-- Forms to Add Categories -->
        <div class="flex flex-col gap-4">
          <!-- Add Parent Category -->
          <div class="card">
            <h3 class="mb-4">Nova Categoria Principal</h3>
            <form @submit.prevent="submitParentCategory">
              <div class="form-group">
                <label>Nome da Categoria Pai *</label>
                <input type="text" v-model="parentCategoryForm.nome" required class="input-control" placeholder="Ex: Peça, Acessório" />
              </div>
              <div class="form-group">
                <label>Tipo de Uso *</label>
                <select v-model="parentCategoryForm.tipo_uso" required class="input-control select-control">
                  <option value="Ambos">Ambos (PDV & OS)</option>
                  <option value="Venda">Apenas Venda (PDV)</option>
                  <option value="OS">Apenas Ordem de Serviço (OS)</option>
                </select>
              </div>
              <button type="submit" class="btn w-full">Criar Categoria Principal</button>
            </form>
          </div>
          
          <!-- Add Subcategory -->
          <div class="card">
            <h3 class="mb-4">Nova Subcategoria</h3>
            <form @submit.prevent="submitSubCategory">
              <div class="form-group">
                <label>Categoria Pai *</label>
                <select v-model="subCategoryForm.id_pai" required class="input-control select-control">
                  <option value="">Selecione a categoria principal</option>
                  <option v-for="cat in categoriesHierarchical" :key="cat.id_categoria" :value="cat.id_categoria">
                    {{ cat.nome }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Nome da Subcategoria *</label>
                <input type="text" v-model="subCategoryForm.nome" required class="input-control" placeholder="Ex: Capinha, Película, Bateria" />
              </div>
              <div class="form-group">
                <label>Tipo de Uso (Opcional — Herda do pai se vazio)</label>
                <select v-model="subCategoryForm.tipo_uso" class="input-control select-control">
                  <option value="">Herdar da Categoria Pai</option>
                  <option value="Ambos">Ambos (PDV & OS)</option>
                  <option value="Venda">Apenas Venda (PDV)</option>
                  <option value="OS">Apenas Ordem de Serviço (OS)</option>
                </select>
              </div>
              <button type="submit" class="btn w-full">Criar Subcategoria</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Categoria -->
    <div v-if="showEditCategoryModal && editingCategoryObj" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Editar Categoria</h3>
          <button class="close-btn" @click="showEditCategoryModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitEditCategory">
          <div class="modal-body">
            <div class="form-group">
              <label>Nome da Categoria *</label>
              <input type="text" v-model="editingCategoryObj.nome" required class="input-control" />
            </div>
            
            <div class="form-group">
              <label>Categoria Pai</label>
              <select v-model="editingCategoryObj.id_pai" class="input-control select-control">
                <option value="">Nenhuma (Tornar Principal)</option>
                <option v-for="cat in categoriesHierarchical.filter(c => c.id_categoria !== editingCategoryObj.id_categoria)" :key="cat.id_categoria" :value="cat.id_categoria">
                  {{ cat.nome }}
                </option>
              </select>
            </div>

            <div class="form-group m-0">
              <label>Tipo de Uso *</label>
              <select v-model="editingCategoryObj.tipo_uso" required class="input-control select-control">
                <option value="Ambos">Ambos (PDV & OS)</option>
                <option value="Venda">Apenas Venda (PDV)</option>
                <option value="OS">Apenas Ordem de Serviço (OS)</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditCategoryModal = false">Cancelar</button>
            <button type="submit" class="btn">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Novo / Editar Produto -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Item' : 'Novo Produto/Peça' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="submitProduct">
          <div class="modal-body">
            <div class="form-group">
              <label>Código de Barras</label>
              <input type="text" v-model="form.codigo_barras" class="input-control" placeholder="EAN-13 / GTIN ou código interno" />
            </div>

            <div class="form-group">
              <label>Descrição do Item *</label>
              <input type="text" v-model="form.descricao" required class="input-control" placeholder="Ex: Tela Frontal iPhone 12 OLED" />
            </div>

            <div class="form-group">
              <label>Categoria *</label>
              <select v-model="form.id_categoria" required class="input-control select-control">
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
                <input type="number" v-model="form.qtd" required min="0" class="input-control" />
              </div>
              <div class="form-group">
                <label>Estoque Mínimo *</label>
                <input type="number" v-model="form.min" required min="1" class="input-control" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group m-0">
                <label>Preço de Custo (Compra) *</label>
                <input type="number" step="0.01" v-model="form.custo" required class="input-control" placeholder="R$ 0,00" />
              </div>
              <div class="form-group m-0">
                <label>Preço de Venda (Cliente) *</label>
                <input type="number" step="0.01" v-model="form.venda" required class="input-control" placeholder="R$ 0,00" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn">Salvar Produto</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Registrar Entrada Manual -->
    <div v-if="showAddEntryModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Lançar Entrada no Estoque</h3>
          <button class="close-btn" @click="showAddEntryModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitEntry">
          <div class="modal-body">
            <div class="form-group">
              <label>Selecione o Item *</label>
              <select v-model="entryForm.produtoId" required class="input-control select-control">
                <option value="">Selecione o Produto</option>
                <option v-for="p in products" :key="p.id" :value="p.id">{{ p.descricao }} (Atual: {{ p.qtd }})</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group m-0">
                <label>Quantidade a Adicionar *</label>
                <input type="number" v-model="entryForm.qtd" required min="1" class="input-control" />
              </div>
              <div class="form-group m-0">
                <label>Origem / Fornecedor *</label>
                <input type="text" v-model="entryForm.origem" required class="input-control" placeholder="Ex: Fornecedor X" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAddEntryModal = false">Cancelar</button>
            <button type="submit" class="btn">Confirmar Entrada</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { produtosService, categoriasService } from '../services/index.js';

export default defineComponent({
  name: 'EstoqueView',
  setup() {
    const activeTab = ref('list');
    const searchQuery = ref('');
    const selectedCategoryFilter = ref('');
    const showAddModal = ref(false);
    const showAddEntryModal = ref(false);
    const editingId = ref(null);
    const products = ref([]);
    const categoriesHierarchical = ref([]);
    const categoriesFlat = ref([]);

    // Category Forms
    const parentCategoryForm = ref({ nome: '', tipo_uso: 'Ambos' });
    const subCategoryForm = ref({ nome: '', id_pai: '', tipo_uso: '' });
    const editingCategoryObj = ref(null);
    const showEditCategoryModal = ref(false);

    const form = ref({
      codigo_barras: '',
      descricao: '',
      id_categoria: '',
      qtd: 5,
      min: 2,
      custo: 0.00,
      venda: 0.00
    });

    const entryForm = ref({
      produtoId: '',
      qtd: 1,
      origem: ''
    });

    const getMovementLogs = () => {
      const stored = localStorage.getItem('guicell_movement_logs');
      if (stored) {
        return JSON.parse(stored);
      }
      const initial = [
        { id: 1, data: '10/07/2026 10:15', produto: 'Tela Frontal iPhone 13 OLED', tipo: 'Saída', qtd: 1, origem: 'OS #OS-20260717-0001', tecnico: 'Técnico Padrão' },
        { id: 2, data: '09/07/2026 17:45', produto: 'Conector de Carga Tipo C', tipo: 'Saída', qtd: 1, origem: 'OS #OS-20260717-0002', tecnico: 'Técnico Padrão' },
        { id: 3, data: '08/07/2026 14:00', produto: 'Bateria Compatível S22', tipo: 'Entrada', qtd: 5, origem: 'Compra Distribuidora', tecnico: 'Gerente Padrão' }
      ];
      localStorage.setItem('guicell_movement_logs', JSON.stringify(initial));
      return initial;
    };

    const movementLogs = ref(getMovementLogs());

    const fetchCategories = async () => {
      try {
        const hierarchicalData = await categoriasService.listar('true');
        categoriesHierarchical.value = hierarchicalData;
        const flatData = await categoriasService.listar('false');
        categoriesFlat.value = flatData;
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
      }
    };

    const fetchProducts = async () => {
      try {
        const params = { busca: searchQuery.value };
        if (selectedCategoryFilter.value) {
          params.id_categoria = selectedCategoryFilter.value;
        }
        const data = await produtosService.listar(params);
        products.value = data.map(p => ({
          ...p,
          id: p.id_produto, // map template binding
          qtd: p.estoque_atual,
          min: p.estoque_minimo,
          custo: parseFloat(p.valor_custo || 0),
          venda: parseFloat(p.valor_venda || 0)
        }));
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
      }
    };

    watch([searchQuery, selectedCategoryFilter], () => {
      fetchProducts();
    });

    const sortedLogs = computed(() => {
      return [...movementLogs.value].sort((a, b) => b.id - a.id);
    });

    const closeModal = () => {
      showAddModal.value = false;
      editingId.value = null;
      form.value = { codigo_barras: '', descricao: '', id_categoria: '', qtd: 5, min: 2, custo: 0, venda: 0 };
    };

    const submitProduct = async () => {
      if (!form.value.descricao || !form.value.venda) {
        alert('Descrição e preço de venda são obrigatórios.');
        return;
      }
      try {
        const payload = {
          codigo_barras: form.value.codigo_barras || null,
          descricao: form.value.descricao,
          id_categoria: form.value.id_categoria ? parseInt(form.value.id_categoria) : null,
          estoque_atual: parseInt(form.value.qtd),
          estoque_minimo: parseInt(form.value.min),
          valor_custo: parseFloat(form.value.custo),
          valor_venda: parseFloat(form.value.venda)
        };

        if (editingId.value) {
          await produtosService.atualizar(editingId.value, payload);
        } else {
          await produtosService.criar(payload);
          const userObj = JSON.parse(localStorage.getItem('guicell_usuario') || 'null');
          const tecnicoNome = userObj ? userObj.nome : 'Gerente Padrão';
          movementLogs.value.unshift({
            id: Date.now(),
            data: new Date().toLocaleString('pt-BR'),
            produto: payload.descricao,
            tipo: 'Entrada',
            qtd: payload.estoque_atual,
            origem: 'Cadastro Inicial',
            tecnico: tecnicoNome
          });
          localStorage.setItem('guicell_movement_logs', JSON.stringify(movementLogs.value));
        }
        await fetchProducts();
        closeModal();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao salvar produto.');
      }
    };

    const editProduct = (prod) => {
      editingId.value = prod.id_produto;
      form.value = {
        codigo_barras: prod.codigo_barras || '',
        descricao: prod.descricao,
        id_categoria: prod.id_categoria || '',
        qtd: prod.estoque_atual,
        min: prod.estoque_minimo,
        custo: parseFloat(prod.valor_custo || 0),
        venda: parseFloat(prod.valor_venda)
      };
      showAddModal.value = true;
    };

    const submitEntry = async () => {
      if (!entryForm.value.produtoId || !entryForm.value.qtd) {
        alert('Selecione o produto e a quantidade.');
        return;
      }
      try {
        await produtosService.registrarEntrada(entryForm.value.produtoId, entryForm.value.qtd);
        const prodObj = products.value.find(p => p.id_produto === parseInt(entryForm.value.produtoId));
        if (prodObj) {
          const userObj = JSON.parse(localStorage.getItem('guicell_usuario') || 'null');
          const tecnicoNome = userObj ? userObj.nome : 'Gerente Padrão';
          movementLogs.value.unshift({
            id: Date.now(),
            data: new Date().toLocaleString('pt-BR'),
            produto: prodObj.descricao,
            tipo: 'Entrada',
            qtd: parseInt(entryForm.value.qtd),
            origem: entryForm.value.origem || 'Entrada manual',
            tecnico: tecnicoNome
          });
          localStorage.setItem('guicell_movement_logs', JSON.stringify(movementLogs.value));
        }
        await fetchProducts();
        showAddEntryModal.value = false;
        entryForm.value = { produtoId: '', qtd: 1, origem: '' };
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao registrar entrada de estoque.');
      }
    };

    const submitParentCategory = async () => {
      if (!parentCategoryForm.value.nome) return;
      try {
        await categoriasService.criar({
          nome: parentCategoryForm.value.nome,
          tipo_uso: parentCategoryForm.value.tipo_uso
        });
        parentCategoryForm.value = { nome: '', tipo_uso: 'Ambos' };
        await fetchCategories();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao criar categoria.');
      }
    };

    const submitSubCategory = async () => {
      if (!subCategoryForm.value.nome || !subCategoryForm.value.id_pai) {
        alert('Selecione a categoria pai e preencha o nome da subcategoria.');
        return;
      }
      try {
        await categoriasService.criar({
          nome: subCategoryForm.value.nome,
          id_pai: parseInt(subCategoryForm.value.id_pai),
          tipo_uso: subCategoryForm.value.tipo_uso || undefined
        });
        subCategoryForm.value = { nome: '', id_pai: subCategoryForm.value.id_pai, tipo_uso: '' };
        await fetchCategories();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao criar subcategoria.');
      }
    };

    const openEditCategory = (cat) => {
      editingCategoryObj.value = {
        id_categoria: cat.id_categoria,
        nome: cat.nome,
        id_pai: cat.id_pai || '',
        tipo_uso: cat.tipo_uso
      };
      showEditCategoryModal.value = true;
    };

    const submitEditCategory = async () => {
      if (!editingCategoryObj.value.nome) return;
      try {
        await categoriasService.atualizar(editingCategoryObj.value.id_categoria, {
          nome: editingCategoryObj.value.nome,
          id_pai: editingCategoryObj.value.id_pai ? parseInt(editingCategoryObj.value.id_pai) : null,
          tipo_uso: editingCategoryObj.value.tipo_uso
        });
        showEditCategoryModal.value = false;
        editingCategoryObj.value = null;
        await fetchCategories();
        await fetchProducts();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao editar categoria.');
      }
    };

    const deleteCategory = async (id) => {
      if (!confirm('Deseja realmente remover esta categoria?')) return;
      try {
        await categoriasService.remover(id);
        await fetchCategories();
        await fetchProducts();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao remover categoria.');
      }
    };

    onMounted(() => {
      fetchCategories();
      fetchProducts();
    });

    const getTipoUsoBadge = (tipo) => {
      switch (tipo) {
        case 'Venda': return 'badge-success';
        case 'OS': return 'badge-info';
        default: return 'badge-muted';
      }
    };

    return {
      activeTab,
      searchQuery,
      selectedCategoryFilter,
      showAddModal,
      showAddEntryModal,
      editingId,
      form,
      entryForm,
      products,
      filteredProducts: products, // direct search bind
      sortedLogs,
      closeModal,
      submitProduct,
      editProduct,
      submitEntry,
      categoriesHierarchical,
      categoriesFlat,
      parentCategoryForm,
      subCategoryForm,
      editingCategoryObj,
      showEditCategoryModal,
      submitParentCategory,
      submitSubCategory,
      openEditCategory,
      submitEditCategory,
      deleteCategory,
      getTipoUsoBadge
    };
  }
});
</script>

<style scoped>
.estoque-view {
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

.tab-btn:hover {
  color: var(--text-white);
  background-color: rgba(255, 255, 255, 0.02);
}

.tab-btn.active {
  color: var(--primary-hover);
  border-bottom-color: var(--primary);
}

.filters-card {
  padding: 16px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
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

.block {
  display: block;
}

.select-control {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
}

.action-icon {
  width: 14px;
  height: 14px;
}

.btn-xs {
  padding: 6px 12px;
  font-size: 0.75rem;
  border-radius: 6px;
}
</style>
