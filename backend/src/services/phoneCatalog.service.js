// Servico de Catalogo de Marcas e Modelos de Celulares
// Baseado no Banco de Dados Local + Catalogo Base BR + Catalogo Oficial GSMArena (6.100+ aparelhos reais)
const { Marca, Modelo } = require('../models');
const gsmarenaCatalog = require('./gsmarenaCatalog.json');

// Catalogo brasileiro complementar (garante modelos classicos nacionais mesmo antigos)
const CATALOGO_BASE = {
  Apple: [
    'iPhone 5', 'iPhone 5C', 'iPhone 5S', 'iPhone SE (1ª geração)',
    'iPhone 6', 'iPhone 6 Plus', 'iPhone 6S', 'iPhone 6S Plus',
    'iPhone 7', 'iPhone 7 Plus', 'iPhone 8', 'iPhone 8 Plus',
    'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone SE (2ª geração)',
    'iPhone 12', 'iPhone 12 Mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
    'iPhone 13', 'iPhone 13 Mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone SE (3ª geração)',
    'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
    'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16e', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
  ],
  Samsung: [
    'Galaxy J1', 'Galaxy J1 Mini', 'Galaxy J1 Mini Prime', 'Galaxy J1 Ace', 'Galaxy J1 2016',
    'Galaxy J2', 'Galaxy J2 Prime', 'Galaxy J2 Core', 'Galaxy J2 Pro',
    'Galaxy J3', 'Galaxy J3 2016', 'Galaxy J4', 'Galaxy J4+', 'Galaxy J4 Core',
    'Galaxy J5', 'Galaxy J5 Prime', 'Galaxy J5 Pro', 'Galaxy J5 Metal',
    'Galaxy J6', 'Galaxy J6+', 'Galaxy J7', 'Galaxy J7 Prime', 'Galaxy J7 Prime 2', 'Galaxy J7 Pro', 'Galaxy J7 Neo', 'Galaxy J7 Metal', 'Galaxy J7 Duo',
    'Galaxy J8', 'Galaxy Gran Prime', 'Galaxy Gran Prime Duos',
    'Galaxy A01', 'Galaxy A01 Core', 'Galaxy A02', 'Galaxy A02s', 'Galaxy A03', 'Galaxy A03s', 'Galaxy A03 Core',
    'Galaxy A04', 'Galaxy A04e', 'Galaxy A04s', 'Galaxy A05', 'Galaxy A05s', 'Galaxy A06',
    'Galaxy A10', 'Galaxy A10s', 'Galaxy A11', 'Galaxy A12', 'Galaxy A13', 'Galaxy A14', 'Galaxy A14 5G', 'Galaxy A15', 'Galaxy A15 5G', 'Galaxy A16', 'Galaxy A16 5G',
    'Galaxy A20', 'Galaxy A20s', 'Galaxy A21s', 'Galaxy A22', 'Galaxy A23', 'Galaxy A24', 'Galaxy A25 5G',
    'Galaxy A30', 'Galaxy A30s', 'Galaxy A31', 'Galaxy A32', 'Galaxy A33 5G', 'Galaxy A34 5G', 'Galaxy A35 5G',
    'Galaxy A50', 'Galaxy A51', 'Galaxy A52', 'Galaxy A52s 5G', 'Galaxy A53 5G', 'Galaxy A54 5G', 'Galaxy A55 5G',
    'Galaxy A70', 'Galaxy A71', 'Galaxy A72', 'Galaxy A73 5G', 'Galaxy A80',
    'Galaxy S10', 'Galaxy S10e', 'Galaxy S10+', 'Galaxy S20', 'Galaxy S20+', 'Galaxy S20 Ultra', 'Galaxy S20 FE',
    'Galaxy S21', 'Galaxy S21+', 'Galaxy S21 Ultra', 'Galaxy S21 FE',
    'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra',
    'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra', 'Galaxy S23 FE',
    'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra', 'Galaxy S24 FE',
    'Galaxy S25', 'Galaxy S25+', 'Galaxy S25 Ultra',
  ],
  Motorola: [
    'Moto C', 'Moto C Plus',
    'Moto E4', 'Moto E4 Plus', 'Moto E5', 'Moto E5 Play', 'Moto E5 Plus',
    'Moto E6', 'Moto E6 Play', 'Moto E6 Plus', 'Moto E6s', 'Moto E6i',
    'Moto E7', 'Moto E7 Play', 'Moto E7 Plus', 'Moto E7 Power',
    'Moto E13', 'Moto E14', 'Moto E20', 'Moto E22', 'Moto E22i', 'Moto E32', 'Moto E40',
    'Moto G1', 'Moto G2', 'Moto G3', 'Moto G4', 'Moto G4 Play', 'Moto G4 Plus',
    'Moto G5', 'Moto G5 Plus', 'Moto G5S', 'Moto G5S Plus',
    'Moto G6', 'Moto G6 Play', 'Moto G6 Plus',
    'Moto G7', 'Moto G7 Play', 'Moto G7 Plus', 'Moto G7 Power',
    'Moto G8', 'Moto G8 Play', 'Moto G8 Plus', 'Moto G8 Power', 'Moto G8 Power Lite',
    'Moto G9', 'Moto G9 Play', 'Moto G9 Plus', 'Moto G9 Power',
    'Moto G04', 'Moto G04s', 'Moto G10', 'Moto G13', 'Moto G14', 'Moto G15',
    'Moto G20', 'Moto G22', 'Moto G23', 'Moto G24', 'Moto G24 Power',
    'Moto G30', 'Moto G31', 'Moto G32', 'Moto G34 5G', 'Moto G35 5G',
    'Moto G41', 'Moto G42', 'Moto G50 5G', 'Moto G52', 'Moto G53 5G', 'Moto G54 5G', 'Moto G55 5G',
    'Moto G60', 'Moto G60s', 'Moto G62 5G', 'Moto G71 5G', 'Moto G72', 'Moto G73 5G', 'Moto G75 5G',
    'Moto G82 5G', 'Moto G84 5G', 'Moto G85 5G', 'Moto G100', 'Moto G200 5G',
  ],
  Xiaomi: [
    'Redmi 9', 'Redmi 9A', 'Redmi 9C', 'Redmi 10', 'Redmi 10A', 'Redmi 10C', 'Redmi 12', 'Redmi 12C', 'Redmi 13', 'Redmi 13C', 'Redmi 14C',
    'Redmi Note 7', 'Redmi Note 8', 'Redmi Note 8 Pro', 'Redmi Note 9', 'Redmi Note 9S', 'Redmi Note 9 Pro',
    'Redmi Note 10', 'Redmi Note 10S', 'Redmi Note 10 Pro', 'Redmi Note 11', 'Redmi Note 11S', 'Redmi Note 11 Pro',
    'Redmi Note 12', 'Redmi Note 12S', 'Redmi Note 12 Pro', 'Redmi Note 12 Pro 5G',
    'Redmi Note 13', 'Redmi Note 13 5G', 'Redmi Note 13 Pro', 'Redmi Note 13 Pro 5G', 'Redmi Note 13 Pro+',
    'Redmi Note 14', 'Redmi Note 14 5G', 'Redmi Note 14 Pro', 'Redmi Note 14 Pro+',
    'POCO C40', 'POCO C55', 'POCO C65', 'POCO C75',
    'POCO M3', 'POCO M4 Pro', 'POCO M5', 'POCO M5s', 'POCO M6 Pro',
    'POCO X3 NFC', 'POCO X3 Pro', 'POCO X4 Pro 5G', 'POCO X5 5G', 'POCO X5 Pro 5G', 'POCO X6 5G', 'POCO X6 Pro 5G', 'POCO X7', 'POCO X7 Pro',
    'POCO F3', 'POCO F4', 'POCO F5', 'POCO F5 Pro', 'POCO F6', 'POCO F6 Pro',
  ],
  Positivo: [
    'Twist 3', 'Twist 4', 'Twist 4 Fit', 'Twist 4 Pro', 'Twist 4S', 'Twist 5', 'Twist 5 Pro', 'Twist 5 Max', 'Q20',
  ],
  Multilaser: [
    'Multilaser E', 'Multilaser E Lite', 'Multilaser F', 'Multilaser F Pro', 'Multilaser G', 'Multilaser G Max', 'Multilaser G Pro', 'Multilaser H',
  ],
};

