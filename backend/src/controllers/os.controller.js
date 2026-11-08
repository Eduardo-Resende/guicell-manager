'use strict';

const { Movimentacao, ItemMovimentacao, Cliente, Aparelho, Usuario, Produto, Caixa, LogAuditoria, sequelize } = require('../models');
const { Op } = require('sequelize');
const fin = require('../services/financeiro.service');

/** Nome do cliente, usado como "favorecido/origem" do lançamento financeiro. */
const nomeCliente = async (id_cliente, transaction) => {
  if (!id_cliente) return null;
  const cliente = await Cliente.findByPk(id_cliente, { attributes: ['nome'], transaction });
  return cliente ? cliente.nome : null;
};

// Includes padrão de uma OS
const osIncludes = [
  { model: Cliente,  as: 'cliente',  attributes: ['id_cliente', 'nome', 'telefone'] },
  { model: Aparelho, as: 'aparelho', attributes: ['id_aparelho', 'marca', 'modelo', 'imei'] },
  { model: Usuario,  as: 'tecnico',  attributes: ['id_usuario', 'nome'] },
  {
    model: ItemMovimentacao, as: 'itens',
    include: [{ model: Produto, as: 'produto', attributes: ['id_produto', 'descricao', 'valor_venda'] }],
  },
];

// Gera número de OS sequencial: 001, 002... 999, 1000...
const gerarNumeroOS = async (transaction) => {
  const [maxRes] = await sequelize.query(
    "SELECT MAX(CAST(numero_os AS UNSIGNED)) AS max_seq FROM movimentacao WHERE origem = 'os'",
    { transaction, lock: transaction ? transaction.LOCK.UPDATE : undefined }
  );
  const maxSeq = (maxRes && maxRes[0] && maxRes[0].max_seq) ? parseInt(maxRes[0].max_seq, 10) : 0;
  let seq = maxSeq + 1;
  while (await Movimentacao.count({ where: { origem: 'os', numero_os: String(seq).padStart(3, '0') }, transaction }) > 0) {
    seq++;
  }
  return String(seq).padStart(3, '0');
};

