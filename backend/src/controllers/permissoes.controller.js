'use strict';

const { Permissao, Usuario } = require('../models');

// ─── Catálogo de Permissões do Sistema ──────────────────────────────────────────
const CATALOGO_MODULOS = [
  {
    id: 'dashboard',
    nome: 'Dashboard e Indicadores',
    descricao: 'Visão geral do negócio, métricas operacionais e gráficos.',
    icone: 'dashboard',
    permissoes: [
      {
        chave: 'dashboard.ver',
        nome: 'Visualizar Dashboard',
        descricao: 'Acesso à tela inicial, indicadores operacionais de OS e estoque.',
      },
      {
        chave: 'dashboard.faturamento',
        nome: 'Visualizar Faturamento e Valores',
        descricao: 'Exibir faturamento total, valores financeiros e ticket médio na tela inicial.',
      },
    ],
  },
  {
    id: 'clientes',
    nome: 'Clientes e Aparelhos',
    descricao: 'Gerenciamento de clientes e vínculo de dispositivos atendidos.',
    icone: 'clientes',
    permissoes: [
      {
        chave: 'clientes.ver',
        nome: 'Visualizar Clientes',
        descricao: 'Acessar a listagem, histórico de visitas e detalhes do cliente.',
      },
      {
        chave: 'clientes.criar',
        nome: 'Cadastrar Clientes',
        descricao: 'Adicionar novos clientes no sistema.',
      },
      {
        chave: 'clientes.editar',
        nome: 'Editar Clientes',
        descricao: 'Alterar dados de contato, endereço e informações do cliente.',
      },
      {
        chave: 'clientes.excluir',
        nome: 'Excluir Clientes',
        descricao: 'Remover cadastros de clientes que não possuem vínculos ativos.',
      },
      {
        chave: 'aparelhos.gerenciar',
        nome: 'Cadastrar e Editar Aparelhos',
        descricao: 'Vincular aparelhos, marcas e modelos aos clientes.',
      },
    ],
  },
  {
    id: 'os',
    nome: 'Ordens de Serviço (OS)',
    descricao: 'Fluxo técnico completo, orçamentos, diagnósticos e laudos.',
    icone: 'os',
    permissoes: [
      {
        chave: 'os.ver',
        nome: 'Visualizar Ordens de Serviço',
        descricao: 'Acessar a lista e consultar detalhes de qualquer OS.',
      },
      {
        chave: 'os.criar',
        nome: 'Abrir Nova OS',
        descricao: 'Iniciar atendimento e criar novas ordens de serviço.',
      },
      {
        chave: 'os.editar',
        nome: 'Editar Dados e Peças da OS',
        descricao: 'Alterar diagnóstico, serviços e peças aplicadas.',
      },
      {
        chave: 'os.status',
        nome: 'Avançar / Alterar Status da OS',
        descricao: 'Mudar status entre Análise, Orçamento, Aguardando Peça, Finalizado, etc.',
      },
      {
        chave: 'os.excluir',
        nome: 'Cancelar / Excluir OS',
        descricao: 'Cancelar atendimentos e ordens de serviço.',
      },
      {
        chave: 'os.imprimir',
        nome: 'Imprimir e Enviar por WhatsApp',
        descricao: 'Gerar via impressa e enviar comprovante da OS ao cliente via WhatsApp.',
      },
    ],
  },
  {
    id: 'estoque',
    nome: 'Estoque e Produtos',
    descricao: 'Controle de peças de reposição, acessórios e saldo de produtos.',
    icone: 'estoque',
    permissoes: [
      {
        chave: 'estoque.ver',
        nome: 'Visualizar Estoque',
        descricao: 'Consultar produtos, peças, quantidade em estoque e preços de venda.',
      },
      {
        chave: 'estoque.criar_editar',
        nome: 'Cadastrar e Editar Produtos',
        descricao: 'Criar novos itens, alterar preços e dados cadastrais.',
      },
      {
        chave: 'estoque.ajustar',
        nome: 'Ajustar Saldo Manualmente',
        descricao: 'Lançar entradas ou saídas manuais para correção de inventário.',
      },
      {
        chave: 'estoque.categorias',
        nome: 'Gerenciar Categorias',
        descricao: 'Criar, alterar e organizar a árvore de categorias de produtos.',
      },
    ],
  },
  {
    id: 'compras',
    nome: 'Compras e Fornecedores',
    descricao: 'Entrada de mercadorias, notas de compra e gestão de fornecedores.',
    icone: 'compras',
    permissoes: [
      {
        chave: 'compras.ver',
        nome: 'Visualizar Compras e Fornecedores',
        descricao: 'Acessar histórico de pedidos e lista de fornecedores.',
      },
      {
        chave: 'compras.criar',
        nome: 'Registrar Nova Compra',
        descricao: 'Lançar novas notas de compras com entrada automática em estoque.',
      },
      {
        chave: 'compras.cancelar',
        nome: 'Cancelar Compra',
        descricao: 'Estornar pedidos de compras e reverter o estoque lançado.',
      },
      {
        chave: 'compras.fornecedores',
        nome: 'Cadastrar e Editar Fornecedores',
        descricao: 'Adicionar e atualizar dados de fornecedores e parceiros.',
      },
    ],
  },
  {
    id: 'vendas',
    nome: 'Vendas (PDV Balcão)',
    descricao: 'Frente de caixa para vendas de acessórios e produtos pronta entrega.',
    icone: 'vendas',
    permissoes: [
      {
        chave: 'vendas.ver',
        nome: 'Visualizar Vendas',
        descricao: 'Consultar histórico de vendas efetuadas no balcão.',
      },
      {
        chave: 'vendas.criar',
        nome: 'Realizar Nova Venda',
        descricao: 'Operar o PDV, adicionar produtos no carrinho e concluir pagamento.',
      },
      {
        chave: 'vendas.desconto',
        nome: 'Conceder Desconto em Vendas',
        descricao: 'Aplicar desconto em itens ou no total da compra.',
      },
      {
        chave: 'vendas.cancelar',
        nome: 'Cancelar Venda',
        descricao: 'Estornar vendas realizadas no balcão e devolver itens ao estoque.',
      },
    ],
  },
  {
    id: 'caixa',
    nome: 'Caixa e Fluxo Financeiro',
    descricao: 'Controle de turnos de caixa, recebimentos, sangrias e despesas.',
    icone: 'caixa',
    permissoes: [
      {
        chave: 'caixa.ver',
        nome: 'Visualizar Movimentações de Caixa',
        descricao: 'Acessar saldo atual, histórico de entradas e saídas.',
      },
      {
        chave: 'caixa.abrir_fechar',
        nome: 'Abrir, Conferir e Fechar Sessão de Caixa',
        descricao: 'Abrir e fechar sessões de caixa informando o dinheiro contado na gaveta (conferência de abertura e fechamento).',
      },
      {
        chave: 'caixa.movimentar',
        nome: 'Lançar Entradas e Saídas Manuais',
        descricao: 'Lançar entradas e despesas avulsas, com uma ou mais formas de pagamento.',
      },
      {
        chave: 'caixa.transferir',
        nome: 'Transferir entre Contas (Gaveta, Cofre, Conta da loja)',
        descricao: 'Realizar e cancelar transferências, como guardar dinheiro da gaveta no cofre (sangria) ou retirá-lo de volta.',
      },
      {
        chave: 'caixa.estornar',
        nome: 'Estornar Lançamentos Manuais',
        descricao: 'Corrigir lançamentos manuais efetivados gerando um estorno (a movimentação original é preservada).',
      },
      {
        chave: 'caixa.aprovar',
        nome: 'Aprovar Divergências e Exceções de Caixa',
        descricao: 'Autorizar diferenças de conferência acima do limite e saídas/transferências acima do saldo disponível.',
      },
    ],
  },
  {
    id: 'relatorios',
    nome: 'Relatórios Gerenciais',
    descricao: 'Análise de desempenho, relatórios financeiros, vendas e OS.',
    icone: 'relatorios',
    permissoes: [
      {
        chave: 'relatorios.vendas',
        nome: 'Relatório de Vendas',
        descricao: 'Exportar e visualizar relatórios detalhados de vendas por período.',
      },
      {
        chave: 'relatorios.caixa',
        nome: 'Relatório Financeiro / Caixa',
        descricao: 'Exportar demonstrativo financeiro e conciliação de caixa.',
      },
      {
        chave: 'relatorios.estoque',
        nome: 'Relatório de Estoque',
        descricao: 'Exportar posição de estoque, peças em falta e custos.',
      },
      {
        chave: 'relatorios.os',
        nome: 'Relatório de Ordens de Serviço',
        descricao: 'Exportar produtividade técnica e tempo médio de conclusão.',
      },
    ],
  },
  {
    id: 'usuarios',
    nome: 'Configurações e Usuários',
    descricao: 'Gestão de contas de colaboradores e controle de acessos.',
    icone: 'usuarios',
    permissoes: [
      {
        chave: 'usuarios.gerenciar',
        nome: 'Gerenciar Colaboradores',
        descricao: 'Cadastrar novos usuários, redefinir senhas e alterar dados de contato.',
      },
      {
        chave: 'permissoes.configurar',
        nome: 'Configurar Perfis de Acesso e Permissões',
        descricao: 'Alterar permissões de cargos e definir permissões customizadas por usuário.',
      },
    ],
  },
];

