const { Caixa, Usuario } = require('../models');
const { Op } = require('sequelize');

const getInicioEFimDia = () => {
  const agora = new Date();
  const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
  const fimDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);
  return { inicioDia, fimDia };
};

// ─── Listar movimentações ─────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { data_inicio, data_fim, tipo } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (data_inicio || data_fim) {
      where.data = {};
      if (data_inicio) {
        const d = new Date(data_inicio.includes('T') ? data_inicio : `${data_inicio}T00:00:00`);
        where.data[Op.gte] = d;
      }
      if (data_fim) {
        const d = new Date(data_fim.includes('T') ? data_fim : `${data_fim}T23:59:59.999`);
        where.data[Op.lte] = d;
      }
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
    const { inicioDia, fimDia } = getInicioEFimDia();

    const movimentos = await Caixa.findAll({
      where: { data: { [Op.between]: [inicioDia, fimDia] } },
      raw: true,
    });

    const abertura = movimentos
      .filter(m => m.categoria === 'Abertura de Caixa')
      .reduce((sum, m) => sum + parseFloat(m.valor), 0);

    const entradas = movimentos
      .filter(m => m.tipo === 'entrada' && m.categoria !== 'Abertura de Caixa' && m.categoria !== 'Fechamento de Caixa')
      .reduce((sum, m) => sum + parseFloat(m.valor), 0);

    const saidas = movimentos
      .filter(m => m.tipo === 'saida' && m.categoria !== 'Fechamento de Caixa')
      .reduce((sum, m) => sum + parseFloat(m.valor), 0);

    const jaFechado = movimentos.some(m => m.categoria === 'Fechamento de Caixa');

    return res.json({
      abertura,
      entradas,
      saidas,
      saldo: abertura + entradas - saidas,
      caixaAberto: abertura > 0 && !jaFechado,
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

    const { inicioDia, fimDia } = getInicioEFimDia();

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

// ─── Fechar caixa do dia ──────────────────────────────────────────────────────
const fecharCaixa = async (req, res) => {
  try {
    const { inicioDia, fimDia } = getInicioEFimDia();

    const jaAberto = await Caixa.findOne({
      where: {
        categoria: 'Abertura de Caixa',
        data: { [Op.between]: [inicioDia, fimDia] },
      },
    });

    if (!jaAberto) {
      return res.status(400).json({ error: 'O caixa não foi aberto hoje.' });
    }

    const jaFechado = await Caixa.findOne({
      where: {
        categoria: 'Fechamento de Caixa',
        data: { [Op.between]: [inicioDia, fimDia] },
      },
    });

    if (jaFechado) {
      return res.status(400).json({ error: 'O caixa já foi fechado hoje.' });
    }

    // Calcular o saldo atual para registrar no fechamento
    const movimentos = await Caixa.findAll({
      where: { data: { [Op.between]: [inicioDia, fimDia] } },
      raw: true,
    });

    const abertura = movimentos
      .filter(m => m.categoria === 'Abertura de Caixa')
      .reduce((sum, m) => sum + parseFloat(m.valor), 0);

    const entradas = movimentos
      .filter(m => m.tipo === 'entrada' && m.categoria !== 'Abertura de Caixa' && m.categoria !== 'Fechamento de Caixa')
      .reduce((sum, m) => sum + parseFloat(m.valor), 0);

    const saidas = movimentos
      .filter(m => m.tipo === 'saida' && m.categoria !== 'Fechamento de Caixa')
      .reduce((sum, m) => sum + parseFloat(m.valor), 0);

    const saldo = abertura + entradas - saidas;

    const mov = await Caixa.create({
      id_usuario: req.usuario.id_usuario,
      data: new Date(),
      tipo: 'saida',
      valor: saldo,
      descricao: 'Fechamento de Caixa',
      categoria: 'Fechamento de Caixa',
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

module.exports = { listar, resumoDia, abrirCaixa, fecharCaixa, registrarManual };
