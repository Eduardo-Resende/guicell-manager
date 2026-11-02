'use strict';

const { Movimentacao, ItemMovimentacao, Produto, Fornecedor, Usuario, LogAuditoria, sequelize } = require('../models');
const { Op } = require('sequelize');
const fin = require('../services/financeiro.service');

const { ErroNegocio } = fin;

const compraIncludes = [
  { model: Fornecedor, as: 'fornecedor', attributes: ['id_fornecedor', 'nome'] },
  { model: Usuario,    as: 'usuario',    attributes: ['id_usuario', 'nome'] },
  {
    model: ItemMovimentacao, as: 'itens',
    include: [{ model: Produto, as: 'produto', attributes: ['id_produto', 'descricao'] }],
  },
];

const podeAutorizarExcecao = (req) => !!(req.body?.autorizar_saldo_negativo && req.usuario?.permissoes?.['caixa.aprovar']);

/** Valor ainda não pago de uma compra (0 quando cancelada). */
const valorPendente = (compra) => {
  if (compra.status_pagamento === 'cancelado') return 0;
  const total = fin.paraCentavos(compra.valor_total);
  const pago = compra.valor_pago === null || compra.valor_pago === undefined ? total : fin.paraCentavos(compra.valor_pago);
  return fin.deCentavos(Math.max(total - pago, 0));
};

/** Enriquece as compras com os pagamentos efetivos (por forma/conta) e o valor pendente. */
const comPagamentos = async (compras) => {
  const mapa = await fin.pagamentosPorMovimentacoes(compras.map((c) => c.id_movimentacao));
  return compras.map((c) => {
    const json = c.toJSON();
    return {
      ...json,
      valor_pendente: valorPendente(json),
      pagamentos_caixa: mapa[c.id_movimentacao] || [],
    };
  });
};

const nomeDoFornecedor = async (compra, transaction) => {
  if (compra.id_fornecedor) {
    const f = await Fornecedor.findByPk(compra.id_fornecedor, { attributes: ['nome'], transaction });
    if (f) return f.nome;
  }
  return compra.nome_fornecedor_avulso || 'Fornecedor';
};

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
    return res.json(await comPagamentos(compras));
  } catch (err) {
    return fin.responderErro(res, err, 'Compras/listar');
  }
};

// ─── Buscar por ID ────────────────────────────────────────────────────────────
const buscarPorId = async (req, res) => {
  try {
    const compra = await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'compra' }, include: compraIncludes });
    if (!compra) return res.status(404).json({ error: 'Compra não encontrada.' });
    const [completa] = await comPagamentos([compra]);
    return res.json(completa);
  } catch (err) {
    return fin.responderErro(res, err, 'Compras/buscar');
  }
};

// ─── Criar ────────────────────────────────────────────────────────────────────
// Pagamento: `pagamentos: [{ forma, conta, valor }]` — uma ou várias formas; cada uma sai da conta informada.
//  • soma == total  → compra paga;
//  • soma <  total  → compra parcial: só o valor efetivamente pago sai do caixa, o restante fica PENDENTE;
//  • `a_prazo: true` sem pagamentos → compra totalmente pendente (nenhuma saída financeira).
const criar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    await fin.exigirSessaoAberta(t, 'compras');

    const { id_fornecedor, nome_fornecedor_avulso, data_compra, itens, observacao, pagamentos, a_prazo } = req.body;

    if (!data_compra)                              { await t.rollback(); return res.status(400).json({ error: 'Data da compra é obrigatória.' }); }
    if (!itens || itens.length === 0)              { await t.rollback(); return res.status(400).json({ error: 'Informe ao menos um item na compra.' }); }
    if (!id_fornecedor && !nome_fornecedor_avulso) { await t.rollback(); return res.status(400).json({ error: 'Informe um fornecedor ou nome avulso.' }); }

    const totalCent = itens.reduce((acc, item) => acc + fin.paraCentavos(item.valor_custo_unitario) * parseInt(item.quantidade, 10), 0);
    if (!Number.isFinite(totalCent) || totalCent <= 0) throw new ErroNegocio('O valor total da compra deve ser maior que zero.', 400);
    const valorTotal = fin.deCentavos(totalCent);

    // Pagamentos: validados antes de gravar qualquer coisa
    const temPagamentos = Array.isArray(pagamentos) && pagamentos.length > 0;
    if (!temPagamentos && a_prazo !== true) {
      throw new ErroNegocio('Informe a forma de pagamento da compra ou marque-a como "a prazo / pagar depois".', 400, 'PAGAMENTO_OBRIGATORIO');
    }
    let pernas = [];
    if (temPagamentos) {
      pernas = fin.resolverPagamentos(pagamentos, await fin.carregarCadastros(t), { exigirConta: true });
      if (fin.somaCentavos(pernas) > totalCent) {
        throw new ErroNegocio(
          `O total pago (${fin.formatarMoeda(fin.somaCentavos(pernas))}) não pode ser maior que o valor da compra (${fin.formatarMoeda(totalCent)}).`,
          422, 'SOMA_DIVERGENTE'
        );
      }
    }
    const pagoCent = fin.somaCentavos(pernas);

    const compra = await Movimentacao.create({
      origem:                   'compra',
      id_fornecedor:            id_fornecedor || null,
      nome_fornecedor_avulso:   nome_fornecedor_avulso || null,
      data_movimentacao:        new Date(`${data_compra}T12:00:00`),
      valor_total:              valorTotal,
      valor_pago:               fin.deCentavos(pagoCent),
      forma_pagamento:          pernas.length ? fin.rotuloFormas(pernas) : null,
      status_pagamento:         pagoCent === totalCent ? 'pago' : 'pendente',
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

    // Somente o que foi efetivamente pago gera saída financeira (uma operação, várias pernas)
    if (pernas.length) {
      await fin.registrarLancamento({
        tipo:            'saida',
        descricao:       `Compra #${compra.id_movimentacao} - ${await nomeDoFornecedor(compra, t)}`,
        categoria:       'Compra',
        origem:          'compra',
        favorecido:      await nomeDoFornecedor(compra, t),
        id_usuario:      req.usuario.id_usuario,
        id_movimentacao: compra.id_movimentacao,
        pagamentos:      fin.pernasParaPagamentos(pernas),
        valorTotal:      fin.deCentavos(pagoCent),
        permitirNegativo: podeAutorizarExcecao(req),
        ip:              req.ip,
        transaction:     t,
      });
    }

    await t.commit();

    const compraCompleta = await Movimentacao.findOne({ where: { id_movimentacao: compra.id_movimentacao }, include: compraIncludes });
    const [completa] = await comPagamentos([compraCompleta]);
    return res.status(201).json(completa);
  } catch (err) {
    if (!t.finished) await t.rollback();
    return fin.responderErro(res, err, 'Compras/criar', 'Erro interno ao registrar compra.');
  }
};

// ─── Pagar (total ou parcialmente) uma compra pendente ───────────────────────
const pagar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    await fin.exigirSessaoAberta(t, 'pagamentos de compras');

    const { pagamentos } = req.body;
    const compra = await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'compra' }, transaction: t, lock: t.LOCK.UPDATE });
    if (!compra) throw new ErroNegocio('Compra não encontrada.', 404);
    if (compra.status_pagamento === 'cancelado') throw new ErroNegocio('Esta compra está cancelada.', 409, 'COMPRA_CANCELADA');
    if (compra.status_pagamento === 'pago') throw new ErroNegocio('Esta compra já está totalmente paga.', 409, 'COMPRA_PAGA');

    const pernas = fin.resolverPagamentos(pagamentos, await fin.carregarCadastros(t), { exigirConta: true });
    const pagoAgoraCent = fin.somaCentavos(pernas);
    const pendenteCent = fin.paraCentavos(compra.valor_total) - fin.paraCentavos(compra.valor_pago || 0);
    if (pagoAgoraCent > pendenteCent) {
      throw new ErroNegocio(
        `O valor informado (${fin.formatarMoeda(pagoAgoraCent)}) é maior que o saldo pendente da compra (${fin.formatarMoeda(pendenteCent)}).`,
        422, 'SOMA_DIVERGENTE'
      );
    }

    const nome = await nomeDoFornecedor(compra, t);
    await fin.registrarLancamento({
      tipo:            'saida',
      descricao:       `Pagamento Compra #${compra.id_movimentacao} - ${nome}`,
      categoria:       'Compra',
      origem:          'compra',
      favorecido:      nome,
      id_usuario:      req.usuario.id_usuario,
      id_movimentacao: compra.id_movimentacao,
      pagamentos:      fin.pernasParaPagamentos(pernas),
      valorTotal:      fin.deCentavos(pagoAgoraCent),
      permitirNegativo: podeAutorizarExcecao(req),
      ip:              req.ip,
      transaction:     t,
    });

    const novoPagoCent = fin.paraCentavos(compra.valor_pago || 0) + pagoAgoraCent;
    const rotuloNovo = fin.rotuloFormas(pernas);
    await compra.update({
      valor_pago: fin.deCentavos(novoPagoCent),
      status_pagamento: novoPagoCent === fin.paraCentavos(compra.valor_total) ? 'pago' : 'pendente',
      forma_pagamento: !compra.forma_pagamento || compra.forma_pagamento === rotuloNovo ? rotuloNovo : 'Dividido',
    }, { transaction: t });

    await t.commit();

    const atualizada = await Movimentacao.findOne({ where: { id_movimentacao: compra.id_movimentacao }, include: compraIncludes });
    const [completa] = await comPagamentos([atualizada]);
    return res.json(completa);
  } catch (err) {
    if (!t.finished) await t.rollback();
    return fin.responderErro(res, err, 'Compras/pagar', 'Erro interno ao registrar pagamento.');
  }
};