// ─── Padrões de Fábrica do Sistema ─────────────────────────────────────────────
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

/**
 * Função utilitária para resolver as permissões ativas de qualquer usuário.
 * Regra: Se tem permissão cadastrada para o id_usuario -> usa do usuário.
 *        Se não tem -> usa do perfil de acesso (banco).
 *        Se não achar -> usa padrão de fábrica.
 */
const resolverPermissoesUsuario = async (usuario) => {
  if (!usuario) return {};

  const garantirSegurancaGerente = (obj) => {
    if (usuario.perfil === 'Gerente') {
      obj['permissoes.configurar'] = true;
    }
    return obj;
  };

  try {
    // 1. Verifica se há permissões específicas cadastradas para este id_usuario
    const permUsuario = await Permissao.findOne({
      where: { id_usuario: usuario.id_usuario },
    });

    if (permUsuario && permUsuario.regras) {
      const regras = typeof permUsuario.regras === 'string'
        ? JSON.parse(permUsuario.regras)
        : permUsuario.regras;
      return garantirSegurancaGerente({ ...PADROES_SISTEMA[usuario.perfil], ...regras, _fonte: 'usuario' });
    }

    // 2. Se não tem para o usuário, pega do perfil cadastrado no banco
    const permPerfil = await Permissao.findOne({
      where: { perfil: usuario.perfil, id_usuario: null },
    });

    if (permPerfil && permPerfil.regras) {
      const regras = typeof permPerfil.regras === 'string'
        ? JSON.parse(permPerfil.regras)
        : permPerfil.regras;
      return garantirSegurancaGerente({ ...PADROES_SISTEMA[usuario.perfil], ...regras, _fonte: 'perfil' });
    }

    // 3. Fallback: Padrão de fábrica em memória
    return garantirSegurancaGerente({ ...(PADROES_SISTEMA[usuario.perfil] || PADROES_SISTEMA['Atendente']), _fonte: 'padrao' });
  } catch (err) {
    console.error('[Permissoes] Erro ao resolver permissões:', err);
    return garantirSegurancaGerente({ ...(PADROES_SISTEMA[usuario.perfil] || {}), _fonte: 'erro_fallback' });
  }
};

