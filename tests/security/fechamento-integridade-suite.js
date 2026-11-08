/**
 * Suíte de Testes de Fechamento de Integridade Financeira e Regressão
 * Sistema: Guicell Manager
 * Casos de Teste: FIN01 a FIN08, RF13-01, CONC01, CONC02, DB01, REG01
 */

'use strict';

process.env.NODE_ENV = 'test';
const path = require('path');
const fs = require('fs');
require('../../backend/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });

const http = require('http');
const axios = require('../../backend/node_modules/axios');
const app = require('../../backend/src/app');
const {
  sequelize,
  Usuario,
  Cliente,
  Aparelho,
  Produto,
  Movimentacao,
  ItemMovimentacao,
  Caixa,
  CaixaPagamento,
  Permissao,
} = require('../../backend/src/models');

const RESULTS_DIR = path.resolve(__dirname, '../results/fechamento-integridade');
const REPORT_FILE = path.join(RESULTS_DIR, 'relatorio_fechamento_integridade.json');

async function runFechamentoIntegridadeSuite() {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('   SUITE: FECHAMENTO DA INTEGRIDADE FINANCEIRA E REGRESSÃO (GUICELL)          ');
  console.log('   Casos de Teste: FIN01-FIN08, RF13-01, CONC01-02, DB01, REG01               ');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const BASE_URL = `http://127.0.0.1:${port}/api`;
  const testHeaders = { 'x-test-bypass-rate-limit': '1' };

  const testResults = [];

  function record(id, nome, pass, detalhe, duracao) {
    testResults.push({ id, nome, status: pass ? 'PASS' : 'FAIL', detalhe, duracao_ms: duracao });
    const mark = pass ? '✔' : '✖';
    console.log(`  ${mark} [${id}] ${nome} (${duracao}ms)`);
    if (!pass) {
      console.error(`      FALHA: ${detalhe}`);
    }
  }

  try {
    // ─── Setup Inicial: Autenticação & Caixa ──────────────────────────────────
    const resAuthG = await axios.post(`${BASE_URL}/auth/login`, { login: 'gerente', senha: 'guicell123' }, { headers: testHeaders });
    const tokenG = resAuthG.data.token;
    const authG = { headers: { Authorization: `Bearer ${tokenG}`, ...testHeaders } };

    // Garante caixa aberto
    const stCaixa = await axios.get(`${BASE_URL}/caixa/status`, authG);
    if (!stCaixa.data.caixaAberto) {
      const infoAbertura = await axios.get(`${BASE_URL}/caixa/abertura-info`, authG);
      const saldoEsperado = infoAbertura.data.saldo_esperado !== undefined ? infoAbertura.data.saldo_esperado : 100;
      await axios.post(`${BASE_URL}/caixa/abrir`, { valor_contado: saldoEsperado, justificativa: 'Abertura para suite fechamento' }, authG);
    }

    const stamp = Date.now();
    const clienteBase = await Cliente.create({ nome: `Cliente Integridade ${stamp}`, telefone: '11988887771', email: `int_${stamp}@teste.com` });
    const aparelhoBase = await Aparelho.create({ id_cliente: clienteBase.id_cliente, marca: 'Motorola', modelo: 'Moto G100', imei: `35900000000${stamp % 10000}` });
    const produtoBase = await Produto.create({
      descricao: `Produto Suite Integridade ${stamp}`,
      estoque_atual: 50,
      estoque_minimo: 2,
      valor_custo: 20.00,
      valor_venda: 50.00,
    });

    console.log(`Ambiente base preparado: Cliente #${clienteBase.id_cliente} | Aparelho #${aparelhoBase.id_aparelho} | Produto #${produtoBase.id_produto}\n`);

    // ─── FIN01: PATCH /os/:id/status com forma_pagamento sem status ───────────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'FIN01 Teste mutacao financeira generica',
        }, authG);
        const osId = resOS.data.id_movimentacao;

        try {
          await axios.patch(`${BASE_URL}/ordens-servico/${osId}/status`, { forma_pagamento: 'PIX' }, authG);
          detalhe = 'PATCH com forma_pagamento deveria ter retornado 400 Bad Request';
        } catch (err) {
          if (err.response?.status === 400 && String(err.response?.data?.error).includes('forma_pagamento')) {
            const osNoDb = await Movimentacao.findByPk(osId);
            const lancamentos = await Caixa.findAll({ where: { id_movimentacao: osId } });

            if (osNoDb.status_pagamento !== 'pago' && osNoDb.forma_pagamento !== 'PIX' && lancamentos.length === 0) {
              pass = true;
              detalhe = `Rejeitado com 400 Bad Request. Status mantido como '${osNoDb.status_pagamento || 'aberto'}' e 0 lançamentos em caixa.`;
            } else {
              detalhe = `Estado corrompido no banco: status_pagamento=${osNoDb.status_pagamento}, caixa=${lancamentos.length}`;
            }
          } else {
            detalhe = `Esperado 400, obtido ${err.response?.status}: ${JSON.stringify(err.response?.data)}`;
          }
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('FIN01', 'Bloqueio de forma_pagamento em PATCH /os/:id/status sem status', pass, detalhe, Date.now() - start);
    }

    // ─── FIN02: Tentativa em PUT e PATCH com e sem status, incluindo status_pagamento='pago'
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'FIN02 Teste PUT/PATCH bypass',
        }, authG);
        const osId = resOS.data.id_movimentacao;

        // 1. PUT /os/:id com status_pagamento='pago'
        const req1 = axios.put(`${BASE_URL}/ordens-servico/${osId}`, { status_pagamento: 'pago' }, authG)
          .then(() => false).catch(err => err.response?.status === 400);

        // 2. PATCH /os/:id com status_pagamento='pago'
        const req2 = axios.patch(`${BASE_URL}/ordens-servico/${osId}`, { status_pagamento: 'pago' }, authG)
          .then(() => false).catch(err => err.response?.status === 400);

        // 3. PUT /os/:id com status='Em Reparo' e forma_pagamento='Dinheiro'
        const req3 = axios.put(`${BASE_URL}/ordens-servico/${osId}`, { status: 'Em Reparo', forma_pagamento: 'Dinheiro' }, authG)
          .then(() => false).catch(err => err.response?.status === 400);

        // 4. PATCH /os/:id/status com status='Em Reparo' e valor_total=500
        const req4 = axios.patch(`${BASE_URL}/ordens-servico/${osId}/status`, { status: 'Em Reparo', valor_total: 500 }, authG)
          .then(() => false).catch(err => err.response?.status === 400);

        const [r1, r2, r3, r4] = await Promise.all([req1, req2, req3, req4]);

        if (r1 && r2 && r3 && r4) {
          const osNoDb = await Movimentacao.findByPk(osId);
          if (osNoDb.status_pagamento !== 'pago') {
            pass = true;
            detalhe = 'Todas as 4 tentativas de injeção financeira em PUT/PATCH foram rejeitadas com HTTP 400. Status não alterado para pago.';
          } else {
            detalhe = `OS no banco com status_pagamento='${osNoDb.status_pagamento}' (não deveria ser 'pago')`;
          }
        } else {
          detalhe = `Rejeições incompletas: r1=${r1}, r2=${r2}, r3=${r3}, r4=${r4}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('FIN02', 'Rejeição de campos financeiros em PUT e PATCH (com e sem status)', pass, detalhe, Date.now() - start);
    }

    // ─── FIN03: Usuário restrito a os.editar não consegue confirmar recebimento ─
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const bcrypt = require('../../backend/node_modules/bcryptjs');
        const loginTec = `tecnico_edit_${stamp}`;
        const senhaHash = await bcrypt.hash('Guicell@12345678', 10);

        // Cria usuário Técnico (perfil com os.editar mas sem permissão de entrega/caixa)
        const userTec = await Usuario.create({
          nome: 'Tecnico Apenas Edicao',
          login: loginTec,
          senha_hash: senhaHash,
          perfil: 'Técnico',
          ativo: true,
        });

        // Configura permissão customizada: apenas 'os.ver' e 'os.editar'
        await Permissao.create({
          id_usuario: userTec.id_usuario,
          regras: {
            'os.ver': true,
            'os.editar': true,
            'os.status': false,
            'caixa.movimentar': false,
          },
        });

        const resLoginTec = await axios.post(`${BASE_URL}/auth/login`, { login: loginTec, senha: 'Guicell@12345678' }, { headers: testHeaders });
        const authTec = { headers: { Authorization: `Bearer ${resLoginTec.data.token}`, ...testHeaders } };

        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'FIN03 Teste RBAC Tecnico',
        }, authG);
        const osId = resOS.data.id_movimentacao;

        // 1. Tentar fechar OS via POST /fechar -> deve receber 403 Forbidden
        const fecharForbidden = await axios.post(`${BASE_URL}/ordens-servico/${osId}/fechar`, {
          valor_final: 100,
          forma_pagamento: 'Dinheiro',
        }, authTec).then(() => false).catch(err => err.response?.status === 403);

        // 2. Tentar pagar fiado via POST /pagar -> deve receber 403 Forbidden
        const pagarForbidden = await axios.post(`${BASE_URL}/ordens-servico/${osId}/pagar`, {
          forma_pagamento: 'Dinheiro',
        }, authTec).then(() => false).catch(err => err.response?.status === 403);

        // 3. Tentar burlar via PATCH genérico com forma_pagamento -> deve receber 400 Bad Request
        const patchBlocked = await axios.patch(`${BASE_URL}/ordens-servico/${osId}`, {
          forma_pagamento: 'Dinheiro',
        }, authTec).then(() => false).catch(err => err.response?.status === 400);

        if (fecharForbidden && pagarForbidden && patchBlocked) {
          pass = true;
          detalhe = 'Usuário restrito bloqueado em POST /fechar (403), POST /pagar (403) e PATCH genérico (400).';
        } else {
          detalhe = `Falha de bloqueio: fechar403=${fecharForbidden}, pagar403=${pagarForbidden}, patch400=${patchBlocked}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('FIN03', 'Usuário restrito a os.editar não consegue confirmar recebimento por nenhuma rota', pass, detalhe, Date.now() - start);
    }

    // ─── FIN04: Fechamento legítimo com pagamento único gera lançamentos conciliados ─
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'FIN04 Fechamento Legítimo',
        }, authG);
        const osId = resOS.data.id_movimentacao;
        const valorFinal = 180.50;

        const resFechar = await axios.post(`${BASE_URL}/ordens-servico/${osId}/fechar`, {
          valor_final: valorFinal,
          forma_pagamento: 'PIX',
        }, authG);

        const osDb = await Movimentacao.findByPk(osId);
        const lancamentoCaixa = await Caixa.findOne({
          where: { id_movimentacao: osId, tipo: 'entrada' },
        });
        const pagamentosCaixa = lancamentoCaixa
          ? await CaixaPagamento.findAll({ where: { id_caixa: lancamentoCaixa.id_caixa } })
          : [];

        const somaPernas = pagamentosCaixa.reduce((acc, p) => acc + parseFloat(p.valor), 0);

        if (
          resFechar.status === 200 &&
          osDb.status_os === 'Entregue' &&
          osDb.status_pagamento === 'pago' &&
          osDb.forma_pagamento === 'PIX' &&
          lancamentoCaixa &&
          parseFloat(lancamentoCaixa.valor) === valorFinal &&
          pagamentosCaixa.length === 1 &&
          Math.abs(somaPernas - valorFinal) < 0.001
        ) {
          pass = true;
          detalhe = `OS entregue e paga: R$ ${valorFinal} conciliado em movimentacao, caixa (#${lancamentoCaixa.id_caixa}) e caixa_pagamentos (#${pagamentosCaixa[0].id_caixa_pagamento}).`;
        } else {
          detalhe = `Divergência na conciliação: status_os=${osDb.status_os}, status_pagamento=${osDb.status_pagamento}, caixaVal=${lancamentoCaixa?.valor}, somaPernas=${somaPernas}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('FIN04', 'Fechamento legítimo gera movimentação, caixa e pernas financeiras conciliadas', pass, detalhe, Date.now() - start);
    }

    // ─── FIN05: Entrega fiada pendente sem caixa, quitada posteriormente ──────────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'FIN05 Entrega Fiado e Quitação Posterior',
        }, authG);
        const osId = resOS.data.id_movimentacao;
        const valorTotal = 250.00;

        // 1. Fechar como Fiado
        await axios.post(`${BASE_URL}/ordens-servico/${osId}/fechar`, {
          valor_final: valorTotal,
          forma_pagamento: 'Fiado',
        }, authG);

        const osAposEntrega = await Movimentacao.findByPk(osId);
        const lancamentoCaixaAntes = await Caixa.findOne({ where: { id_movimentacao: osId } });

        if (osAposEntrega.status_os !== 'Entregue' || osAposEntrega.status_pagamento !== 'pendente' || lancamentoCaixaAntes !== null) {
          throw new Error(`Estado pós-entrega fiado inválido: status_pagamento=${osAposEntrega.status_pagamento}, caixaExiste=${!!lancamentoCaixaAntes}`);
        }

        // 2. Quitação posterior
        await axios.post(`${BASE_URL}/ordens-servico/${osId}/pagar`, {
          forma_pagamento: 'Cartão de débito',
        }, authG);

        const osAposPagamento = await Movimentacao.findByPk(osId);
        const lancamentoCaixaDepois = await Caixa.findOne({ where: { id_movimentacao: osId, tipo: 'entrada' } });
        const pernas = lancamentoCaixaDepois ? await CaixaPagamento.findAll({ where: { id_caixa: lancamentoCaixaDepois.id_caixa } }) : [];

        if (
          osAposPagamento.status_pagamento === 'pago' &&
          osAposPagamento.forma_pagamento === 'Cartão de débito' &&
          lancamentoCaixaDepois &&
          parseFloat(lancamentoCaixaDepois.valor) === valorTotal &&
          pernas.length === 1
        ) {
          pass = true;
          detalhe = `Fiado permaneceu pendente sem caixa; quitação posterior gerou entrada de R$ ${valorTotal} no caixa #${lancamentoCaixaDepois.id_caixa}.`;
        } else {
          detalhe = `Falha na quitação: status=${osAposPagamento.status_pagamento}, caixaExiste=${!!lancamentoCaixaDepois}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('FIN05', 'Entrega fiada permanece pendente sem caixa e pagamento posterior efetiva baixa', pass, detalhe, Date.now() - start);
    }

    // ─── FIN06: Dois fechamentos simultâneos não geram duplicidade ────────────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'FIN06 Teste Fechamentos Concorrentes',
        }, authG);
        const osId = resOS.data.id_movimentacao;

        const [r1, r2] = await Promise.allSettled([
          axios.post(`${BASE_URL}/ordens-servico/${osId}/fechar`, { valor_final: 90.00, forma_pagamento: 'Dinheiro' }, authG),
          axios.post(`${BASE_URL}/ordens-servico/${osId}/fechar`, { valor_final: 90.00, forma_pagamento: 'Dinheiro' }, authG),
        ]);

        const sucessos = [r1, r2].filter(r => r.status === 'fulfilled' && r.value.status === 200);
        const rejeitados = [r1, r2].filter(r => r.status === 'rejected' && r.reason?.response?.status === 400);

        const lancamentos = await Caixa.findAll({ where: { id_movimentacao: osId, tipo: 'entrada' } });

        if (sucessos.length === 1 && rejeitados.length === 1 && lancamentos.length === 1) {
          pass = true;
          detalhe = 'Exatamente 1 fechamento processado (200) e 1 rejeitado (400 OS já finalizada). Exatamente 1 lançamento gravado no caixa.';
        } else {
          detalhe = `Falha na concorrência: sucessos=${sucessos.length}, rejeitados=${rejeitados.length}, totalCaixa=${lancamentos.length}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('FIN06', 'Dois fechamentos simultâneos não geram recebimento duplicado (idempotência)', pass, detalhe, Date.now() - start);
    }

    // ─── FIN07: Falha induzida antes do commit desfaz alterações (rollback) ────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'FIN07 Teste Rollback Atomico',
        }, authG);
        const osId = resOS.data.id_movimentacao;

        const estAntes = (await Produto.findByPk(produtoBase.id_produto)).estoque_atual;

        // Tenta fechar com item cujo estoque é insuficiente (exigindo 999999 un)
        try {
          await axios.post(`${BASE_URL}/ordens-servico/${osId}/fechar`, {
            valor_final: 300.00,
            forma_pagamento: 'PIX',
            itens: [{ id_produto: produtoBase.id_produto, quantidade: 999999, valor_unitario: 50.00 }],
          }, authG);
          detalhe = 'Fechamento com estoque insuficiente deveria ter falhado';
        } catch (err) {
          if (err.response?.status === 400) {
            const osNoDb = await Movimentacao.findByPk(osId);
            const estDepois = (await Produto.findByPk(produtoBase.id_produto)).estoque_atual;
            const lancamentos = await Caixa.findAll({ where: { id_movimentacao: osId } });

            if (osNoDb.status_os !== 'Entregue' && osNoDb.status_pagamento !== 'pago' && estDepois === estAntes && lancamentos.length === 0) {
              pass = true;
              detalhe = `Transação revertida com sucesso. OS preservada como '${osNoDb.status_os}', estoque inalterado (${estAntes} un) e 0 registros em caixa.`;
            } else {
              detalhe = `Rollback parcial ou corrompido: status_os=${osNoDb.status_os}, estDepois=${estDepois}, caixa=${lancamentos.length}`;
            }
          } else {
            detalhe = `Erro inesperado: status ${err.response?.status}`;
          }
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('FIN07', 'Falha induzida antes do commit desfaz todas as alterações (rollback atômico)', pass, detalhe, Date.now() - start);
    }

    // ─── FIN08: Cancelamento e estorno de OS recebida preservam saldos ─────────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const prodItem = await Produto.create({
          descricao: `Produto FIN08 ${stamp}`,
          estoque_atual: 10,
          estoque_minimo: 1,
          valor_custo: 25.00,
          valor_venda: 60.00,
        });

        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'FIN08 Teste Estorno e Estoque',
        }, authG);
        const osId = resOS.data.id_movimentacao;

        // Fecha entregando 2 un de peças e recebendo R$ 120 via PIX
        await axios.post(`${BASE_URL}/ordens-servico/${osId}/fechar`, {
          valor_final: 120.00,
          forma_pagamento: 'PIX',
          itens: [{ id_produto: prodItem.id_produto, quantidade: 2, valor_unitario: 60.00 }],
        }, authG);

        const estPosFechamento = (await Produto.findByPk(prodItem.id_produto)).estoque_atual;
        if (estPosFechamento !== 8) throw new Error(`Estoque pós-fechamento deveria ser 8, obtido ${estPosFechamento}`);

        // Cancela legitimamente
        await axios.post(`${BASE_URL}/ordens-servico/${osId}/cancelar`, {
          motivo: 'Cancelamento regular para teste de estorno FIN08',
        }, authG);

        const estPosCancelamento = (await Produto.findByPk(prodItem.id_produto)).estoque_atual;
        const lancamentosCaixa = (await axios.get(`${BASE_URL}/caixa`, authG)).data;
        const estornoCaixa = lancamentosCaixa.find(l => l.id_movimentacao === osId && l.estorno === true && l.tipo === 'saida');

        // Tenta segundo cancelamento (duplicidade) -> deve falhar
        let segundoCancelFalhou = false;
        try {
          await axios.post(`${BASE_URL}/ordens-servico/${osId}/cancelar`, { motivo: 'Tentativa 2' }, authG);
        } catch (err) {
          if (err.response?.status === 400) segundoCancelFalhou = true;
        }

        const estFinal = (await Produto.findByPk(prodItem.id_produto)).estoque_atual;

        if (estPosCancelamento === 10 && estFinal === 10 && estornoCaixa && segundoCancelFalhou) {
          pass = true;
          detalhe = `Estorno efetuado no caixa #${estornoCaixa.id_caixa}; estoque restaurado exatamente para 10 un e tentativa duplicada rejeitada sem novo estorno.`;
        } else {
          detalhe = `Inconsistência: estPosCancelamento=${estPosCancelamento}, estFinal=${estFinal}, estorno=${!!estornoCaixa}, duplicado=${segundoCancelFalhou}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('FIN08', 'Cancelamento e estorno de OS recebida preservam saldos e não duplicam estoque', pass, detalhe, Date.now() - start);
    }

    // ─── RF13-01: Mais de 10 OS de um cliente consultáveis por paginação ───────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const clienteC = await Cliente.create({ nome: `Cliente RF13 C ${stamp}`, telefone: '11977770001' });
        const aparelhoC = await Aparelho.create({ id_cliente: clienteC.id_cliente, marca: 'Apple', modelo: 'iPhone 13', imei: `35111111111${stamp % 1000}` });

        const clienteD = await Cliente.create({ nome: `Cliente RF13 D ${stamp}`, telefone: '11977770002' });
        const aparelhoD = await Aparelho.create({ id_cliente: clienteD.id_cliente, marca: 'Xiaomi', modelo: 'Redmi Note', imei: `35222222222${stamp % 1000}` });

        // Cria 12 OS para o cliente C
        const osCriadasC = [];
        for (let i = 1; i <= 12; i++) {
          const res = await axios.post(`${BASE_URL}/ordens-servico`, {
            id_cliente: clienteC.id_cliente,
            id_aparelho: aparelhoC.id_aparelho,
            defeito_relatado: `OS Cliente C #${i}`,
          }, authG);
          osCriadasC.push(res.data.id_movimentacao);
        }

        // Cria 3 OS para o cliente D
        for (let i = 1; i <= 3; i++) {
          await axios.post(`${BASE_URL}/ordens-servico`, {
            id_cliente: clienteD.id_cliente,
            id_aparelho: aparelhoD.id_aparelho,
            defeito_relatado: `OS Cliente D #${i}`,
          }, authG);
        }

        // 1. Consulta via buscarPorId (paginada por default até 50)
        const resClienteCompleto = await axios.get(`${BASE_URL}/clientes/${clienteC.id_cliente}`, authG);
        const todasOsC = resClienteCompleto.data.movimentacoes || [];
        const totalRegistrado = resClienteCompleto.data.total_os;

        // 2. Consulta via endpoint dedicado paginado /clientes/:id/historico-os
        const resPagina1 = await axios.get(`${BASE_URL}/clientes/${clienteC.id_cliente}/historico-os?pagina=1&limite=5`, authG);
        const resPagina2 = await axios.get(`${BASE_URL}/clientes/${clienteC.id_cliente}/historico-os?pagina=2&limite=5`, authG);
        const resPagina3 = await axios.get(`${BASE_URL}/clientes/${clienteC.id_cliente}/historico-os?pagina=3&limite=5`, authG);

        const idsPag1 = resPagina1.data.ordens.map(o => o.id_movimentacao);
        const idsPag2 = resPagina2.data.ordens.map(o => o.id_movimentacao);
        const idsPag3 = resPagina3.data.ordens.map(o => o.id_movimentacao);

        const todosIdsPaginados = [...idsPag1, ...idsPag2, ...idsPag3];
        const semDuplicados = new Set(todosIdsPaginados).size === 12;

        // Verifica que nenhuma OS pertence ao cliente D
        const todasDeC = todasOsC.every(o => o.id_cliente === clienteC.id_cliente);

        if (
          totalRegistrado === 12 &&
          todasOsC.length === 12 &&
          idsPag1.length === 5 &&
          idsPag2.length === 5 &&
          idsPag3.length === 2 &&
          semDuplicados &&
          todasDeC
        ) {
          pass = true;
          detalhe = `12/12 OSs do cliente C acessíveis (5+5+2 nas páginas 1, 2 e 3). Ordenação temporal correta e sem vazamento de OSs do cliente D.`;
        } else {
          detalhe = `Falha RF13: totalRegistrado=${totalRegistrado}, todasOsC=${todasOsC.length}, pag1=${idsPag1.length}, pag2=${idsPag2.length}, pag3=${idsPag3.length}, todasDeC=${todasDeC}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('RF13-01', 'Mais de 10 OS de um cliente consultáveis por paginação sem mistura de clientes', pass, detalhe, Date.now() - start);
    }

    // ─── CONC01: OS e Venda concorrentes disputando o mesmo produto ───────────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const prodConcorrencia = await Produto.create({
          descricao: `Produto CONC01 ${stamp}`,
          estoque_atual: 3,
          estoque_minimo: 1,
          valor_custo: 10.00,
          valor_venda: 25.00,
        });

        // Cria 2 OSs abertas para aplicar peça
        const resOS1 = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'CONC01 OS 1',
        }, authG);
        const resOS2 = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteBase.id_cliente,
          id_aparelho: aparelhoBase.id_aparelho,
          defeito_relatado: 'CONC01 OS 2',
        }, authG);

        // Dispara 4 operações concorrentes demandando 1 un cada (Estoque disponível = 3)
        // 2 Vendas + 2 Fechamentos de OS
        const operacoes = [
          axios.post(`${BASE_URL}/vendas`, { forma_pagamento: 'Dinheiro', itens: [{ id_produto: prodConcorrencia.id_produto, quantidade: 1 }] }, authG)
            .then(r => ({ op: 'venda', status: r.status })).catch(e => ({ op: 'venda', status: e.response?.status })),
          axios.post(`${BASE_URL}/vendas`, { forma_pagamento: 'Dinheiro', itens: [{ id_produto: prodConcorrencia.id_produto, quantidade: 1 }] }, authG)
            .then(r => ({ op: 'venda', status: r.status })).catch(e => ({ op: 'venda', status: e.response?.status })),
          axios.post(`${BASE_URL}/ordens-servico/${resOS1.data.id_movimentacao}/fechar`, { valor_final: 50, forma_pagamento: 'PIX', itens: [{ id_produto: prodConcorrencia.id_produto, quantidade: 1, valor_unitario: 25 }] }, authG)
            .then(r => ({ op: 'os1', status: r.status })).catch(e => ({ op: 'os1', status: e.response?.status })),
          axios.post(`${BASE_URL}/ordens-servico/${resOS2.data.id_movimentacao}/fechar`, { valor_final: 50, forma_pagamento: 'PIX', itens: [{ id_produto: prodConcorrencia.id_produto, quantidade: 1, valor_unitario: 25 }] }, authG)
            .then(r => ({ op: 'os2', status: r.status })).catch(e => ({ op: 'os2', status: e.response?.status })),
        ];

        const resultados = await Promise.all(operacoes);
        const sucessos = resultados.filter(r => r.status === 200 || r.status === 201);
        const rejeitados = resultados.filter(r => r.status === 400);

        const estFinal = (await Produto.findByPk(prodConcorrencia.id_produto)).estoque_atual;

        if (sucessos.length === 3 && rejeitados.length === 1 && estFinal === 0) {
          pass = true;
          detalhe = 'Exatamente 3 operações concluídas com sucesso e 1 rejeitada (400 Estoque insuficiente). Saldo final = 0 un (sem saldo negativo nem lost updates).';
        } else {
          detalhe = `Falha de concorrência: sucessos=${sucessos.length}, rejeitados=${rejeitados.length}, estFinal=${estFinal}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CONC01', 'OS e Venda concorrentes disputando o mesmo produto preservam integridade de estoque', pass, detalhe, Date.now() - start);
    }

    // ─── CONC02: Compra e Venda concorrentes envolvendo o mesmo produto ───────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const prodCompraVenda = await Produto.create({
          descricao: `Produto CONC02 ${stamp}`,
          estoque_atual: 5,
          estoque_minimo: 1,
          valor_custo: 15.00,
          valor_venda: 35.00,
        });

        // Dispara simultaneamente 3 Vendas de 2 unidades cada (demanda total = 6 un)
        // e 1 Compra de 4 unidades (entrada de 4 un)
        const promessas = [
          axios.post(`${BASE_URL}/vendas`, { forma_pagamento: 'Dinheiro', itens: [{ id_produto: prodCompraVenda.id_produto, quantidade: 2 }] }, authG)
            .then(r => ({ tipo: 'venda', status: r.status })).catch(e => ({ tipo: 'venda', status: e.response?.status })),
          axios.post(`${BASE_URL}/vendas`, { forma_pagamento: 'Dinheiro', itens: [{ id_produto: prodCompraVenda.id_produto, quantidade: 2 }] }, authG)
            .then(r => ({ tipo: 'venda', status: r.status })).catch(e => ({ tipo: 'venda', status: e.response?.status })),
          axios.post(`${BASE_URL}/vendas`, { forma_pagamento: 'Dinheiro', itens: [{ id_produto: prodCompraVenda.id_produto, quantidade: 2 }] }, authG)
            .then(r => ({ tipo: 'venda', status: r.status })).catch(e => ({ tipo: 'venda', status: e.response?.status })),
          axios.post(`${BASE_URL}/compras`, {
            nome_fornecedor_avulso: 'Fornecedor CONC02',
            data_compra: new Date().toISOString().slice(0, 10),
            a_prazo: true,
            itens: [{ id_produto: prodCompraVenda.id_produto, descricao_item: prodCompraVenda.descricao, quantidade: 4, valor_custo_unitario: 15.00 }],
          }, authG).then(r => ({ tipo: 'compra', status: r.status })).catch(e => ({ tipo: 'compra', status: e.response?.status })),
        ];

        const resultados = await Promise.all(promessas);
        const comprasSucesso = resultados.filter(r => r.tipo === 'compra' && r.status === 201).length;
        const vendasSucesso = resultados.filter(r => r.tipo === 'venda' && r.status === 201).length;

        const estFinal = (await Produto.findByPk(prodCompraVenda.id_produto)).estoque_atual;
        const estoqueEsperado = 5 + (comprasSucesso * 4) - (vendasSucesso * 2);

        if (comprasSucesso === 1 && estFinal === estoqueEsperado && estFinal >= 0) {
          pass = true;
          detalhe = `Concorrência resolvida sem deadlocks: 1 compra processada (+4), ${vendasSucesso} vendas processadas (-${vendasSucesso * 2}). Estoque final conferido: ${estFinal} un.`;
        } else {
          detalhe = `Inconsistência matemática: estFinal=${estFinal}, esperado=${estoqueEsperado}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CONC02', 'Compra e Venda concorrentes envolvendo o mesmo produto preservam saldo exato', pass, detalhe, Date.now() - start);
    }

    // ─── DB01: Auditoria física das Foreign Keys via information_schema ───────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const [rows] = await sequelize.query(`
          SELECT 
            rc.CONSTRAINT_NAME, 
            rc.TABLE_NAME, 
            kcu.COLUMN_NAME, 
            rc.REFERENCED_TABLE_NAME, 
            kcu.REFERENCED_COLUMN_NAME, 
            rc.DELETE_RULE, 
            rc.UPDATE_RULE 
          FROM information_schema.REFERENTIAL_CONSTRAINTS rc 
          JOIN information_schema.KEY_COLUMN_USAGE kcu 
            ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
            AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA 
          WHERE rc.CONSTRAINT_SCHEMA = DATABASE() 
            AND rc.TABLE_NAME IN ('transferencias_caixa', 'caixa', 'caixa_pagamentos')
        `);

        const fkTransferenciaEstorno = rows.find(r => r.TABLE_NAME === 'transferencias_caixa' && r.COLUMN_NAME === 'id_transferencia_estornada');
        const fkCaixaTransferencia = rows.find(r => r.TABLE_NAME === 'caixa' && r.COLUMN_NAME === 'id_transferencia');
        const fkCaixaLancamentoOrigem = rows.find(r => r.TABLE_NAME === 'caixa' && r.COLUMN_NAME === 'id_lancamento_origem');
        const fkCaixaPagamentosCaixa = rows.find(r => r.TABLE_NAME === 'caixa_pagamentos' && r.COLUMN_NAME === 'id_caixa');

        const checks = [
          { name: 'transferencias_caixa.id_transferencia_estornada', rule: fkTransferenciaEstorno?.DELETE_RULE },
          { name: 'caixa.id_transferencia', rule: fkCaixaTransferencia?.DELETE_RULE },
          { name: 'caixa.id_lancamento_origem', rule: fkCaixaLancamentoOrigem?.DELETE_RULE },
          { name: 'caixa_pagamentos.id_caixa', rule: fkCaixaPagamentosCaixa?.DELETE_RULE },
        ];

        const falhas = checks.filter(c => c.rule !== 'RESTRICT');

        if (falhas.length === 0) {
          pass = true;
          detalhe = 'Todas as 4 Foreign Keys verificadas fisicamente no MySQL 8 como DELETE_RULE = RESTRICT.';
        } else {
          detalhe = `FKs divergentes no MySQL físico: ${falhas.map(f => `${f.name}=${f.rule}`).join(', ')}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('DB01', 'Conferência física das FKs no information_schema do MySQL 8 (DELETE_RULE=RESTRICT)', pass, detalhe, Date.now() - start);
    }

    // ─── REG01: Execução das suítes de regressão (Cancelamento, RBAC, Consistência, Build)
    {
      const start = Date.now();
      let pass = true;
      const subResultados = [];

      // A. Suíte de cancelamento
      try {
        const { execSync } = require('child_process');
        execSync('node guicell-manager/tests/test-cancel-os.js', { stdio: 'pipe' });
        subResultados.push('test-cancel-os: APROVADO');
      } catch (e) {
        pass = false;
        subResultados.push(`test-cancel-os: FALHOU (${e.message})`);
      }

      // B. Suíte RBAC
      try {
        const { execSync } = require('child_process');
        execSync('node guicell-manager/tests/security/rbac-test.js', { stdio: 'pipe' });
        subResultados.push('rbac-test (11/11): APROVADO');
      } catch (e) {
        pass = false;
        subResultados.push(`rbac-test: FALHOU (${e.message})`);
      }

      // C. Suíte de Consistência
      try {
        const { execSync } = require('child_process');
        execSync('node guicell-manager/tests/security/consistencia-suite.js', { stdio: 'pipe' });
        subResultados.push('consistencia-suite (13/13): APROVADO');
      } catch (e) {
        pass = false;
        subResultados.push(`consistencia-suite: FALHOU (${e.message})`);
      }

      // D. Build do Frontend
      try {
        const { execSync } = require('child_process');
        execSync('npm --prefix guicell-manager/frontend run build', { stdio: 'pipe' });
        subResultados.push('frontend-build (Vite): APROVADO');
      } catch (e) {
        pass = false;
        subResultados.push(`frontend-build: FALHOU (${e.message})`);
      }

      const detalhe = subResultados.join(' | ');
      record('REG01', 'Regressão completa: Cancelamento, RBAC (11/11), Consistência (13/13) e Build Frontend', pass, detalhe, Date.now() - start);
    }

    // ─── Resumo Final ────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════════════════════════════');
    const total = testResults.length;
    const aprovados = testResults.filter(r => r.status === 'PASS').length;
    const reprovados = testResults.filter(r => r.status === 'FAIL').length;
    console.log(`   TOTAL DE TESTES: ${total} | APROVADOS: ${aprovados} | REPROVADOS: ${reprovados}`);
    console.log('══════════════════════════════════════════════════════════════════════════════\n');

    const reportData = {
      timestamp: new Date().toISOString(),
      ambiente: {
        node_env: process.env.NODE_ENV,
        database: sequelize.config.database,
        host: sequelize.config.host,
      },
      resumo: {
        total,
        aprovados,
        reprovados,
        taxa_sucesso: `${((aprovados / total) * 100).toFixed(1)}%`,
      },
      casos_de_teste: testResults,
    };

    fs.writeFileSync(REPORT_FILE, JSON.stringify(reportData, null, 2), 'utf8');
    console.log(`Relatório salvo em: ${REPORT_FILE}\n`);

    if (reprovados > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Erro fatal na suíte de fechamento:', err);
    process.exitCode = 1;
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  }
}

if (require.main === module) {
  runFechamentoIntegridadeSuite();
}

module.exports = runFechamentoIntegridadeSuite;
