const { Aparelho, Cliente } = require('../models');

const listarPorCliente = async (req, res) => {
  try {
    const aparelhos = await Aparelho.findAll({
      where: { id_cliente: req.params.id_cliente },
      order: [['marca', 'ASC']],
    });
    return res.json(aparelhos);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const criar = async (req, res) => {
  try {
    const { id_cliente, marca, modelo, imei, observacoes } = req.body;
    if (!id_cliente || !marca || !modelo) {
      return res.status(400).json({ error: 'Cliente, marca e modelo são obrigatórios.' });
    }
    const cliente = await Cliente.findByPk(id_cliente);
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

    const finalImei = (imei && imei.trim()) ? imei.trim() : null;

    if (finalImei) {
      // Verificar se o aparelho com este IMEI já existe
      const existing = await Aparelho.findOne({ where: { imei: finalImei } });
      if (existing) {
        // Se já existe, apenas retorna o aparelho existente
        return res.status(200).json(existing);
      }
    }

    const aparelho = await Aparelho.create({ id_cliente, marca, modelo, imei: finalImei, observacoes });
    return res.status(201).json(aparelho);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'IMEI já cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const atualizar = async (req, res) => {
  try {
    const aparelho = await Aparelho.findByPk(req.params.id);
    if (!aparelho) return res.status(404).json({ error: 'Aparelho não encontrado.' });
    await aparelho.update(req.body);
    return res.json(aparelho);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listarPorCliente, criar, atualizar };
