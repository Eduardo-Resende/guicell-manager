'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /** Localização financeira: Caixa (gaveta), Cofre ou Conta da loja (eletrônica). */
  class ContaFinanceira extends Model {
    static associate(models) {
      ContaFinanceira.hasMany(models.FormaPagamento, { foreignKey: 'id_conta', as: 'formas' });
    }
  }

  ContaFinanceira.init({
    id_conta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nome: { type: DataTypes.STRING(60), allowNull: false },
    tipo: { type: DataTypes.ENUM('fisica', 'eletronica'), allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    sequelize,
    modelName: 'ContaFinanceira',
    tableName: 'contas_financeiras',
    timestamps: false,
  });

  return ContaFinanceira;
};

