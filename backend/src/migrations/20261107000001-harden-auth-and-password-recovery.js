'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('usuarios');

    // 1. versao_sessao para revogação imediata de JWTs
    if (!tableInfo.versao_sessao) {
      await queryInterface.addColumn('usuarios', 'versao_sessao', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      });
    }

    // 2. recuperacao_tentativas para limitar tentativas de OTP (max 5)
    if (!tableInfo.recuperacao_tentativas) {
      await queryInterface.addColumn('usuarios', 'recuperacao_tentativas', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    // 3. recuperacao_solicitado_em para cooldown de reenvio
    if (!tableInfo.recuperacao_solicitado_em) {
      await queryInterface.addColumn('usuarios', 'recuperacao_solicitado_em', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // 4. recuperacao_grant_hash para token de alta entropia de uso único (SHA-256)
    if (!tableInfo.recuperacao_grant_hash) {
      await queryInterface.addColumn('usuarios', 'recuperacao_grant_hash', {
        type: Sequelize.STRING(64),
        allowNull: true,
      });
    }

    // 5. recuperacao_grant_expira
    if (!tableInfo.recuperacao_grant_expira) {
      await queryInterface.addColumn('usuarios', 'recuperacao_grant_expira', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // 6. login_tentativas para proteção contra força bruta persistente
    if (!tableInfo.login_tentativas) {
      await queryInterface.addColumn('usuarios', 'login_tentativas', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    // 7. login_bloqueado_ate para bloqueio temporário após 5 falhas
    if (!tableInfo.login_bloqueado_ate) {
      await queryInterface.addColumn('usuarios', 'login_bloqueado_ate', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // 8. Expandir recuperacao_codigo para suportar HMAC-SHA-256 (64 hex chars)
    if (tableInfo.recuperacao_codigo) {
      await queryInterface.changeColumn('usuarios', 'recuperacao_codigo', {
        type: Sequelize.STRING(128),
        allowNull: true,
      });
    }

    // 9. Invalidação preventiva de códigos legados de 4 dígitos em texto claro
    await queryInterface.sequelize.query(
      'UPDATE usuarios SET recuperacao_codigo = NULL, recuperacao_expira = NULL WHERE recuperacao_codigo IS NOT NULL'
    );
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('usuarios');

    if (tableInfo.login_bloqueado_ate) {
      await queryInterface.removeColumn('usuarios', 'login_bloqueado_ate');
    }
    if (tableInfo.login_tentativas) {
      await queryInterface.removeColumn('usuarios', 'login_tentativas');
    }
    if (tableInfo.recuperacao_grant_expira) {
      await queryInterface.removeColumn('usuarios', 'recuperacao_grant_expira');
    }
    if (tableInfo.recuperacao_grant_hash) {
      await queryInterface.removeColumn('usuarios', 'recuperacao_grant_hash');
    }
    if (tableInfo.recuperacao_solicitado_em) {
      await queryInterface.removeColumn('usuarios', 'recuperacao_solicitado_em');
    }
    if (tableInfo.recuperacao_tentativas) {
      await queryInterface.removeColumn('usuarios', 'recuperacao_tentativas');
    }
    if (tableInfo.versao_sessao) {
      await queryInterface.removeColumn('usuarios', 'versao_sessao');
    }
  },
};

