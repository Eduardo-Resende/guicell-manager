'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItemOS extends Model {
    static associate(models) {
      ItemOS.belongsTo(models.OrdemServico, { foreignKey: 'id_os', as: 'ordemServico' });
      ItemOS.belongsTo(models.Produto, { foreignKey: 'id_produto', as: 'produto' });
    }
  }

  ItemOS.init({
    id_item_os: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_os: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'ordens_servico', key: 'id_os' },
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
    modelName: 'ItemOS',
    tableName: 'itens_os',
    timestamps: false,
  });

  return ItemOS;
};
