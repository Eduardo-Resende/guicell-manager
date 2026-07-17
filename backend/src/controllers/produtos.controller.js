const { Produto, Categoria, sequelize } = require('../models');
const { Op } = require('sequelize');

const listar = async (req, res) => {
  try {
    const { categoria, id_categoria, tipo_uso, busca } = req.query;
    const where = {};

    if (id_categoria) {
      // Se for filtrado por ID, trazemos a própria categoria ou suas subcategorias caso seja uma categoria pai
      const cat = await Categoria.findByPk(id_categoria, {
        include: [{ model: Categoria, as: 'subcategorias' }]
      });
      if (cat) {
        const subIds = cat.subcategorias.map(s => s.id_categoria);
        where.id_categoria = { [Op.in]: [cat.id_categoria, ...subIds] };
      } else {
        where.id_categoria = id_categoria;
      }
    } else if (categoria) {
      // Filtragem retrocompatível por nome de categoria (ex: rápido para "Acessório" nas Vendas)
      const cat = await Categoria.findOne({
        where: { nome: categoria },
        include: [{ model: Categoria, as: 'subcategorias' }]
      });
      if (cat) {
        const subIds = cat.subcategorias.map(s => s.id_categoria);
        where.id_categoria = { [Op.in]: [cat.id_categoria, ...subIds] };
      } else {
        where.id_categoria = null;
      }
    } else if (tipo_uso) {
      // Filtrar produtos que pertençam a categorias com o tipo de uso adequado (ou Ambos)
      const matchingCats = await Categoria.findAll({
        where: {
          tipo_uso: { [Op.in]: [tipo_uso, 'Ambos'] }
        },
        attributes: ['id_categoria']
      });
      const catIds = matchingCats.map(c => c.id_categoria);
      where.id_categoria = { [Op.in]: catIds };
    }

    if (busca) {
      where[Op.or] = [
        { descricao: { [Op.like]: `%${busca}%` } },
        { codigo_barras: busca }
      ];
    }

    const produtos = await Produto.findAll({
      where,
      include: [
        {
          model: Categoria,
          as: 'categoriaRef',
          include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }]
        }
      ],
      order: [['descricao', 'ASC']]
    });
    return res.json(produtos);
  } catch (err) {
    console.error('[Produtos] Erro ao listar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const produto = await Produto.findByPk(req.params.id, {
      include: [
        {
          model: Categoria,
          as: 'categoriaRef',
          include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }]
        }
      ]
    });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado.' });
    return res.json(produto);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const criar = async (req, res) => {
  try {
    const { codigo_barras, descricao, id_categoria, estoque_atual, estoque_minimo, valor_custo, valor_venda } = req.body;
    if (!descricao || !valor_venda) {
      return res.status(400).json({ error: 'Descrição e valor de venda são obrigatórios.' });
    }
    const produto = await Produto.create({
      codigo_barras,
      descricao,
      id_categoria: id_categoria || null,
      estoque_atual,
      estoque_minimo,
      valor_custo,
      valor_venda
    });

    const createdProduto = await Produto.findByPk(produto.id_produto, {
      include: [
        {
          model: Categoria,
          as: 'categoriaRef',
          include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }]
        }
      ]
    });

    return res.status(201).json(createdProduto);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Código de barras já cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const atualizar = async (req, res) => {
  try {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado.' });
    await produto.update(req.body);

    const updatedProduto = await Produto.findByPk(produto.id_produto, {
      include: [
        {
          model: Categoria,
          as: 'categoriaRef',
          include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }]
        }
      ]
    });

    return res.json(updatedProduto);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const remover = async (req, res) => {
  try {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado.' });
    await produto.destroy();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// RF06: Registrar entrada manual no estoque
const registrarEntrada = async (req, res) => {
  try {
    const { quantidade } = req.body;
    if (!quantidade || quantidade <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que 0.' });
    }
    const produto = await Produto.findByPk(req.params.id, {
      include: [
        {
          model: Categoria,
          as: 'categoriaRef',
          include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }]
        }
      ]
    });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado.' });

    await produto.update({ estoque_atual: produto.estoque_atual + parseInt(quantidade) });
    return res.json({ message: 'Estoque atualizado.', produto });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// Listar produtos com alerta de estoque mínimo
const alertasEstoque = async (req, res) => {
  try {
    const produtos = await Produto.findAll({
      where: { estoque_atual: { [Op.lte]: sequelize.col('estoque_minimo') } },
      include: [
        {
          model: Categoria,
          as: 'categoriaRef',
          include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }]
        }
      ]
    });
    return res.json(produtos);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover, registrarEntrada, alertasEstoque };
