'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('usuarios');

    if (!tableInfo.email) {
      await queryInterface.addColumn('usuarios', 'email', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!tableInfo.telefone) {
      await queryInterface.addColumn('usuarios', 'telefone', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }

    if (!tableInfo.recuperacao_codigo) {
      await queryInterface.addColumn('usuarios', 'recuperacao_codigo', {
        type: Sequelize.STRING(10),
        allowNull: true,
      });
    }

    if (!tableInfo.recuperacao_expira) {
      await queryInterface.addColumn('usuarios', 'recuperacao_expira', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('usuarios');

    if (tableInfo.recuperacao_expira) {
      await queryInterface.removeColumn('usuarios', 'recuperacao_expira');
    }
    if (tableInfo.recuperacao_codigo) {
      await queryInterface.removeColumn('usuarios', 'recuperacao_codigo');
    }
    if (tableInfo.telefone) {
      await queryInterface.removeColumn('usuarios', 'telefone');
    }
    if (tableInfo.email) {
      await queryInterface.removeColumn('usuarios', 'email');
    }
  },
};

