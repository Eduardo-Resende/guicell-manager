'use strict';
const { Model } = require('sequelize');

const imutavel = (acao) => () => {
  throw new Error(`Movimentações financeiras não podem ser ${acao} após efetivadas. Use estorno ou ajuste.`);
};

module.exports = (sequelize, DataTypes) => {
  /**
   * "Perna" financeira de um lançamento: quanto saiu/entrou, em qual conta e por qual forma de pagamento.
   * Uma despesa dividida (ex.: R$ 80 dinheiro + R$ 120 PIX) possui várias pernas sob um único lançamento.
   * Todos os saldos são calculados somando estas pernas.
   */
  class CaixaPagamento extends Model {
    static associate(models) {
      CaixaPagamento.belongsTo(models.Caixa, { foreignKey: 'id_caixa', as: 'lancamento' });
      CaixaPagamento.belongsTo(models.ContaFinanceira, { foreignKey: 'id_conta', as: 'conta' });
      CaixaPagamento.belongsTo(models.FormaPagamento, { foreignKey: 'id_forma', as: 'forma' });
      CaixaPagamento.belongsTo(models.SessaoCaixa, { foreignKey: 'id_sessao', as: 'sessao' });
    }
  }

  CaixaPagamento.init({
    id_caixa_pagamento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_caixa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'caixa', key: 'id_caixa' },
    },
    id_conta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'contas_financeiras', key: 'id_conta' },
    },
    id_forma: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'formas_pagamento', key: 'id_forma' },
    },
    tipo: { type: DataTypes.ENUM('entrada', 'saida'), allowNull: false },
    valor: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    data: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    id_sessao: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'sessoes_caixa', key: 'id_sessao' },
    },
  }, {
    sequelize,
    modelName: 'CaixaPagamento',
    tableName: 'caixa_pagamentos',
    timestamps: false,
    hooks: {
      beforeUpdate: imutavel('alteradas'),
      beforeDestroy: imutavel('excluídas'),
      beforeBulkUpdate: imutavel('alteradas'),
      beforeBulkDestroy: imutavel('excluídas'),
    },
  });

  return CaixaPagamento;
};

