'use strict';

const { Movimentacao, ItemMovimentacao, Produto, Cliente, Usuario, Caixa, sequelize } = require('../models');
const { Op } = require('sequelize');

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
const criar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id_cliente, forma_pagamento, desconto, itens } = req.body;

    if (!itens || itens.length === 0) {
      await t.rollback(); return res.status(400).json({ error: 'A venda deve ter ao menos 1 item.' });
    }
    if (!forma_pagamento) {
      await t.rollback(); return res.status(400).json({ error: 'Forma de pagamento é obrigatória.' });
    }

    let totalBruto = 0;
    for (const item of itens) {
      const produto = await Produto.findByPk(item.id_produto, { transaction: t });
      if (!produto) { await t.rollback(); return res.status(404).json({ error: `Produto ${item.id_produto} não encontrado.` }); }
      if (produto.estoque_atual < item.quantidade) {
        await t.rollback(); return res.status(400).json({ error: `Estoque insuficiente: ${produto.descricao}` });
      }
      item.valor_unitario = parseFloat(produto.valor_venda);
      totalBruto += item.valor_unitario * item.quantidade;
      await produto.update({ estoque_atual: produto.estoque_atual - item.quantidade }, { transaction: t });
    }

    const valor_total = parseFloat((totalBruto - (desconto || 0)).toFixed(2));
    const isPendente  = forma_pagamento === 'Fiado';

    const venda = await Movimentacao.create({
      origem: 'venda',
      id_cliente:      id_cliente || null,
      id_usuario:      req.usuario.id_usuario,
      data_movimentacao: new Date(),
      valor_total,
      forma_pagamento,
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
      await Caixa.create({
        id_usuario:      req.usuario.id_usuario,
        data:            new Date(),
        tipo:            'entrada',
        valor:           valor_total,
        descricao:       `Venda #${venda.id_movimentacao}`,
        categoria:       'Venda',
        id_movimentacao: venda.id_movimentacao,
      }, { transaction: t });
    }

    await t.commit();
    return res.status(201).json(venda);
  } catch (err) {
    await t.rollback();
    console.error('[Vendas] Erro ao criar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Pagar venda pendente (fiado) ─────────────────────────────────────────────
const pagarFiado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { forma_pagamento } = req.body;
    if (!forma_pagamento || forma_pagamento === 'Fiado') {
      await t.rollback(); return res.status(400).json({ error: 'Informe uma forma de pagamento válida (não pode ser Fiado).' });
    }

    const venda = await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'venda' }, transaction: t });
    if (!venda)                       { await t.rollback(); return res.status(404).json({ error: 'Venda não encontrada.' }); }
    if (venda.status_pagamento !== 'pendente') { await t.rollback(); return res.status(400).json({ error: 'Esta venda já foi paga.' }); }

    await venda.update({ status_pagamento: 'pago', forma_pagamento }, { transaction: t });
    await Caixa.create({
      id_usuario:      req.usuario.id_usuario,
      data:            new Date(),
      tipo:            'entrada',
      valor:           parseFloat(venda.valor_total),
      descricao:       `Recebimento Venda #${venda.id_movimentacao} (Fiado)`,
      categoria:       'Venda',
      id_movimentacao: venda.id_movimentacao,
    }, { transaction: t });

    await t.commit();
    return res.json(venda);
  } catch (err) {
    await t.rollback();
    console.error('[Vendas] Erro ao pagar fiado:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listar, listarPendentes, criar, pagarFiado };
