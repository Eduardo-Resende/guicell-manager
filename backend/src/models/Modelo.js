'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Modelo extends Model {
    static associate(models) {
      Modelo.belongsTo(models.Marca, { foreignKey: 'id_marca', as: 'marca' });
    }
  }

  Modelo.init(
    {
      id_modelo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_marca: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'marcas', key: 'id_marca' },
      },
      nome: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Modelo',
      tableName: 'modelos',
      timestamps: true,
      createdAt: 'criado_em',
      updatedAt: 'atualizado_em',
    }
  );

  return Modelo;
};
