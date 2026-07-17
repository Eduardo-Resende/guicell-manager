'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const senhaHash = await bcrypt.hash('guicell123', 10);

    // 1. Seed de usuários
    await queryInterface.bulkInsert('usuarios', [
      {
        nome: 'Gerente Padrão',
        login: 'gerente',
        senha_hash: senhaHash,
        perfil: 'Gerente',
        ativo: true,
        criado_em: new Date(),
        atualizado_em: new Date(),
      },
      {
        nome: 'Atendente Padrão',
        login: 'atendente',
        senha_hash: await bcrypt.hash('guicell123', 10),
        perfil: 'Atendente',
        ativo: true,
        criado_em: new Date(),
        atualizado_em: new Date(),
      },
      {
        nome: 'Técnico Padrão',
        login: 'tecnico',
        senha_hash: await bcrypt.hash('guicell123', 10),
        perfil: 'Técnico',
        ativo: true,
        criado_em: new Date(),
        atualizado_em: new Date(),
      },
    ]);

    // 2. Seed de categorias
    await queryInterface.bulkInsert('categorias', [
      { id_categoria: 1, nome: 'Peça', id_pai: null, tipo_uso: 'OS', criado_em: new Date(), atualizado_em: new Date() },
      { id_categoria: 2, nome: 'Acessório', id_pai: null, tipo_uso: 'Ambos', criado_em: new Date(), atualizado_em: new Date() },
      { id_categoria: 3, nome: 'Tela', id_pai: 1, tipo_uso: 'OS', criado_em: new Date(), atualizado_em: new Date() },
      { id_categoria: 4, nome: 'Bateria', id_pai: 1, tipo_uso: 'OS', criado_em: new Date(), atualizado_em: new Date() },
      { id_categoria: 5, nome: 'Película', id_pai: 2, tipo_uso: 'Ambos', criado_em: new Date(), atualizado_em: new Date() },
      { id_categoria: 6, nome: 'Capinha', id_pai: 2, tipo_uso: 'Ambos', criado_em: new Date(), atualizado_em: new Date() },
    ]);

  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categorias', null, {});
    await queryInterface.bulkDelete('usuarios', null, {});
  }
};
