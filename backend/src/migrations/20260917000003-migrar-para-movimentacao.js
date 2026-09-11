'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Adicionar id_movimentacao em caixa (vínculo com a nova tabela)
    await queryInterface.addColumn('caixa', 'id_movimentacao', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'movimentacao', key: 'id_movimentacao' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 2. Remover FKs antigas de caixa antes de dropar as tabelas
    // MySQL exige remoção explícita das FK constraints antes de dropar colunas/tabelas
    const [rows] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'caixa'
        AND COLUMN_NAME IN ('id_os', 'id_venda')
        AND CONSTRAINT_NAME != 'PRIMARY'
    `);

    for (const row of rows) {
      await queryInterface.sequelize.query(
        `ALTER TABLE caixa DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``
      );
    }

    // 3. Remover colunas antigas de caixa
    const caixaInfo = await queryInterface.describeTable('caixa');
    if (caixaInfo.id_os)    await queryInterface.removeColumn('caixa', 'id_os');
    if (caixaInfo.id_venda) await queryInterface.removeColumn('caixa', 'id_venda');

    // 4. Dropar tabelas de itens primeiro (FKs filhas)
    const tables = await queryInterface.showAllTables();
    if (tables.includes('itens_os'))    await queryInterface.dropTable('itens_os');
    if (tables.includes('itens_venda')) await queryInterface.dropTable('itens_venda');
    if (tables.includes('itens_compra')) await queryInterface.dropTable('itens_compra');

    // 5. Dropar tabelas pai
    if (tables.includes('ordens_servico')) await queryInterface.dropTable('ordens_servico');
    if (tables.includes('vendas'))         await queryInterface.dropTable('vendas');
    if (tables.includes('compras'))        await queryInterface.dropTable('compras');
  },

  async down(queryInterface, Sequelize) {
    // Recria as tabelas antigas (estrutura mínima para rollback)
    await queryInterface.createTable('compras', {
      id_compra:              { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_fornecedor:          { type: Sequelize.INTEGER, allowNull: true  },
      nome_fornecedor_avulso: { type: Sequelize.STRING(150), allowNull: true },
      data_compra:            { type: Sequelize.DATEONLY, allowNull: false },
      valor_total:            { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      observacao:             { type: Sequelize.TEXT, allowNull: true },
      id_usuario:             { type: Sequelize.INTEGER, allowNull: false },
      criado_em:              { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.createTable('itens_compra', {
      id_item_compra:       { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_compra:            { type: Sequelize.INTEGER, allowNull: false },
      id_produto:           { type: Sequelize.INTEGER, allowNull: true },
      descricao_item:       { type: Sequelize.STRING(200), allowNull: false },
      quantidade:           { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      valor_custo_unitario: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      valor_venda_unitario: { type: Sequelize.DECIMAL(10,2), allowNull: true },
      criado_em:            { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.createTable('vendas', {
      id_venda:        { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_cliente:      { type: Sequelize.INTEGER, allowNull: true  },
      id_usuario:      { type: Sequelize.INTEGER, allowNull: false },
      data_venda:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      valor_total:     { type: Sequelize.DECIMAL(10,2), allowNull: false },
      forma_pagamento: { type: Sequelize.STRING(50), allowNull: false },
      desconto:        { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      status:          { type: Sequelize.ENUM('pago','pendente'), allowNull: false, defaultValue: 'pago' },
      criado_em:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.createTable('itens_venda', {
      id_item_venda:  { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_venda:       { type: Sequelize.INTEGER, allowNull: false },
      id_produto:     { type: Sequelize.INTEGER, allowNull: false },
      quantidade:     { type: Sequelize.INTEGER, allowNull: false },
      valor_unitario: { type: Sequelize.DECIMAL(10,2), allowNull: false },
    });
    await queryInterface.createTable('ordens_servico', {
      id_os:            { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      numero_os:        { type: Sequelize.STRING(20), allowNull: false, unique: true },
      id_cliente:       { type: Sequelize.INTEGER, allowNull: false },
      id_aparelho:      { type: Sequelize.INTEGER, allowNull: false },
      id_tecnico:       { type: Sequelize.INTEGER, allowNull: true  },
      defeito_relatado: { type: Sequelize.TEXT, allowNull: false },
      diagnostico:      { type: Sequelize.TEXT, allowNull: true },
      status:           { type: Sequelize.ENUM('Aguardando','Aguardando Diagnóstico','Aguardando Cliente','Em Reparo','Aguardando Peça','Concluído','Entregue','Cancelado'), allowNull: false, defaultValue: 'Aguardando Diagnóstico' },
      valor_orcado:     { type: Sequelize.DECIMAL(10,2), allowNull: true },
      valor_final:      { type: Sequelize.DECIMAL(10,2), allowNull: true },
      forma_pagamento:  { type: Sequelize.STRING(50), allowNull: true },
      status_pagamento: { type: Sequelize.ENUM('pago','pendente'), allowNull: false, defaultValue: 'pago' },
      data_abertura:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      data_fechamento:  { type: Sequelize.DATE, allowNull: true },
      prazo_estimado:   { type: Sequelize.DATEONLY, allowNull: true },
      criado_em:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      atualizado_em:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.createTable('itens_os', {
      id_item_os:     { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_os:          { type: Sequelize.INTEGER, allowNull: false },
      id_produto:     { type: Sequelize.INTEGER, allowNull: false },
      quantidade:     { type: Sequelize.INTEGER, allowNull: false },
      valor_unitario: { type: Sequelize.DECIMAL(10,2), allowNull: false },
    });

    // Restaurar colunas de caixa
    await queryInterface.addColumn('caixa', 'id_os',    { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('caixa', 'id_venda', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.removeColumn('caixa', 'id_movimentacao');
  },
};
