'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      Usuario.hasMany(models.Movimentacao, { foreignKey: 'id_usuario', as: 'movimentacoes' });
      Usuario.hasMany(models.Caixa, { foreignKey: 'id_usuario', as: 'movimentacoesCaixa' });
      Usuario.hasOne(models.Permissao, { foreignKey: 'id_usuario', as: 'permissaoCustomizada' });
    }
  }

  Usuario.init({
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    login: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    senha_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    perfil: {
      type: DataTypes.ENUM('Atendente', 'Técnico', 'Gerente'),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    recuperacao_codigo: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    recuperacao_expira: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Usuario;
};
