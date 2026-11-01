const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT.
 * Verifica o token Bearer no header Authorization.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id_usuario, login, perfil }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};

/**
 * Middleware de autorização por perfil estático.
 * Uso: authorize(['Gerente']) ou authorize(['Gerente', 'Atendente'])
 */
const authorize = (perfisPermitidos) => (req, res, next) => {
  if (!perfisPermitidos.includes(req.usuario.perfil)) {
    return res.status(403).json({
      error: `Acesso negado. Requer perfil: ${perfisPermitidos.join(' ou ')}.`,
    });
  }
  next();
};

/**
 * Middleware de verificação granular e dinâmica de permissões.
 * Avalia se o usuário ou perfil possui a chave (ou pelo menos uma chave da lista) liberada no banco.
 * Uso: checkPermission('estoque.criar_editar') ou checkPermission(['caixa.ver', 'caixa.abrir_fechar'])
 */
const checkPermission = (chaveOuLista) => async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Acesso negado. Usuário não autenticado.' });
    }

    // Lazy load do controller para evitar dependência circular
    const { resolverPermissoesUsuario } = require('../controllers/permissoes.controller');
    const permissoes = await resolverPermissoesUsuario(req.usuario);
    req.usuario.permissoes = permissoes;

    const listaChaves = Array.isArray(chaveOuLista) ? chaveOuLista : [chaveOuLista];

    const verificarChave = (chave) => {
      if (chave === 'relatorios') {
        return !!(permissoes['relatorios.vendas'] || permissoes['relatorios.caixa'] || permissoes['relatorios.estoque'] || permissoes['relatorios.os']);
      }
      if (chave === 'dashboard') {
        return !!(permissoes['dashboard.ver'] || permissoes['dashboard.faturamento']);
      }
      if (chave === 'caixa') {
        return !!(permissoes['caixa.ver'] || permissoes['caixa.abrir_fechar'] || permissoes['caixa.movimentar']);
      }
      if (chave === 'estoque') {
        return !!(permissoes['estoque.ver'] || permissoes['estoque.criar_editar'] || permissoes['estoque.ajustar'] || permissoes['estoque.categorias']);
      }
      if (chave === 'compras') {
        return !!(permissoes['compras.ver'] || permissoes['compras.criar'] || permissoes['compras.cancelar'] || permissoes['compras.fornecedores']);
      }
      if (chave === 'vendas') {
        return !!(permissoes['vendas.ver'] || permissoes['vendas.criar'] || permissoes['vendas.desconto'] || permissoes['vendas.cancelar']);
      }
      if (chave === 'os') {
        return !!(permissoes['os.ver'] || permissoes['os.criar'] || permissoes['os.editar'] || permissoes['os.status'] || permissoes['os.excluir'] || permissoes['os.imprimir']);
      }
      if (chave === 'clientes') {
        return !!(permissoes['clientes.ver'] || permissoes['clientes.criar'] || permissoes['clientes.editar'] || permissoes['clientes.excluir'] || permissoes['aparelhos.gerenciar']);
      }
      return permissoes[chave] === true;
    };

    if (listaChaves.some(verificarChave)) {
      return next();
    }

    return res.status(403).json({
      error: `Acesso negado: Você não possui permissão (${listaChaves.join(' ou ')}) para realizar esta operação.`,
    });
  } catch (err) {
    console.error('[checkPermission] Erro:', err);
    return res.status(500).json({ error: 'Erro ao validar permissões.' });
  }
};

module.exports = { authenticate, authorize, checkPermission };
