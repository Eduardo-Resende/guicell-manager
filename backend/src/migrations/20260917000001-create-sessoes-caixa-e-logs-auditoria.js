'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabela: sessoes_caixa
    // Cada registro representa um "dia de caixa" aberto por um funcionário,
    // com controle formal de abertura, fechamento, valor contado e diferença.
    await queryInterface.createTable('sessoes_caixa', {
      id_sessao: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_usuario_abertura: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id_usuario' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      data_abertura: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      valor_abertura: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      data_fechamento: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      valor_contado: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      valor_sistema: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      diferenca: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      id_usuario_fechamento: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id_usuario' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('aberto', 'fechado'),
        allowNull: false,
        defaultValue: 'aberto',
      },
      observacao: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });

    // 2. Adiciona id_sessao na tabela caixa para vincular cada movimentação à sessão do dia
    await queryInterface.addColumn('caixa', 'id_sessao', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'sessoes_caixa', key: 'id_sessao' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 3. Tabela: logs_auditoria
    // Registra automaticamente toda ação crítica (cancelamentos, fechamentos, edições),
    // com estado antes/depois do registro e o IP de origem.
    await queryInterface.createTable('logs_auditoria', {
      id_log: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id_usuario' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      acao: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      entidade: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      id_registro: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      dados_anteriores: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      dados_posteriores: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      data_hora: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      ip_origem: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('logs_auditoria');
    await queryInterface.removeColumn('caixa', 'id_sessao');
    await queryInterface.dropTable('sessoes_caixa');
  },
};
