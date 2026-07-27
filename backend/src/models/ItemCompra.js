'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItemCompra extends Model {
    static associate(models) {
      ItemCompra.belongsTo(models.Compra, { foreignKey: 'id_compra', as: 'compra' });
      ItemCompra.belongsTo(models.Produto, { foreignKey: 'id_produto', as: 'produto' });
    }
  }

  ItemCompra.init({
    id_item_compra: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_compra: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_produto: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    descricao_item: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    valor_custo_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    valor_venda_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'ItemCompra',
    tableName: 'itens_compra',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  });

  return ItemCompra;
};
