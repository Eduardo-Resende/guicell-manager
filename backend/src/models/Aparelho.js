'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Aparelho extends Model {
    static associate(models) {
      Aparelho.belongsTo(models.Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
      Aparelho.hasMany(models.OrdemServico, { foreignKey: 'id_aparelho', as: 'ordensServico' });
    }
  }

  Aparelho.init({
    id_aparelho: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'clientes', key: 'id_cliente' },
    },
    marca: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    modelo: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    imei: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true,
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'Aparelho',
    tableName: 'aparelhos',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Aparelho;
};
