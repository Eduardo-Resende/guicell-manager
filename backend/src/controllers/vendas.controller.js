'use strict';

const { Movimentacao, ItemMovimentacao, Produto, Cliente, Usuario, LogAuditoria, sequelize } = require('../models');
const { Op } = require('sequelize');
const fin = require('../services/financeiro.service');

/** Nome do cliente, usado como "favorecido/origem" do lançamento financeiro. */
const nomeCliente = async (id_cliente, transaction) => {
  if (!id_cliente) return null;
  const cliente = await Cliente.findByPk(id_cliente, { attributes: ['nome'], transaction });
  return cliente ? cliente.nome : null;
};

const vendaIncludes = [
  { model: Cliente, as: 'cliente',   attributes: ['id_cliente', 'nome'] },
  { model: Usuario, as: 'usuario',   attributes: ['id_usuario', 'nome'] },
  {
    model: ItemMovimentacao, as: 'itens',
    include: [{ model: Produto, as: 'produto', attributes: ['id_produto', 'descricao'] }],
  },
];

// ─── Listar vendas ────────────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { data_inicio, data_fim, status } = req.query;
    const where = { origem: 'venda' };
    if (status) where.status_pagamento = status;
    if (data_inicio || data_fim) {
      where.data_movimentacao = {};
      if (data_inicio) where.data_movimentacao[Op.gte] = new Date(data_inicio);
      if (data_fim)    where.data_movimentacao[Op.lte] = new Date(data_fim + 'T23:59:59');
    }
    const vendas = await Movimentacao.findAll({ where, include: vendaIncludes, order: [['data_movimentacao', 'DESC']] });
    return res.json(vendas);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Listar vendas pendentes (fiado) ─────────────────────────────────────────
const listarPendentes = async (req, res) => {
  try {
    const vendas = await Movimentacao.findAll({
      where: { origem: 'venda', status_pagamento: 'pendente' },
      include: vendaIncludes,
      order: [['data_movimentacao', 'ASC']],
    });
    return res.json(vendas);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Criar venda ─────────────────────────────────────────────────────────────
// Pagamento: `forma_pagamento` (única) ou `pagamentos: [{ forma, valor }]` (dividido). A soma deve fechar o total.
// "Fiado" não movimenta o caixa na venda; só quando o recebimento for registrado.
const criar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    await fin.exigirSessaoAberta(t, 'vendas');

    const { id_cliente, forma_pagamento, pagamentos, desconto, itens } = req.body;
    const dividido = Array.isArray(pagamentos) && pagamentos.length > 0;

    if (!itens || itens.length === 0) {
      await t.rollback(); return res.status(400).json({ error: 'A venda deve ter ao menos 1 item.' });
    }
    if (!forma_pagamento && !dividido) {
      await t.rollback(); return res.status(400).json({ error: 'Forma de pagamento é obrigatória.' });
    }

    // Validação, ordenação e lock pessimista para evitar lost update e deadlock (A04)
    const qtdPorProduto = {};
    for (const item of itens) {
      const pId = Number(item.id_produto);
      const qtd = parseInt(item.quantidade, 10);
      if (!pId || isNaN(qtd) || qtd <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Item de venda com produto ou quantidade inválida.' });
      }
      qtdPorProduto[pId] = (qtdPorProduto[pId] || 0) + qtd;
    }

    const sortedProdIds = Object.keys(qtdPorProduto).map(Number).sort((a, b) => a - b);
    const produtosMap = new Map();

    for (const pId of sortedProdIds) {
      const produto = await Produto.findByPk(pId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!produto) {
        await t.rollback();
        return res.status(404).json({ error: `Produto ${pId} não encontrado.` });
      }
      if (produto.estoque_atual < qtdPorProduto[pId]) {
        await t.rollback();
        return res.status(400).json({ error: `Estoque insuficiente: ${produto.descricao}` });
      }
      produtosMap.set(pId, produto);
    }

    let totalBruto = 0;
    for (const item of itens) {
      const produto = produtosMap.get(Number(item.id_produto));
      item.valor_unitario = parseFloat(produto.valor_venda);
      totalBruto += item.valor_unitario * parseInt(item.quantidade, 10);
    }

    for (const pId of sortedProdIds) {
      const produto = produtosMap.get(pId);
      await produto.update(
        { estoque_atual: produto.estoque_atual - qtdPorProduto[pId] },
        { transaction: t }
      );
    }

    const valor_total = parseFloat((totalBruto - (desconto || 0)).toFixed(2));
    const isPendente  = !dividido && forma_pagamento === 'Fiado';

    // Valida forma(s) de pagamento e a soma ANTES de gravar qualquer coisa
    let pagamento = null;
    if (!isPendente) {
      pagamento = fin.pagamentosDaOperacao({ pagamentos, forma_pagamento, valorTotal: valor_total }, await fin.carregarCadastros(t));
    }

    const venda = await Movimentacao.create({
      origem: 'venda',
      id_cliente:      id_cliente || null,
      id_usuario:      req.usuario.id_usuario,
      data_movimentacao: new Date(),
      valor_total,
      forma_pagamento: isPendente ? 'Fiado' : pagamento.rotulo,
      desconto:         desconto || 0,
      status_pagamento: isPendente ? 'pendente' : 'pago',
    }, { transaction: t });

    for (const item of itens) {
      await ItemMovimentacao.create({
        id_movimentacao: venda.id_movimentacao,
        id_produto:      item.id_produto,
        quantidade:      item.quantidade,
        valor_unitario:  item.valor_unitario,
      }, { transaction: t });
    }

    if (!isPendente) {
      await fin.registrarLancamento({
        tipo:            'entrada',
        descricao:       `Venda #${venda.id_movimentacao}`,
        categoria:       'Venda',
        origem:          'venda',
        favorecido:      await nomeCliente(id_cliente, t),
        id_usuario:      req.usuario.id_usuario,
        id_movimentacao: venda.id_movimentacao,
        pagamentos:      fin.pernasParaPagamentos(pagamento.pernas),
        valorTotal:      valor_total,
        ip:              req.ip,
        transaction:     t,
      });
    }

    await t.commit();
    return res.status(201).json(venda);
  } catch (err) {
    if (!t.finished) await t.rollback();
    return fin.responderErro(res, err, 'Vendas/criar');
  }
};

