'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venda extends Model {
    static associate(models) {
      Venda.belongsTo(models.Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
      Venda.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'atendente' });
      Venda.hasMany(models.ItemVenda, { foreignKey: 'id_venda', as: 'itens' });
      Venda.hasMany(models.Caixa, { foreignKey: 'id_venda', as: 'movimentacoesCaixa' });
    }
  }

  Venda.init({
    id_venda: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'clientes', key: 'id_cliente' },
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    data_venda: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    forma_pagamento: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    desconto: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'Venda',
    tableName: 'vendas',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Venda;
};
