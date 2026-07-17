'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItemVenda extends Model {
    static associate(models) {
      ItemVenda.belongsTo(models.Venda, { foreignKey: 'id_venda', as: 'venda' });
      ItemVenda.belongsTo(models.Produto, { foreignKey: 'id_produto', as: 'produto' });
    }
  }

  ItemVenda.init({
    id_item_venda: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_venda: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vendas', key: 'id_venda' },
    },
    id_produto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'produtos', key: 'id_produto' },
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valor_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'ItemVenda',
    tableName: 'itens_venda',
    timestamps: false,
  });

  return ItemVenda;
};