// ─── Pagar venda pendente (fiado) ─────────────────────────────────────────────
const pagarFiado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    await fin.exigirSessaoAberta(t, 'recebimentos de vendas');

    const { forma_pagamento, pagamentos } = req.body;
    const dividido = Array.isArray(pagamentos) && pagamentos.length > 0;
    if (!dividido && (!forma_pagamento || forma_pagamento === 'Fiado')) {
      await t.rollback(); return res.status(400).json({ error: 'Informe uma forma de pagamento válida (não pode ser Fiado).' });
    }

    const venda = await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'venda' }, transaction: t, lock: t.LOCK.UPDATE });
    if (!venda)                       { await t.rollback(); return res.status(404).json({ error: 'Venda não encontrada.' }); }
    if (venda.status_pagamento !== 'pendente') { await t.rollback(); return res.status(400).json({ error: 'Esta venda já foi paga.' }); }

    const pagamento = fin.pagamentosDaOperacao(
      { pagamentos, forma_pagamento, valorTotal: parseFloat(venda.valor_total) },
      await fin.carregarCadastros(t)
    );

    await venda.update({ status_pagamento: 'pago', forma_pagamento: pagamento.rotulo }, { transaction: t });
    await fin.registrarLancamento({
      tipo:            'entrada',
      descricao:       `Recebimento Venda #${venda.id_movimentacao} (Fiado)`,
      categoria:       'Venda',
      origem:          'venda',
      favorecido:      await nomeCliente(venda.id_cliente, t),
      id_usuario:      req.usuario.id_usuario,
      id_movimentacao: venda.id_movimentacao,
      pagamentos:      fin.pernasParaPagamentos(pagamento.pernas),
      valorTotal:      parseFloat(venda.valor_total),
      ip:              req.ip,
      transaction:     t,
    });

    await t.commit();
    return res.json(venda);
  } catch (err) {
    if (!t.finished) await t.rollback();
    return fin.responderErro(res, err, 'Vendas/pagarFiado');
  }
};