// Marcas prioritárias no Brasil (para ordenação quando a marca está em branco)
const PRIORITY_BRANDS = new Set([
  'apple', 'samsung', 'motorola', 'xiaomi', 'realme', 'infinix', 'lg', 'asus',
  'google', 'huawei', 'honor', 'nokia', 'oneplus', 'oppo', 'vivo', 'positivo',
  'multilaser', 'sony', 'tcl', 'tecno', 'zte',
]);

// Assinaturas exclusivas de linhas por fabricante (para validação cruzada Marca x Modelo)
const BRAND_EXCLUSIVE_PATTERNS = [
  { brand: 'Apple', regex: /\b(iphone|ipad|ipod|apple\s*watch)\b/i },
  { brand: 'Samsung', regex: /\b(galaxy)\b/i },
  { brand: 'Xiaomi', regex: /\b(redmi|poco|pocophone|xiaomi)\b/i },
  { brand: 'Motorola', regex: /\b(moto|motorola|razr)\b/i },
  { brand: 'ASUS', regex: /\b(zenfone|rog\s*phone)\b/i },
  { brand: 'Google', regex: /\b(pixel)\b/i },
  { brand: 'Realme', regex: /\b(realme|narzo)\b/i },
  { brand: 'Infinix', regex: /\b(infinix)\b/i },
  { brand: 'Sony', regex: /\b(xperia)\b/i },
  { brand: 'Huawei', regex: /\b(huawei)\b/i },
  { brand: 'Honor', regex: /\b(honor)\b/i },
  { brand: 'OnePlus', regex: /\b(oneplus)\b/i },
  { brand: 'OPPO', regex: /\b(oppo|reno)\b/i },
  { brand: 'Nokia', regex: /\b(nokia|lumia)\b/i },
  { brand: 'Tecno', regex: /\b(tecno|camon|pova)\b/i },
  { brand: 'Positivo', regex: /\b(twist)\b/i },
  { brand: 'Multilaser', regex: /\b(multilaser)\b/i },
];

