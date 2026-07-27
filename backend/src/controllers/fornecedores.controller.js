const { Fornecedor } = require('../models');
const { Op } = require('sequelize');

// ─── Listar ──────────────────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { busca, ativo } = req.query;
    const where = {};
    if (ativo !== undefined) where.ativo = ativo === 'true';
    if (busca) {
      where[Op.or] = [
        { nome: { [Op.like]: `%${busca}%` } },
        { cnpj: { [Op.like]: `%${busca}%` } },
        { email: { [Op.like]: `%${busca}%` } },
      ];
    }
    const fornecedores = await Fornecedor.findAll({ where, order: [['nome', 'ASC']] });
    return res.json(fornecedores);
  } catch (err) {
    console.error('[Fornecedores] Erro ao listar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Buscar por ID ───────────────────────────────────────────────────────────
const buscarPorId = async (req, res) => {
  try {
    const f = await Fornecedor.findByPk(req.params.id);
    if (!f) return res.status(404).json({ error: 'Fornecedor não encontrado.' });
    return res.json(f);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Criar ───────────────────────────────────────────────────────────────────
const criar = async (req, res) => {
  try {
    const { nome, cnpj, telefone, email, endereco, contato, observacoes } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
    const f = await Fornecedor.create({ nome, cnpj: cnpj || null, telefone, email, endereco, contato, observacoes });
    return res.status(201).json(f);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'CNPJ já cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Atualizar ───────────────────────────────────────────────────────────────
const atualizar = async (req, res) => {
  try {
    const f = await Fornecedor.findByPk(req.params.id);
    if (!f) return res.status(404).json({ error: 'Fornecedor não encontrado.' });
    await f.update(req.body);
    return res.json(f);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'CNPJ já cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ─── Toggle Ativo ─────────────────────────────────────────────────────────────
const toggleAtivo = async (req, res) => {
  try {
    const f = await Fornecedor.findByPk(req.params.id);
    if (!f) return res.status(404).json({ error: 'Fornecedor não encontrado.' });
    await f.update({ ativo: !f.ativo });
    return res.json(f);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, toggleAtivo };