// ─── Cancelar compra ──────────────────────────────────────────────────────────
const cancelar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { motivo } = req.body;
    if (!motivo || !String(motivo).trim()) {
      await t.rollback();
      return res.status(400).json({ error: 'O motivo do cancelamento é obrigatório.' });
    }

    // Trava a compra para que dois cancelamentos simultâneos não estornem o caixa duas vezes
    await Movimentacao.findOne({ where: { id_movimentacao: req.params.id, origem: 'compra' }, transaction: t, lock: t.LOCK.UPDATE });

    const compra = await Movimentacao.findOne({
      where: { id_movimentacao: req.params.id, origem: 'compra' },
      include: [
        { model: Fornecedor, as: 'fornecedor', attributes: ['id_fornecedor', 'nome'] },
        { model: ItemMovimentacao, as: 'itens' },
      ],
      transaction: t,
    });

    if (!compra) {
      await t.rollback();
      return res.status(404).json({ error: 'Compra não encontrada.' });
    }
    if (compra.status_pagamento === 'cancelado') {
      await t.rollback();
      return res.status(400).json({ error: 'Esta compra já está cancelada.' });
    }

    const dadosAnteriores = compra.toJSON();
    const motivoLimpo = String(motivo).trim();

    // 1. Agrupar quantidades por produto e validar saldo disponível em estoque
    const qtdPorProduto = {};
    for (const item of compra.itens || []) {
      qtdPorProduto[item.id_produto] = (qtdPorProduto[item.id_produto] || 0) + parseInt(item.quantidade, 10);
    }

    const produtosParaAtualizar = [];
    for (const [idProdStr, qtdEstorno] of Object.entries(qtdPorProduto)) {
      const produto = await Produto.findByPk(Number(idProdStr), { transaction: t });
      if (!produto) {
        await t.rollback();
        return res.status(404).json({ error: `Produto #${idProdStr} da compra não encontrado no estoque.` });
      }
      if (produto.estoque_atual < qtdEstorno) {
        await t.rollback();
        return res.status(400).json({
          error: `Não é possível cancelar esta compra: o produto "${produto.descricao}" possui apenas ${produto.estoque_atual} un em estoque, mas a compra exige retirar ${qtdEstorno} un (parte dos itens já foi vendida ou utilizada).`,
        });
      }
      produtosParaAtualizar.push({ produto, qtdEstorno });
    }

    // 2. Retirar quantidades do estoque
    for (const { produto, qtdEstorno } of produtosParaAtualizar) {
      await produto.update(
        { estoque_atual: produto.estoque_atual - qtdEstorno },
        { transaction: t }
      );
    }

    // 3. Atualizar status da compra e registrar motivo
    await compra.update(
      {
        status_pagamento: 'cancelado',
        motivo_cancelamento: motivoLimpo,
      },
      { transaction: t }
    );

    // 4. Estornar no Caixa tudo o que foi efetivamente pago, com as mesmas formas e contas dos pagamentos originais.
    //    Compra a prazo/sem pagamento não tem o que estornar (nada saiu do caixa).
    const nomeFornecedor = compra.fornecedor?.nome || compra.nome_fornecedor_avulso || 'Fornecedor';
    await fin.estornarPorMovimentacao(compra.id_movimentacao, {
      id_usuario:  req.usuario.id_usuario,
      descricao:   `Cancelamento Compra #${compra.id_movimentacao} (${nomeFornecedor}) — Motivo: ${motivoLimpo}`,
      permitirNegativo: podeAutorizarExcecao(req),
      ip:          req.ip,
      transaction: t,
    });

    // 5. Registrar log de auditoria
    if (LogAuditoria) {
      await LogAuditoria.create(
        {
          id_usuario:       req.usuario.id_usuario,
          acao:             'CANCELAR',
          entidade:         'movimentacao',
          id_registro:      compra.id_movimentacao,
          dados_anteriores: dadosAnteriores,
          dados_posteriores: compra.toJSON(),
          ip_origem:        req.ip || null,
        },
        { transaction: t }
      );
    }

    await t.commit();

    const compraAtualizada = await Movimentacao.findOne({
      where: { id_movimentacao: compra.id_movimentacao },
      include: compraIncludes,
    });
    const [completa] = await comPagamentos([compraAtualizada]);
    return res.json(completa);
  } catch (err) {
    if (!t.finished) await t.rollback();
    return fin.responderErro(res, err, 'Compras/cancelar', 'Erro interno ao cancelar compra.');
  }
};

module.exports = { listar, buscarPorId, criar, pagar, cancelar };
