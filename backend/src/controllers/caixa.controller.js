const { Caixa, Usuario } = require('../models');
const { Op } = require('sequelize');

// ─── Listar movimentações ─────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { data_inicio, data_fim, tipo } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (data_inicio || data_fim) {
      where.data = {};
      if (data_inicio) where.data[Op.gte] = new Date(data_inicio);
      if (data_fim) where.data[Op.lte] = new Date(data_fim + 'T23:59:59');
    }
    const movimentacoes = await Caixa.findAll({
      where,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nome'] }],
      order: [['data', 'DESC']],
    });
    return res.json(movimentacoes);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Resumo do dia (separa abertura das demais entradas) ──────────────────────
const resumoDia = async (req, res) => {
  try {
    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia = new Date(new Date().setHours(23, 59, 59, 999));

    const movimentos = await Caixa.findAll({
      where: { data: { [Op.between]: [inicioDia, fimDia] } },
      raw: true,
    });

    const abertura = movimentos
      .filter(m => m.categoria === 'Abertura de Caixa')
      .reduce((sum, m) => sum + parseFloat(m.valor), 0);

    const entradas = movimentos
      .filter(m => m.tipo === 'entrada' && m.categoria !== 'Abertura de Caixa')
      .reduce((sum, m) => sum + parseFloat(m.valor), 0);

    const saidas = movimentos
      .filter(m => m.tipo === 'saida')
      .reduce((sum, m) => sum + parseFloat(m.valor), 0);

    return res.json({
      abertura,
      entradas,
      saidas,
      saldo: abertura + entradas - saidas,
      caixaAberto: abertura > 0,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Abrir caixa do dia ───────────────────────────────────────────────────────
const abrirCaixa = async (req, res) => {
  try {
    const { valor } = req.body;
    if (valor === undefined || parseFloat(valor) < 0) {
      return res.status(400).json({ error: 'Informe um valor de abertura válido.' });
    }

    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia = new Date(new Date().setHours(23, 59, 59, 999));

    const jaAberto = await Caixa.findOne({
      where: {
        categoria: 'Abertura de Caixa',
        data: { [Op.between]: [inicioDia, fimDia] },
      },
    });

    if (jaAberto) {
      return res.status(400).json({ error: 'O caixa já foi aberto hoje.' });
    }

    const mov = await Caixa.create({
      id_usuario: req.usuario.id_usuario,
      data: new Date(),
      tipo: 'entrada',
      valor: parseFloat(valor),
      descricao: 'Abertura de Caixa',
      categoria: 'Abertura de Caixa',
    });

    return res.status(201).json(mov);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Registrar movimentação manual ────────────────────────────────────────────
const registrarManual = async (req, res) => {
  try {
    const { tipo, valor, descricao, categoria } = req.body;
    if (!tipo || !valor || !descricao) {
      return res.status(400).json({ error: 'Tipo, valor e descrição são obrigatórios.' });
    }
    const mov = await Caixa.create({
      id_usuario: req.usuario.id_usuario,
      data: new Date(),
      tipo, valor, descricao, categoria,
    });
    return res.status(201).json(mov);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listar, resumoDia, abrirCaixa, registrarManual };
