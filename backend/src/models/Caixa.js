'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Caixa extends Model {
    static associate(models) {
      Caixa.belongsTo(models.Usuario,       { foreignKey: 'id_usuario',       as: 'usuario' });
      Caixa.belongsTo(models.SessaoCaixa,   { foreignKey: 'id_sessao',        as: 'sessao' });
      Caixa.belongsTo(models.Movimentacao,  { foreignKey: 'id_movimentacao',  as: 'movimentacao' });
    }
  }

  Caixa.init({
    id_caixa: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    data: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    tipo: {
      type: DataTypes.ENUM('entrada', 'saida'),
      allowNull: false,
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    descricao: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    id_movimentacao: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'movimentacao', key: 'id_movimentacao' },
    },
    id_sessao: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'sessoes_caixa', key: 'id_sessao' },
    },
  }, {
    sequelize,
    modelName: 'Caixa',
    tableName: 'caixa',
    timestamps: false,
  });

  return Caixa;
};
