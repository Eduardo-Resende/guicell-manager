'use strict';

const { Movimentacao, ItemMovimentacao, Caixa, Produto, Categoria, Cliente, Aparelho, Usuario, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const fin = require('../services/financeiro.service');

const getPeriodo = (data_inicio, data_fim) => {
  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  const inicioStr = data_inicio || '2020-01-01';
  const fimStr = data_fim || hojeStr;
  return {
    [Op.between]: [
      new Date(inicioStr.includes('T') ? inicioStr : `${inicioStr}T00:00:00`),
      new Date(fimStr.includes('T') ? fimStr : `${fimStr}T23:59:59.999`),
    ],
  };
};

// RF09: Relatório de OS por período, técnico e status
const relatorioOS = async (req, res) => {
  try {
    const { data_inicio, data_fim, status, id_tecnico } = req.query;
    const where = { origem: 'os', data_movimentacao: getPeriodo(data_inicio, data_fim) };
    if (status)     where.status_os = status;
    if (id_tecnico) where.id_tecnico = id_tecnico;

    const ordens = await Movimentacao.findAll({
      where,
      include: [
        { model: Cliente,  as: 'cliente',  attributes: ['nome', 'telefone'] },
        { model: Aparelho, as: 'aparelho', attributes: ['marca', 'modelo'] },
        { model: Usuario,  as: 'tecnico',  attributes: ['nome'] },
        { model: ItemMovimentacao, as: 'itens', attributes: ['quantidade', 'valor_unitario'] },
      ],
      order: [['data_movimentacao', 'DESC'], ['id_movimentacao', 'DESC']],
    });

    const calcularValorOS = (os) => {
      if (os.status_os === 'Entregue' && os.valor_total != null) return parseFloat(os.valor_total);
      const pecas = (os.itens || []).reduce((s, it) => s + parseFloat(it.valor_unitario) * it.quantidade, 0);
      return parseFloat(os.valor_orcado || 0) + pecas;
    };

    const totais = {
      total: ordens.length,
      valor_total: ordens.reduce((sum, os) => sum + calcularValorOS(os), 0),
      por_status: {},
    };
    ordens.forEach(os => { totais.por_status[os.status_os] = (totais.por_status[os.status_os] || 0) + 1; });

    const ordensComValor = ordens.map(os => ({ ...os.toJSON(), valor_calculado: calcularValorOS(os) }));
    return res.json({ ordens: ordensComValor, totais });
  } catch (err) {
    console.error('[Relatórios] Erro OS:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// RF10: Relatório de vendas por período
const relatorioVendas = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const vendas = await Movimentacao.findAll({
      where: { origem: 'venda', data_movimentacao: getPeriodo(data_inicio, data_fim) },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['nome'] },
        { model: Usuario, as: 'usuario', attributes: ['nome'] },
        {
          model: ItemMovimentacao, as: 'itens',
          include: [{
            model: Produto, as: 'produto',
            attributes: ['descricao'],
            include: [{ model: Categoria, as: 'categoriaRef', attributes: ['nome'], include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }] }],
          }],
        },
      ],
      order: [['data_movimentacao', 'DESC'], ['id_movimentacao', 'DESC']],
    });

    const vendasAtivas = vendas.filter(v => v.status_pagamento !== 'cancelado');
    const totais = {
      total_vendas: vendasAtivas.length,
      valor_total:  vendasAtivas.reduce((sum, v) => sum + parseFloat(v.valor_total), 0),
    };
    return res.json({ vendas, totais });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// RF11: Relatório de fluxo de caixa por período
