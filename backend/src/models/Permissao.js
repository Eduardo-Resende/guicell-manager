'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Permissao extends Model {
    static associate(models) {
      Permissao.belongsTo(models.Usuario, {
        foreignKey: 'id_usuario',
        as: 'usuario',
      });
    }
  }

  Permissao.init({
    id_permissao: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    perfil: {
      type: DataTypes.ENUM('Gerente', 'Atendente', 'Técnico'),
      allowNull: true,
      unique: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
    regras: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Permissao',
    tableName: 'permissoes',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Permissao;
};

