'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Compra extends Model {
    static associate(models) {
      Compra.belongsTo(models.Fornecedor, { foreignKey: 'id_fornecedor', as: 'fornecedor' });
      Compra.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
      Compra.hasMany(models.ItemCompra, { foreignKey: 'id_compra', as: 'itens' });
    }
  }

  Compra.init({
    id_compra: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_fornecedor: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    nome_fornecedor_avulso: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    data_compra: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Compra',
    tableName: 'compras',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Compra;
};
