import api from './api';
import { atualizarPermissoesLocais } from '../composables/usePermissoes';

export const authService = {
  async login(login, senha) {
    const { data } = await api.post('/auth/login', { login, senha });
    localStorage.setItem('guicell_token', data.token);
    localStorage.setItem('guicell_usuario', JSON.stringify(data.usuario));
    localStorage.setItem('guicell_user', JSON.stringify(data.usuario));
    atualizarPermissoesLocais();
    return data;
  },
  solicitarRecuperacao: (login, canal) => api.post('/auth/recuperar-senha/solicitar', { login, canal }).then(r => r.data),
  validarCodigo: (login, codigo) => api.post('/auth/recuperar-senha/validar-codigo', { login, codigo }).then(r => r.data),
  redefinirSenha: (login, resetGrant, novaSenha, confirmarNovaSenha) => api.post('/auth/recuperar-senha/redefinir', { login, resetGrant, novaSenha, confirmarNovaSenha }).then(r => r.data),
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignora erro de rede para garantir limpeza local
    }
    localStorage.removeItem('guicell_token');
    localStorage.removeItem('guicell_usuario');
    localStorage.removeItem('guicell_user');
    atualizarPermissoesLocais();
  },
  getUsuarioLogado() {
    return JSON.parse(localStorage.getItem('guicell_usuario') || localStorage.getItem('guicell_user') || 'null');
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
  buscarMarcas: (busca) => api.get('/aparelhos/marcas', { params: { busca } }).then(r => r.data),
  buscarModelos: (marca, busca) => api.get('/aparelhos/modelos', { params: { marca, busca } }).then(r => r.data),
  consultarAPIExterna: (q) => api.get('/aparelhos/buscar-externo', { params: { q } }).then(r => r.data),
  listarPorCliente: (id_cliente) => api.get(`/aparelhos/cliente/${id_cliente}`).then(r => r.data),
  listarAtivosParaOS: (id_cliente) => api.get(`/aparelhos/cliente/${id_cliente}/ativos`).then(r => r.data),
  criar: (dados) => api.post('/aparelhos', dados).then(r => r.data),
  atualizar: (id, dados) => api.put(`/aparelhos/${id}`, dados).then(r => r.data),
  toggleAtivo: (id) => api.patch(`/aparelhos/${id}/toggle-ativo`).then(r => r.data),
};

export const osService = {
  dashboard: () => api.get('/ordens-servico/dashboard').then(r => r.data),
  listar: (filtros) => api.get('/ordens-servico', { params: filtros }).then(r => r.data),
  listarPendentes: () => api.get('/ordens-servico/pendentes').then(r => r.data),
  buscarPorId: (id) => api.get(`/ordens-servico/${id}`).then(r => r.data),
  criar: (dados) => api.post('/ordens-servico', dados).then(r => r.data),
  atualizarStatus: (id, status, diagnostico, itens, valor_orcado, prazo_estimado) => api.patch(`/ordens-servico/${id}/status`, { status, diagnostico, itens, valor_orcado, prazo_estimado }).then(r => r.data),
  fechar: (id, dados) => api.post(`/ordens-servico/${id}/fechar`, dados).then(r => r.data),
  pagar: (id, forma_pagamento) => api.post(`/ordens-servico/${id}/pagar`, { forma_pagamento }).then(r => r.data),
  cancelar: (id, motivo) => api.post(`/ordens-servico/${id}/cancelar`, { motivo }).then(r => r.data),
  enviarEmail: (payload) => api.post('/ordens-servico/enviar-email', payload).then(r => r.data),
  enviarWhatsapp: (payload) => api.post('/ordens-servico/enviar-whatsapp', payload).then(r => r.data),
};

export const produtosService = {
  listar: (filtros) => api.get('/produtos', { params: filtros }).then(r => r.data),
  alertas: () => api.get('/produtos/alertas').then(r => r.data),
  movimentacoes: () => api.get('/produtos/movimentacoes').then(r => r.data),
  criar: (dados) => api.post('/produtos', dados).then(r => r.data),
  atualizar: (id, dados) => api.put(`/produtos/${id}`, dados).then(r => r.data),
  remover: (id) => api.delete(`/produtos/${id}`),
  registrarEntrada: (id, quantidade, tipo = 'entrada') => api.post(`/produtos/${id}/entrada`, { quantidade, tipo }).then(r => r.data),
};