// ─── Listar ───────────────────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { status, id_tecnico, data_inicio, data_fim, busca } = req.query;
    const where = { origem: 'os' };
    if (status)     where.status_os = status;
    if (id_tecnico) where.id_tecnico = id_tecnico;
    if (data_inicio || data_fim) {
      where.data_movimentacao = {};
      if (data_inicio) where.data_movimentacao[Op.gte] = new Date(data_inicio);
      if (data_fim)    where.data_movimentacao[Op.lte] = new Date(data_fim + 'T23:59:59');
    }
    if (busca) {
      where[Op.or] = [
        { numero_os: { [Op.like]: `%${busca}%` } },
        { defeito_relatado: { [Op.like]: `%${busca}%` } },
      ];
    }
    const ordens = await Movimentacao.findAll({ where, include: osIncludes, order: [['data_movimentacao', 'DESC']] });
    return res.json(ordens);
  } catch (err) {
    console.error('[OS] Erro ao listar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Buscar por ID ────────────────────────────────────────────────────────────
const buscarPorId = async (req, res) => {
  try {
    const os = await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'os' }, include: osIncludes });
    if (!os) return res.status(404).json({ error: 'OS não encontrada.' });
    return res.json(os);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Criar ────────────────────────────────────────────────────────────────────
const criar = async (req, res) => {
  try {
    const { id_cliente, id_aparelho, id_tecnico, defeito_relatado, diagnostico, valor_orcado, prazo_estimado } = req.body;
    if (!id_cliente || !id_aparelho || !defeito_relatado) {
      return res.status(400).json({ error: 'Cliente, aparelho e defeito são obrigatórios.' });
    }

    // A03: Validação de consistência entre Cliente e Aparelho
    const cliente = await Cliente.findByPk(id_cliente);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    const aparelho = await Aparelho.findByPk(id_aparelho);
    if (!aparelho) {
      return res.status(404).json({ error: 'Aparelho não encontrado.' });
    }
    if (parseInt(aparelho.id_cliente, 10) !== parseInt(id_cliente, 10)) {
      return res.status(422).json({ error: 'O aparelho informado não pertence ao cliente selecionado.' });
    }

    // A05: Concorrência na numeração de OS com retry transacional e backoff exponencial
    const MAX_TENTATIVAS = 10;
    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      const t = await sequelize.transaction();
      try {
        const numero_os = await gerarNumeroOS(t);
        const os = await Movimentacao.create({
          origem: 'os',
          numero_os,
          id_cliente,
          id_aparelho,
          id_tecnico: id_tecnico || null,
          id_usuario: req.usuario.id_usuario,
          defeito_relatado,
          diagnostico: diagnostico || null,
          valor_orcado: valor_orcado || null,
          prazo_estimado: prazo_estimado || null,
          status_os: 'Aguardando Diagnóstico',
          data_movimentacao: new Date(),
        }, { transaction: t });

        await t.commit();
        return res.status(201).json(os);
      } catch (err) {
        if (!t.finished) await t.rollback();
        if (err.name === 'SequelizeUniqueConstraintError' && tentativa < MAX_TENTATIVAS) {
          await new Promise(r => setTimeout(r, Math.floor(Math.random() * 40 * tentativa) + 20));
          continue;
        }
        console.error('[OS] Erro ao criar:', err);
        return res.status(err.name === 'SequelizeUniqueConstraintError' ? 409 : 500).json({
          error: err.name === 'SequelizeUniqueConstraintError' ? 'Conflito de numeração de OS. Tente novamente.' : 'Erro interno.'
        });
      }
    }
  } catch (err) {
    console.error('[OS] Erro ao criar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Helper: atualiza itens e estoque ─────────────────────────────────────────
const atualizarItensEstoque = async (osId, novosItens, transaction) => {
  const itensExistentes = await ItemMovimentacao.findAll({ where: { id_movimentacao: osId }, transaction });

  const qtdExistenteMap = {};
  for (const item of itensExistentes) {
    qtdExistenteMap[item.id_produto] = (qtdExistenteMap[item.id_produto] || 0) + item.quantidade;
  }
  const qtdNovaMap = {};
  for (const item of novosItens) {
    qtdNovaMap[item.id_produto] = (qtdNovaMap[item.id_produto] || 0) + item.quantidade;
  }
  const todosProdutoIds = Array.from(new Set([
    ...Object.keys(qtdExistenteMap).map(Number),
    ...Object.keys(qtdNovaMap).map(Number),
  ])).sort((a, b) => a - b);

  for (const prodId of todosProdutoIds) {
    const diff = (qtdNovaMap[prodId] || 0) - (qtdExistenteMap[prodId] || 0);
    if (diff !== 0) {
      const produto = await Produto.findByPk(prodId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!produto) throw new Error(`Produto #${prodId} não encontrado.`);
      if (diff > 0 && produto.estoque_atual < diff) {
        throw new Error(`Estoque insuficiente para a peça: ${produto.descricao}`);
      }
      await produto.update({ estoque_atual: produto.estoque_atual - diff }, { transaction });
    }
  }

  await ItemMovimentacao.destroy({ where: { id_movimentacao: osId }, transaction });
  for (const item of novosItens) {
    await ItemMovimentacao.create({
      id_movimentacao: osId,
      id_produto: item.id_produto,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    }, { transaction });
  }
};

// ─── Atualizar status / dados da OS ───────────────────────────────────────────
const atualizarStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { status, diagnostico, itens, valor_orcado, forma_pagamento, prazo_estimado, id_cliente, id_aparelho } = req.body;
    const os = await Movimentacao.findOne({
      where: { id_movimentacao: req.params.id, origem: 'os' },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!os) {
      await t.rollback();
      return res.status(404).json({ error: 'OS não encontrada.' });
    }

    // A01 & A02: Bloqueio de mutações a partir de estados finais e bloqueio de rotas alternativas
    if (os.status_os === 'Cancelado') {
      await t.rollback();
      return res.status(400).json({ error: 'Não é possível alterar uma Ordem de Serviço cancelada.' });
    }
    if (os.status_os === 'Entregue') {
      await t.rollback();
      return res.status(400).json({ error: 'Não é possível alterar uma OS já entregue.' });
    }

    if (status === 'Cancelado') {
      await t.rollback();
      return res.status(400).json({
        error: 'Para cancelar uma Ordem de Serviço, utilize a rota dedicada de cancelamento (POST /api/ordens-servico/:id/cancelar).',
      });
    }

    if (status === 'Entregue') {
      await t.rollback();
      return res.status(400).json({
        error: 'Para entregar a Ordem de Serviço, utilize a rota de fechamento financeiro (POST /api/ordens-servico/:id/fechar).',
      });
    }

    const statusValidos = ['Aguardando Diagnóstico', 'Aguardando Cliente', 'Em Reparo', 'Aguardando Peça', 'Concluído'];
    if (status && !statusValidos.includes(status)) {
      await t.rollback();
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const perms = req.usuario?.permissoes || {};
    if (status && status !== os.status_os) {
      if (!perms['os.status']) {
        await t.rollback();
        return res.status(403).json({ error: 'Acesso negado: Você não possui permissão para alterar o status da OS (os.status).' });
      }
    }

    if (itens !== undefined) {
      try {
        await atualizarItensEstoque(os.id_movimentacao, itens, t);
      } catch (error) {
        await t.rollback();
        return res.status(400).json({ error: error.message });
      }
    }

    // Bloqueio estrito de campos financeiros em rotas genéricas de OS (FIN01, FIN02)
    const camposFinanceirosEnviados = [
      'forma_pagamento',
      'status_pagamento',
      'valor_total',
      'valor_final',
      'valor_pago',
      'pagamentos',
    ].filter((campo) => req.body[campo] !== undefined);

    if (camposFinanceirosEnviados.length > 0) {
      await t.rollback();
      return res.status(400).json({
        error: `Alteração financeira não permitida: os campos [${camposFinanceirosEnviados.join(', ')}] não podem ser modificados via rota genérica de atualização. Para faturar ou entregar uma OS, utilize a rota dedicada POST /api/ordens-servico/:id/fechar; para quitar OS fiado, utilize POST /api/ordens-servico/:id/pagar.`,
        code: 'CAMPOS_FINANCEIROS_PROTEGIDOS',
      });
    }

    const payload = {};
    if (status) payload.status_os = status;
    if (status === 'Concluído') payload.data_fechamento = new Date();
    if (status && status !== 'Concluído') payload.data_fechamento = null;
    if (diagnostico  !== undefined) payload.diagnostico  = diagnostico;
    if (valor_orcado !== undefined) payload.valor_orcado = valor_orcado;
    if (prazo_estimado !== undefined) payload.prazo_estimado = prazo_estimado || null;

    // A03 & CT12: Validação de coerência cliente-aparelho na edição de OS
    const targetClienteId = id_cliente !== undefined ? Number(id_cliente) : os.id_cliente;
    const targetAparelhoId = id_aparelho !== undefined ? Number(id_aparelho) : os.id_aparelho;

    if (id_aparelho !== undefined || id_cliente !== undefined) {
      if (targetAparelhoId) {
        const ap = await Aparelho.findByPk(targetAparelhoId, { transaction: t });
        if (!ap) {
          await t.rollback();
          return res.status(404).json({ error: 'Aparelho informado não encontrado.' });
        }
        if (targetClienteId && ap.id_cliente !== targetClienteId) {
          await t.rollback();
          return res.status(422).json({
            error: 'Incoerência de cadastro: o aparelho informado não pertence ao cliente indicado.',
          });
        }
      }
      if (id_cliente !== undefined) payload.id_cliente = id_cliente;
      if (id_aparelho !== undefined) payload.id_aparelho = id_aparelho;
    }

    await os.update(payload, { transaction: t });
    await t.commit();

    const updatedOS = await Movimentacao.findOne({ where: { id_movimentacao: os.id_movimentacao }, include: osIncludes });
    return res.json(updatedOS);
  } catch (err) {
    if (!t.finished) await t.rollback();
    console.error('[OS] Erro ao atualizar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Fechar OS ────────────────────────────────────────────────────────────────
// Pagamento: `forma_pagamento` (única) ou `pagamentos: [{ forma, valor }]` (dividido). A soma deve fechar o valor final.
const fechar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    await fin.exigirSessaoAberta(t, 'entrega de Ordens de Serviço');

    const { valor_final, forma_pagamento, pagamentos, itens, prazo_estimado } = req.body;
    const dividido = Array.isArray(pagamentos) && pagamentos.length > 0;
    if (valor_final === undefined || (!forma_pagamento && !dividido)) {
      await t.rollback(); return res.status(400).json({ error: 'Valor final e forma de pagamento são obrigatórios.' });
    }

    const os = await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'os' }, transaction: t, lock: t.LOCK.UPDATE });
    if (!os) { await t.rollback(); return res.status(404).json({ error: 'OS não encontrada.' }); }
    if (['Entregue', 'Cancelado'].includes(os.status_os)) {
      await t.rollback(); return res.status(400).json({ error: 'OS já finalizada.' });
    }

    if (itens !== undefined) {
      try { await atualizarItensEstoque(os.id_movimentacao, itens, t); }
      catch (error) { await t.rollback(); return res.status(400).json({ error: error.message }); }
    }

    const isFiado = !dividido && forma_pagamento === 'Fiado';
    const pagamento = isFiado
      ? null
      : fin.pagamentosDaOperacao({ pagamentos, forma_pagamento, valorTotal: valor_final }, await fin.carregarCadastros(t));

    const updatePayload = {
      status_os: 'Entregue',
      valor_total: valor_final,
      forma_pagamento: isFiado ? 'Fiado' : pagamento.rotulo,
      data_fechamento: new Date(),
      status_pagamento: isFiado ? 'pendente' : 'pago',
    };
    if (prazo_estimado !== undefined) updatePayload.prazo_estimado = prazo_estimado || null;

    if (LogAuditoria) {
      await LogAuditoria.create({
        id_usuario: req.usuario?.id_usuario || os.id_usuario,
        acao: 'FECHAR',
        entidade: 'movimentacao',
        id_registro: os.id_movimentacao,
        dados_anteriores: os.toJSON(),
        dados_posteriores: { ...os.toJSON(), ...updatePayload },
        ip_origem: req.ip,
      }, { transaction: t });
    }

    await os.update(updatePayload, { transaction: t });

    if (!isFiado) {
      // Trava contra duplicidade: lançamentos efetivados são imutáveis, então nunca se cria um segundo recebimento da mesma OS
      const jaLancada = await Caixa.findOne({
        where: { id_movimentacao: os.id_movimentacao, natureza: 'operacional', id_lancamento_origem: null },
        transaction: t,
      });
      if (!jaLancada) {
        await fin.registrarLancamento({
          tipo: 'entrada',
          descricao: `Fechamento da OS ${os.numero_os}`,
          categoria: 'OS',
          origem: 'os',
          favorecido: await nomeCliente(os.id_cliente, t),
          id_usuario: req.usuario.id_usuario,
          id_movimentacao: os.id_movimentacao,
          pagamentos: fin.pernasParaPagamentos(pagamento.pernas),
          valorTotal: valor_final,
          ip: req.ip,
          transaction: t,
        });
      }
    }

    await t.commit();
    const updatedOS = await Movimentacao.findOne({ where: { id_movimentacao: os.id_movimentacao }, include: osIncludes });
    return res.json({ message: 'OS fechada com sucesso.', os: updatedOS });
  } catch (err) {
    if (!t.finished) await t.rollback();
    return fin.responderErro(res, err, 'OS/fechar');
  }
};

// ─── Listar OS pendentes (fiado) ──────────────────────────────────────────────
const listarOsPendentes = async (req, res) => {
  try {
    const ordens = await Movimentacao.findAll({
      where: {
        origem: 'os',
        [Op.or]: [{ status_pagamento: 'pendente' }, { forma_pagamento: 'Fiado' }],
        status_os: { [Op.ne]: 'Cancelado' },
      },
      include: [
        { model: Cliente,  as: 'cliente',  attributes: ['id_cliente', 'nome', 'telefone'] },
        { model: Aparelho, as: 'aparelho', attributes: ['id_aparelho', 'marca', 'modelo'] },
        { model: Usuario,  as: 'tecnico',  attributes: ['id_usuario', 'nome'] },
      ],
      order: [['criado_em', 'DESC']],
    });
    return res.json(ordens);
  } catch (err) {
    console.error('[OS] Erro ao listar pendentes:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Pagar OS fiado ───────────────────────────────────────────────────────────
const pagarOsFiado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    await fin.exigirSessaoAberta(t, 'recebimentos de OS');

    const { forma_pagamento, pagamentos } = req.body;
    const dividido = Array.isArray(pagamentos) && pagamentos.length > 0;
    if (!dividido && (!forma_pagamento || forma_pagamento === 'Fiado')) {
      await t.rollback(); return res.status(400).json({ error: 'Informe uma forma de pagamento válida (não pode ser Fiado).' });
    }

    const os = await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'os' }, transaction: t, lock: t.LOCK.UPDATE });
    if (!os) { await t.rollback(); return res.status(404).json({ error: 'OS não encontrada.' }); }
    if (os.status_pagamento !== 'pendente') {
      await t.rollback(); return res.status(400).json({ error: 'Esta OS já foi paga.' });
    }

    const pagamento = fin.pagamentosDaOperacao(
      { pagamentos, forma_pagamento, valorTotal: parseFloat(os.valor_total) },
      await fin.carregarCadastros(t)
    );

    await os.update({ status_pagamento: 'pago', forma_pagamento: pagamento.rotulo }, { transaction: t });
    await fin.registrarLancamento({
      tipo: 'entrada',
      descricao: `Recebimento OS ${os.numero_os} (Fiado)`,
      categoria: 'OS',
      origem: 'os',
      favorecido: await nomeCliente(os.id_cliente, t),
      id_usuario: req.usuario.id_usuario,
      id_movimentacao: os.id_movimentacao,
      pagamentos: fin.pernasParaPagamentos(pagamento.pernas),
      valorTotal: parseFloat(os.valor_total),
      ip: req.ip,
      transaction: t,
    });

    await t.commit();
    return res.json({ message: 'Pagamento registrado com sucesso.', os });
  } catch (err) {
    if (!t.finished) await t.rollback();
    return fin.responderErro(res, err, 'OS/pagarFiado');
  }
};

