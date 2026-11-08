/**
 * Suite de Testes de Integridade, Fluxos de Negócio e Concorrência Transacional
 * Sistema: Guicell Manager
 * Casos de Teste: CT01 a CT13 (A01 a A08)
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
} = require('../../backend/src/models');

const RESULTS_DIR = path.resolve(__dirname, '../results/consistencia');
const REPORT_FILE = path.join(RESULTS_DIR, 'relatorio_testes_consistencia.json');

async function runConsistenciaSuite() {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('   SUITE DE TESTES: INTEGRIDADE, FLUXOS E CONCORRÊNCIA — GUICELL MANAGER      ');
  console.log('   Validação dos Achados A01 a A08 (CT01 a CT13)                              ');
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
      await axios.post(`${BASE_URL}/caixa/abrir`, { valor_contado: saldoEsperado, justificativa: 'Abertura para suite consistencia' }, authG);
    }

    // Criação de dados base de teste (Clientes, Aparelhos, Produtos)
    const stamp = Date.now();
    const clienteA = await Cliente.create({ nome: `Cliente Teste A ${stamp}`, telefone: '11999990001', email: `clientea_${stamp}@teste.com` });
    const clienteB = await Cliente.create({ nome: `Cliente Teste B ${stamp}`, telefone: '11999990002', email: `clienteb_${stamp}@teste.com` });

    const aparelhoA = await Aparelho.create({ id_cliente: clienteA.id_cliente, marca: 'Samsung', modelo: 'Galaxy S21', imei: `35100000000${stamp % 10000}` });
    const aparelhoB = await Aparelho.create({ id_cliente: clienteB.id_cliente, marca: 'Apple', modelo: 'iPhone 12', imei: `35200000000${stamp % 10000}` });

    const produtoBase = await Produto.create({
      descricao: `Peca Teste Suite ${stamp}`,
      estoque_atual: 20,
      estoque_minimo: 2,
      valor_custo: 30.00,
      valor_venda: 60.00,
    });

    console.log(`Ambiente preparado: Clientes ${clienteA.id_cliente}, ${clienteB.id_cliente} | Produto ${produtoBase.id_produto}\n`);

    // ─── CT01: Bloqueio de cancelamento via PATCH /status ─────────────────────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteA.id_cliente,
          id_aparelho: aparelhoA.id_aparelho,
          defeito_relatado: 'CT01 Teste Bloqueio Cancelamento PATCH',
        }, authG);
        const osId = resOS.data.id_movimentacao;

        try {
          await axios.patch(`${BASE_URL}/ordens-servico/${osId}/status`, { status: 'Cancelado' }, authG);
          detalhe = 'PATCH /status para Cancelado deveria ter retornado status 400';
        } catch (err) {
          if (err.response?.status === 400 && String(err.response?.data?.error).includes('POST /api/ordens-servico/:id/cancelar')) {
            pass = true;
            detalhe = `Rejeitado com 400 Bad Request: "${err.response.data.error}"`;
          } else {
            detalhe = `Esperado 400 com mensagem sobre rota dedicada, obtido ${err.response?.status}: ${JSON.stringify(err.response?.data)}`;
          }
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CT01', 'Bloqueio de cancelamento via PATCH /status (orientando rota POST /cancelar)', pass, detalhe, Date.now() - start);
    }

    // ─── CT02: Bloqueio de entrega direta via PATCH /status sem fechamento ───
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteA.id_cliente,
          id_aparelho: aparelhoA.id_aparelho,
          defeito_relatado: 'CT02 Teste Bloqueio Entrega PATCH',
        }, authG);
        const osId = resOS.data.id_movimentacao;

        try {
          await axios.patch(`${BASE_URL}/ordens-servico/${osId}/status`, { status: 'Entregue' }, authG);
          detalhe = 'PATCH /status para Entregue deveria ter retornado 400';
        } catch (err) {
          if (err.response?.status === 400 && String(err.response?.data?.error).includes('POST /api/ordens-servico/:id/fechar')) {
            pass = true;
            detalhe = `Rejeitado com 400 Bad Request: "${err.response.data.error}"`;
          } else {
            detalhe = `Esperado 400 com mensagem sobre rota de fechamento, obtido ${err.response?.status}: ${JSON.stringify(err.response?.data)}`;
          }
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CT02', 'Bloqueio de entrega direta via PATCH /status sem fechamento financeiro', pass, detalhe, Date.now() - start);
    }

    // ─── CT03: Cancelamento regular de OS via POST /cancelar ──────────────────
    let ct03OsId = null;
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const resOS = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteA.id_cliente,
          id_aparelho: aparelhoA.id_aparelho,
          defeito_relatado: 'CT03 Cancelamento regular',
        }, authG);
        ct03OsId = resOS.data.id_movimentacao;

        const estAntes = (await axios.get(`${BASE_URL}/produtos/${produtoBase.id_produto}`, authG)).data.estoque_atual;

        // Adiciona 2 unidades de peça
        await axios.patch(`${BASE_URL}/ordens-servico/${ct03OsId}/status`, {
          status: 'Em Reparo',
          itens: [{ id_produto: produtoBase.id_produto, quantidade: 2, valor_unitario: 60.00 }],
        }, authG);

        // Fecha a OS recebendo R$ 150 em PIX
        await axios.post(`${BASE_URL}/ordens-servico/${ct03OsId}/fechar`, {
          valor_final: 150.00,
          forma_pagamento: 'PIX',
          itens: [{ id_produto: produtoBase.id_produto, quantidade: 2, valor_unitario: 60.00 }],
        }, authG);

        const estDurante = (await axios.get(`${BASE_URL}/produtos/${produtoBase.id_produto}`, authG)).data.estoque_atual;
        if (estDurante !== estAntes - 2) {
          throw new Error(`Estoque intermediário incorreto: esperado ${estAntes - 2}, obtido ${estDurante}`);
        }

        // Executa cancelamento com justificativa
        const resCancel = await axios.post(`${BASE_URL}/ordens-servico/${ct03OsId}/cancelar`, {
          motivo: 'CT03 Justificativa válida de cancelamento com devolução e estorno',
        }, authG);

        const estDepois = (await axios.get(`${BASE_URL}/produtos/${produtoBase.id_produto}`, authG)).data.estoque_atual;
        const osDb = (await axios.get(`${BASE_URL}/ordens-servico/${ct03OsId}`, authG)).data;

        // Verifica estorno no caixa
        const lancamentos = (await axios.get(`${BASE_URL}/caixa`, authG)).data;
        const estornoCaixa = lancamentos.find(l => l.id_movimentacao === ct03OsId && l.estorno === true && l.tipo === 'saida');

        if (osDb.status_os === 'Cancelado' && osDb.status_pagamento === 'cancelado' && estDepois === estAntes && estornoCaixa) {
          pass = true;
          detalhe = `OS cancelada com status_os='Cancelado', estoque devolvido (${estAntes} un) e estorno no caixa #${estornoCaixa.id_caixa}`;
        } else {
          detalhe = `Inconsistência pós-cancelamento: status_os=${osDb.status_os}, status_pagamento=${osDb.status_pagamento}, estDepois=${estDepois}/${estAntes}, estorno=${!!estornoCaixa}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CT03', 'Cancelamento regular de OS via POST /cancelar com justificativa válida', pass, detalhe, Date.now() - start);
    }

    // ─── CT04: Rejeição de cancelamento duplicado na rota POST /cancelar ───────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        await axios.post(`${BASE_URL}/ordens-servico/${ct03OsId}/cancelar`, {
          motivo: 'Tentativa duplicada de cancelamento',
        }, authG);
        detalhe = 'Segundo cancelamento deveria ter retornado 400';
      } catch (err) {
        if (err.response?.status === 400 && String(err.response?.data?.error).includes('já está cancelada')) {
          pass = true;
          detalhe = `Rejeitado com 400 Bad Request: "${err.response.data.error}"`;
        } else {
          detalhe = `Esperado 400 ("já está cancelada"), obtido ${err.response?.status}: ${JSON.stringify(err.response?.data)}`;
        }
      }
      record('CT04', 'Rejeição de cancelamento duplicado na rota POST /cancelar', pass, detalhe, Date.now() - start);
    }

    // ─── CT05: Bloqueio de alteração de status via PATCH em OS já cancelada ────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        await axios.patch(`${BASE_URL}/ordens-servico/${ct03OsId}/status`, {
          status: 'Em Reparo',
        }, authG);
        detalhe = 'PATCH em OS cancelada deveria ter retornado 400';
      } catch (err) {
        if (err.response?.status === 400 && String(err.response?.data?.error).includes('cancelada')) {
          pass = true;
          detalhe = `Rejeitado com 400 Bad Request: "${err.response.data.error}"`;
        } else {
          detalhe = `Esperado 400, obtido ${err.response?.status}: ${JSON.stringify(err.response?.data)}`;
        }
      }
      record('CT05', 'Bloqueio de alteração de status via PATCH em OS já cancelada', pass, detalhe, Date.now() - start);
    }

    // ─── CT06: Validação cliente-aparelho na criação de OS (incoerente -> 422) ─
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteA.id_cliente,
          id_aparelho: aparelhoB.id_aparelho, // Aparelho pertence ao cliente B!
          defeito_relatado: 'CT06 Incompatibilidade',
        }, authG);
        detalhe = 'Criação de OS com aparelho de outro cliente deveria retornar 422';
      } catch (err) {
        if (err.response?.status === 422 && String(err.response?.data?.error).includes('não pertence ao cliente')) {
          pass = true;
          detalhe = `Rejeitado com 422 Unprocessable Entity: "${err.response.data.error}"`;
        } else {
          detalhe = `Esperado 422 com mensagem de incoerência, obtido ${err.response?.status}: ${JSON.stringify(err.response?.data)}`;
        }
      }
      record('CT06', 'Validação de coerência cliente-aparelho na criação de OS (incoerente -> 422)', pass, detalhe, Date.now() - start);
    }

    // ─── CT07: Criação de OS com dados consistentes (compatível -> 201) ────────
    let ct07OsId = null;
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const res = await axios.post(`${BASE_URL}/ordens-servico`, {
          id_cliente: clienteA.id_cliente,
          id_aparelho: aparelhoA.id_aparelho,
          defeito_relatado: 'CT07 Dados consistentes',
          valor_orcado: 120.00,
        }, authG);
        if (res.status === 201 && res.data.id_movimentacao && res.data.numero_os) {
          pass = true;
          ct07OsId = res.data.id_movimentacao;
          detalhe = `OS criada com sucesso: ID #${res.data.id_movimentacao}, Número #${res.data.numero_os}`;
        } else {
          detalhe = `Resposta inesperada: status ${res.status}`;
        }
      } catch (e) {
        detalhe = e.response?.data?.error || e.message;
      }
      record('CT07', 'Criação de OS com dados consistentes (id_aparelho compatível -> 201)', pass, detalhe, Date.now() - start);
    }

    // ─── CT08: Concorrência em Vendas: 10 requisições simultâneas ─────────────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const prodEstoqueLimitado = await Produto.create({
          descricao: `Produto Concorrencia Venda ${stamp}`,
          estoque_atual: 4,
          estoque_minimo: 1,
          valor_custo: 10.00,
          valor_venda: 25.00,
        });

        // 10 requisições disparadas simultaneamente para comprar 1 unidade cada
        const promessasVenda = Array.from({ length: 10 }, (_, i) =>
          axios.post(`${BASE_URL}/vendas`, {
            forma_pagamento: 'Dinheiro',
            itens: [{ id_produto: prodEstoqueLimitado.id_produto, quantidade: 1 }],
          }, authG).then(r => ({ success: true, status: r.status, id: r.data.id_movimentacao }))
            .catch(err => ({ success: false, status: err.response?.status, error: err.response?.data?.error }))
        );

        const resultados = await Promise.all(promessasVenda);
        const sucessos = resultados.filter(r => r.success && r.status === 201);
        const rejeitados = resultados.filter(r => !r.success && r.status === 400);

        const prodAtual = await Produto.findByPk(prodEstoqueLimitado.id_produto);

        if (sucessos.length === 4 && rejeitados.length === 6 && prodAtual.estoque_atual === 0) {
          pass = true;
          detalhe = `Exatamente 4 vendas aprovadas (201), 6 rejeitadas (400 Estoque insuficiente). Estoque final: 0 (sem saldo negativo nem lost updates).`;
        } else {
          detalhe = `Inconsistência: sucessos=${sucessos.length} (esperado 4), rejeitados=${rejeitados.length} (esperado 6), estoque_final=${prodAtual.estoque_atual} (esperado 0)`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CT08', 'Concorrência em Vendas: 10 requisições disputando estoque limitado', pass, detalhe, Date.now() - start);
    }

    // ─── CT09: Cancelamento de Venda com lock ordenado e estorno financeiro ───
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const prodVendaCancel = await Produto.create({
          descricao: `Produto Venda Cancel ${stamp}`,
          estoque_atual: 10,
          estoque_minimo: 1,
          valor_custo: 15.00,
          valor_venda: 40.00,
        });

        const resVenda = await axios.post(`${BASE_URL}/vendas`, {
          forma_pagamento: 'PIX',
          itens: [{ id_produto: prodVendaCancel.id_produto, quantidade: 3 }],
        }, authG);
        const idVenda = resVenda.data.id_movimentacao;

        const estDurante = (await Produto.findByPk(prodVendaCancel.id_produto)).estoque_atual;
        if (estDurante !== 7) throw new Error(`Estoque após venda deveria ser 7, obtido ${estDurante}`);

        // Cancela a venda
        await axios.post(`${BASE_URL}/vendas/${idVenda}/cancelar`, {
          motivo: 'Cancelamento regular de teste balcão',
        }, authG);

        const estFinal = (await Produto.findByPk(prodVendaCancel.id_produto)).estoque_atual;
        const vendaDb = await Movimentacao.findByPk(idVenda);
        const lancamentos = (await axios.get(`${BASE_URL}/caixa`, authG)).data;
        const lancamentoEstorno = lancamentos.find(l => l.id_movimentacao === idVenda && l.estorno === true && l.tipo === 'saida');

        if (estFinal === 10 && vendaDb.status_pagamento === 'cancelado' && lancamentoEstorno) {
          pass = true;
          detalhe = `Venda #${idVenda} cancelada, estoque devolvido integralmente (10 un) e estorno no caixa #${lancamentoEstorno.id_caixa}`;
        } else {
          detalhe = `Falha: estFinal=${estFinal}, status=${vendaDb.status_pagamento}, estorno=${!!lancamentoEstorno}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CT09', 'Cancelamento de Venda: devolução de estoque com lock ordenado e estorno financeiro', pass, detalhe, Date.now() - start);
    }

    // ─── CT10: Concorrência em Compras: cancelamentos concorrentes ────────────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const prodCompraConcorrente = await Produto.create({
          descricao: `Produto Compra Concorrencia ${stamp}`,
          estoque_atual: 5,
          estoque_minimo: 1,
          valor_custo: 20.00,
          valor_venda: 50.00,
        });

        const resCompra = await axios.post(`${BASE_URL}/compras`, {
          nome_fornecedor_avulso: 'Fornecedor Concorrencia Teste',
          data_compra: new Date().toISOString().slice(0, 10),
          a_prazo: true,
          itens: [{
            id_produto: prodCompraConcorrente.id_produto,
            descricao_item: prodCompraConcorrente.descricao,
            quantidade: 5,
            valor_custo_unitario: 20.00,
          }],
        }, authG);
        const idCompra = resCompra.data.id_movimentacao;

        const estPosCompra = (await Produto.findByPk(prodCompraConcorrente.id_produto)).estoque_atual;
        if (estPosCompra !== 10) throw new Error(`Estoque após compra deveria ser 10, obtido ${estPosCompra}`);

        // Dois cancelamentos disparados simultaneamente
        const [c1, c2] = await Promise.allSettled([
          axios.post(`${BASE_URL}/compras/${idCompra}/cancelar`, { motivo: 'Cancelamento Concorrente 1' }, authG),
          axios.post(`${BASE_URL}/compras/${idCompra}/cancelar`, { motivo: 'Cancelamento Concorrente 2' }, authG),
        ]);

        const sucessos = [c1, c2].filter(r => r.status === 'fulfilled' && r.value.status === 200);
        const rejeitados = [c1, c2].filter(r => r.status === 'rejected' && r.reason?.response?.status === 400);

        const estFinal = (await Produto.findByPk(prodCompraConcorrente.id_produto)).estoque_atual;

        if (sucessos.length === 1 && rejeitados.length === 1 && estFinal === 5) {
          pass = true;
          detalhe = `Exatamente 1 cancelamento processado e 1 rejeitado (400 já cancelada). Estoque final retornou precisamente para 5 (devolvido uma única vez).`;
        } else {
          detalhe = `Falha: sucessos=${sucessos.length}, rejeitados=${rejeitados.length}, estFinal=${estFinal} (esperado 5)`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CT10', 'Concorrência em Compras: cancelamento concorrente não gera saldo inconsistente', pass, detalhe, Date.now() - start);
    }

    // ─── CT11: Concorrência na numeração de OS: geração paralela de 10 OSs ────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const promessasOS = Array.from({ length: 10 }, (_, i) =>
          axios.post(`${BASE_URL}/ordens-servico`, {
            id_cliente: clienteA.id_cliente,
            id_aparelho: aparelhoA.id_aparelho,
            defeito_relatado: `CT11 Concorrencia OS Paralela #${i + 1}`,
          }, authG).then(r => ({ success: true, numero_os: r.data.numero_os, id: r.data.id_movimentacao }))
            .catch(err => ({ success: false, status: err.response?.status, error: err.response?.data?.error }))
        );

        const resultados = await Promise.all(promessasOS);
        const sucessos = resultados.filter(r => r.success);
        const numerosOS = sucessos.map(r => r.numero_os);
        const numerosUnicos = new Set(numerosOS);

        if (sucessos.length === 10 && numerosUnicos.size === 10) {
          pass = true;
          detalhe = `10 Ordens de Serviço geradas concorrentemente sem colisões. Números obtidos: ${numerosOS.join(', ')}`;
        } else {
          detalhe = `Falha na unicidade: ${sucessos.length}/10 geradas com sucesso; ${numerosUnicos.size} números distintos`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CT11', 'Concorrência na numeração de OS: geração paralela de 10 OSs sem colisão de chave', pass, detalhe, Date.now() - start);
    }

    // ─── CT12: Validação cliente-aparelho na edição de OS (incoerente -> 422) ─
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        await axios.patch(`${BASE_URL}/ordens-servico/${ct07OsId}/status`, {
          id_aparelho: aparelhoB.id_aparelho, // Aparelho do cliente B para OS do cliente A!
        }, authG);
        detalhe = 'Edição de OS vinculando aparelho de outro cliente deveria retornar 422';
      } catch (err) {
        if (err.response?.status === 422 && String(err.response?.data?.error).includes('não pertence ao cliente')) {
          pass = true;
          detalhe = `Rejeitado com 422 Unprocessable Entity: "${err.response.data.error}"`;
        } else {
          detalhe = `Esperado 422, obtido ${err.response?.status}: ${JSON.stringify(err.response?.data)}`;
        }
      }
      record('CT12', 'Validação de coerência cliente-aparelho na edição de OS (aparelho incompatível -> 422)', pass, detalhe, Date.now() - start);
    }

    // ─── CT13: Auditoria do schema SQL e documentação ────────────────────────
    {
      const start = Date.now();
      let pass = false;
      let detalhe = '';
      try {
        const sqlPath = path.resolve(__dirname, '../../tcc/banco_de_dados.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        const checks = [
          {
            desc: 'transferencias_caixa.id_transferencia_estornada ON DELETE RESTRICT',
            ok: /FOREIGN KEY\s*\(id_transferencia_estornada\)\s*REFERENCES\s*transferencias_caixa\(id_transferencia\)\s*ON UPDATE CASCADE ON DELETE RESTRICT/i.test(sqlContent),
          },
          {
            desc: 'caixa.id_transferencia ON DELETE RESTRICT',
            ok: /FOREIGN KEY\s*\(id_transferencia\)\s*REFERENCES\s*transferencias_caixa\(id_transferencia\)\s*ON UPDATE CASCADE ON DELETE RESTRICT/i.test(sqlContent),
          },
          {
            desc: 'caixa.id_lancamento_origem ON DELETE RESTRICT',
            ok: /FOREIGN KEY\s*\(id_lancamento_origem\)\s*REFERENCES\s*caixa\(id_caixa\)\s*ON UPDATE CASCADE ON DELETE RESTRICT/i.test(sqlContent),
          },
          {
            desc: 'caixa_pagamentos.id_caixa ON DELETE RESTRICT',
            ok: /FOREIGN KEY\s*\(id_caixa\)\s*REFERENCES\s*caixa\(id_caixa\)\s*ON UPDATE CASCADE ON DELETE RESTRICT/i.test(sqlContent),
          },
          {
            desc: 'Comentário de expiração OTP (5 minutos)',
            ok: /recuperacao_expira.*5 minutos/i.test(sqlContent),
          },
          {
            desc: 'Comentário de tentativas OTP (máximo 5 tentativas)',
            ok: /recuperacao_tentativas.*5 tentativas/i.test(sqlContent),
          },
        ];

        const falhas = checks.filter(c => !c.ok);
        if (falhas.length === 0) {
          pass = true;
          detalhe = 'Todas as 4 constraints RESTRICT e comentários de OTP conferidos com êxito no schema SQL.';
        } else {
          detalhe = `Falhas na verificação do SQL: ${falhas.map(f => f.desc).join('; ')}`;
        }
      } catch (e) {
        detalhe = e.message;
      }
      record('CT13', 'Auditoria do schema SQL: verificação das 4 constraints RESTRICT e comentários OTP', pass, detalhe, Date.now() - start);
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
      resumo: { total, aprovados, reprovados, taxa_sucesso: `${((aprovados / total) * 100).toFixed(1)}%` },
      casos_de_teste: testResults,
    };

    fs.writeFileSync(REPORT_FILE, JSON.stringify(reportData, null, 2), 'utf8');
    console.log(`Relatório salvo em: ${REPORT_FILE}\n`);

    if (reprovados > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Erro fatal na suíte de testes:', err);
    process.exitCode = 1;
  } finally {
    await new Promise(resolve => server.close(resolve));
    await sequelize.close();
  }
}

if (require.main === module) {
  runConsistenciaSuite();
}

module.exports = runConsistenciaSuite;