// ─── Controladores da API ───────────────────────────────────────────────────────

/**
 * Retorna a matriz unificada de permissões: catálogo completo, perfis cadastrados,
 * usuários ativos (com status de herança) e os padrões do sistema.
 */
const obterMatrizCompleta = async (req, res) => {
  try {
    // Busca permissões de perfis
    const permissoesPerfisBanco = await Permissao.findAll({
      where: { id_usuario: null },
    });

    const perfisMap = {
      Gerente: { ...PADROES_SISTEMA.Gerente },
      Atendente: { ...PADROES_SISTEMA.Atendente },
      Técnico: { ...PADROES_SISTEMA.Técnico },
    };

    permissoesPerfisBanco.forEach((p) => {
      if (perfisMap[p.perfil]) {
        const regras = typeof p.regras === 'string' ? JSON.parse(p.regras) : p.regras;
        perfisMap[p.perfil] = { ...perfisMap[p.perfil], ...regras };
      }
    });

    // Busca todos os usuários ativos
    const usuarios = await Usuario.findAll({
      where: { ativo: true },
      attributes: ['id_usuario', 'nome', 'login', 'perfil', 'email', 'telefone'],
      order: [['nome', 'ASC']],
    });

    // Busca permissões customizadas de usuários
    const permissoesUsuariosBanco = await Permissao.findAll({
      where: { id_usuario: { [require('sequelize').Op.ne]: null } },
    });

    const usuariosCustomMap = {};
    permissoesUsuariosBanco.forEach((p) => {
      const regras = typeof p.regras === 'string' ? JSON.parse(p.regras) : p.regras;
      usuariosCustomMap[p.id_usuario] = regras;
    });

    // Mapeia os usuários com status de herança
    const listaUsuarios = usuarios.map((u) => {
      const temPersonalizado = !!usuariosCustomMap[u.id_usuario];
      const regrasPerfil = perfisMap[u.perfil] || PADROES_SISTEMA[u.perfil] || {};
      const regrasEfetivas = temPersonalizado
        ? { ...regrasPerfil, ...usuariosCustomMap[u.id_usuario] }
        : { ...regrasPerfil };

      return {
        id_usuario: u.id_usuario,
        nome: u.nome,
        login: u.login,
        perfil: u.perfil,
        email: u.email,
        telefone: u.telefone,
        temPermissaoPersonalizada: temPersonalizado,
        regras: regrasEfetivas,
      };
    });

    return res.json({
      catalogo: CATALOGO_MODULOS,
      padroes: PADROES_SISTEMA,
      perfis: perfisMap,
      usuarios: listaUsuarios,
    });
  } catch (err) {
    console.error('[Permissoes] Erro ao obter matriz:', err);
    return res.status(500).json({ error: 'Erro ao carregar permissões.' });
  }
};

