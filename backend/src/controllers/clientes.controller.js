const { Cliente, Aparelho, OrdemServico } = require('../models');
const { Op } = require('sequelize');

const listar = async (req, res) => {
  try {
    const { busca } = req.query;
    const where = {};
    if (busca) {
      where[Op.or] = [
        { nome: { [Op.like]: `%${busca}%` } },
        { telefone: { [Op.like]: `%${busca}%` } },
        { cpf_cnpj: { [Op.like]: `%${busca}%` } },
      ];
    }
    const clientes = await Cliente.findAll({ where, order: [['nome', 'ASC']] });
    return res.json(clientes);
  } catch (err) {
    console.error('[Clientes] Erro ao listar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [
        { model: Aparelho, as: 'aparelhos' },
        {
          model: OrdemServico, as: 'ordensServico',
          order: [['data_abertura', 'DESC']],
          limit: 10,
        },
      ],
    });
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });
    return res.json(cliente);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, cpf_cnpj, telefone, email, endereco } = req.body;
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }
    const cliente = await Cliente.create({ nome, cpf_cnpj, telefone, email, endereco });
    return res.status(201).json(cliente);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'CPF/CNPJ já cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const atualizar = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });
    await cliente.update(req.body);
    return res.json(cliente);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const remover = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });
    await cliente.destroy();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };
