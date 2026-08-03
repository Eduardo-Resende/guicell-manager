'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ordens_servico', 'status_pagamento', {
      type: Sequelize.ENUM('pago', 'pendente'),
      allowNull: false,
      defaultValue: 'pago',
      after: 'forma_pagamento',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ordens_servico', 'status_pagamento');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_ordens_servico_status_pagamento;");
  },
};
