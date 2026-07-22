<template>
  <div class="clientes-view">
    <div class="header-section">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Cadastre e gerencie os clientes da sua assistência técnica.</p>
      </div>
      <button class="btn" @click="showAddModal = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Novo Cliente</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <div class="card filters-card">
      <div class="search-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
          class="input-control search-input"
        />
      </div>
    </div>

    <!-- Clientes Table -->
    <div class="card table-card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF/CNPJ</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Endereço</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in filteredClients" :key="client.id">
              <td class="font-semibold text-white">{{ client.nome }}</td>
              <td>{{ client.cpf }}</td>
              <td>{{ client.telefone }}</td>
              <td>{{ client.email }}</td>
              <td>{{ client.endereco }}</td>
              <td class="text-right">
                <div class="actions-wrapper">
                  <button
                    class="btn btn-secondary btn-xs mr-2"
                    title="Gerenciar Aparelhos"
                    @click="openAparelhosModal(client)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                    <span>Aparelhos</span>
                  </button>
                  <button
                    class="btn btn-secondary btn-xs mr-2"
                    title="Ver Histórico de OS"
                    @click="viewHistory(client)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    <span>Histórico</span>
                  </button>
                  <button class="btn btn-secondary btn-xs btn-icon-only" title="Editar" @click="editClient(client)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredClients.length === 0">
              <td colspan="6" class="text-center text-muted py-6">Nenhum cliente encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- Modal: Novo / Editar Cliente                                  -->
    <!-- ============================================================ -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Cliente' : 'Novo Cliente' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="submitClient">
          <div class="modal-body">
            <div class="form-group">
              <label>Nome Completo *</label>
              <input type="text" v-model="form.nome" required class="input-control" placeholder="Nome do cliente" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>CPF / CNPJ</label>
                <input type="text" v-model="form.cpf" class="input-control" placeholder="000.000.000-00" />
              </div>
              <div class="form-group">
                <label>Telefone *</label>
                <input type="text" v-model="form.telefone" required class="input-control" placeholder="(62) 99999-9999" />
              </div>
            </div>

            <div class="form-group">
              <label>E-mail</label>
              <input type="email" v-model="form.email" class="input-control" placeholder="cliente@email.com" />
            </div>

            <div class="form-group">
              <label>Endereço Completo</label>
              <input type="text" v-model="form.endereco" class="input-control" placeholder="Rua, Número, Bairro, Cidade" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- Modal: Aparelhos do Cliente                                   -->
    <!-- ============================================================ -->
    <div v-if="showAparelhosModal" class="modal-overlay">
      <div class="modal-content max-w-aparelhos">
        <div class="modal-header">
          <div>
            <h3 class="m-0">Aparelhos do Cliente</h3>
            <p class="text-muted text-xs m-0">{{ selectedClient?.nome }}</p>
          </div>
          <button class="close-btn" @click="closeAparelhosModal">&times;</button>
        </div>

        <div class="modal-body">

          <!-- ── Lista de aparelhos ─────────────────────────────── -->
          <div class="aparelhos-list-section">
            <!-- Header da lista + botão de adicionar -->
            <div class="aparelhos-list-header">
              <span class="text-muted text-xs" v-if="clientAparelhos.length > 0">
                {{ clientAparelhos.length }} aparelho{{ clientAparelhos.length !== 1 ? 's' : '' }} cadastrado{{ clientAparelhos.length !== 1 ? 's' : '' }}
              </span>
              <span v-else></span>
              <button
                v-if="!showAparelhoForm"
                class="btn btn-sm"
                @click="startAddAparelho"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Novo Aparelho
              </button>
            </div>

            <!-- Lista vazia -->
            <div v-if="clientAparelhos.length === 0 && !showAparelhoForm" class="aparelhos-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <p>Nenhum aparelho cadastrado.</p>
              <p class="text-xs text-muted">Clique em "Novo Aparelho" para adicionar.</p>
            </div>

            <!-- Itens da lista -->
            <div v-else-if="clientAparelhos.length > 0" class="aparelhos-list">
              <div
                v-for="ap in clientAparelhos"
                :key="ap.id_aparelho"
                :class="['aparelho-row', { 'aparelho-row--editing': editingAparelhoId === ap.id_aparelho }]"
              >
                <div class="aparelho-row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </div>

                <div class="aparelho-row-info">
                  <span class="aparelho-row-nome">{{ ap.marca }} {{ ap.modelo }}</span>
                  <span v-if="ap.imei" class="aparelho-row-detalhe">IMEI: {{ ap.imei }}</span>
                  <span v-if="ap.observacoes" class="aparelho-row-detalhe">{{ ap.observacoes }}</span>
                </div>

                <div class="aparelho-row-actions">
                  <!-- Badge ATIVO / INATIVO (Clicável) -->
                  <span 
                    :class="['status-badge', 'status-badge-clickable', ap.ativo ? 'status-badge--ativo' : 'status-badge--inativo']"
                    @click="toggleAparelhoAtivo(ap)"
                    title="Alterar Status"
                  >
                    <span class="status-dot"></span>
                    {{ ap.ativo ? 'Ativo' : 'Inativo' }}
                  </span>

                  <!-- Editar -->
                  <button
                    class="btn btn-secondary btn-xs btn-icon-only"
                    title="Editar"
                    @click="editAparelho(ap)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Formulário (colapsável) ─────────────────────────── -->
          <transition name="form-slide">
            <div v-if="showAparelhoForm" class="aparelho-form-card">
              <div class="aparelho-form-title">
                {{ editingAparelhoId ? 'Editar Aparelho' : 'Novo Aparelho' }}
              </div>

              <!-- Marca (combobox com busca) -->
              <div class="form-group">
                <label>Marca *</label>
                <div class="combobox-wrapper" ref="marcaWrapper">
                  <div class="combobox-input-row">
                    <input
                      type="text"
                      v-model="aparelhoForm.marcaBusca"
                      @input="onMarcaInput"
                      @focus="onMarcaFocus"
                      @blur="onMarcaBlur"
                      @keydown.enter.prevent="selectFirstMarca"
                      @keydown.esc="showMarcaDropdown = false"
                      class="input-control"
                      placeholder="Pesquisar ou digitar marca (Ex: Samsung, Apple)..."
                      autocomplete="off"
                    />
                    <svg v-if="aparelhoForm.marcaBusca" @mousedown.prevent="clearMarca" class="combobox-clear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                  <div v-if="showMarcaDropdown && marcasFiltradas.length > 0" class="combobox-dropdown">
                    <div
                      v-for="m in marcasFiltradas"
                      :key="m"
                      class="combobox-option"
                      @mousedown.prevent="selectMarca(m)"
                    >
                      {{ m }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modelo (combobox com busca, habilitado só com marca) -->
              <div class="form-group">
                <label>Modelo *</label>
                <div class="combobox-wrapper" ref="modeloWrapper">
                  <div class="combobox-input-row">
                    <input
                      type="text"
                      v-model="aparelhoForm.modeloBusca"
                      @input="onModeloInput"
                      @focus="onModeloFocus"
                      @blur="onModeloBlur"
                      @keydown.enter.prevent="selectFirstModelo"
                      @keydown.esc="showModeloDropdown = false"
                      class="input-control"
                      :placeholder="aparelhoForm.marcaBusca.trim() ? 'Pesquisar ou digitar modelo (Ex: Galaxy J1 Mini)...' : 'Digite a marca primeiro'"
                      :disabled="!aparelhoForm.marcaBusca.trim()"
                      autocomplete="off"
                    />
                    <svg v-if="aparelhoForm.modeloBusca" @mousedown.prevent="clearModelo" class="combobox-clear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                  <div v-if="showModeloDropdown && (modelosFiltrados.length > 0 || aparelhoForm.modeloBusca.trim())" class="combobox-dropdown">
                    <div
                      v-for="m in modelosFiltrados"
                      :key="m"
                      class="combobox-option"
                      @mousedown.prevent="selectModelo(m)"
                    >
                      {{ m }}
                    </div>
                    <div
                      v-if="aparelhoForm.modeloBusca.trim() && !isSearchingAPI"
                      class="combobox-option combobox-option-api"
                      @mousedown.prevent="buscarModeloAPIExterna"
                    >
                      🌐 Pesquisar "{{ aparelhoForm.modeloBusca.trim() }}" na API (MobileAPI.dev)...
                    </div>
                    <div v-if="isSearchingAPI" class="combobox-option text-muted">
                      ⏳ Consultando API externa MobileAPI.dev...
                    </div>
                    <div
                      v-if="aparelhoForm.modeloBusca.trim() && !modelosFiltrados.includes(aparelhoForm.modeloBusca.trim())"
                      class="combobox-option combobox-option-custom"
                      @mousedown.prevent="selectModelo(aparelhoForm.modeloBusca.trim())"
                    >
                      ➕ Usar "{{ aparelhoForm.modeloBusca.trim() }}" (Cadastrar)
                    </div>
                  </div>
                </div>
              </div>

              <!-- IMEI e Observações -->
              <div class="grid grid-cols-2 gap-3">
                <div class="form-group">
                  <label>IMEI / Nº Série</label>
                  <input
                    type="text"
                    v-model="aparelhoForm.imei"
                    class="input-control"
                    placeholder="15 dígitos"
                    maxlength="20"
                  />
                </div>
                <div class="form-group">
                  <label>Observações</label>
                  <input
                    type="text"
                    v-model="aparelhoForm.observacoes"
                    class="input-control"
                    placeholder="Ex: Tampa quebrada"
                  />
                </div>
              </div>

              <!-- Ações do formulário -->
              <div class="aparelho-form-footer">
                <button type="button" class="btn btn-secondary btn-sm" @click="cancelEditAparelho">Cancelar</button>
                <button
                  type="button"
                  class="btn btn-sm"
                  @click="submitAparelho"
                  :disabled="!aparelhoForm.marcaBusca.trim() || !aparelhoForm.modeloBusca.trim()"
                >
                  {{ editingAparelhoId ? 'Salvar Alterações' : 'Adicionar Aparelho' }}
                </button>
              </div>
            </div>
          </transition>

        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeAparelhosModal">Fechar</button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- Modal: Histórico de OS                                        -->
    <!-- ============================================================ -->
    <div v-if="showHistoryModal" class="modal-overlay">
      <div class="modal-content max-w-lg">
        <div class="modal-header">
          <div>
            <h3 class="m-0">Histórico de Ordens de Serviço</h3>
            <p class="text-muted text-xs m-0">Cliente: {{ selectedClient?.nome }}</p>
          </div>
          <button class="close-btn" @click="showHistoryModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="clientHistory.length === 0" class="text-center text-muted py-4">
            Nenhuma Ordem de Serviço registrada para este cliente.
          </div>
          <div v-else class="history-list">
            <div v-for="os in clientHistory" :key="os.id" class="history-item card">
              <div class="history-item-header">
                <span class="font-semibold text-white">OS #{{ os.numero }}</span>
                <span :class="['badge', getBadgeClass(os.status)]">{{ os.status }}</span>
              </div>
              <div class="history-item-details">
                <p><strong>Aparelho:</strong> {{ os.aparelho }}</p>
                <p><strong>Defeito:</strong> {{ os.defeito }}</p>
                <p><strong>Valor:</strong> {{ os.valor }}</p>
              </div>
              <div class="history-item-footer text-muted">
                Abertura: {{ os.data }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showHistoryModal = false">Fechar</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue';
import { clientesService, aparelhosService } from '../services/index.js';

export default defineComponent({
  name: 'ClientesView',
  setup() {
    const searchQuery = ref('');
    const showAddModal = ref(false);
    const showHistoryModal = ref(false);
    const showAparelhosModal = ref(false);
    const showAparelhoForm = ref(false);
    const selectedClient = ref(null);
    const editingId = ref(null);
    const clients = ref([]);
    const clientHistory = ref([]);
    const clientAparelhos = ref([]);
    const editingAparelhoId = ref(null);

    // Combobox state
    const showMarcaDropdown = ref(false);
    const showModeloDropdown = ref(false);
    const marcasFiltradas = ref([]);
    const modelosFiltrados = ref([]);
    const isSearchingAPI = ref(false);

    const form = ref({
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      endereco: ''
    });

    const aparelhoForm = ref({
      marcaBusca: '',
      marcaSelecionada: '',
      modeloBusca: '',
      modeloSelecionado: '',
      imei: '',
      observacoes: ''
    });

    // ── API REST: Marcas & Modelos ──────────────────────────────────
    const fetchMarcasAPI = async (q = '') => {
      try {
        const data = await aparelhosService.buscarMarcas(q);
        marcasFiltradas.value = data || [];
      } catch (err) {
        console.error('Erro ao buscar marcas via API:', err);
      }
    };

    const fetchModelosAPI = async (marca = '', q = '') => {
      try {
        if (!marca) {
          modelosFiltrados.value = [];
          return;
        }
        const data = await aparelhosService.buscarModelos(marca, q);
        modelosFiltrados.value = data || [];
      } catch (err) {
        console.error('Erro ao buscar modelos via API:', err);
      }
    };

    // ── Combobox: Marca ─────────────────────────────────────────────
    const onMarcaInput = () => {
      aparelhoForm.value.marcaSelecionada = aparelhoForm.value.marcaBusca.trim();
      showMarcaDropdown.value = true;
      fetchMarcasAPI(aparelhoForm.value.marcaBusca);
      fetchModelosAPI(aparelhoForm.value.marcaBusca, aparelhoForm.value.modeloBusca);
    };

    const onMarcaFocus = () => {
      showMarcaDropdown.value = true;
      fetchMarcasAPI(aparelhoForm.value.marcaBusca);
    };

    const selectMarca = (marca) => {
      aparelhoForm.value.marcaBusca = marca;
      aparelhoForm.value.marcaSelecionada = marca;
      showMarcaDropdown.value = false;
      fetchModelosAPI(marca, aparelhoForm.value.modeloBusca);
    };

    const selectFirstMarca = () => {
      if (marcasFiltradas.value.length > 0) {
        selectMarca(marcasFiltradas.value[0]);
      } else if (aparelhoForm.value.marcaBusca.trim()) {
        aparelhoForm.value.marcaSelecionada = aparelhoForm.value.marcaBusca.trim();
        showMarcaDropdown.value = false;
      }
    };

    const clearMarca = () => {
      aparelhoForm.value.marcaBusca = '';
      aparelhoForm.value.marcaSelecionada = '';
      aparelhoForm.value.modeloBusca = '';
      aparelhoForm.value.modeloSelecionado = '';
      marcasFiltradas.value = [];
      modelosFiltrados.value = [];
    };

    const onMarcaBlur = () => {
      setTimeout(() => {
        if (aparelhoForm.value.marcaBusca.trim()) {
          aparelhoForm.value.marcaSelecionada = aparelhoForm.value.marcaBusca.trim();
        }
        showMarcaDropdown.value = false;
      }, 150);
    };

    // ── Combobox: Modelo ────────────────────────────────────────────
    const onModeloInput = () => {
      aparelhoForm.value.modeloSelecionado = aparelhoForm.value.modeloBusca.trim();
      showModeloDropdown.value = true;
      fetchModelosAPI(aparelhoForm.value.marcaBusca, aparelhoForm.value.modeloBusca);
    };

    const onModeloFocus = () => {
      showModeloDropdown.value = true;
      fetchModelosAPI(aparelhoForm.value.marcaBusca, aparelhoForm.value.modeloBusca);
    };

    const selectModelo = (modelo) => {
      aparelhoForm.value.modeloBusca = modelo;
      aparelhoForm.value.modeloSelecionado = modelo;
      showModeloDropdown.value = false;
    };

    const selectFirstModelo = () => {
      if (modelosFiltrados.value.length > 0) {
        selectModelo(modelosFiltrados.value[0]);
      } else if (aparelhoForm.value.modeloBusca.trim()) {
        aparelhoForm.value.modeloSelecionado = aparelhoForm.value.modeloBusca.trim();
        showModeloDropdown.value = false;
      }
    };

    const clearModelo = () => {
      aparelhoForm.value.modeloBusca = '';
      aparelhoForm.value.modeloSelecionado = '';
      modelosFiltrados.value = [];
    };

    const onModeloBlur = () => {
      setTimeout(() => {
        if (aparelhoForm.value.modeloBusca.trim()) {
          aparelhoForm.value.modeloSelecionado = aparelhoForm.value.modeloBusca.trim();
        }
        showModeloDropdown.value = false;
      }, 150);
    };

    const buscarModeloAPIExterna = async () => {
      if (!aparelhoForm.value.modeloBusca.trim()) return;
      isSearchingAPI.value = true;
      try {
        const termo = `${aparelhoForm.value.marcaBusca} ${aparelhoForm.value.modeloBusca}`.trim();
        const resultados = await aparelhosService.consultarAPIExterna(termo);
        
        // Recarrega as marcas e modelos locais (que foram alimentados incrementalmente pela API)
        await fetchMarcasAPI(aparelhoForm.value.marcaBusca);
        await fetchModelosAPI(aparelhoForm.value.marcaBusca, aparelhoForm.value.modeloBusca);

        if (resultados && resultados.length > 0) {
          const match = resultados.find(r => r.model.toLowerCase().includes(aparelhoForm.value.modeloBusca.toLowerCase())) || resultados[0];
          if (match) {
            selectModelo(match.model);
            if (match.brand) selectMarca(match.brand);
          }
        }
      } catch (err) {
        console.error('Erro ao consultar API externa:', err);
      } finally {
        isSearchingAPI.value = false;
      }
    };

    // ── Clientes ────────────────────────────────────────────────────
    const fetchClients = async () => {
      try {
        const data = await clientesService.listar(searchQuery.value);
        clients.value = data.map(c => ({
          ...c,
          id: c.id_cliente,
          cpf: c.cpf_cnpj
        }));
      } catch (err) {
        console.error('Erro ao buscar clientes:', err);
      }
    };

    watch(searchQuery, () => fetchClients());

    const closeModal = () => {
      showAddModal.value = false;
      editingId.value = null;
      form.value = { nome: '', cpf: '', telefone: '', email: '', endereco: '' };
    };

    const submitClient = async () => {
      if (!form.value.nome || !form.value.telefone) {
        alert('Nome e telefone são obrigatórios.');
        return;
      }
      try {
        const payload = {
          nome: form.value.nome,
          cpf_cnpj: form.value.cpf,
          telefone: form.value.telefone,
          email: form.value.email,
          endereco: form.value.endereco
        };
        if (editingId.value) {
          await clientesService.atualizar(editingId.value, payload);
        } else {
          await clientesService.criar(payload);
        }
        await fetchClients();
        closeModal();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao salvar cliente.');
      }
    };

    const editClient = (client) => {
      editingId.value = client.id_cliente;
      form.value = {
        nome: client.nome,
        cpf: client.cpf_cnpj || '',
        telefone: client.telefone,
        email: client.email || '',
        endereco: client.endereco || ''
      };
      showAddModal.value = true;
    };

    // ── Aparelhos ───────────────────────────────────────────────────
    const openAparelhosModal = async (client) => {
      selectedClient.value = client;
      clientAparelhos.value = [];
      cancelEditAparelho();
      showAparelhosModal.value = true;
      await fetchAparelhos(client.id_cliente);
    };

    const closeAparelhosModal = () => {
      showAparelhosModal.value = false;
      selectedClient.value = null;
      clientAparelhos.value = [];
      cancelEditAparelho();
    };

    const fetchAparelhos = async (id_cliente) => {
      try {
        const data = await aparelhosService.listarPorCliente(id_cliente);
        clientAparelhos.value = data;
      } catch (err) {
        console.error('Erro ao buscar aparelhos:', err);
      }
    };

    const resetAparelhoForm = () => {
      aparelhoForm.value = {
        marcaBusca: '',
        marcaSelecionada: '',
        modeloBusca: '',
        modeloSelecionado: '',
        imei: '',
        observacoes: ''
      };
    };

    const startAddAparelho = () => {
      editingAparelhoId.value = null;
      resetAparelhoForm();
      showAparelhoForm.value = true;
      fetchMarcasAPI();
    };

    const cancelEditAparelho = () => {
      editingAparelhoId.value = null;
      showAparelhoForm.value = false;
      resetAparelhoForm();
    };

    const editAparelho = (ap) => {
      editingAparelhoId.value = ap.id_aparelho;
      aparelhoForm.value = {
        marcaBusca: ap.marca,
        marcaSelecionada: ap.marca,
        modeloBusca: ap.modelo,
        modeloSelecionado: ap.modelo,
        imei: ap.imei || '',
        observacoes: ap.observacoes || ''
      };
      showAparelhoForm.value = true;
      fetchMarcasAPI(ap.marca);
      fetchModelosAPI(ap.marca, ap.modelo);
    };

    const submitAparelho = async () => {
      const marca = aparelhoForm.value.marcaSelecionada || aparelhoForm.value.marcaBusca.trim();
      const modelo = aparelhoForm.value.modeloSelecionado || aparelhoForm.value.modeloBusca.trim();

      if (!marca || !modelo) {
        alert('Marca e modelo são obrigatórios.');
        return;
      }

      try {
        const payload = {
          marca,
          modelo,
          imei: aparelhoForm.value.imei || null,
          observacoes: aparelhoForm.value.observacoes
        };

        if (editingAparelhoId.value) {
          await aparelhosService.atualizar(editingAparelhoId.value, payload);
        } else {
          await aparelhosService.criar({
            id_cliente: selectedClient.value.id_cliente,
            ...payload
          });
        }

        cancelEditAparelho();
        await fetchAparelhos(selectedClient.value.id_cliente);
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao salvar aparelho.');
      }
    };

    const toggleAparelhoAtivo = async (ap) => {
      try {
        await aparelhosService.toggleAtivo(ap.id_aparelho);
        await fetchAparelhos(selectedClient.value.id_cliente);
      } catch (err) {
        alert('Erro ao alterar status do aparelho.');
      }
    };

    // ── Histórico OS ────────────────────────────────────────────────
    const viewHistory = async (client) => {
      selectedClient.value = client;
      clientHistory.value = [];
      showHistoryModal.value = true;
      try {
        const details = await clientesService.buscarPorId(client.id_cliente);
        clientHistory.value = (details.ordensServico || []).map(os => ({
          id: os.id_os,
          numero: os.numero_os,
          aparelho: os.aparelho ? `${os.aparelho.marca} ${os.aparelho.modelo}` : 'Aparelho s/ ref',
          defeito: os.defeito_relatado,
          status: os.status,
          valor: os.valor_final
            ? `R$ ${parseFloat(os.valor_final).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'Não orçado',
          data: new Date(os.data_abertura).toLocaleDateString('pt-BR')
        }));
      } catch (err) {
        console.error('Erro ao buscar histórico do cliente:', err);
      }
    };

    const getBadgeClass = (status) => {
      switch (status) {
        case 'Aguardando': return 'badge-warning';
        case 'Em Reparo': return 'badge-info';
        case 'Aguardando Peça': return 'badge-danger';
        case 'Concluído':
        case 'Entregue': return 'badge-success';
        case 'Cancelado': return 'badge-muted';
        default: return 'badge-muted';
      }
    };

    onMounted(() => fetchClients());

    return {
      searchQuery,
      showAddModal,
      showHistoryModal,
      showAparelhosModal,
      showAparelhoForm,
      selectedClient,
      editingId,
      form,
      aparelhoForm,
      editingAparelhoId,
      clients,
      filteredClients: clients,
      clientHistory,
      clientAparelhos,
      // combobox
      showMarcaDropdown,
      showModeloDropdown,
      marcasFiltradas,
      modelosFiltrados,
      isSearchingAPI,
      onMarcaInput,
      selectMarca,
      selectFirstMarca,
      clearMarca,
      onMarcaBlur,
      onModeloInput,
      selectModelo,
      selectFirstModelo,
      clearModelo,
      onModeloBlur,
      buscarModeloAPIExterna,
      // actions
      closeModal,
      submitClient,
      editClient,
      openAparelhosModal,
      closeAparelhosModal,
      startAddAparelho,
      editAparelho,
      cancelEditAparelho,
      submitAparelho,
      toggleAparelhoAtivo,
      viewHistory,
      getBadgeClass
    };
  }
});
</script>

<style scoped>
.clientes-view {
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

.filters-card { padding: 16px; }
.search-wrapper { position: relative; display: flex; align-items: center; width: 100%; }
.search-icon {
  position: absolute; left: 14px;
  color: var(--text-muted); width: 18px; height: 18px; pointer-events: none;
}
.search-input { padding-left: 44px; background-color: var(--bg-dark); }

.actions-wrapper { display: flex; justify-content: flex-end; align-items: center; gap: 4px; }
.btn-xs { padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; }
.btn-sm { padding: 7px 14px; font-size: 0.8rem; border-radius: 7px; gap: 6px; }
.action-icon { width: 14px; height: 14px; }

/* ── Modais ─────────────────────────────────────────────────── */
.max-w-lg { max-width: 600px; }
.max-w-aparelhos { max-width: 640px; }

/* ── Aparelhos modal body ───────────────────────────────────── */
.aparelhos-list-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aparelhos-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 32px;
}

/* Lista vazia */
.aparelhos-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 0 12px;
  color: var(--text-muted);
}
.empty-icon { width: 40px; height: 40px; opacity: 0.3; }

/* Lista de aparelhos */
.aparelhos-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 280px;
  overflow-y: auto;
}

.aparelho-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 4px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}

.aparelho-row:last-child { border-bottom: none; }
.aparelho-row--editing { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 13px 10px; }

.aparelho-row-icon {
  color: var(--primary);
  flex-shrink: 0;
  opacity: 0.8;
}

.aparelho-row-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.aparelho-row-nome {
  font-weight: 600;
  color: var(--text-primary, #fff);
  font-size: 0.9rem;
}

.aparelho-row-detalhe {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.aparelho-row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Status badge (estilo Usuários) ─────────────────────────── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 20px;
  user-select: none;
}

.status-badge-clickable {
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
}

.status-badge-clickable:hover {
  opacity: 0.85;
  transform: scale(1.02);
}

.status-badge--ativo {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.status-badge--inativo {
  background: rgba(100, 116, 139, 0.1);
  color: var(--text-muted);
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* removido css nao utilizado do btn-icon-action e btn-outline-toggle */
/* ── Formulário de aparelho (colapsável) ────────────────────── */
.aparelho-form-card {
  margin-top: 4px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.aparelho-form-title {
  font-weight: 600;
  color: var(--text-primary, #fff);
  font-size: 0.9rem;
  margin-bottom: 14px;
}

.aparelho-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

/* ── Transição do formulário ─────────────────────────────────── */
.form-slide-enter-active,
.form-slide-leave-active {
  transition: all 0.22s ease;
  overflow: hidden;
}
.form-slide-enter-from,
.form-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.form-slide-enter-to,
.form-slide-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* ── Combobox ───────────────────────────────────────────────── */
.combobox-wrapper {
  position: relative;
}

.combobox-input-row {
  position: relative;
  display: flex;
  align-items: center;
}

.combobox-input-row .input-control {
  width: 100%;
  padding-right: 36px;
}

.combobox-clear {
  position: absolute;
  right: 10px;
  width: 15px;
  height: 15px;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
}
.combobox-clear:hover { color: var(--text-primary, #fff); }

.combobox-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-card, #1e2332);
  border: 1px solid var(--border);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.combobox-option {
  padding: 9px 14px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.1s;
  color: var(--text-secondary, #cbd5e1);
}
.combobox-option:hover { background: rgba(255,255,255,0.07); color: #fff; }

.combobox-option-api {
  color: #38bdf8;
  border-top: 1px dashed var(--border);
  font-weight: 500;
}
.combobox-option-api:hover {
  background: rgba(56, 189, 248, 0.1);
  color: #7dd3fc;
}

.combobox-option-custom {
  color: var(--primary, #22c55e);
  border-top: 1px dashed var(--border);
  font-weight: 500;
}
.combobox-option-custom:hover {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
}

/* ── Histórico ──────────────────────────────────────────────── */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}
.history-item { padding: 16px; background-color: rgba(255,255,255,0.01); }
.history-item-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 6px;
}
.history-item-details p { font-size: 0.85rem; margin-bottom: 4px; }
.history-item-footer { font-size: 0.75rem; margin-top: 8px; }
</style>
