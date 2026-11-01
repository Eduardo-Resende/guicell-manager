'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SessaoCaixa extends Model {
    static associate(models) {
      SessaoCaixa.belongsTo(models.Usuario, { foreignKey: 'id_usuario_abertura', as: 'usuarioAbertura' });
      SessaoCaixa.belongsTo(models.Usuario, { foreignKey: 'id_usuario_fechamento', as: 'usuarioFechamento' });
      SessaoCaixa.belongsTo(models.Usuario, { foreignKey: 'id_usuario_autorizador_abertura', as: 'autorizadorAbertura' });
      SessaoCaixa.belongsTo(models.Usuario, { foreignKey: 'id_usuario_autorizador_fechamento', as: 'autorizadorFechamento' });
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

    // ── Conferência da abertura (esperado = valor contado no fechamento anterior) ──
    valor_esperado_abertura: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    diferenca_abertura:      { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    justificativa_abertura:  { type: DataTypes.TEXT, allowNull: true },
    id_usuario_autorizador_abertura: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    // true na primeiríssima abertura do sistema: o valor contado vira o saldo inicial da gaveta
    abertura_inicial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    // ── Conferência do fechamento ──
    justificativa_fechamento: { type: DataTypes.TEXT, allowNull: true },
    id_usuario_autorizador_fechamento: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'usuarios', key: 'id_usuario' },
    },

    // 1 enquanto a sessão está aberta, NULL quando fechada. O índice UNIQUE no banco garante
    // que nunca existam duas sessões abertas ao mesmo tempo.
    trava_aberta: { type: DataTypes.TINYINT, allowNull: true },
  }, {
    sequelize,
    modelName: 'SessaoCaixa',
    tableName: 'sessoes_caixa',
    timestamps: false,
  });

  return SessaoCaixa;
};
