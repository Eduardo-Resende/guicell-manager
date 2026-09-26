<template>
  <div class="estoque-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Estoque</h1>
        <p class="page-subtitle">Controle de peças de reposição e acessórios com alerta de nível crítico.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" @click="irParaCompras">
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
                <td class="font-bold" :class="{ 'text-danger': prod.min > 0 && prod.qtd <= prod.min }">{{ prod.qtd }}</td>
                <td>{{ prod.min > 0 ? prod.min : '—' }}</td>
                <td>R$ {{ prod.custo.toFixed(2) }}</td>
                <td class="font-semibold text-white">R$ {{ prod.venda.toFixed(2) }}</td>
                <td>
                  <span 
                    v-if="prod.min > 0 && prod.qtd <= prod.min" 
                    class="badge badge-danger"
                  >
                    Crítico
                  </span>
                  <span 
                    v-else-if="prod.min > 0 && prod.qtd <= prod.min + 2" 
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
      <div class="categories-layout">
        
        <!-- Left Column: Tree List of Categories -->
        <div class="card cat-list-card">
          <div class="cat-list-header">
            <div>
              <h3 class="m-0">Categorias Cadastradas</h3>
            </div>
            <div class="cat-count-badge" v-if="categoriesHierarchical.length > 0">
              {{ categoriesHierarchical.length }} principais
            </div>
          </div>

          <div class="categories-tree">
            <div v-for="parent in categoriesHierarchical" :key="parent.id_categoria" class="cat-tree-card">
              <!-- Parent Node Header -->
              <div class="parent-cat-row">
                <div class="parent-cat-left">
                  <div class="cat-icon-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;" class="text-emerald-400">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div class="cat-name-block">
                    <span class="parent-cat-title">{{ parent.nome }}</span>
                    <span class="sub-count-tag" v-if="parent.subcategorias && parent.subcategorias.length > 0">
                      {{ parent.subcategorias.length }} {{ parent.subcategorias.length === 1 ? 'subcategoria' : 'subcategorias' }}
                    </span>
                    <span class="sub-count-tag text-muted" v-else>Sem subcategorias</span>
                  </div>
                </div>

                <div class="parent-cat-right">
                  <span :class="['uso-badge', getTipoUsoBadge(parent.tipo_uso)]">
                    {{ parent.tipo_uso }}
                  </span>
                  <div class="cat-actions">
                    <button class="cat-action-btn edit-btn" title="Editar categoria" @click="openEditCategory(parent)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button class="cat-action-btn delete-btn" title="Excluir categoria" @click="deleteCategory(parent.id_categoria)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Subcategories Branch -->
              <div v-if="parent.subcategorias && parent.subcategorias.length > 0" class="subcat-branch">
                <div v-for="sub in parent.subcategorias" :key="sub.id_categoria" class="subcat-row">
                  <div class="subcat-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;" class="branch-icon">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <span class="subcat-title">{{ sub.nome }}</span>
                  </div>
                  <div class="subcat-right">
                    <span :class="['uso-badge uso-badge-sub', getTipoUsoBadge(sub.tipo_uso || parent.tipo_uso)]">
                      {{ sub.tipo_uso ? sub.tipo_uso : `${parent.tipo_uso} (Herdado)` }}
                    </span>
                    <div class="cat-actions">
                      <button class="cat-action-btn edit-btn" title="Editar subcategoria" @click="openEditCategory(sub)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button class="cat-action-btn delete-btn" title="Excluir subcategoria" @click="deleteCategory(sub.id_categoria)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="categoriesHierarchical.length === 0" class="cat-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-cat-icon">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <p class="m-0 font-semibold text-white">Nenhuma categoria cadastrada</p>
              <p class="text-xs text-muted mt-1 m-0">Use o painel ao lado para criar sua primeira categoria principal.</p>
            </div>
          </div>
        </div>
        
        <!-- Right Column: Single Unified Creation Card with Segmented Switcher -->
        <div class="card cat-form-card">
          <div class="cat-form-header">
            <h3 class="m-0">Cadastrar Categoria</h3>
          </div>

          <!-- Segmented Tab Switcher -->
          <div class="cat-tab-switcher mb-4">
            <button
              type="button"
              :class="['cat-tab-btn', { active: categoryFormTab === 'principal' }]"
              @click="categoryFormTab = 'principal'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;" class="tab-btn-svg">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Categoria Principal</span>
            </button>
            <button
              type="button"
              :class="['cat-tab-btn', { active: categoryFormTab === 'sub' }]"
              @click="categoryFormTab = 'sub'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;" class="tab-btn-svg">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span>Subcategoria</span>
            </button>
          </div>

          <!-- Form: Categoria Principal -->
          <form v-if="categoryFormTab === 'principal'" @submit.prevent="submitParentCategory" class="cat-active-form">
            <div class="form-group">
              <label>Nome da Categoria Principal *</label>
              <input
                type="text"
                v-model="parentCategoryForm.nome"
                required
                class="input-control"
                placeholder="Ex: Peça, Acessório, Aparelho"
              />
            </div>
            <div class="form-group mb-5">
              <label>Tipo de Uso / Destino *</label>
              <select v-model="parentCategoryForm.tipo_uso" required class="input-control select-control">
                <option value="Ambos">Ambos (PDV & OS)</option>
                <option value="Venda">Apenas Venda (PDV)</option>
                <option value="OS">Apenas Ordem de Serviço (OS)</option>
              </select>
            </div>
            <button type="submit" class="btn btn-compra w-full btn-create-cat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Criar Categoria Principal</span>
            </button>
          </form>

          <!-- Form: Subcategoria -->
          <form v-else @submit.prevent="submitSubCategory" class="cat-active-form">
            <div class="form-group">
              <label>Categoria Principal (Pai) *</label>
              <select v-model="subCategoryForm.id_pai" required class="input-control select-control">
                <option value="">Selecione a categoria principal...</option>
                <option v-for="cat in categoriesHierarchical" :key="cat.id_categoria" :value="cat.id_categoria">
                  📁 {{ cat.nome }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Nome da Subcategoria *</label>
              <input
                type="text"
                v-model="subCategoryForm.nome"
                required
                class="input-control"
                placeholder="Ex: Capinha, Película, Bateria, Tela"
              />
            </div>
            <div class="form-group mb-5">
              <label>Tipo de Uso <span class="text-xs text-muted font-normal">(Opcional — herda se vazio)</span></label>
              <select v-model="subCategoryForm.tipo_uso" class="input-control select-control">
                <option value="">Herdar da Categoria Principal</option>
                <option value="Ambos">Ambos (PDV & OS)</option>
                <option value="Venda">Apenas Venda (PDV)</option>
                <option value="OS">Apenas Ordem de Serviço (OS)</option>
              </select>
            </div>
            <button type="submit" class="btn btn-compra w-full btn-create-cat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span>Criar Subcategoria</span>
            </button>
          </form>
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
                <label>Estoque Mínimo <span class="text-xs text-muted font-normal">(0 ou em branco = sem aviso)</span></label>
                <input type="number" v-model="form.min" min="0" class="input-control" placeholder="0 = Sem aviso" />
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
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { produtosService, categoriasService } from '../services/index.js';

export default defineComponent({
  name: 'EstoqueView',
  setup() {
    const router = useRouter();
    const activeTab = ref('list');
    const searchQuery = ref('');
    const selectedCategoryFilter = ref('');
    const showAddModal = ref(false);
    const editingId = ref(null);
    const products = ref([]);
    const categoriesHierarchical = ref([]);
    const categoriesFlat = ref([]);

    // Category Forms
    const categoryFormTab = ref('principal');
    const parentCategoryForm = ref({ nome: '', tipo_uso: 'Ambos' });
    const subCategoryForm = ref({ nome: '', id_pai: '', tipo_uso: '' });
    const editingCategoryObj = ref(null);
    const showEditCategoryModal = ref(false);

    const form = ref({
      codigo_barras: '',
      descricao: '',
      id_categoria: '',
      qtd: 5,
      min: 0,
      custo: 0.00,
      venda: 0.00
    });

    const irParaCompras = () => {
      router.push('/compras');
    };

    const movementLogs = ref([]);

    const fetchMovementLogs = async () => {
      try {
        const data = await produtosService.movimentacoes();
        movementLogs.value = data;
      } catch (err) {
        console.error('Erro ao buscar movimentações:', err);
      }
    };

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
      return movementLogs.value;
    });

    const closeModal = () => {
      showAddModal.value = false;
      editingId.value = null;
      form.value = { codigo_barras: '', descricao: '', id_categoria: '', qtd: 5, min: 0, custo: 0, venda: 0 };
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
          estoque_atual: parseInt(form.value.qtd) || 0,
          estoque_minimo: parseInt(form.value.min) || 0,
          valor_custo: parseFloat(form.value.custo) || 0,
          valor_venda: parseFloat(form.value.venda)
        };

        if (editingId.value) {
          await produtosService.atualizar(editingId.value, payload);
        } else {
          await produtosService.criar(payload);
        }
        await fetchProducts();
        await fetchMovementLogs();
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
      fetchMovementLogs();
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
      editingId,
      form,
      products,
      filteredProducts: products, // direct search bind
      sortedLogs,
      closeModal,
      submitProduct,
      editProduct,
      irParaCompras,
      categoriesHierarchical,
      categoriesFlat,
      categoryFormTab,
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

/* ==========================================================================
   CATEGORIES MANAGEMENT — MODERN REDESIGN
   ========================================================================== */
.categories-layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 992px) {
  .categories-layout {
    grid-template-columns: 1fr;
  }
}

.cat-list-card, .cat-form-card {
  padding: 20px;
}

.cat-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}

