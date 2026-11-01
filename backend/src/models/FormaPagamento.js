'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /** Forma de pagamento (Dinheiro, PIX, Cartão de débito/crédito) e a conta financeira padrão associada. */
  class FormaPagamento extends Model {
    static associate(models) {
      FormaPagamento.belongsTo(models.ContaFinanceira, { foreignKey: 'id_conta', as: 'conta' });
    }
  }

  FormaPagamento.init({
    id_forma: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    nome: { type: DataTypes.STRING(60), allowNull: false },
    id_conta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'contas_financeiras', key: 'id_conta' },
    },
    ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    sequelize,
    modelName: 'FormaPagamento',
    tableName: 'formas_pagamento',
    timestamps: false,
  });

  return FormaPagamento;
};

