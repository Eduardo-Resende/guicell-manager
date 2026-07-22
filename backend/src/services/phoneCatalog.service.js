// Servico de Catalogo de Marcas e Modelos de Celulares
// Fornece dados integrando Banco de Dados Local (tabelas marcas/modelos) e API externa (MobileAPI.dev)
const { Op } = require('sequelize');
const { Marca, Modelo } = require('../models');

// Fallback estático em memória caso a migration ainda não tenha sido executada
const MARCAS_FALLBACK = [
  'Apple', 'Samsung', 'Motorola', 'Xiaomi', 'LG', 'ASUS', 'Google', 'Huawei',
  'Nokia', 'OnePlus', 'OPPO', 'Positivo', 'Realme', 'Sony', 'Tecno', 'ZTE',
];

/**
 * Busca marcas cadastradas no Banco de Dados local
 */
const buscarMarcasAPI = async (busca = '') => {
  try {
    const where = {};
    if (busca && busca.trim()) {
      where.nome = { [Op.like]: `%${busca.trim()}%` };
    }

    const marcas = await Marca.findAll({
      where,
      order: [['nome', 'ASC']],
      attributes: ['nome'],
      raw: true,
    });

    if (marcas && marcas.length > 0) {
      return marcas.map((m) => m.nome);
    }

    // Se a tabela estiver vazia, aplica filtro no fallback estático
    if (!busca) return MARCAS_FALLBACK;
    const q = busca.trim().toLowerCase();
    return MARCAS_FALLBACK.filter((m) => m.toLowerCase().includes(q));
  } catch (err) {
    console.warn('[PhoneCatalogService] Falha ao buscar marcas no banco, usando fallback:', err.message);
    if (!busca) return MARCAS_FALLBACK;
    const q = busca.trim().toLowerCase();
    return MARCAS_FALLBACK.filter((m) => m.toLowerCase().includes(q));
  }
};

/**
 * Busca modelos de uma marca no Banco de Dados local
 */
const buscarModelosAPI = async (marca = '', busca = '') => {
  if (!marca || !marca.trim()) return [];

  try {
    const marcaObj = await Marca.findOne({
      where: { nome: marca.trim() },
      attributes: ['id_marca'],
    });

    if (!marcaObj) return [];

    const where = { id_marca: marcaObj.id_marca };
    if (busca && busca.trim()) {
      where.nome = { [Op.like]: `%${busca.trim()}%` };
    }

    const modelos = await Modelo.findAll({
      where,
      order: [['nome', 'ASC']],
      attributes: ['nome'],
      raw: true,
    });

    return modelos.map((m) => m.nome);
  } catch (err) {
    console.warn('[PhoneCatalogService] Falha ao buscar modelos no banco:', err.message);
    return [];
  }
};

/**
 * Garante que uma marca e um modelo existam no Banco de Dados local (Alimentação Incremental).
 */
const garantirMarcaEModelo = async (nomeMarca, nomeModelo) => {
  if (!nomeMarca || !nomeModelo) return null;

  const mNome = nomeMarca.trim();
  const modNome = nomeModelo.trim();

  if (!mNome || !modNome) return null;

  try {
    // 1. Garante a Marca
    const [marca] = await Marca.findOrCreate({
      where: { nome: mNome },
      defaults: { nome: mNome },
    });

    // 2. Garante o Modelo
    const [modelo] = await Modelo.findOrCreate({
      where: {
        id_marca: marca.id_marca,
        nome: modNome,
      },
      defaults: {
        id_marca: marca.id_marca,
        nome: modNome,
      },
    });

    return { marca, modelo };
  } catch (err) {
    console.error('[PhoneCatalogService] Erro ao garantir marca/modelo no banco:', err.message);
    return null;
  }
};

/**
 * Consulta a API externa MobileAPI.dev para novos modelos e alimenta o banco local
 * Endpoint: GET https://api.mobileapi.dev/devices/search?name=...
 */
const consultarAPIExterna = async (termoBusca) => {
  if (!termoBusca || !termoBusca.trim()) return [];

  const q = termoBusca.trim();
  const url = `https://api.mobileapi.dev/devices/search?name=${encodeURIComponent(q)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[PhoneCatalogService] MobileAPI.dev retornou status ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : data.data || data.results || [];

    const resultados = [];
    for (const item of items) {
      const brand = item.brand_name || item.brand || item.marca;
      const model = item.name || item.model || item.modelo;

      if (brand && model) {
        resultados.push({ brand: brand.trim(), model: model.trim() });
        // Alimenta o banco de dados incrementalmente
        await garantirMarcaEModelo(brand, model);
      }
    }

    return resultados;
  } catch (err) {
    console.warn('[PhoneCatalogService] Erro ao consultar MobileAPI.dev:', err.message);
    return [];
  }
};

module.exports = {
  buscarMarcasAPI,
  buscarModelosAPI,
  garantirMarcaEModelo,
  consultarAPIExterna,
};
