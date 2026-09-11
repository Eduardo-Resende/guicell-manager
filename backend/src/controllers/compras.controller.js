'use strict';

const { Movimentacao, ItemMovimentacao, Produto, Fornecedor, Caixa, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');

const compraIncludes = [
  { model: Fornecedor, as: 'fornecedor', attributes: ['id_fornecedor', 'nome'] },
  { model: Usuario,    as: 'usuario',    attributes: ['id_usuario', 'nome'] },
  {
    model: ItemMovimentacao, as: 'itens',
    include: [{ model: Produto, as: 'produto', attributes: ['id_produto', 'descricao'] }],
  },
];

// ─── Listar ───────────────────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { data_inicio, data_fim, id_fornecedor } = req.query;
    const where = { origem: 'compra' };
    if (id_fornecedor) where.id_fornecedor = id_fornecedor;
    if (data_inicio || data_fim) {
      where.data_movimentacao = {};
      if (data_inicio) where.data_movimentacao[Op.gte] = new Date(data_inicio);
      if (data_fim)    where.data_movimentacao[Op.lte] = new Date(data_fim + 'T23:59:59');
    }
    const compras = await Movimentacao.findAll({ where, include: compraIncludes, order: [['data_movimentacao', 'DESC']] });
    return res.json(compras);
  } catch (err) {
    console.error('[Compras] Erro ao listar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Buscar por ID ────────────────────────────────────────────────────────────
const buscarPorId = async (req, res) => {
  try {
    const compra = await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'compra' }, include: compraIncludes });
    if (!compra) return res.status(404).json({ error: 'Compra não encontrada.' });
    return res.json(compra);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Criar ────────────────────────────────────────────────────────────────────
const criar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id_fornecedor, nome_fornecedor_avulso, data_compra, itens, observacao } = req.body;

    if (!data_compra)                              { await t.rollback(); return res.status(400).json({ error: 'Data da compra é obrigatória.' }); }
    if (!itens || itens.length === 0)              { await t.rollback(); return res.status(400).json({ error: 'Informe ao menos um item na compra.' }); }
    if (!id_fornecedor && !nome_fornecedor_avulso) { await t.rollback(); return res.status(400).json({ error: 'Informe um fornecedor ou nome avulso.' }); }

    const valorTotal = itens.reduce((acc, item) => acc + (parseFloat(item.valor_custo_unitario) * parseInt(item.quantidade)), 0);

    const compra = await Movimentacao.create({
      origem:                   'compra',
      id_fornecedor:            id_fornecedor || null,
      nome_fornecedor_avulso:   nome_fornecedor_avulso || null,
      data_movimentacao:        new Date(`${data_compra}T12:00:00`),
      valor_total:              valorTotal,
      observacao:               observacao || null,
      id_usuario:               req.usuario.id_usuario,
    }, { transaction: t });

    for (const item of itens) {
      let produtoId = item.id_produto || null;

      if (produtoId) {
        const produto = await Produto.findByPk(produtoId, { transaction: t });
        if (!produto) { await t.rollback(); return res.status(404).json({ error: `Produto #${produtoId} não encontrado.` }); }
        await produto.update({
          estoque_atual: produto.estoque_atual + parseInt(item.quantidade),
          valor_custo:   parseFloat(item.valor_custo_unitario),
        }, { transaction: t });
      } else {
        const novoProduto = await Produto.create({
          descricao:     item.descricao_item,
          estoque_atual: parseInt(item.quantidade),
          estoque_minimo: 1,
          valor_custo:   parseFloat(item.valor_custo_unitario),
          valor_venda:   parseFloat(item.valor_venda_unitario || item.valor_custo_unitario),
          id_categoria:  null,
        }, { transaction: t });
        produtoId = novoProduto.id_produto;
      }

      await ItemMovimentacao.create({
        id_movimentacao:     compra.id_movimentacao,
        id_produto:          produtoId,
        descricao_item:      item.descricao_item,
        quantidade:          parseInt(item.quantidade),
        valor_unitario:      parseFloat(item.valor_custo_unitario),   // campo unificado
        valor_venda_unitario: item.valor_venda_unitario ? parseFloat(item.valor_venda_unitario) : null,
      }, { transaction: t });
    }

    const nomeFornecedor = id_fornecedor
      ? (await Fornecedor.findByPk(id_fornecedor, { transaction: t }))?.nome || 'Fornecedor'
      : (nome_fornecedor_avulso || 'Avulso');

    await Caixa.create({
      id_usuario:      req.usuario.id_usuario,
      data:            new Date(`${data_compra}T12:00:00`),
      tipo:            'saida',
      valor:           valorTotal,
      descricao:       `Compra #${compra.id_movimentacao} - ${nomeFornecedor}`,
      categoria:       'Compra',
      id_movimentacao: compra.id_movimentacao,
    }, { transaction: t });

    await t.commit();

    const compraCompleta = await Movimentacao.findOne({ where: { id_movimentacao: compra.id_movimentacao }, include: compraIncludes });
    return res.status(201).json(compraCompleta);
  } catch (err) {
    await t.rollback();
    console.error('[Compras] Erro ao criar:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar compra.' });
  }
};

module.exports = { listar, buscarPorId, criar };
