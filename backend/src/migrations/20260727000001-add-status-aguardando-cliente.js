'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // MySQL: reescrever o ENUM completo com os novos valores
    await queryInterface.changeColumn('ordens_servico', 'status', {
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
      allowNull: false,
      defaultValue: 'Aguardando Diagnóstico',
    });
    // Migrar registros antigos com status 'Aguardando' para 'Aguardando Diagnóstico'
    await queryInterface.sequelize.query(
      "UPDATE ordens_servico SET status = 'Aguardando Diagnóstico' WHERE status = 'Aguardando'"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('ordens_servico', 'status', {
      type: Sequelize.ENUM(
        'Aguardando',
        'Em Reparo',
        'Aguardando Peça',
        'Concluído',
        'Entregue',
        'Cancelado'
      ),
      allowNull: false,
      defaultValue: 'Aguardando',
    });
    await queryInterface.sequelize.query(
      "UPDATE ordens_servico SET status = 'Aguardando' WHERE status = 'Aguardando Diagnóstico'"
    );
  }
};
