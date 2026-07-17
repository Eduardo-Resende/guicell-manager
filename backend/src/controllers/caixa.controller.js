const { Caixa, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');

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

const resumoDia = async (req, res) => {
  try {
    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia = new Date(new Date().setHours(23, 59, 59, 999));
    const resultado = await Caixa.findAll({
      where: { data: { [Op.between]: [inicioDia, fimDia] } },
      attributes: ['tipo', [sequelize.fn('SUM', sequelize.col('valor')), 'total']],
      group: ['tipo'],
      raw: true,
    });
    const entradas = parseFloat(resultado.find(r => r.tipo === 'entrada')?.total || 0);
    const saidas = parseFloat(resultado.find(r => r.tipo === 'saida')?.total || 0);
    return res.json({ entradas, saidas, saldo: entradas - saidas });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

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

module.exports = { listar, resumoDia, registrarManual };