// Receitas e despesas = lançamentos operacionais. Transferências, ajustes de conferência e aberturas/fechamentos
// têm tratamento próprio (bloco "outros") e nunca entram nos totais de receitas/despesas.
const relatorioCaixa = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const periodo = getPeriodo(data_inicio, data_fim);
    const [inicio, fim] = periodo[Op.between];
    const where = { data: periodo, natureza: 'operacional' };

    const lancamentos = await Caixa.findAll({
      where,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nome'] }, ...fin.INCLUDE_PERNAS],
      order: [['data', 'DESC'], ['id_caixa', 'DESC']],
    });
    const estornados = await fin.marcarEstornados(lancamentos);
    const movimentacoes = lancamentos.map((l) => fin.serializarLancamento(l, estornados));

    const totaisBrutos = await Caixa.findAll({
      where,
      attributes: ['tipo', [sequelize.fn('SUM', sequelize.col('valor')), 'total']],
      group: ['tipo'],
      raw: true,
    });
    const entradas = parseFloat(totaisBrutos.find(t => t.tipo === 'entrada')?.total || 0);
    const saidas   = parseFloat(totaisBrutos.find(t => t.tipo === 'saida')?.total   || 0);

    const agrupar = async (campoCodigo, campoNome, tabela, chave) => {
      const linhas = await sequelize.query(
        `SELECT x.${campoCodigo} AS codigo, x.${campoNome} AS nome, p.tipo AS tipo, SUM(p.valor) AS total
           FROM caixa_pagamentos p
           JOIN caixa c ON c.id_caixa = p.id_caixa
           JOIN ${tabela} x ON x.${chave} = p.${chave}
          WHERE c.natureza = 'operacional' AND c.data BETWEEN :inicio AND :fim
          GROUP BY x.${campoCodigo}, x.${campoNome}, p.tipo`,
        { replacements: { inicio, fim }, type: QueryTypes.SELECT }
      );
      const mapa = {};
      linhas.forEach((l) => {
        mapa[l.codigo] = mapa[l.codigo] || { codigo: l.codigo, nome: l.nome, entradas: 0, saidas: 0, saldo: 0 };
        mapa[l.codigo][l.tipo === 'entrada' ? 'entradas' : 'saidas'] = parseFloat(l.total);
        mapa[l.codigo].saldo = mapa[l.codigo].entradas - mapa[l.codigo].saidas;
      });
      return Object.values(mapa);
    };

    const [porForma, porConta, transferencias, ajustes] = await Promise.all([
      agrupar('codigo', 'nome', 'formas_pagamento', 'id_forma'),
      agrupar('codigo', 'nome', 'contas_financeiras', 'id_conta'),
      sequelize.query(
        `SELECT COUNT(*) AS quantidade, COALESCE(SUM(valor), 0) AS valor
           FROM caixa WHERE natureza = 'transferencia' AND tipo = 'entrada' AND data BETWEEN :inicio AND :fim`,
        { replacements: { inicio, fim }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT tipo, COUNT(*) AS quantidade, COALESCE(SUM(valor), 0) AS valor
           FROM caixa WHERE natureza = 'ajuste_conferencia' AND data BETWEEN :inicio AND :fim GROUP BY tipo`,
        { replacements: { inicio, fim }, type: QueryTypes.SELECT }
      ),
    ]);
    const sobras = ajustes.find(a => a.tipo === 'entrada');
    const faltas = ajustes.find(a => a.tipo === 'saida');

    return res.json({
      movimentacoes,
      totais: { entradas, saidas, saldo: entradas - saidas },
      por_forma: porForma,
      por_conta: porConta,
      outros: {
        transferencias: { quantidade: Number(transferencias[0].quantidade), valor: parseFloat(transferencias[0].valor) },
        ajustes_conferencia: {
          sobras: parseFloat(sobras?.valor || 0),
          faltas: parseFloat(faltas?.valor || 0),
          quantidade: Number(sobras?.quantidade || 0) + Number(faltas?.quantidade || 0),
        },
      },
    });
  } catch (err) {
    console.error('[Relatórios] Erro Caixa:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// Relatório de estoque
const relatorioEstoque = async (req, res) => {
  try {
    const produtos = await Produto.findAll({
      include: [{ model: Categoria, as: 'categoriaRef', include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }] }],
      order: [['descricao', 'ASC']],
    });
    const emAlerta = produtos.filter(p => (p.estoque_minimo || 0) > 0 && p.estoque_atual <= p.estoque_minimo).length;
    return res.json({ produtos, totais: { total: produtos.length, em_alerta: emAlerta } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { relatorioOS, relatorioVendas, relatorioCaixa, relatorioEstoque };
