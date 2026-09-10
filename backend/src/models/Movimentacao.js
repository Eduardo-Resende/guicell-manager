'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Movimentacao extends Model {
    static associate(models) {
      // Comum a todos os tipos
      Movimentacao.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
      Movimentacao.hasMany(models.ItemMovimentacao, { foreignKey: 'id_movimentacao', as: 'itens' });

      // Vendas e OS
      Movimentacao.belongsTo(models.Cliente, { foreignKey: 'id_cliente', as: 'cliente' });

      // Compras
      Movimentacao.belongsTo(models.Fornecedor, { foreignKey: 'id_fornecedor', as: 'fornecedor' });

      // OS
      Movimentacao.belongsTo(models.Aparelho, { foreignKey: 'id_aparelho', as: 'aparelho' });
      Movimentacao.belongsTo(models.Usuario, { foreignKey: 'id_tecnico', as: 'tecnico' });
    }
  }

  Movimentacao.init({
    id_movimentacao: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    origem: {
      type: DataTypes.ENUM('os', 'venda', 'compra'),
      allowNull: false,
      // Identifica de qual módulo partiu a transação
    },

    // ── Campos em Comum ────────────────────────────────────────────
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    data_movimentacao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      // Unifica: data_venda (vendas), data_compra (compras), data_abertura (OS)
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      // Unifica: valor_total (venda/compra) e valor_final (OS)
    },
    forma_pagamento: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status_pagamento: {
      type: DataTypes.ENUM('pago', 'pendente'),
      allowNull: true,
      // Unifica: status (vendas) e status_pagamento (OS)
    },
    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // ── Específico: Vendas e OS ────────────────────────────────────
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'clientes', key: 'id_cliente' },
    },
    desconto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },

    // ── Específico: Compras ────────────────────────────────────────
    id_fornecedor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'fornecedores', key: 'id_fornecedor' },
    },
    nome_fornecedor_avulso: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    // ── Específico: OS ─────────────────────────────────────────────
    numero_os: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    id_aparelho: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'aparelhos', key: 'id_aparelho' },
    },
    id_tecnico: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'usuarios', key: 'id_usuario' },
    },
    defeito_relatado: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnostico: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status_os: {
      type: DataTypes.ENUM(
        'Aguardando',
        'Aguardando Diagnóstico',
        'Aguardando Cliente',
        'Em Reparo',
        'Aguardando Peça',
        'Concluído',
        'Entregue',
        'Cancelado'
      ),
      allowNull: true,
    },
    valor_orcado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    data_fechamento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    prazo_estimado: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Movimentacao',
    tableName: 'movimentacao',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Movimentacao;
};
