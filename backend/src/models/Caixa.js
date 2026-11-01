'use strict';
const { Model } = require('sequelize');

const imutavel = (acao) => () => {
  throw new Error(
    `Lançamentos financeiros não podem ser ${acao} após efetivados. Corrija por estorno ou ajuste identificado.`
  );
};

module.exports = (sequelize, DataTypes) => {
  /**
   * Lançamento principal do caixa (uma linha por operação: venda, compra, despesa, transferência, ajuste...).
   * O detalhamento de "de onde / por qual forma" fica nas pernas (CaixaPagamento), que são a base dos saldos.
   * Lançamentos são imutáveis: correções ocorrem por estorno (novo lançamento inverso) ou ajuste.
   */
  class Caixa extends Model {
    static associate(models) {
      Caixa.belongsTo(models.Usuario,       { foreignKey: 'id_usuario',       as: 'usuario' });
      Caixa.belongsTo(models.SessaoCaixa,   { foreignKey: 'id_sessao',        as: 'sessao' });
      Caixa.belongsTo(models.Movimentacao,  { foreignKey: 'id_movimentacao',  as: 'movimentacao' });
      Caixa.belongsTo(models.TransferenciaCaixa, { foreignKey: 'id_transferencia', as: 'transferencia' });
      Caixa.hasMany(models.CaixaPagamento,  { foreignKey: 'id_caixa',         as: 'pagamentos' });
      Caixa.belongsTo(models.Caixa,         { foreignKey: 'id_lancamento_origem', as: 'lancamentoOrigem' });
      Caixa.hasMany(models.Caixa,           { foreignKey: 'id_lancamento_origem', as: 'estornos' });
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
    // operacional: receitas/despesas reais. As demais naturezas têm tratamento próprio nos relatórios.
    natureza: {
      type: DataTypes.ENUM('operacional', 'transferencia', 'ajuste_conferencia', 'abertura', 'fechamento'),
      allowNull: false,
      defaultValue: 'operacional',
    },
    // venda | os | compra | manual | transferencia | conferencia_abertura | conferencia_fechamento | implantacao | sistema
    origem: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    // Fornecedor, cliente ou outra referência da operação
    favorecido: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    // true quando um recebimento/pagamento eletrônico foi registrado sem sessão de caixa aberta (auditado)
    fora_sessao: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    id_transferencia: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'transferencias_caixa', key: 'id_transferencia' },
    },
    // Preenchido nos estornos: aponta para o lançamento original que está sendo revertido
    id_lancamento_origem: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'caixa', key: 'id_caixa' },
    },
  }, {
    sequelize,
    modelName: 'Caixa',
    tableName: 'caixa',
    timestamps: false,
    hooks: {
      beforeUpdate: imutavel('alterados'),
      beforeDestroy: imutavel('excluídos'),
      beforeBulkUpdate: imutavel('alterados'),
      beforeBulkDestroy: imutavel('excluídos'),
    },
  });

  return Caixa;
};
