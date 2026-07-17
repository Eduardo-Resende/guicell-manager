'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Caixa extends Model {
    static associate(models) {
      Caixa.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
      Caixa.belongsTo(models.OrdemServico, { foreignKey: 'id_os', as: 'ordemServico' });
      Caixa.belongsTo(models.Venda, { foreignKey: 'id_venda', as: 'venda' });
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
    id_os: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'ordens_servico', key: 'id_os' },
    },
    id_venda: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'vendas', key: 'id_venda' },
    },
  }, {
    sequelize,
    modelName: 'Caixa',
    tableName: 'caixa',
    timestamps: false,
  });

  return Caixa;
};