// ─── Cancelar OS ─────────────────────────────────────────────────────────────
const cancelar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { motivo } = req.body;
    if (!motivo || !String(motivo).trim()) {
      await t.rollback();
      return res.status(400).json({ error: 'O motivo do cancelamento é obrigatório.' });
    }

    const os = await Movimentacao.findOne({
      where: { id_movimentacao: req.params.id, origem: 'os' },
      include: [{ model: ItemMovimentacao, as: 'itens' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!os) {
      await t.rollback();
      return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });
    }

    if (os.status_os === 'Cancelado') {
      await t.rollback();
      return res.status(400).json({ error: 'Esta Ordem de Serviço já está cancelada.' });
    }

    const perms = req.usuario?.permissoes || {};
    if (!perms['os.excluir']) {
      await t.rollback();
      return res.status(403).json({ error: 'Acesso negado: Você não possui permissão para cancelar Ordens de Serviço (os.excluir).' });
    }

    const dadosAnteriores = os.toJSON();
    const motivoLimpo = String(motivo).trim();

    // 1. Devolver peças e componentes utilizados de volta ao estoque (ordenados e com lock)
    const itensAgrupados = {};
    for (const item of os.itens || []) {
      itensAgrupados[item.id_produto] = (itensAgrupados[item.id_produto] || 0) + parseInt(item.quantidade, 10);
    }
    const sortedProdIds = Object.keys(itensAgrupados).map(Number).sort((a, b) => a - b);
    for (const prodId of sortedProdIds) {
      const produto = await Produto.findByPk(prodId, { transaction: t, lock: t.LOCK.UPDATE });
      if (produto) {
        await produto.update(
          { estoque_atual: produto.estoque_atual + itensAgrupados[prodId] },
          { transaction: t }
        );
      }
    }

    // 2. Estornar lançamentos financeiros no Caixa (se houver recebimento associado)
    await fin.estornarPorMovimentacao(os.id_movimentacao, {
      id_usuario: req.usuario.id_usuario,
      descricao: `Cancelamento OS #${os.numero_os} — Motivo: ${motivoLimpo}`,
      permitirNegativo: !!(req.body?.autorizar_saldo_negativo && perms['caixa.aprovar']),
      ip: req.ip,
      transaction: t,
    });

    // 3. Atualizar status da OS e registrar motivo
    await os.update(
      {
        status_os: 'Cancelado',
        status_pagamento: 'cancelado',
        motivo_cancelamento: motivoLimpo,
      },
      { transaction: t }
    );

    // 4. Registrar Log de Auditoria
    if (LogAuditoria) {
      await LogAuditoria.create(
        {
          id_usuario: req.usuario.id_usuario,
          acao: 'CANCELAR',
          entidade: 'movimentacao',
          id_registro: os.id_movimentacao,
          dados_anteriores: dadosAnteriores,
          dados_posteriores: os.toJSON(),
          ip_origem: req.ip || null,
        },
        { transaction: t }
      );
    }

    await t.commit();

    const osAtualizada = await Movimentacao.findOne({
      where: { id_movimentacao: os.id_movimentacao },
      include: osIncludes,
    });
    return res.json(osAtualizada);
  } catch (err) {
    if (!t.finished) await t.rollback();
    return fin.responderErro(res, err, 'OS/cancelar', 'Erro interno ao cancelar Ordem de Serviço.');
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const dashboard = async (req, res) => {
  try {
    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia    = new Date(new Date().setHours(23, 59, 59, 999));

    const [osAbertas, osConcluidas, prodEstoqueMinimo, statusCounts] = await Promise.all([
      Movimentacao.count({ where: { origem: 'os', status_os: { [Op.in]: ['Aguardando Diagnóstico', 'Aguardando Cliente', 'Em Reparo', 'Aguardando Peça'] } } }),
      Movimentacao.count({ where: { origem: 'os', status_os: { [Op.in]: ['Concluído', 'Entregue'] }, data_fechamento: { [Op.between]: [inicioDia, fimDia] } } }),
      Produto.count({ where: { estoque_minimo: { [Op.gt]: 0 }, estoque_atual: { [Op.lte]: sequelize.col('estoque_minimo') } } }),
      Movimentacao.findAll({
        attributes: ['status_os', [sequelize.fn('COUNT', sequelize.col('id_movimentacao')), 'count']],
        where: { origem: 'os' },
        group: ['status_os'],
        raw: true,
      }),
    ]);

    // Caixa do dia: apenas receitas/despesas operacionais. Transferências, conferências e aberturas/fechamentos
    // não são receita nem despesa e ficam fora desse indicador.
    const caixaHoje = await Caixa.findAll({
      where: { natureza: 'operacional', data: { [Op.between]: [inicioDia, fimDia] } },
      attributes: ['tipo', [sequelize.fn('SUM', sequelize.col('valor')), 'total']],
      group: ['tipo'],
      raw: true,
    });
    const entradas  = caixaHoje.find(c => c.tipo === 'entrada')?.total || 0;
    const saidas    = caixaHoje.find(c => c.tipo === 'saida')?.total || 0;
    const saldoDia  = parseFloat(entradas) - parseFloat(saidas);

    const ultimasOS = await Movimentacao.findAll({
      where: { origem: 'os' },
      limit: 5,
      order: [['data_movimentacao', 'DESC']],
      include: [
        { model: Cliente,  as: 'cliente',  attributes: ['nome'] },
        { model: Aparelho, as: 'aparelho', attributes: ['marca', 'modelo'] },
      ],
    });

    return res.json({ osAbertas, osConcluidas, saldoDia, prodEstoqueMinimo, ultimasOS, statusCounts });
  } catch (err) {
    console.error('[Dashboard] Erro:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizarStatus, fechar, listarOsPendentes, pagarOsFiado, cancelar, dashboard };