// ─── Cancelar venda ───────────────────────────────────────────────────────────
const cancelar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { motivo } = req.body;
    if (!motivo || !String(motivo).trim()) {
      await t.rollback();
      return res.status(400).json({ error: 'O motivo do cancelamento é obrigatório.' });
    }

    // Trava a venda para que dois cancelamentos simultâneos não estornem o caixa duas vezes
    await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'venda' }, transaction: t, lock: t.LOCK.UPDATE });

    const venda = await Movimentacao.findOne({
      where: { id_movimentacao: req.params.id, origem: 'venda' },
      include: [{ model: ItemMovimentacao, as: 'itens' }],
      transaction: t,
    });

    if (!venda) {
      await t.rollback();
      return res.status(404).json({ error: 'Venda não encontrada.' });
    }
    if (venda.status_pagamento === 'cancelado') {
      await t.rollback();
      return res.status(400).json({ error: 'Esta venda já está cancelada.' });
    }

    const dadosAnteriores = venda.toJSON();
    const estavaPaga = venda.status_pagamento === 'pago';
    const motivoLimpo = String(motivo).trim();

    // 1. Devolver os produtos vendidos ao estoque de forma ordenada e com lock pessimista (A04)
    const qtdRetornoPorProduto = {};
    for (const item of venda.itens || []) {
      const pId = Number(item.id_produto);
      const qtd = parseInt(item.quantidade, 10);
      if (pId && qtd > 0) {
        qtdRetornoPorProduto[pId] = (qtdRetornoPorProduto[pId] || 0) + qtd;
      }
    }
    const sortedRetornoIds = Object.keys(qtdRetornoPorProduto).map(Number).sort((a, b) => a - b);
    for (const pId of sortedRetornoIds) {
      const produto = await Produto.findByPk(pId, { transaction: t, lock: t.LOCK.UPDATE });
      if (produto) {
        await produto.update(
          { estoque_atual: produto.estoque_atual + qtdRetornoPorProduto[pId] },
          { transaction: t }
        );
      }
    }

    // 2. Atualizar status da venda e registrar motivo do cancelamento
    await venda.update(
      {
        status_pagamento: 'cancelado',
        motivo_cancelamento: motivoLimpo,
      },
      { transaction: t }
    );

    // 3. Se estava paga (à vista ou fiado já recebido), estornar o(s) lançamento(s) do Caixa com
    //    exatamente as mesmas formas de pagamento e contas da operação original (inclusive se foi dividida)
    if (estavaPaga) {
      const estornos = await fin.estornarPorMovimentacao(venda.id_movimentacao, {
        id_usuario:  req.usuario.id_usuario,
        descricao:   `Cancelamento Venda #${venda.id_movimentacao} — Motivo: ${motivoLimpo}`,
        permitirNegativo: !!(req.body?.autorizar_saldo_negativo && req.usuario?.permissoes?.['caixa.aprovar']),
        ip:          req.ip,
        transaction: t,
      });
      if (estornos.length === 0 && LogAuditoria) {
        await fin.registrarAuditoria({
          id_usuario: req.usuario.id_usuario, acao: 'ESTORNO_SEM_LANCAMENTO', entidade: 'movimentacao',
          id_registro: venda.id_movimentacao, ip: req.ip,
          posteriores: { aviso: 'Venda paga sem lançamento financeiro localizado; nenhum estorno de caixa foi gerado.' },
        }, t);
      }
    }

    // 4. Registrar log de auditoria
    if (LogAuditoria) {
      await LogAuditoria.create(
        {
          id_usuario:       req.usuario.id_usuario,
          acao:             'CANCELAR',
          entidade:         'movimentacao',
          id_registro:      venda.id_movimentacao,
          dados_anteriores: dadosAnteriores,
          dados_posteriores: venda.toJSON(),
          ip_origem:        req.ip || null,
        },
        { transaction: t }
      );
    }

    await t.commit();
    const vendaAtualizada = await Movimentacao.findOne({
      where: { id_movimentacao: venda.id_movimentacao },
      include: vendaIncludes,
    });
    return res.json(vendaAtualizada);
  } catch (err) {
    if (!t.finished) await t.rollback();
    return fin.responderErro(res, err, 'Vendas/cancelar', 'Erro interno ao cancelar venda.');
  }
};

module.exports = { listar, listarPendentes, criar, pagarFiado, cancelar };
