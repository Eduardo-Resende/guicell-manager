'use strict';

/**
 * Controle financeiro do Caixa por conta/localização e forma de pagamento.
 *
 * Cria:
 *  - contas_financeiras  : Caixa (gaveta), Cofre e Conta da loja (eletrônica)
 *  - formas_pagamento    : Dinheiro, PIX, Cartão de débito, Cartão de crédito (+ conta padrão de cada uma)
 *  - transferencias_caixa: transferências entre contas (sem efeito em receitas/despesas)
 *  - caixa_pagamentos    : "pernas" financeiras de cada lançamento (forma + conta + valor).
 *                          É a base de cálculo de todos os saldos.
 *
 * Altera:
 *  - caixa           : natureza, origem, favorecido, vínculo de transferência/estorno, fora_sessao
 *  - sessoes_caixa   : conferência (esperado x contado) na abertura e no fechamento, justificativa e autorização
 *  - movimentacao    : valor_pago (compras parcialmente pagas / a prazo)
 *
 * A migration é re-executável (cada passo verifica se já foi aplicado), pois DDL no MySQL não é transacional.
 */

const CONTAS = [
  { codigo: 'gaveta', nome: 'Caixa (gaveta)', tipo: 'fisica' },
  { codigo: 'cofre', nome: 'Cofre', tipo: 'fisica' },
  { codigo: 'loja', nome: 'Conta da loja (eletrônica)', tipo: 'eletronica' },
];

const FORMAS = [
  { codigo: 'dinheiro', nome: 'Dinheiro', conta: 'gaveta', ordem: 1 },
  { codigo: 'pix', nome: 'PIX', conta: 'loja', ordem: 2 },
  { codigo: 'cartao_debito', nome: 'Cartão de débito', conta: 'loja', ordem: 3 },
  { codigo: 'cartao_credito', nome: 'Cartão de crédito', conta: 'loja', ordem: 4 },
];

const tabelaExiste = async (queryInterface, nome) => {
  const tabelas = await queryInterface.showAllTables();
  return tabelas.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(nome);
};

const addColumnSeAusente = async (queryInterface, tabela, coluna, definicao) => {
  const info = await queryInterface.describeTable(tabela);
  if (!info[coluna]) await queryInterface.addColumn(tabela, coluna, definicao);
};

