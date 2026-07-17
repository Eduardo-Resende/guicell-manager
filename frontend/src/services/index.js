import api from './api';

export const authService = {
  async login(login, senha) {
    const { data } = await api.post('/auth/login', { login, senha });
    localStorage.setItem('guicell_token', data.token);
    localStorage.setItem('guicell_usuario', JSON.stringify(data.usuario));
    return data;
  },
  logout() {
    localStorage.removeItem('guicell_token');
    localStorage.removeItem('guicell_usuario');
  },
  getUsuarioLogado() {
    return JSON.parse(localStorage.getItem('guicell_usuario') || 'null');
  },
  isAuthenticated() {
    return !!localStorage.getItem('guicell_token');
  },
};

export const clientesService = {
  listar: (busca) => api.get('/clientes', { params: { busca } }).then(r => r.data),
  buscarPorId: (id) => api.get(`/clientes/${id}`).then(r => r.data),
  criar: (dados) => api.post('/clientes', dados).then(r => r.data),
  atualizar: (id, dados) => api.put(`/clientes/${id}`, dados).then(r => r.data),
  remover: (id) => api.delete(`/clientes/${id}`),
};

export const aparelhosService = {
  listarPorCliente: (id_cliente) => api.get(`/aparelhos/cliente/${id_cliente}`).then(r => r.data),
  criar: (dados) => api.post('/aparelhos', dados).then(r => r.data),
  atualizar: (id, dados) => api.put(`/aparelhos/${id}`, dados).then(r => r.data),
};

export const osService = {
  dashboard: () => api.get('/ordens-servico/dashboard').then(r => r.data),
  listar: (filtros) => api.get('/ordens-servico', { params: filtros }).then(r => r.data),
  buscarPorId: (id) => api.get(`/ordens-servico/${id}`).then(r => r.data),
  criar: (dados) => api.post('/ordens-servico', dados).then(r => r.data),
  atualizarStatus: (id, status, diagnostico, itens, valor_orcado) => api.patch(`/ordens-servico/${id}/status`, { status, diagnostico, itens, valor_orcado }).then(r => r.data),
  fechar: (id, dados) => api.post(`/ordens-servico/${id}/fechar`, dados).then(r => r.data),
};

export const produtosService = {
  listar: (filtros) => api.get('/produtos', { params: filtros }).then(r => r.data),
  alertas: () => api.get('/produtos/alertas').then(r => r.data),
  criar: (dados) => api.post('/produtos', dados).then(r => r.data),
  atualizar: (id, dados) => api.put(`/produtos/${id}`, dados).then(r => r.data),
  remover: (id) => api.delete(`/produtos/${id}`),
  registrarEntrada: (id, quantidade) => api.post(`/produtos/${id}/entrada`, { quantidade }).then(r => r.data),
};

export const vendasService = {
  listar: (filtros) => api.get('/vendas', { params: filtros }).then(r => r.data),
  criar: (dados) => api.post('/vendas', dados).then(r => r.data),
};

export const caixaService = {
  listar: (filtros) => api.get('/caixa', { params: filtros }).then(r => r.data),
  resumoDia: () => api.get('/caixa/resumo-dia').then(r => r.data),
  registrarManual: (dados) => api.post('/caixa', dados).then(r => r.data),
};

export const relatoriosService = {
  os: (filtros) => api.get('/relatorios/os', { params: filtros }).then(r => r.data),
  vendas: (filtros) => api.get('/relatorios/vendas', { params: filtros }).then(r => r.data),
  caixa: (filtros) => api.get('/relatorios/caixa', { params: filtros }).then(r => r.data),
  estoque: () => api.get('/relatorios/estoque').then(r => r.data),
};

export const usuariosService = {
  listar: () => api.get('/usuarios').then(r => r.data),
  tecnicos: () => api.get('/usuarios/tecnicos').then(r => r.data),
  criar: (dados) => api.post('/usuarios', dados).then(r => r.data),
  atualizar: (id, dados) => api.put(`/usuarios/${id}`, dados).then(r => r.data),
  toggleAtivo: (id) => api.patch(`/usuarios/${id}/toggle-ativo`).then(r => r.data),
};

export const categoriasService = {
  listar: (hierarquico) => api.get('/categorias', { params: { hierarquico } }).then(r => r.data),
  criar: (dados) => api.post('/categorias', dados).then(r => r.data),
  atualizar: (id, dados) => api.put(`/categorias/${id}`, dados).then(r => r.data),
  remover: (id) => api.delete(`/categorias/${id}`).then(r => r.data),
};