/**
 * Salva as permissões de um perfil de acesso (Gerente, Atendente ou Técnico).
 */
const salvarPermissoesPerfil = async (req, res) => {
  try {
    const { perfil } = req.params;
    const { regras } = req.body;

    if (!['Gerente', 'Atendente', 'Técnico'].includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido.' });
    }

    if (!regras || typeof regras !== 'object') {
      return res.status(400).json({ error: 'Mapa de regras é obrigatório.' });
    }

    let permissao = await Permissao.findOne({
      where: { perfil, id_usuario: null },
    });

    if (permissao) {
      permissao.regras = regras;
      await permissao.save();
    } else {
      permissao = await Permissao.create({
        perfil,
        id_usuario: null,
        regras,
      });
    }

    return res.json({
      sucesso: true,
      mensagem: `Permissões do perfil "${perfil}" salvas com sucesso.`,
      regras: permissao.regras,
    });
  } catch (err) {
    console.error('[Permissoes] Erro ao salvar perfil:', err);
    return res.status(500).json({ error: 'Erro ao salvar permissões do perfil.' });
  }
};

/**
 * Restaura as permissões de um perfil de acesso para o padrão de fábrica do sistema.
 */
const restaurarPadraoPerfil = async (req, res) => {
  try {
    const { perfil } = req.params;

    if (!['Gerente', 'Atendente', 'Técnico'].includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido.' });
    }

    const padrao = PADROES_SISTEMA[perfil];
    if (!padrao) {
      return res.status(400).json({ error: 'Padrão não encontrado para este perfil.' });
    }

    let permissao = await Permissao.findOne({
      where: { perfil, id_usuario: null },
    });

    if (permissao) {
      permissao.regras = padrao;
      await permissao.save();
    } else {
      await Permissao.create({
        perfil,
        id_usuario: null,
        regras: padrao,
      });
    }

    return res.json({
      sucesso: true,
      mensagem: `Permissões do perfil "${perfil}" restauradas para o padrão com sucesso.`,
      regras: padrao,
    });
  } catch (err) {
    console.error('[Permissoes] Erro ao restaurar padrão do perfil:', err);
    return res.status(500).json({ error: 'Erro ao restaurar padrão do perfil.' });
  }
};

/**
 * Salva as permissões personalizadas de um usuário específico.
 */
const salvarPermissoesUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { regras } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (!regras || typeof regras !== 'object') {
      return res.status(400).json({ error: 'Mapa de regras é obrigatório.' });
    }

    let permissao = await Permissao.findOne({
      where: { id_usuario: id },
    });

    if (permissao) {
      permissao.regras = regras;
      await permissao.save();
    } else {
      permissao = await Permissao.create({
        perfil: null,
        id_usuario: id,
        regras,
      });
    }

    return res.json({
      sucesso: true,
      mensagem: `Permissões personalizadas para o colaborador "${usuario.nome}" salvas com sucesso.`,
      regras: permissao.regras,
    });
  } catch (err) {
    console.error('[Permissoes] Erro ao salvar permissões do usuário:', err);
    return res.status(500).json({ error: 'Erro ao salvar permissões do usuário.' });
  }
};

/**
 * Restaura as permissões de um usuário para o padrão do perfil dele (remove a substituição).
 */
const restaurarPadraoUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Exclui a linha de customização desse id_usuario
    await Permissao.destroy({
      where: { id_usuario: id },
    });

    // Pega as regras ativas herdadas do perfil
    const permPerfil = await Permissao.findOne({
      where: { perfil: usuario.perfil, id_usuario: null },
    });

    const regrasHerdadas = permPerfil && permPerfil.regras
      ? (typeof permPerfil.regras === 'string' ? JSON.parse(permPerfil.regras) : permPerfil.regras)
      : PADROES_SISTEMA[usuario.perfil];

    return res.json({
      sucesso: true,
      mensagem: `Permissões de "${usuario.nome}" restauradas para o padrão do perfil (${usuario.perfil}).`,
      regras: regrasHerdadas,
    });
  } catch (err) {
    console.error('[Permissoes] Erro ao restaurar padrão do usuário:', err);
    return res.status(500).json({ error: 'Erro ao restaurar permissões do usuário.' });
  }
};

module.exports = {
  CATALOGO_MODULOS,
  PADROES_SISTEMA,
  resolverPermissoesUsuario,
  obterMatrizCompleta,
  salvarPermissoesPerfil,
  restaurarPadraoPerfil,
  salvarPermissoesUsuario,
  restaurarPadraoUsuario,
};

