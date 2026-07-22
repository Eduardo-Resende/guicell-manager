const { Aparelho, Cliente } = require('../models');
const phoneCatalogService = require('../services/phoneCatalog.service');

// API REST Endpoint: Lista marcas de celulares
const buscarMarcas = async (req, res) => {
  try {
    const { busca } = req.query;
    const marcas = await phoneCatalogService.buscarMarcasAPI(busca);
    return res.json(marcas);
  } catch (err) {
    console.error('[AparelhosController] Erro em buscarMarcas:', err);
    return res.status(500).json({ error: 'Erro ao buscar marcas.' });
  }
};

// API REST Endpoint: Lista modelos de celulares por marca
const buscarModelos = async (req, res) => {
  try {
    const { marca, busca } = req.query;
    const modelos = await phoneCatalogService.buscarModelosAPI(marca, busca);
    return res.json(modelos);
  } catch (err) {
    console.error('[AparelhosController] Erro em buscarModelos:', err);
    return res.status(500).json({ error: 'Erro ao buscar modelos.' });
  }
};

// API REST Endpoint: Consulta dispositivos na API Externa MobileAPI.dev
const consultarExterno = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json([]);
    }
    const resultados = await phoneCatalogService.consultarAPIExterna(q);
    return res.json(resultados);
  } catch (err) {
    console.error('[AparelhosController] Erro em consultarExterno:', err);
    return res.status(500).json({ error: 'Erro ao consultar API externa.' });
  }
};

// Lista todos os aparelhos do cliente (ativos e inativos) — para tela de clientes
const listarPorCliente = async (req, res) => {
  try {
    const aparelhos = await Aparelho.findAll({
      where: { id_cliente: req.params.id_cliente },
      order: [['criado_em', 'DESC']],
    });
    return res.json(aparelhos);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// Lista apenas os ativos — para dropdown de aparelhos na abertura de OS
const listarAtivosPorCliente = async (req, res) => {
  try {
    const aparelhos = await Aparelho.findAll({
      where: { id_cliente: req.params.id_cliente, ativo: true },
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
      const existing = await Aparelho.findOne({ where: { imei: finalImei } });
      if (existing) {
        return res.status(200).json(existing);
      }
    }

    // Registra/garante marca e modelo na tabela marcas e modelos do banco (Alimentação Incremental)
    await phoneCatalogService.garantirMarcaEModelo(marca, modelo);

    const aparelho = await Aparelho.create({ id_cliente, marca, modelo, imei: finalImei, observacoes, ativo: true });
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
    const { marca, modelo, imei, observacoes } = req.body;

    // Registra/garante marca e modelo na tabela marcas e modelos do banco (Alimentação Incremental)
    await phoneCatalogService.garantirMarcaEModelo(marca, modelo);

    await aparelho.update({ marca, modelo, imei: imei || null, observacoes });
    return res.json(aparelho);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'IMEI já cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const toggleAtivo = async (req, res) => {
  try {
    const aparelho = await Aparelho.findByPk(req.params.id);
    if (!aparelho) return res.status(404).json({ error: 'Aparelho não encontrado.' });
    await aparelho.update({ ativo: !aparelho.ativo });
    return res.json(aparelho);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = {
  buscarMarcas,
  buscarModelos,
  consultarExterno,
  listarPorCliente,
  listarAtivosPorCliente,
  criar,
  atualizar,
  toggleAtivo,
};
