const { Cliente, Aparelho, Movimentacao } = require('../models');
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
      ],
    });
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

    // RF13: Consulta do histórico de OS com ordenação temporal e suporte a paginação controlada
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const limiteDefault = req.query.todos === 'true' ? 500 : (parseInt(req.query.limite, 10) || 50);
    const limite = Math.min(Math.max(1, limiteDefault), 500);
    const offset = (pagina - 1) * limite;

    const { count, rows: movimentacoes } = await Movimentacao.findAndCountAll({
      where: { id_cliente: cliente.id_cliente, origem: 'os' },
      include: [
        { model: Aparelho, as: 'aparelho', attributes: ['id_aparelho', 'marca', 'modelo', 'imei'] },
      ],
      order: [
        ['data_movimentacao', 'DESC'],
        ['id_movimentacao', 'DESC'],
      ],
      limit: limite,
      offset,
    });

    const clienteData = cliente.toJSON();
    clienteData.movimentacoes = movimentacoes;
    clienteData.total_os = count;
    clienteData.pagina_os = pagina;
    clienteData.limite_os = limite;
    clienteData.total_paginas_os = Math.ceil(count / limite);

    return res.json(clienteData);
  } catch (err) {
    console.error('[Clientes] Erro ao buscar por ID:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// RF13: Endpoint dedicado de consulta paginada do histórico completo de OS do cliente
const listarHistoricoOs = async (req, res) => {
  try {
    const idCliente = req.params.id;
    const cliente = await Cliente.findByPk(idCliente);
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const limite = Math.min(Math.max(1, parseInt(req.query.limite, 10) || 10), 100);
    const offset = (pagina - 1) * limite;

    const { count, rows: ordens } = await Movimentacao.findAndCountAll({
      where: { id_cliente: idCliente, origem: 'os' },
      include: [
        { model: Aparelho, as: 'aparelho', attributes: ['id_aparelho', 'marca', 'modelo', 'imei'] },
      ],
      order: [
        ['data_movimentacao', 'DESC'],
        ['id_movimentacao', 'DESC'],
      ],
      limit: limite,
      offset,
    });

    return res.json({
      id_cliente: cliente.id_cliente,
      nome_cliente: cliente.nome,
      total: count,
      pagina,
      limite,
      total_paginas: Math.ceil(count / limite),
      ordens,
    });
  } catch (err) {
    console.error('[Clientes] Erro ao listar histórico de OS:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const sanitizeDigits = (str) => (str ? String(str).replace(/\D/g, '') : null);

const criar = async (req, res) => {
  try {
    const { nome, cpf_cnpj, telefone, email, endereco } = req.body;
    const cleanTelefone = sanitizeDigits(telefone);
    if (!nome || !cleanTelefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }
    const cliente = await Cliente.create({
      nome: nome.trim(),
      cpf_cnpj: sanitizeDigits(cpf_cnpj),
      telefone: cleanTelefone,
      email: email ? email.trim() : null,
      endereco: endereco ? endereco.trim() : null,
    });
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
    
    const data = { ...req.body };
    if (data.telefone) data.telefone = sanitizeDigits(data.telefone);
    if (data.cpf_cnpj) data.cpf_cnpj = sanitizeDigits(data.cpf_cnpj);
    if (data.nome) data.nome = data.nome.trim();

    await cliente.update(data);
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

module.exports = { listar, buscarPorId, listarHistoricoOs, criar, atualizar, remover };