.cat-form-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 22px;
}

.cat-count-badge {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.25);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.categories-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cat-tree-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.cat-tree-card:hover {
  border-color: rgba(255, 255, 255, 0.14);
}

.parent-cat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  background: rgba(255, 255, 255, 0.02);
}

.parent-cat-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.cat-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-name-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.parent-cat-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--text-white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-count-tag {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.parent-cat-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.uso-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 6px;
}

.uso-badge-sub {
  font-size: 0.6rem;
  opacity: 0.85;
}

.badge-ambos, :deep(.badge-ambos) {
  background: rgba(167, 139, 250, 0.15);
  color: #c084fc;
  border: 1px solid rgba(167, 139, 250, 0.3);
}

.badge-venda, :deep(.badge-venda) {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-os, :deep(.badge-os) {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.cat-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cat-action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-action-btn svg, .cat-action-svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.cat-action-btn.edit-btn {
  background: rgba(167, 139, 250, 0.12);
  border: 1px solid rgba(167, 139, 250, 0.3);
  color: #c084fc;
}

.cat-action-btn.edit-btn:hover {
  background: rgba(167, 139, 250, 0.25);
  border-color: rgba(167, 139, 250, 0.5);
  color: #e9d5ff;
}

.cat-action-btn.delete-btn {
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
}

.cat-action-btn.delete-btn:hover {
  background: rgba(248, 113, 113, 0.25);
  border-color: rgba(248, 113, 113, 0.5);
  color: #fca5a5;
}

/* Subcategories Branch */
.subcat-branch {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 8px 12px 10px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0, 0, 0, 0.15);
}

.subcat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.15s;
}

.subcat-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.subcat-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.branch-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  opacity: 0.6;
}

.subcat-title {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-white);
}

.subcat-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cat-empty-state {
  text-align: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.01);
  border: 1px dashed var(--border);
  border-radius: 12px;
}

.empty-cat-icon {
  width: 42px;
  height: 42px;
  color: var(--text-muted);
  margin-bottom: 10px;
  opacity: 0.5;
}

/* Segmented Tab Switcher */
.cat-tab-switcher {
  display: flex;
  gap: 4px;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  padding: 4px;
  border-radius: 10px;
}

.cat-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-tab-btn:hover {
  color: var(--text-white);
}

.cat-tab-btn.active {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.tab-btn-svg {
  width: 15px;
  height: 15px;
}

.btn-create-cat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px;
  font-size: 0.9rem;
  margin-top: 8px;
}
</style>

