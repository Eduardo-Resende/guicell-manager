'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('vendas', 'status', {
      type: Sequelize.ENUM('pago', 'pendente'),
      allowNull: false,
      defaultValue: 'pago',
      after: 'desconto',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('vendas', 'status');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_vendas_status;");
  },
};
