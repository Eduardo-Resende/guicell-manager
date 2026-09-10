'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SessaoCaixa extends Model {
    static associate(models) {
      SessaoCaixa.belongsTo(models.Usuario, { foreignKey: 'id_usuario_abertura', as: 'usuarioAbertura' });
      SessaoCaixa.belongsTo(models.Usuario, { foreignKey: 'id_usuario_fechamento', as: 'usuarioFechamento' });
      SessaoCaixa.hasMany(models.Caixa, { foreignKey: 'id_sessao', as: 'movimentacoes' });
    }
  }

  SessaoCaixa.init({
    id_sessao: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario_abertura: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    data_abertura: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    valor_abertura: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    data_fechamento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    valor_contado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    valor_sistema: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    diferenca: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    id_usuario_fechamento: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    status: {
      type: DataTypes.ENUM('aberto', 'fechado'),
      allowNull: false,
      defaultValue: 'aberto',
    },
    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'SessaoCaixa',
    tableName: 'sessoes_caixa',
    timestamps: false,
  });

  return SessaoCaixa;
};
