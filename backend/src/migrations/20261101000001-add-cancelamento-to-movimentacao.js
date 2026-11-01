'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Expandir ENUM de status_pagamento para incluir 'cancelado'
    await queryInterface.changeColumn('movimentacao', 'status_pagamento', {
      type: Sequelize.ENUM('pago', 'pendente', 'cancelado'),
      allowNull: true,
    });

    // 2. Adicionar coluna motivo_cancelamento na tabela movimentacao
    const tableDesc = await queryInterface.describeTable('movimentacao');
    if (!tableDesc.motivo_cancelamento) {
      await queryInterface.addColumn('movimentacao', 'motivo_cancelamento', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // 3. Atualizar compras antigas sem status_pagamento para 'pago'
    await queryInterface.sequelize.query(
      "UPDATE movimentacao SET status_pagamento = 'pago' WHERE origem = 'compra' AND status_pagamento IS NULL;"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "UPDATE movimentacao SET status_pagamento = NULL WHERE status_pagamento = 'cancelado';"
    );
    const tableDesc = await queryInterface.describeTable('movimentacao');
    if (tableDesc.motivo_cancelamento) {
      await queryInterface.removeColumn('movimentacao', 'motivo_cancelamento');
    }
    await queryInterface.changeColumn('movimentacao', 'status_pagamento', {
      type: Sequelize.ENUM('pago', 'pendente'),
      allowNull: true,
    });
  },
};

