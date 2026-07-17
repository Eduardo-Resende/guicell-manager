'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cliente extends Model {
    static associate(models) {
      Cliente.hasMany(models.Aparelho, { foreignKey: 'id_cliente', as: 'aparelhos' });
      Cliente.hasMany(models.OrdemServico, { foreignKey: 'id_cliente', as: 'ordensServico' });
      Cliente.hasMany(models.Venda, { foreignKey: 'id_cliente', as: 'vendas' });
    }
  }

  Cliente.init({
    id_cliente: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cpf_cnpj: {
      type: DataTypes.STRING(18),
      unique: true,
      allowNull: true,
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    endereco: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Cliente',
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Cliente;
};
