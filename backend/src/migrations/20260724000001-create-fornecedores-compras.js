'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabela: fornecedores
    await queryInterface.createTable('fornecedores', {
      id_fornecedor: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      cnpj: { type: Sequelize.STRING(18), allowNull: true, unique: true },
      telefone: { type: Sequelize.STRING(20), allowNull: true },
      email: { type: Sequelize.STRING(100), allowNull: true },
      endereco: { type: Sequelize.STRING(255), allowNull: true },
      contato: { type: Sequelize.STRING(100), allowNull: true },
      observacoes: { type: Sequelize.TEXT, allowNull: true },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // 2. Tabela: compras
    await queryInterface.createTable('compras', {
      id_compra: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_fornecedor: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'fornecedores', key: 'id_fornecedor' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      nome_fornecedor_avulso: { type: Sequelize.STRING(150), allowNull: true },
      data_compra: { type: Sequelize.DATEONLY, allowNull: false },
      valor_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      observacao: { type: Sequelize.TEXT, allowNull: true },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id_usuario' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // 3. Tabela: itens_compra
    await queryInterface.createTable('itens_compra', {
      id_item_compra: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_compra: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'compras', key: 'id_compra' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_produto: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'produtos', key: 'id_produto' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      descricao_item: { type: Sequelize.STRING(200), allowNull: false },
      quantidade: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      valor_custo_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      valor_venda_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('itens_compra');
    await queryInterface.dropTable('compras');
    await queryInterface.dropTable('fornecedores');
  },
};