let catalogCache = null;
let catalogCacheTimestamp = 0;
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Normaliza string para comparação sem acentos e minúscula
 */
const normalizeText = (str = '') =>
  String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim();

/**
 * Carrega e mescla o catálogo: CATALOGO_BASE + GSMArena (6.096 modelos) + Banco Local
 */
const getCatalog = async () => {
  const now = Date.now();
  if (catalogCache && now - catalogCacheTimestamp < CATALOG_CACHE_TTL_MS) {
    return catalogCache;
  }

  const modelosPorMarca = new Map(); // brandKey -> Map<modelKey, modelName>
  const brandCanonical = new Map();  // brandKey -> canonicalBrandName
  const modelToBrands = new Map();   // modelKey -> Set<canonicalBrandName>

  const registerBrand = (nome) => {
    const trimmed = String(nome || '').trim();
    if (!trimmed) return null;
    const key = normalizeText(trimmed);
    if (!brandCanonical.has(key)) {
      brandCanonical.set(key, trimmed);
      modelosPorMarca.set(key, new Map());
    }
    return key;
  };

  const registerModel = (brandKey, nomeModelo) => {
    if (!brandKey || !nomeModelo) return;
    const trimmed = String(nomeModelo).trim();
    if (!trimmed) return;
    const modelKey = normalizeText(trimmed);
    const mapModelos = modelosPorMarca.get(brandKey);
    if (mapModelos && !mapModelos.has(modelKey)) {
      mapModelos.set(modelKey, trimmed);
    }
    const canonicalBrand = brandCanonical.get(brandKey);
    if (canonicalBrand) {
      if (!modelToBrands.has(modelKey)) {
        modelToBrands.set(modelKey, new Set());
      }
      modelToBrands.get(modelKey).add(canonicalBrand);
    }
  };

  // 1. Carrega CATALOGO_BASE (modelos nacionais prioritários)
  for (const [marca, listaModelos] of Object.entries(CATALOGO_BASE)) {
    const bKey = registerBrand(marca);
    for (const mod of listaModelos) {
      registerModel(bKey, mod);
    }
  }

  // 2. Carrega catálogo completo GSMArena (6.096 modelos reais)
  for (const [marca, listaModelos] of Object.entries(gsmarenaCatalog)) {
    const bKey = registerBrand(marca);
    for (const mod of listaModelos) {
      registerModel(bKey, mod);
    }
  }

  // 3. Mescla com o Banco de Dados local
  try {
    const [marcasDB, modelosDB] = await Promise.all([
      Marca.findAll({ attributes: ['id_marca', 'nome'], raw: true }),
      Modelo.findAll({ attributes: ['id_marca', 'nome'], raw: true }),
    ]);

    const idToBrandKey = new Map();
    for (const m of marcasDB) {
      const bKey = registerBrand(m.nome);
      if (bKey) idToBrandKey.set(m.id_marca, bKey);
    }

    for (const mod of modelosDB) {
      const bKey = idToBrandKey.get(mod.id_marca);
      if (bKey) registerModel(bKey, mod.nome);
    }
  } catch (err) {
    console.warn('[PhoneCatalogService] Usando catalogo em memoria:', err.message);
  }

  // Ordena marcas colocando as mais usadas no Brasil no topo quando sem filtro, ou alfabético
  const marcasOrdenadas = Array.from(brandCanonical.values()).sort((a, b) => {
    const aPrio = PRIORITY_BRANDS.has(normalizeText(a)) ? 0 : 1;
    const bPrio = PRIORITY_BRANDS.has(normalizeText(b)) ? 0 : 1;
    if (aPrio !== bPrio) return aPrio - bPrio;
    return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
  });

  const modelosListaPorMarca = new Map();
  for (const [bKey, mapMod] of modelosPorMarca.entries()) {
    modelosListaPorMarca.set(bKey, Array.from(mapMod.values()));
  }

  catalogCache = {
    marcas: marcasOrdenadas,
    modelosPorMarca: modelosListaPorMarca,
    brandCanonical,
    modelToBrands,
  };
  catalogCacheTimestamp = now;
  return catalogCache;
};

