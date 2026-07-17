'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Categoria extends Model {
    static associate(models) {
      Categoria.belongsTo(models.Categoria, { as: 'pai', foreignKey: 'id_pai' });
      Categoria.hasMany(models.Categoria, { as: 'subcategorias', foreignKey: 'id_pai' });
      Categoria.hasMany(models.Produto, { as: 'produtos', foreignKey: 'id_categoria' });
    }
  }

  Categoria.init({
    id_categoria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    id_pai: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tipo_uso: {
      type: DataTypes.ENUM('Venda', 'OS', 'Ambos'),
      allowNull: false,
      defaultValue: 'Ambos',
    },
  }, {
    sequelize,
    modelName: 'Categoria',
    tableName: 'categorias',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Categoria;
};
