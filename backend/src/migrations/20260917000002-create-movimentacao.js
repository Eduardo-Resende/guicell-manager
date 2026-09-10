'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabela: movimentacao
    // Futura substituta unificada de: compras, vendas e ordens_servico.
    // O campo 'origem' diferencia qual módulo gerou o registro.
    await queryInterface.createTable('movimentacao', {
      id_movimentacao: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      origem: {
        type: Sequelize.ENUM('os', 'venda', 'compra'),
        allowNull: false,
      },

      // ── Campos em Comum ──────────────────────────────────────────
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id_usuario' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      data_movimentacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      valor_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      forma_pagamento: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      status_pagamento: {
        type: Sequelize.ENUM('pago', 'pendente'),
        allowNull: true,
      },
      observacao: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      // ── Específico: Vendas e OS ───────────────────────────────────
      id_cliente: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'clientes', key: 'id_cliente' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      desconto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },

      // ── Específico: Compras ───────────────────────────────────────
      id_fornecedor: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'fornecedores', key: 'id_fornecedor' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      nome_fornecedor_avulso: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },

      // ── Específico: OS ────────────────────────────────────────────
      numero_os: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      id_aparelho: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'aparelhos', key: 'id_aparelho' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_tecnico: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id_usuario' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      defeito_relatado: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      diagnostico: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status_os: {
        type: Sequelize.ENUM(
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
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      data_fechamento: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      prazo_estimado: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
    });

    // 2. Tabela: itens_movimentacao
    // Futura substituta unificada de: itens_os, itens_venda e itens_compra.
    await queryInterface.createTable('itens_movimentacao', {
      id_item_movimentacao: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_movimentacao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'movimentacao', key: 'id_movimentacao' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_produto: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'produtos', key: 'id_produto' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantidade: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      valor_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      // ── Específico: Compras (itens_compra) ───────────────────────
      descricao_item: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      valor_venda_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('itens_movimentacao');
    await queryInterface.dropTable('movimentacao');
  },
};