const invalidateCatalogCache = () => {
  catalogCache = null;
  catalogCacheTimestamp = 0;
};

/**
 * Calcula score de relevância de um modelo real contra a busca do usuário
 */
const scoreCandidate = (candidate, rawQuery, brandName = '') => {
  const normCandidate = normalizeText(candidate);
  const compactCandidate = normCandidate.replace(/\s+/g, '');

  let cleanedQuery = normalizeText(rawQuery);
  if (brandName) {
    const normBrand = normalizeText(brandName);
    if (cleanedQuery === normBrand) return 60;
    if (cleanedQuery.startsWith(normBrand + ' ')) {
      cleanedQuery = cleanedQuery.slice(normBrand.length).trim();
    }
  }
  if (!cleanedQuery) return 50;

  const compactQuery = cleanedQuery.replace(/\s+/g, '');
  const queryTokens = cleanedQuery.split(/\s+/).filter(Boolean);

  // 1. Match exato
  if (normCandidate === cleanedQuery || compactCandidate === compactQuery) return 100;

  // 2. Começa exatamente com o termo digitado
  if (normCandidate.startsWith(cleanedQuery)) return 94;

  // 3. Começa com o termo após o prefixo da linha (ex: "j1 mini" bate com "galaxy j1 mini")
  const withoutLinePrefix = normCandidate.replace(/^(galaxy|moto|motorola|iphone|redmi|poco|xiaomi|zenfone|realme|infinix|nokia|tcl|blade)\s+/, '');
  if (withoutLinePrefix === cleanedQuery) return 96;
  if (withoutLinePrefix.startsWith(cleanedQuery)) return 90;
  if (withoutLinePrefix.replace(/\s+/g, '').startsWith(compactQuery)) return 86;

  // 4. Contém a frase inteira como palavra/substring
  const candidateWords = normCandidate.split(/\s+/);
  if (candidateWords.some((w) => w.startsWith(compactQuery))) return 82;
  if (normCandidate.includes(' ' + cleanedQuery)) return 80;

  // 5. Todos os tokens estão presentes no candidato (ex: "iphone 13 max" -> "iPhone 13 Pro Max")
  const allTokensMatch = queryTokens.every((tk) => {
    if (tk.length === 1) {
      return candidateWords.some((cw) => cw.startsWith(tk));
    }
    return candidateWords.some((cw) => cw.startsWith(tk) || cw.includes(tk)) || compactCandidate.includes(tk);
  });
  if (allTokensMatch) return 72;

  return 0;
};

