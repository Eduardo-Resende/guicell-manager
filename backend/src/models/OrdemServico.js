'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrdemServico extends Model {
    static associate(models) {
      OrdemServico.belongsTo(models.Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
      OrdemServico.belongsTo(models.Aparelho, { foreignKey: 'id_aparelho', as: 'aparelho' });
      OrdemServico.belongsTo(models.Usuario, { foreignKey: 'id_tecnico', as: 'tecnico' });
      OrdemServico.hasMany(models.ItemOS, { foreignKey: 'id_os', as: 'itens' });
      OrdemServico.hasMany(models.Caixa, { foreignKey: 'id_os', as: 'movimentacoesCaixa' });
    }
  }

  OrdemServico.init({
    id_os: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    numero_os: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'clientes', key: 'id_cliente' },
    },
    id_aparelho: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'aparelhos', key: 'id_aparelho' },
    },
    id_tecnico: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    defeito_relatado: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    diagnostico: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        'Aguardando',
        'Em Reparo',
        'Aguardando Peça',
        'Concluído',
        'Entregue',
        'Cancelado'
      ),
      allowNull: false,
      defaultValue: 'Aguardando',
    },
    valor_orcado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    valor_final: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    forma_pagamento: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    data_abertura: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    data_fechamento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    prazo_estimado: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'OrdemServico',
    tableName: 'ordens_servico',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return OrdemServico;
};