const removeFksDaColuna = async (queryInterface, tabela, coluna) => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tabela AND COLUMN_NAME = :coluna
        AND REFERENCED_TABLE_NAME IS NOT NULL`,
    { replacements: { tabela, coluna } }
  );
  for (const row of rows) {
    await queryInterface.sequelize.query(`ALTER TABLE \`${tabela}\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
  }
};

const removeColumnSePresente = async (queryInterface, tabela, coluna) => {
  const info = await queryInterface.describeTable(tabela);
  if (!info[coluna]) return;
  await removeFksDaColuna(queryInterface, tabela, coluna);
  await queryInterface.removeColumn(tabela, coluna);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;

    // ── 1. contas_financeiras ───────────────────────────────────────────────
    if (!(await tabelaExiste(queryInterface, 'contas_financeiras'))) {
      await queryInterface.createTable('contas_financeiras', {
        id_conta: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        codigo: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        nome: { type: Sequelize.STRING(60), allowNull: false },
        tipo: { type: Sequelize.ENUM('fisica', 'eletronica'), allowNull: false },
        ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      });
    }
    for (const c of CONTAS) {
      const [[existe]] = await sequelize.query('SELECT COUNT(*) AS n FROM contas_financeiras WHERE codigo = :codigo', { replacements: { codigo: c.codigo } });
      if (!Number(existe.n)) await queryInterface.bulkInsert('contas_financeiras', [{ ...c, ativo: true }]);
    }

    // ── 2. formas_pagamento ─────────────────────────────────────────────────
    if (!(await tabelaExiste(queryInterface, 'formas_pagamento'))) {
      await queryInterface.createTable('formas_pagamento', {
        id_forma: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        codigo: { type: Sequelize.STRING(30), allowNull: false, unique: true },
        nome: { type: Sequelize.STRING(60), allowNull: false },
        id_conta: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'contas_financeiras', key: 'id_conta' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      });
    }
    for (const f of FORMAS) {
      const [[existe]] = await sequelize.query('SELECT COUNT(*) AS n FROM formas_pagamento WHERE codigo = :codigo', { replacements: { codigo: f.codigo } });
      if (!Number(existe.n)) {
        const [[conta]] = await sequelize.query('SELECT id_conta FROM contas_financeiras WHERE codigo = :c', { replacements: { c: f.conta } });
        await queryInterface.bulkInsert('formas_pagamento', [{
          codigo: f.codigo, nome: f.nome, id_conta: conta.id_conta, ordem: f.ordem, ativo: true,
        }]);
      }
    }

    // ── 3. transferencias_caixa ─────────────────────────────────────────────
    if (!(await tabelaExiste(queryInterface, 'transferencias_caixa'))) {
      await queryInterface.createTable('transferencias_caixa', {
        id_transferencia: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        id_conta_origem: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'contas_financeiras', key: 'id_conta' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        id_conta_destino: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'contas_financeiras', key: 'id_conta' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        valor: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        descricao: { type: Sequelize.STRING(200), allowNull: true },
        data_hora: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        id_usuario: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'usuarios', key: 'id_usuario' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        id_sessao: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: 'sessoes_caixa', key: 'id_sessao' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
        },
        status: { type: Sequelize.ENUM('efetivada', 'cancelada'), allowNull: false, defaultValue: 'efetivada' },
        // Preenchido na transferência "inversa" gerada por um cancelamento: aponta para a original.
        id_transferencia_estornada: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: 'transferencias_caixa', key: 'id_transferencia' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        motivo_cancelamento: { type: Sequelize.TEXT, allowNull: true },
        id_usuario_cancelamento: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: 'usuarios', key: 'id_usuario' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
        },
        data_cancelamento: { type: Sequelize.DATE, allowNull: true },
      });
    }

    // ── 4. caixa: novas colunas ─────────────────────────────────────────────
    await addColumnSeAusente(queryInterface, 'caixa', 'natureza', {
      type: Sequelize.ENUM('operacional', 'transferencia', 'ajuste_conferencia', 'abertura', 'fechamento'),
      allowNull: false,
      defaultValue: 'operacional',
    });
    await addColumnSeAusente(queryInterface, 'caixa', 'origem', { type: Sequelize.STRING(30), allowNull: true });
    await addColumnSeAusente(queryInterface, 'caixa', 'favorecido', { type: Sequelize.STRING(150), allowNull: true });
    await addColumnSeAusente(queryInterface, 'caixa', 'fora_sessao', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addColumnSeAusente(queryInterface, 'caixa', 'id_transferencia', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'transferencias_caixa', key: 'id_transferencia' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    });
    await addColumnSeAusente(queryInterface, 'caixa', 'id_lancamento_origem', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'caixa', key: 'id_caixa' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    });

    // ── 5. caixa_pagamentos ─────────────────────────────────────────────────
    if (!(await tabelaExiste(queryInterface, 'caixa_pagamentos'))) {
      await queryInterface.createTable('caixa_pagamentos', {
        id_caixa_pagamento: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        id_caixa: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'caixa', key: 'id_caixa' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        id_conta: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'contas_financeiras', key: 'id_conta' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        id_forma: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'formas_pagamento', key: 'id_forma' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        tipo: { type: Sequelize.ENUM('entrada', 'saida'), allowNull: false },
        valor: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        data: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        id_sessao: {
          type: Sequelize.INTEGER, allowNull: true,
          references: { model: 'sessoes_caixa', key: 'id_sessao' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
        },
      });
      await queryInterface.addIndex('caixa_pagamentos', ['id_conta', 'tipo'], { name: 'idx_caixa_pag_conta_tipo' });
      await queryInterface.addIndex('caixa_pagamentos', ['id_forma'], { name: 'idx_caixa_pag_forma' });
      await queryInterface.addIndex('caixa_pagamentos', ['id_sessao'], { name: 'idx_caixa_pag_sessao' });
    }

    // ── 6. sessoes_caixa: conferência na abertura/fechamento ────────────────
    await addColumnSeAusente(queryInterface, 'sessoes_caixa', 'valor_esperado_abertura', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await addColumnSeAusente(queryInterface, 'sessoes_caixa', 'diferenca_abertura', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await addColumnSeAusente(queryInterface, 'sessoes_caixa', 'justificativa_abertura', { type: Sequelize.TEXT, allowNull: true });
    await addColumnSeAusente(queryInterface, 'sessoes_caixa', 'id_usuario_autorizador_abertura', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'usuarios', key: 'id_usuario' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
    });
    await addColumnSeAusente(queryInterface, 'sessoes_caixa', 'justificativa_fechamento', { type: Sequelize.TEXT, allowNull: true });
    await addColumnSeAusente(queryInterface, 'sessoes_caixa', 'id_usuario_autorizador_fechamento', {
      type: Sequelize.INTEGER, allowNull: true,
      references: { model: 'usuarios', key: 'id_usuario' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
    });
    await addColumnSeAusente(queryInterface, 'sessoes_caixa', 'abertura_inicial', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    // Garante, no banco, no máximo uma sessão aberta: 1 enquanto aberta, NULL quando fechada (UNIQUE ignora NULLs).
    const infoSessoes = await queryInterface.describeTable('sessoes_caixa');
    if (!infoSessoes.trava_aberta) {
      await queryInterface.addColumn('sessoes_caixa', 'trava_aberta', { type: Sequelize.TINYINT(1), allowNull: true });
      await sequelize.query("UPDATE sessoes_caixa SET trava_aberta = 1 WHERE status = 'aberto'");
      await queryInterface.addIndex('sessoes_caixa', ['trava_aberta'], { unique: true, name: 'uniq_sessao_aberta' });
    }

    // ── 7. movimentacao.valor_pago (compras parciais / a prazo) ─────────────
    const infoMov = await queryInterface.describeTable('movimentacao');
    if (!infoMov.valor_pago) {
      await queryInterface.addColumn('movimentacao', 'valor_pago', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
      await sequelize.query(
        "UPDATE movimentacao SET valor_pago = CASE WHEN status_pagamento = 'pago' THEN valor_total ELSE 0 END WHERE origem = 'compra'"
      );
    }

    // ── 8. Backfill do histórico existente ──────────────────────────────────
    const [[jaMigrado]] = await sequelize.query('SELECT COUNT(*) AS n FROM caixa_pagamentos');
    if (!Number(jaMigrado.n)) {
      await sequelize.query("UPDATE caixa SET natureza = 'abertura' WHERE categoria = 'Abertura de Caixa'");
      await sequelize.query("UPDATE caixa SET natureza = 'fechamento' WHERE categoria = 'Fechamento de Caixa'");
      await sequelize.query(`
        UPDATE caixa c
        LEFT JOIN movimentacao m ON m.id_movimentacao = c.id_movimentacao
           SET c.origem = CASE
                 WHEN m.origem IS NOT NULL THEN m.origem
                 WHEN c.natureza IN ('abertura', 'fechamento') THEN 'sistema'
                 ELSE 'manual'
               END
         WHERE c.origem IS NULL
      `);

      // Cada lançamento operacional antigo vira uma perna financeira.
      // Forma: lida da venda/OS vinculada. Registros sem forma (compras e lançamentos manuais antigos)
      // eram tratados como dinheiro. "Cartão" genérico (antes sem distinção) é assumido como débito.
      await sequelize.query(`
        INSERT INTO caixa_pagamentos (id_caixa, id_conta, id_forma, tipo, valor, data, id_sessao)
        SELECT c.id_caixa, f.id_conta, f.id_forma, c.tipo, c.valor, c.data, NULL
          FROM caixa c
          LEFT JOIN movimentacao m ON m.id_movimentacao = c.id_movimentacao
          JOIN formas_pagamento f ON f.codigo = (
            CASE
              WHEN m.forma_pagamento LIKE '%pix%' THEN 'pix'
              WHEN m.forma_pagamento LIKE '%cr_dito%' THEN 'cartao_credito'
              WHEN m.forma_pagamento LIKE '%cart%' THEN 'cartao_debito'
              WHEN m.forma_pagamento LIKE '%d_bito%' THEN 'cartao_debito'
              ELSE 'dinheiro'
            END
          )
         WHERE c.natureza = 'operacional'
      `);

      // A gaveta passa a ser controlada por conferência. Todo o dinheiro histórico (que na prática já saiu da gaveta)
      // é neutralizado por um único ajuste de implantação; o saldo físico inicial será informado na primeira abertura.
      const [[gaveta]] = await sequelize.query(`
        SELECT COALESCE(SUM(CASE WHEN p.tipo = 'entrada' THEN p.valor ELSE -p.valor END), 0) AS saldo
          FROM caixa_pagamentos p
          JOIN contas_financeiras c ON c.id_conta = p.id_conta
         WHERE c.codigo = 'gaveta'
      `);
      const saldoGaveta = Math.round(parseFloat(gaveta.saldo) * 100) / 100;
      const [[usuario]] = await sequelize.query(
        "SELECT id_usuario FROM usuarios ORDER BY (perfil = 'Gerente') DESC, id_usuario ASC LIMIT 1"
      );
      if (saldoGaveta !== 0 && usuario) {
        const tipoAjuste = saldoGaveta > 0 ? 'saida' : 'entrada';
        const valorAjuste = Math.abs(saldoGaveta);
        const agora = new Date();
        await queryInterface.bulkInsert('caixa', [{
          id_usuario: usuario.id_usuario,
          data: agora,
          tipo: tipoAjuste,
          valor: valorAjuste,
          descricao: 'Ajuste de implantação do controle por contas (saldo físico informado na primeira abertura)',
          categoria: 'Ajuste de Conferência',
          natureza: 'ajuste_conferencia',
          origem: 'implantacao',
          fora_sessao: false,
        }]);
        const [[ajuste]] = await sequelize.query("SELECT MAX(id_caixa) AS id FROM caixa WHERE origem = 'implantacao'");
        const [[refs]] = await sequelize.query(`
          SELECT (SELECT id_conta FROM contas_financeiras WHERE codigo = 'gaveta') AS id_conta,
                 (SELECT id_forma FROM formas_pagamento WHERE codigo = 'dinheiro') AS id_forma
        `);
        await queryInterface.bulkInsert('caixa_pagamentos', [{
          id_caixa: ajuste.id,
          id_conta: refs.id_conta,
          id_forma: refs.id_forma,
          tipo: tipoAjuste,
          valor: valorAjuste,
          data: agora,
          id_sessao: null,
        }]);
      }
    }

    await queryInterface.addIndex('caixa', ['natureza', 'data'], { name: 'idx_caixa_natureza_data' }).catch(() => {});
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;

    await queryInterface.removeIndex('caixa', 'idx_caixa_natureza_data').catch(() => {});

    if (await tabelaExiste(queryInterface, 'caixa_pagamentos')) await queryInterface.dropTable('caixa_pagamentos');

    // Lançamentos que só existem no novo modelo não têm significado no modelo antigo.
    await removeColumnSePresente(queryInterface, 'caixa', 'id_lancamento_origem').catch(() => {});
    await sequelize.query("DELETE FROM caixa WHERE natureza IN ('transferencia', 'ajuste_conferencia')").catch(() => {});

    await removeColumnSePresente(queryInterface, 'caixa', 'id_transferencia');
    await removeColumnSePresente(queryInterface, 'caixa', 'fora_sessao');
    await removeColumnSePresente(queryInterface, 'caixa', 'favorecido');
    await removeColumnSePresente(queryInterface, 'caixa', 'origem');
    await removeColumnSePresente(queryInterface, 'caixa', 'natureza');

    if (await tabelaExiste(queryInterface, 'transferencias_caixa')) await queryInterface.dropTable('transferencias_caixa');
    if (await tabelaExiste(queryInterface, 'formas_pagamento')) await queryInterface.dropTable('formas_pagamento');
    if (await tabelaExiste(queryInterface, 'contas_financeiras')) await queryInterface.dropTable('contas_financeiras');

    await queryInterface.removeIndex('sessoes_caixa', 'uniq_sessao_aberta').catch(() => {});
    for (const coluna of [
      'trava_aberta', 'abertura_inicial', 'id_usuario_autorizador_fechamento', 'justificativa_fechamento',
      'id_usuario_autorizador_abertura', 'justificativa_abertura', 'diferenca_abertura', 'valor_esperado_abertura',
    ]) {
      await removeColumnSePresente(queryInterface, 'sessoes_caixa', coluna);
    }

    await removeColumnSePresente(queryInterface, 'movimentacao', 'valor_pago');
  },
};

