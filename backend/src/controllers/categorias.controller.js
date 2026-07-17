const { Categoria, Produto } = require('../models');
const { Op } = require('sequelize');

const listar = async (req, res) => {
  try {
    const { hierarquico } = req.query;
    
    if (hierarquico === 'true') {
      const categorias = await Categoria.findAll({
        where: { id_pai: null },
        include: [
          {
            model: Categoria,
            as: 'subcategorias',
            order: [['nome', 'ASC']],
          }
        ],
        order: [['nome', 'ASC']],
      });
      return res.json(categorias);
    } else {
      const categorias = await Categoria.findAll({
        include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }],
        order: [['nome', 'ASC']],
      });
      return res.json(categorias);
    }
  } catch (err) {
    console.error('[Categorias] Erro ao listar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, id_pai, tipo_uso } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }
    
    let finalTipoUso = tipo_uso || 'Ambos';
    if (id_pai) {
      const pai = await Categoria.findByPk(id_pai);
      if (!pai) {
        return res.status(404).json({ error: 'Categoria pai não encontrada.' });
      }
      if (!tipo_uso) {
        finalTipoUso = pai.tipo_uso; // Herdar do pai se não informado
      }
    }

    const categoria = await Categoria.create({ nome, id_pai: id_pai || null, tipo_uso: finalTipoUso });
    return res.status(201).json(categoria);
  } catch (err) {
    console.error('[Categorias] Erro ao criar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { nome, id_pai, tipo_uso } = req.body;
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    if (id_pai) {
      if (parseInt(id_pai) === parseInt(id)) {
        return res.status(400).json({ error: 'Uma categoria não pode ser pai de si mesma.' });
      }
      const paiExists = await Categoria.findByPk(id_pai);
      if (!paiExists) {
        return res.status(404).json({ error: 'Categoria pai não encontrada.' });
      }
    }

    const oldTipoUso = categoria.tipo_uso;

    await categoria.update({
      nome: nome !== undefined ? nome : categoria.nome,
      id_pai: id_pai !== undefined ? (id_pai || null) : categoria.id_pai,
      tipo_uso: tipo_uso !== undefined ? tipo_uso : categoria.tipo_uso
    });

    if (tipo_uso && tipo_uso !== oldTipoUso) {
      // Cascatear tipo_uso para todas as subcategorias
      await Categoria.update(
        { tipo_uso: tipo_uso },
        { where: { id_pai: categoria.id_categoria } }
      );
    }

    return res.json(categoria);
  } catch (err) {
    console.error('[Categorias] Erro ao atualizar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const remover = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByPk(id, {
      include: [{ model: Categoria, as: 'subcategorias' }]
    });

    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    // Obter IDs de todas as subcategorias para verificar se há produtos vinculados
    const subcategoriasIds = categoria.subcategorias.map(s => s.id_categoria);
    const allIdsToCheck = [categoria.id_categoria, ...subcategoriasIds];

    // Verificar se há produtos vinculados a esta categoria ou subcategorias
    const produtosVinculados = await Produto.count({
      where: {
        id_categoria: {
          [Op.in]: allIdsToCheck
        }
      }
    });

    if (produtosVinculados > 0) {
      return res.status(400).json({
        error: 'Não é possível excluir esta categoria porque há produtos vinculados a ela ou às suas subcategorias.'
      });
    }

    // Se tiver subcategorias, vamos excluí-las ou avisar. O CASCADE no banco apagaria as subcategorias, mas vamos verificar por segurança
    if (categoria.subcategorias.length > 0) {
      // Exclui subcategorias primeiro
      await Categoria.destroy({
        where: {
          id_categoria: { [Op.in]: subcategoriasIds }
        }
      });
    }

    await categoria.destroy();
    return res.status(204).send();
  } catch (err) {
    console.error('[Categorias] Erro ao remover:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listar, criar, atualizar, remover };
