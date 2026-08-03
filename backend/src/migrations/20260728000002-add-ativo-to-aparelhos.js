'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('aparelhos');
    if (!tableInfo.ativo) {
      await queryInterface.addColumn('aparelhos', 'ativo', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('aparelhos');
    if (tableInfo.ativo) {
      await queryInterface.removeColumn('aparelhos', 'ativo');
    }
  },
};
