'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Marca extends Model {
    static associate(models) {
      Marca.hasMany(models.Modelo, { foreignKey: 'id_marca', as: 'modelos' });
    }
  }

  Marca.init(
    {
      id_marca: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'Marca',
      tableName: 'marcas',
      timestamps: true,
      createdAt: 'criado_em',
      updatedAt: 'atualizado_em',
    }
  );

  return Marca;
};
