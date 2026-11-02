const axios = require('../backend/node_modules/axios');

const BASE_URL = 'http://localhost:3001/api';

async function testCancelamentoOS() {
  console.log('=== TESTE DE CANCELAMENTO DE OS COM DEVOLUÇÃO DE ESTOQUE E ESTORNO FINANCEIRO ===\n');

  try {
    // 1. Autenticação
    const resGerente = await axios.post(`${BASE_URL}/auth/login`, { login: 'gerente', senha: 'guicell123' });
    const tokenGerente = resGerente.data.token;
    const authG = { headers: { Authorization: `Bearer ${tokenGerente}` } };

    const resAtendente = await axios.post(`${BASE_URL}/auth/login`, { login: 'atendente', senha: 'guicell123' });
    const tokenAtendente = resAtendente.data.token;
    const authA = { headers: { Authorization: `Bearer ${tokenAtendente}` } };

    console.log('✔ Usuários autenticados com sucesso.');

    // 2. Garantir que o Caixa está aberto
    const statusCaixa = await axios.get(`${BASE_URL}/caixa/status`, authG);
    if (!statusCaixa.data.caixaAberto) {
      console.log('Abrindo turno de caixa para o teste...');
      const infoAbertura = await axios.get(`${BASE_URL}/caixa/abertura-info`, authG);
      const valorEsperado = infoAbertura.data.saldo_esperado !== undefined ? infoAbertura.data.saldo_esperado : 50;
      await axios.post(`${BASE_URL}/caixa/abrir`, { valor_contado: valorEsperado, justificativa: 'Abertura para testes automatizados' }, authG);
    }
    console.log('✔ Sessão de caixa ativa verificada.');

    // 3. Obter um produto e registrar o estoque inicial
    const resProds = await axios.get(`${BASE_URL}/produtos`, authG);
    const produtoTeste = resProds.data[0];
    const prodId = produtoTeste.id_produto;
    const estoqueOriginal = parseInt(produtoTeste.estoque_atual, 10);
    console.log(`✔ Produto para teste: "${produtoTeste.descricao}" (ID ${prodId}) | Estoque original: ${estoqueOriginal}`);

    // 4. Obter um cliente e aparelho válidos
    const resClientes = await axios.get(`${BASE_URL}/clientes`, authG);
    const cliente = resClientes.data[0];
    const resAparelhos = await axios.get(`${BASE_URL}/aparelhos/cliente/${cliente.id_cliente}`, authG);
    let aparelho = resAparelhos.data[0];
    if (!aparelho) {
      const novoAp = await axios.post(`${BASE_URL}/aparelhos`, {
        id_cliente: cliente.id_cliente,
        marca: 'Apple',
        modelo: 'iPhone 13',
        imei: '351234567890123'
      }, authG);
      aparelho = novoAp.data;
    }

    // 5. Criar uma OS de teste
    const resNovaOS = await axios.post(`${BASE_URL}/ordens-servico`, {
      id_cliente: cliente.id_cliente,
      id_aparelho: aparelho.id_aparelho,
      defeito_relatado: 'Tela trincada - teste de cancelamento',
      valor_orcado: 150.00
    }, authG);
    const idOS = resNovaOS.data.id_movimentacao;
    const numOS = resNovaOS.data.numero_os;
    console.log(`✔ OS #${numOS} (ID ${idOS}) criada com sucesso.`);

    // 6. Adicionar 2 unidades da peça na OS (deve debitar 2 do estoque)
    const qtdPecas = 2;
    await axios.patch(`${BASE_URL}/ordens-servico/${idOS}/status`, {
      status: 'Em Reparo',
      diagnostico: 'Substituição de componente',
      itens: [{ id_produto: prodId, quantidade: qtdPecas, valor_unitario: 50.00 }]
    }, authG);

    const resProdAposItem = await axios.get(`${BASE_URL}/produtos/${prodId}`, authG);
    const estoqueAposItem = parseInt(resProdAposItem.data.estoque_atual, 10);
    console.log(`✔ Peças aplicadas na OS. Estoque atualizado para: ${estoqueAposItem} (esperado: ${estoqueOriginal - qtdPecas})`);
    if (estoqueAposItem !== estoqueOriginal - qtdPecas) {
      throw new Error(`Falha no débito de estoque: obtido ${estoqueAposItem}, esperado ${estoqueOriginal - qtdPecas}`);
    }

    // 7. Entregar / Fechar a OS com recebimento em Dinheiro/PIX (gera lançamento de entrada no caixa)
    const valorFechamento = 200.00;
    await axios.post(`${BASE_URL}/ordens-servico/${idOS}/fechar`, {
      valor_final: valorFechamento,
      forma_pagamento: 'PIX',
      itens: [{ id_produto: prodId, quantidade: qtdPecas, valor_unitario: 50.00 }]
    }, authG);
    console.log(`✔ OS entregue e fechada com pagamento de R$ ${valorFechamento} via PIX.`);

    // 8. Teste de Validação 1: Atendente tentando cancelar (sem permissão os.excluir) -> 403
    try {
      await axios.post(`${BASE_URL}/ordens-servico/${idOS}/cancelar`, { motivo: 'Tentativa indevida' }, authA);
      throw new Error('Falha no RBAC: Atendente não deveria conseguir cancelar OS');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✔ Validação RBAC: Atendente bloqueado ao tentar cancelar OS (403 Forbidden).');
      } else {
        throw err;
      }
    }

    // 9. Teste de Validação 2: Cancelamento sem motivo -> 400
    try {
      await axios.post(`${BASE_URL}/ordens-servico/${idOS}/cancelar`, { motivo: '   ' }, authG);
      throw new Error('Falha na validação: cancelamento sem motivo deveria ser rejeitado');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✔ Validação: Cancelamento sem motivo rejeitado (400 Bad Request).');
      } else {
        throw err;
      }
    }

    // 10. Executar o cancelamento legítimo como Gerente
    const motivoReal = 'Aparelho apresentou vício reincidente no display e cliente solicitou devolução integral';
    const resCancel = await axios.post(`${BASE_URL}/ordens-servico/${idOS}/cancelar`, {
      motivo: motivoReal
    }, authG);

    console.log('✔ Requisição de cancelamento executada com sucesso.');
    const osCancelada = resCancel.data;
    console.log(`  - Status da OS: ${osCancelada.status_os} (esperado: Cancelado)`);
    console.log(`  - Status do Pagamento: ${osCancelada.status_pagamento} (esperado: cancelado)`);
    console.log(`  - Motivo gravado: "${osCancelada.motivo_cancelamento}"`);

    if (osCancelada.status_os !== 'Cancelado' || osCancelada.status_pagamento !== 'cancelado') {
      throw new Error('Status da OS não foi alterado para Cancelado');
    }

    // 11. Verificar se o estoque foi devolvido
    const resProdAposCancel = await axios.get(`${BASE_URL}/produtos/${prodId}`, authG);
    const estoqueFinal = parseInt(resProdAposCancel.data.estoque_atual, 10);
    console.log(`✔ Verificação de Estoque: Estoque final é ${estoqueFinal} (esperado: ${estoqueOriginal})`);
    if (estoqueFinal !== estoqueOriginal) {
      throw new Error(`Falha na devolução de estoque: obtido ${estoqueFinal}, esperado ${estoqueOriginal}`);
    }

    // 12. Verificar se o estorno foi lançado no Caixa
    const resCaixaMovs = await axios.get(`${BASE_URL}/caixa`, authG);
    const estornoLancamento = resCaixaMovs.data.find(c =>
      c.id_movimentacao === idOS && c.estorno === true && c.tipo === 'saida'
    );
    if (!estornoLancamento) {
      throw new Error('Falha no Caixa: Não foi localizado o lançamento de estorno da OS cancelada.');
    }
    console.log(`✔ Verificação Financeira: Estorno de saída localizado no Caixa (ID #${estornoLancamento.id_caixa}, Valor: R$ ${parseFloat(estornoLancamento.valor).toFixed(2)})`);

    // 13. Teste de Validação 3: Tentar cancelar novamente a OS já cancelada -> 400
    try {
      await axios.post(`${BASE_URL}/ordens-servico/${idOS}/cancelar`, { motivo: 'Tentativa duplicada' }, authG);
      throw new Error('Falha: cancelamento de OS já cancelada deveria ser rejeitado');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✔ Validação de duplicidade: Rejeitado cancelamento de OS já cancelada (400 Bad Request).');
      } else {
        throw err;
      }
    }

    // 14. Teste de Validação 4: Cancelamento via PATCH /status sem motivo -> 400
    const resNovaOS2 = await axios.post(`${BASE_URL}/ordens-servico`, {
      id_cliente: cliente.id_cliente,
      id_aparelho: aparelho.id_aparelho,
      defeito_relatado: 'Teste PATCH status cancelamento sem motivo',
      valor_orcado: 100.00
    }, authG);
    const idOS2 = resNovaOS2.data.id_movimentacao;

    try {
      await axios.patch(`${BASE_URL}/ordens-servico/${idOS2}/status`, { status: 'Cancelado' }, authG);
      throw new Error('Falha: PATCH /status para Cancelado sem motivo deveria ser rejeitado');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✔ Validação PATCH /status: Rejeitada alteração para Cancelado sem justificativa (400 Bad Request).');
      } else {
        throw err;
      }
    }

    // Cancelar com motivo via PATCH
    await axios.patch(`${BASE_URL}/ordens-servico/${idOS2}/status`, {
      status: 'Cancelado',
      motivo: 'Cancelamento via painel com justificativa válida'
    }, authG);
    console.log('✔ PATCH /status para Cancelado com justificativa aceito com sucesso.');

    console.log('\n============================================================');
    console.log('🎉 TODOS OS TESTES DE CANCELAMENTO DE OS FORAM APROVADOS!');
    console.log('============================================================');

  } catch (err) {
    console.error('\n❌ ERRO NO TESTE:', err.response?.data || err.message);
    process.exit(1);
  }
}

testCancelamentoOS();
