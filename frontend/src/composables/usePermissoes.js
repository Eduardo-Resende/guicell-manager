import { ref, computed } from 'vue';
import api from '../services/api';

// Padrões de fábrica caso o usuário ainda não tenha relogado após a atualização
const PADROES_SISTEMA = {
  Gerente: {
    'dashboard.ver': true,
    'dashboard.faturamento': true,
    'clientes.ver': true,
    'clientes.criar': true,
    'clientes.editar': true,
    'clientes.excluir': true,
    'aparelhos.gerenciar': true,
    'os.ver': true,
    'os.criar': true,
    'os.editar': true,
    'os.status': true,
    'os.excluir': true,
    'os.imprimir': true,
    'estoque.ver': true,
    'estoque.criar_editar': true,
    'estoque.ajustar': true,
    'estoque.categorias': true,
    'compras.ver': true,
    'compras.criar': true,
    'compras.cancelar': true,
    'compras.fornecedores': true,
    'vendas.ver': true,
    'vendas.criar': true,
    'vendas.desconto': true,
    'vendas.cancelar': true,
    'caixa.ver': true,
    'caixa.abrir_fechar': true,
    'caixa.movimentar': true,
    'caixa.transferir': true,
    'caixa.estornar': true,
    'caixa.aprovar': true,
    'relatorios.vendas': true,
    'relatorios.caixa': true,
    'relatorios.estoque': true,
    'relatorios.os': true,
    'usuarios.gerenciar': true,
    'permissoes.configurar': true,
  },
  Atendente: {
    'dashboard.ver': true,
    'dashboard.faturamento': false,
    'clientes.ver': true,
    'clientes.criar': true,
    'clientes.editar': true,
    'clientes.excluir': false,
    'aparelhos.gerenciar': true,
    'os.ver': true,
    'os.criar': true,
    'os.editar': true,
    'os.status': true,
    'os.excluir': false,
    'os.imprimir': true,
    'estoque.ver': true,
    'estoque.criar_editar': false,
    'estoque.ajustar': false,
    'estoque.categorias': false,
    'compras.ver': false,
    'compras.criar': false,
    'compras.cancelar': false,
    'compras.fornecedores': false,
    'vendas.ver': true,
    'vendas.criar': true,
    'vendas.desconto': true,
    'vendas.cancelar': false,
    'caixa.ver': true,
    'caixa.abrir_fechar': true,
    'caixa.movimentar': true,
    'caixa.transferir': true,
    'caixa.estornar': false,
    'caixa.aprovar': false,
    'relatorios.vendas': true,
    'relatorios.caixa': false,
    'relatorios.estoque': true,
    'relatorios.os': true,
    'usuarios.gerenciar': false,
    'permissoes.configurar': false,
  },
  Técnico: {
    'dashboard.ver': true,
    'dashboard.faturamento': false,
    'clientes.ver': true,
    'clientes.criar': true,
    'clientes.editar': true,
    'clientes.excluir': false,
    'aparelhos.gerenciar': true,
    'os.ver': true,
    'os.criar': true,
    'os.editar': true,
    'os.status': true,
    'os.excluir': false,
    'os.imprimir': true,
    'estoque.ver': true,
    'estoque.criar_editar': false,
    'estoque.ajustar': false,
    'estoque.categorias': false,
    'compras.ver': false,
    'compras.criar': false,
    'compras.cancelar': false,
    'compras.fornecedores': false,
    'vendas.ver': false,
    'vendas.criar': false,
    'vendas.desconto': false,
    'vendas.cancelar': false,
    'caixa.ver': false,
    'caixa.abrir_fechar': false,
    'caixa.movimentar': false,
    'caixa.transferir': false,
    'caixa.estornar': false,
    'caixa.aprovar': false,
    'relatorios.vendas': false,
    'relatorios.caixa': false,
    'relatorios.estoque': true,
    'relatorios.os': true,
    'usuarios.gerenciar': false,
    'permissoes.configurar': false,
  },
};

const MODULO_CHAVES = {
  dashboard: ['dashboard.ver', 'dashboard.faturamento'],
  clientes: ['clientes.ver', 'clientes.criar', 'clientes.editar', 'clientes.excluir', 'aparelhos.gerenciar'],
  os: ['os.ver', 'os.criar', 'os.editar', 'os.status', 'os.excluir', 'os.imprimir'],
  estoque: ['estoque.ver', 'estoque.criar_editar', 'estoque.ajustar', 'estoque.categorias'],
  compras: ['compras.ver', 'compras.criar', 'compras.cancelar', 'compras.fornecedores'],
  vendas: ['vendas.ver', 'vendas.criar', 'vendas.desconto', 'vendas.cancelar'],
  caixa: ['caixa.ver', 'caixa.abrir_fechar', 'caixa.movimentar', 'caixa.transferir', 'caixa.estornar', 'caixa.aprovar'],
  relatorios: ['relatorios.os', 'relatorios.vendas', 'relatorios.caixa', 'relatorios.estoque'],
  usuarios: ['usuarios.gerenciar'],
  permissoes: ['permissoes.configurar'],
};

