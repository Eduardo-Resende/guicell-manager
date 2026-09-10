'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItemMovimentacao extends Model {
    static associate(models) {
      ItemMovimentacao.belongsTo(models.Movimentacao, { foreignKey: 'id_movimentacao', as: 'movimentacao' });
      ItemMovimentacao.belongsTo(models.Produto, { foreignKey: 'id_produto', as: 'produto' });
    }
  }

  ItemMovimentacao.init({
    id_item_movimentacao: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_movimentacao: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'movimentacao', key: 'id_movimentacao' },
    },
    id_produto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'produtos', key: 'id_produto' },
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valor_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      // Unifica: valor_unitario (venda/OS) e valor_custo_unitario (compra)
    },

    // ── Específico: Compras (itens_compra) ─────────────────────────
    descricao_item: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    valor_venda_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      // Sugestão de preço de venda registrada no momento da compra
    },
  }, {
    sequelize,
    modelName: 'ItemMovimentacao',
    tableName: 'itens_movimentacao',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  });

  return ItemMovimentacao;
};