/**
 * Detecta a qual marca um modelo pertence (usado para autopreencher marca e validar antes de salvar)
 */
const detectarMarcaDoModelo = async (nomeModelo) => {
  if (!nomeModelo || !nomeModelo.trim()) return null;
  const { modelToBrands } = await getCatalog();
  const normMod = normalizeText(nomeModelo);

  // 1. Verifica match exato no índice de modelos conhecidos
  const exactBrands = modelToBrands.get(normMod);
  if (exactBrands && exactBrands.size === 1) {
    return Array.from(exactBrands)[0];
  }

  // 2. Verifica pelas assinaturas exclusivas de linha (ex: Redmi -> Xiaomi, Galaxy -> Samsung, iPhone -> Apple)
  for (const { brand, regex } of BRAND_EXCLUSIVE_PATTERNS) {
    if (regex.test(nomeModelo)) {
      return brand;
    }
  }

  return exactBrands && exactBrands.size > 0 ? Array.from(exactBrands)[0] : null;
};

/**
 * Valida se a marca e o modelo informados são compatíveis entre si
 */
const validarMarcaEModelo = async (nomeMarca, nomeModelo) => {
  if (!nomeMarca || !nomeModelo) {
    return { valido: false, erro: 'Marca e modelo são obrigatórios.' };
  }

  const mTrim = nomeMarca.trim();
  const modTrim = nomeModelo.trim();
  const normBrand = normalizeText(mTrim);
  const normMod = normalizeText(modTrim);

  const { modelosPorMarca, brandCanonical, modelToBrands } = await getCatalog();

  // Se o modelo já existe exatamente dentro da marca selecionada, é 100% válido
  const modelosDaMarca = modelosPorMarca.get(normBrand) || [];
  if (modelosDaMarca.some((m) => normalizeText(m) === normMod)) {
    return { valido: true };
  }

  // Verifica se o texto do modelo contém assinatura exclusiva de OUTRA fabricante (ex: "Redmi" em "Samsung")
  for (const { brand, regex } of BRAND_EXCLUSIVE_PATTERNS) {
    if (regex.test(modTrim) && normalizeText(brand) !== normBrand) {
      return {
        valido: false,
        marcaCorreta: brand,
        erro: `O modelo "${modTrim}" pertence à marca "${brand}", e não à marca "${mTrim}".`,
      };
    }
  }

  // Verifica se o modelo existe exclusivamente em outra marca do catálogo
  const owners = modelToBrands.get(normMod);
  if (owners && owners.size > 0) {
    const ownerList = Array.from(owners);
    const matchesSelected = ownerList.some((b) => normalizeText(b) === normBrand);
    if (!matchesSelected) {
      const marcaCorreta = brandCanonical.get(normalizeText(ownerList[0])) || ownerList[0];
      return {
        valido: false,
        marcaCorreta,
        erro: `O modelo "${modTrim}" pertence à marca "${marcaCorreta}", e não à marca "${mTrim}".`,
      };
    }
  }

  return { valido: true };
};

/**
 * Busca marcas cadastradas
 */