const usuarioAtual = ref(null);
const versaoPermissoes = ref(0);

const carregarUsuarioDoStorage = () => {
  try {
    const raw = localStorage.getItem('guicell_usuario') || localStorage.getItem('guicell_user');
    usuarioAtual.value = raw ? JSON.parse(raw) : null;
  } catch {
    usuarioAtual.value = null;
  }
};

// Inicializa no carregamento
carregarUsuarioDoStorage();

/**
 * Atualiza o estado reativo a partir do localStorage
 */
export const atualizarPermissoesLocais = () => {
  carregarUsuarioDoStorage();
  versaoPermissoes.value++;
};

/**
 * Busca os dados mais recentes do usuário logado no servidor (/api/auth/me)
 * e atualiza o localStorage e o estado reativo em tempo real.
 */
export const sincronizarComServidor = async () => {
  const token = localStorage.getItem('guicell_token');
  if (!token) {
    usuarioAtual.value = null;
    versaoPermissoes.value++;
    return null;
  }
  try {
    const { data } = await api.get('/auth/me');
    if (data && data.id_usuario) {
      localStorage.setItem('guicell_usuario', JSON.stringify(data));
      localStorage.setItem('guicell_user', JSON.stringify(data));
      usuarioAtual.value = data;
      versaoPermissoes.value++;
      return data;
    }
  } catch (err) {
    console.warn('[Permissoes] Falha ao sincronizar com servidor:', err?.message);
  }
  return usuarioAtual.value;
};

/**
 * Verifica se o usuário logado possui determinada permissão granular.
 * @param {string} chave Ex: 'estoque.criar_editar', 'clientes.excluir', 'caixa.abrir_fechar'
 * @returns {boolean}
 */
export const pode = (chave) => {
  // Referencia versaoPermissoes para garantir reatividade em computed/templates
  void versaoPermissoes.value;

  const u = usuarioAtual.value;
  if (!u) return false;

  // Segurança: Gerente sempre mantém acesso à configuração de permissões para não se trancar
  if (u.perfil === 'Gerente' && chave === 'permissoes.configurar') {
    return true;
  }

  // Se o módulo for 'relatorios' genérico, basta ter ao menos 1 relatório ativo
  if (chave === 'relatorios') {
    return podeModulo('relatorios');
  }

  // Se o módulo for passado diretamente (ex: 'caixa', 'dashboard')
  if (MODULO_CHAVES[chave]) {
    return podeModulo(chave);
  }

  const perms = u.permissoes || PADROES_SISTEMA[u.perfil] || PADROES_SISTEMA.Atendente;
  const padraoPerfil = PADROES_SISTEMA[u.perfil] || PADROES_SISTEMA.Atendente;

  if (perms[chave] !== undefined) {
    return perms[chave] === true;
  }
  return padraoPerfil[chave] === true;
};

/**
 * Verifica se o usuário possui PELO MENOS UMA permissão ativa dentro de um módulo.
 * Se todas as permissões do módulo estiverem desmarcadas, retorna false (esconde da Sidebar e bloqueia rota).
 * @param {string} modulo Ex: 'dashboard', 'caixa', 'estoque', 'compras', 'relatorios'
 * @returns {boolean}
 */
export const podeModulo = (modulo) => {
  void versaoPermissoes.value;
  const chaves = MODULO_CHAVES[modulo];
  if (!chaves) return pode(modulo);
  return chaves.some((chave) => pode(chave));
};

/**
 * Retorna a primeira rota que o usuário possui permissão para acessar.
 */
export const obterPrimeiraRotaPermitida = () => {
  const ordemRotas = [
    { path: '/dashboard', modulo: 'dashboard' },
    { path: '/os', modulo: 'os' },
    { path: '/clientes', modulo: 'clientes' },
    { path: '/estoque', modulo: 'estoque' },
    { path: '/vendas', modulo: 'vendas' },
    { path: '/caixa', modulo: 'caixa' },
    { path: '/compras', modulo: 'compras' },
    { path: '/relatorios', modulo: 'relatorios' },
    { path: '/usuarios', modulo: 'usuarios' },
    { path: '/permissoes', modulo: 'permissoes' },
  ];

  for (const item of ordemRotas) {
    if (podeModulo(item.modulo)) {
      return item.path;
    }
  }
  return '/login';
};

export function usePermissoes() {
  const permissoesAtivas = computed(() => {
    void versaoPermissoes.value;
    const u = usuarioAtual.value;
    if (!u) return {};
    return { ...(PADROES_SISTEMA[u.perfil] || {}), ...(u.permissoes || {}) };
  });

  return {
    usuarioAtual,
    permissoesAtivas,
    pode,
    podeModulo,
    obterPrimeiraRotaPermitida,
    atualizarPermissoesLocais,
    sincronizarComServidor,
  };
}
