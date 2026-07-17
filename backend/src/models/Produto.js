'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Produto extends Model {
    static associate(models) {
      Produto.hasMany(models.ItemOS, { foreignKey: 'id_produto', as: 'itensOS' });
      Produto.hasMany(models.ItemVenda, { foreignKey: 'id_produto', as: 'itensVenda' });
      Produto.belongsTo(models.Categoria, { foreignKey: 'id_categoria', as: 'categoriaRef' });
    }
  }

  Produto.init({
    id_produto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo_barras: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    descricao: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    id_categoria: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estoque_atual: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    estoque_minimo: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    valor_custo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    valor_venda: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Produto',
    tableName: 'produtos',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Produto;
};
