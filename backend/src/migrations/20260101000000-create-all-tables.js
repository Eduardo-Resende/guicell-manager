'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabela: usuarios
    await queryInterface.createTable('usuarios', {
      id_usuario: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nome: { type: Sequelize.STRING(100), allowNull: false },
      login: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      senha_hash: { type: Sequelize.STRING(255), allowNull: false },
      perfil: { type: Sequelize.ENUM('Atendente', 'Técnico', 'Gerente'), allowNull: false },
      ativo: { type: Sequelize.BOOLEAN, defaultValue: true },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // 2. Tabela: clientes
    await queryInterface.createTable('clientes', {
      id_cliente: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nome: { type: Sequelize.STRING(100), allowNull: false },
      cpf_cnpj: { type: Sequelize.STRING(18), unique: true, allowNull: true },
      telefone: { type: Sequelize.STRING(20), allowNull: false },
      email: { type: Sequelize.STRING(100), allowNull: true },
      endereco: { type: Sequelize.STRING(200), allowNull: true },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // 3. Tabela: aparelhos
    await queryInterface.createTable('aparelhos', {
      id_aparelho: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_cliente: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'clientes', key: 'id_cliente' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      marca: { type: Sequelize.STRING(50), allowNull: false },
      modelo: { type: Sequelize.STRING(100), allowNull: false },
      imei: { type: Sequelize.STRING(20), unique: true, allowNull: true },
      observacoes: { type: Sequelize.TEXT, allowNull: true },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // 3.5. Tabela: categorias
    await queryInterface.createTable('categorias', {
      id_categoria: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nome: { type: Sequelize.STRING(100), allowNull: false },
      id_pai: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'categorias', key: 'id_categoria' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tipo_uso: {
        type: Sequelize.ENUM('Venda', 'OS', 'Ambos'),
        allowNull: false,
        defaultValue: 'Ambos',
      },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // 4. Tabela: produtos
    await queryInterface.createTable('produtos', {
      id_produto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      codigo_barras: { type: Sequelize.STRING(50), allowNull: true, unique: true },
      descricao: { type: Sequelize.STRING(200), allowNull: false },
      id_categoria: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'categorias', key: 'id_categoria' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      estoque_atual: { type: Sequelize.INTEGER, defaultValue: 0 },
      estoque_minimo: { type: Sequelize.INTEGER, defaultValue: 1 },
      valor_custo: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      valor_venda: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // 5. Tabela: ordens_servico
    await queryInterface.createTable('ordens_servico', {
      id_os: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      numero_os: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      id_cliente: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'clientes', key: 'id_cliente' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      id_aparelho: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'aparelhos', key: 'id_aparelho' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      id_tecnico: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'usuarios', key: 'id_usuario' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      defeito_relatado: { type: Sequelize.TEXT, allowNull: false },
      diagnostico: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('Aguardando', 'Em Reparo', 'Aguardando Peça', 'Concluído', 'Entregue', 'Cancelado'),
        allowNull: false, defaultValue: 'Aguardando',
      },
      valor_orcado: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      valor_final: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      forma_pagamento: { type: Sequelize.STRING(50), allowNull: true },
      data_abertura: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      data_fechamento: { type: Sequelize.DATE, allowNull: true },
      prazo_estimado: { type: Sequelize.DATEONLY, allowNull: true },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // 6. Tabela: itens_os
    await queryInterface.createTable('itens_os', {
      id_item_os: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_os: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ordens_servico', key: 'id_os' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      id_produto: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'produtos', key: 'id_produto' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      quantidade: { type: Sequelize.INTEGER, allowNull: false },
      valor_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    });

    // 7. Tabela: vendas
    await queryInterface.createTable('vendas', {
      id_venda: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_cliente: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'clientes', key: 'id_cliente' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      id_usuario: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'usuarios', key: 'id_usuario' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      data_venda: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      valor_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      forma_pagamento: { type: Sequelize.STRING(50), allowNull: false },
      desconto: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // 8. Tabela: itens_venda
    await queryInterface.createTable('itens_venda', {
      id_item_venda: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_venda: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'vendas', key: 'id_venda' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      id_produto: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'produtos', key: 'id_produto' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      quantidade: { type: Sequelize.INTEGER, allowNull: false },
      valor_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    });

    // 9. Tabela: caixa
    await queryInterface.createTable('caixa', {
      id_caixa: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_usuario: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'usuarios', key: 'id_usuario' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      data: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      tipo: { type: Sequelize.ENUM('entrada', 'saida'), allowNull: false },
      valor: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      descricao: { type: Sequelize.STRING(200), allowNull: false },
      categoria: { type: Sequelize.STRING(50), allowNull: true },
      id_os: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'ordens_servico', key: 'id_os' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      id_venda: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'vendas', key: 'id_venda' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
    });
  },

  async down(queryInterface) {
    // Drop in reverse FK dependency order
    await queryInterface.dropTable('caixa');
    await queryInterface.dropTable('itens_venda');
    await queryInterface.dropTable('vendas');
    await queryInterface.dropTable('itens_os');
    await queryInterface.dropTable('ordens_servico');
    await queryInterface.dropTable('produtos');
    await queryInterface.dropTable('categorias');
    await queryInterface.dropTable('aparelhos');
    await queryInterface.dropTable('clientes');
    await queryInterface.dropTable('usuarios');
  },
};