const buscarMarcasAPI = async (busca = '') => {
  const { marcas } = await getCatalog();
  if (!busca || !busca.trim()) return marcas;

  const q = normalizeText(busca);
  const scored = marcas
    .map((m) => {
      const normM = normalizeText(m);
      let score = 0;
      if (normM === q) score = 100;
      else if (normM.startsWith(q)) score = 90;
      else if (normM.includes(q)) score = 75;
      return { nome: m, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome, 'pt-BR'));

  return scored.map((item) => item.nome);
};

/**
 * Busca modelos:
 * - Se `marca` estiver informada: filtra ESTRITAMENTE os modelos daquela marca.
 * - Se `marca` estiver vazia: busca em TODAS as marcas e retorna `{ modelo, marca }`.
 */
const buscarModelosAPI = async (marca = '', busca = '') => {
  const { modelosPorMarca, brandCanonical } = await getCatalog();
  const hasMarca = Boolean(marca && marca.trim());
  const hasBusca = Boolean(busca && busca.trim());

  // ── Caso 1: Marca selecionada -> filtra estritamente dentro da marca ──
  if (hasMarca) {
    const brandKey = normalizeText(marca);
    const canonicalBrand = brandCanonical.get(brandKey) || marca.trim();
    const listaBase = modelosPorMarca.get(brandKey) || [];

    // Verifica se o usuário digitou um termo exclusivo de outra marca (ex: digitou "Redmi" com marca "Samsung")
    if (hasBusca) {
      for (const { brand, regex } of BRAND_EXCLUSIVE_PATTERNS) {
        if (regex.test(busca) && normalizeText(brand) !== brandKey) {
          return [];
        }
      }
    }

    if (!hasBusca) {
      return listaBase.slice(0, 60).map((mod) => ({ modelo: mod, marca: canonicalBrand }));
    }

    const scored = [];
    for (const mod of listaBase) {
      const score = scoreCandidate(mod, busca, canonicalBrand);
      if (score > 0) {
        scored.push({ modelo: mod, marca: canonicalBrand, score });
      }
    }

    scored.sort(
      (a, b) => b.score - a.score || a.modelo.localeCompare(b.modelo, 'pt-BR', { numeric: true })
    );

    return scored.slice(0, 30).map(({ modelo, marca: m }) => ({ modelo, marca: m }));
  }

  // ── Caso 2: Marca vazia -> busca em TODAS as marcas e retorna { modelo, marca } ──
  if (!hasBusca) {
    return [];
  }

  const scoredAll = [];
  for (const [bKey, listaModelos] of modelosPorMarca.entries()) {
    const canonicalBrand = brandCanonical.get(bKey);
    const isPriority = PRIORITY_BRANDS.has(bKey) ? 2 : 0;

    for (const mod of listaModelos) {
      const score = scoreCandidate(mod, busca, canonicalBrand);
      if (score > 0) {
        scoredAll.push({
          modelo: mod,
          marca: canonicalBrand,
          score: score + isPriority,
        });
      }
    }
  }

  scoredAll.sort(
    (a, b) => b.score - a.score || a.modelo.localeCompare(b.modelo, 'pt-BR', { numeric: true })
  );

  return scoredAll.slice(0, 30).map(({ modelo, marca: m }) => ({ modelo, marca: m }));
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
    const [marca] = await Marca.findOrCreate({
      where: { nome: mNome },
      defaults: { nome: mNome },
    });

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

    invalidateCatalogCache();
    return { marca, modelo };
  } catch (err) {
    console.error('[PhoneCatalogService] Erro ao garantir marca/modelo no banco:', err.message);
    return null;
  }
};

/**
 * Consulta no catálogo global por termo livre e retorna [{ brand, model }]
 */
const consultarAPIExterna = async (termoBusca) => {
  if (!termoBusca || !termoBusca.trim()) return [];
  const resultados = await buscarModelosAPI('', termoBusca.trim());
  return resultados.map((r) => ({ brand: r.marca, model: r.modelo }));
};

module.exports = {
  buscarMarcasAPI,
  buscarModelosAPI,
  garantirMarcaEModelo,
  consultarAPIExterna,
  detectarMarcaDoModelo,
  validarMarcaEModelo,
};
