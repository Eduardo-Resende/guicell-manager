'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * Transferência entre contas financeiras (ex.: gaveta → cofre).
   * Gera dois lançamentos (saída na origem e entrada no destino) que compartilham id_transferencia.
   * Nunca é receita nem despesa. Para desfazer, gera-se uma transferência inversa (id_transferencia_estornada).
   */
  class TransferenciaCaixa extends Model {
    static associate(models) {
      TransferenciaCaixa.belongsTo(models.ContaFinanceira, { foreignKey: 'id_conta_origem', as: 'contaOrigem' });
      TransferenciaCaixa.belongsTo(models.ContaFinanceira, { foreignKey: 'id_conta_destino', as: 'contaDestino' });
      TransferenciaCaixa.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
      TransferenciaCaixa.belongsTo(models.Usuario, { foreignKey: 'id_usuario_cancelamento', as: 'usuarioCancelamento' });
      TransferenciaCaixa.belongsTo(models.SessaoCaixa, { foreignKey: 'id_sessao', as: 'sessao' });
      TransferenciaCaixa.belongsTo(models.TransferenciaCaixa, { foreignKey: 'id_transferencia_estornada', as: 'transferenciaEstornada' });
      TransferenciaCaixa.hasMany(models.Caixa, { foreignKey: 'id_transferencia', as: 'lancamentos' });
    }
  }

  TransferenciaCaixa.init({
    id_transferencia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_conta_origem: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'contas_financeiras', key: 'id_conta' },
    },
    id_conta_destino: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'contas_financeiras', key: 'id_conta' },
    },
    valor: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    descricao: { type: DataTypes.STRING(200), allowNull: true },
    data_hora: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    id_usuario: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    id_sessao: {
      type: DataTypes.INTEGER, allowNull: true,
      references: { model: 'sessoes_caixa', key: 'id_sessao' },
    },
    status: { type: DataTypes.ENUM('efetivada', 'cancelada'), allowNull: false, defaultValue: 'efetivada' },
    id_transferencia_estornada: {
      type: DataTypes.INTEGER, allowNull: true,
      references: { model: 'transferencias_caixa', key: 'id_transferencia' },
    },
    motivo_cancelamento: { type: DataTypes.TEXT, allowNull: true },
    id_usuario_cancelamento: {
      type: DataTypes.INTEGER, allowNull: true,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    data_cancelamento: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'TransferenciaCaixa',
    tableName: 'transferencias_caixa',
    timestamps: false,
    hooks: {
      beforeDestroy: () => { throw new Error('Transferências efetivadas não podem ser excluídas. Cancele para gerar a movimentação inversa.'); },
      beforeBulkDestroy: () => { throw new Error('Transferências efetivadas não podem ser excluídas. Cancele para gerar a movimentação inversa.'); },
    },
  });

  return TransferenciaCaixa;
};