export const vendasService = {
  listar: (filtros) => api.get('/vendas', { params: filtros }).then(r => r.data),
  listarPendentes: () => api.get('/vendas/pendentes').then(r => r.data),
  criar: (dados) => api.post('/vendas', dados).then(r => r.data),
  pagar: (id, forma_pagamento) => api.post(`/vendas/${id}/pagar`, { forma_pagamento }).then(r => r.data),
  cancelar: (id, motivo) => api.post(`/vendas/${id}/cancelar`, { motivo }).then(r => r.data),
};

export const caixaService = {
  status: () => api.get('/caixa/status').then(r => r.data),
  listar: (filtros) => api.get('/caixa', { params: filtros }).then(r => r.data),
  resumo: () => api.get('/caixa/resumo').then(r => r.data),
  resumoDia: () => api.get('/caixa/resumo').then(r => r.data),
  formasPagamento: () => api.get('/caixa/formas-pagamento').then(r => r.data),
  aberturaInfo: () => api.get('/caixa/abertura-info').then(r => r.data),
  fechamentoPrevia: () => api.get('/caixa/fechamento-previa').then(r => r.data),
  abrir: (dados) => api.post('/caixa/abrir', typeof dados === 'object' ? dados : { valor_contado: dados }).then(r => r.data),
  fechar: (dados) => api.post('/caixa/fechar', dados || {}).then(r => r.data),
  registrarManual: (dados) => api.post('/caixa', dados).then(r => r.data),
  estornar: (id, motivo) => api.post(`/caixa/${id}/estornar`, { motivo }).then(r => r.data),
  sessoes: (params) => api.get('/caixa/sessoes', { params }).then(r => r.data),
  transferencias: (params) => api.get('/caixa/transferencias', { params }).then(r => r.data),
  buscarTransferencia: (id) => api.get(`/caixa/transferencias/${id}`).then(r => r.data),
  criarTransferencia: (dados) => api.post('/caixa/transferencias', dados).then(r => r.data),
  cancelarTransferencia: (id, motivo) => api.post(`/caixa/transferencias/${id}/cancelar`, { motivo }).then(r => r.data),
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

export const fornecedoresService = {
  listar: (params) => api.get('/fornecedores', { params }).then(r => r.data),
  buscarPorId: (id) => api.get(`/fornecedores/${id}`).then(r => r.data),
  criar: (dados) => api.post('/fornecedores', dados).then(r => r.data),
  atualizar: (id, dados) => api.put(`/fornecedores/${id}`, dados).then(r => r.data),
  toggleAtivo: (id) => api.patch(`/fornecedores/${id}/toggle-ativo`).then(r => r.data),
};

export const comprasService = {
  listar: (filtros) => api.get('/compras', { params: filtros }).then(r => r.data),
  buscarPorId: (id) => api.get(`/compras/${id}`).then(r => r.data),
  criar: (dados) => api.post('/compras', dados).then(r => r.data),
  pagar: (id, pagamentos) => api.post(`/compras/${id}/pagar`, { pagamentos }).then(r => r.data),
  cancelar: (id, motivo) => api.post(`/compras/${id}/cancelar`, { motivo }).then(r => r.data),
};

export const permissoesService = {
  obterMatriz: () => api.get('/permissoes/matriz').then(r => r.data),
  salvarPerfil: (perfil, regras) => api.put(`/permissoes/perfil/${perfil}`, { regras }).then(r => r.data),
  restaurarPerfil: (perfil) => api.post(`/permissoes/perfil/${perfil}/restaurar`).then(r => r.data),
  salvarUsuario: (id, regras) => api.put(`/permissoes/usuario/${id}`, { regras }).then(r => r.data),
  restaurarUsuario: (id) => api.delete(`/permissoes/usuario/${id}/restaurar`).then(r => r.data),
};
