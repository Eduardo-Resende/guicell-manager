/**
 * Testes Automatizados de Autorização e RBAC (Role-Based Access Control)
 * Sistema: Guicell Manager
 * Executa verificações de controle de acesso contra a API local.
 */

'use strict';

process.env.NODE_ENV = 'test';
const path = require('path');
require('../../backend/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });
const http = require('http');
const axios = require('../../backend/node_modules/axios');
const app = require('../../backend/src/app');

async function runRbacTests() {
  console.log('=== INICIANDO TESTES DE AUTORIZAÇÃO E RBAC (GUICELL MANAGER) ===\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const BASE_URL = `http://127.0.0.1:${port}/api`;
  const testHeaders = { 'x-test-bypass-rate-limit': '1' };

  const results = [];

  function record(id, descricao, endpoint, esperado, obtido, detalhes = '') {
    const statusPass = (esperado === obtido);
    results.push({
      id,
      cenario: descricao,
      endpoint,
      statusEsperado: esperado,
      statusObtido: obtido,
      resultado: statusPass ? 'Sucesso (Acesso Bloqueado/Permitido Conforme Regra)' : 'Falha na Validação',
      detalhes,
    });
    console.log(`[${statusPass ? '✔ PASSOU' : '✖ FALHOU'}] Teste #${id}: ${descricao} | Endpoint: ${endpoint} | Esperado: ${esperado} | Obtido: ${obtido}`);
  }

  try {
    // 1. Rota protegida sem token
    try {
      const res = await axios.get(`${BASE_URL}/usuarios`, { headers: testHeaders });
      record(1, 'Acesso à rota protegida de usuários sem token', 'GET /api/usuarios', 401, res.status);
    } catch (err) {
      record(1, 'Acesso à rota protegida de usuários sem token', 'GET /api/usuarios', 401, err.response?.status || 500, err.response?.data?.error);
    }

    try {
      const res = await axios.get(`${BASE_URL}/clientes`, { headers: testHeaders });
      record(2, 'Acesso à rota protegida de clientes sem token', 'GET /api/clientes', 401, res.status);
    } catch (err) {
      record(2, 'Acesso à rota protegida de clientes sem token', 'GET /api/clientes', 401, err.response?.status || 500, err.response?.data?.error);
    }

    // 2. Token inválido / adulterado
    try {
      const res = await axios.get(`${BASE_URL}/usuarios`, {
        headers: { Authorization: 'Bearer token_invalido_ou_adulterado_xyz123', ...testHeaders },
      });
      record(3, 'Acesso com token JWT inválido/adulterado', 'GET /api/usuarios', 401, res.status);
    } catch (err) {
      record(3, 'Acesso com token JWT inválido/adulterado', 'GET /api/usuarios', 401, err.response?.status || 500, err.response?.data?.error);
    }

    // Obter tokens legítimos
    let tokenGerente, tokenAtendente, tokenTecnico;
    try {
      const resG = await axios.post(`${BASE_URL}/auth/login`, { login: 'gerente', senha: 'guicell123' }, { headers: testHeaders });
      tokenGerente = resG.data.token;

      const resA = await axios.post(`${BASE_URL}/auth/login`, { login: 'atendente', senha: 'guicell123' }, { headers: testHeaders });
      tokenAtendente = resA.data.token;

      const resT = await axios.post(`${BASE_URL}/auth/login`, { login: 'tecnico', senha: 'guicell123' }, { headers: testHeaders });
      tokenTecnico = resT.data.token;
    } catch (err) {
      console.error('Falha ao autenticar usuários de teste:', err.message);
      return;
    }

    // 3. Atendente tentando acessar rota de Gerente (Gestão de Usuários)
    try {
      const res = await axios.get(`${BASE_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${tokenAtendente}`, ...testHeaders },
      });
      record(4, 'Atendente tentando acessar listagem de usuários (requer usuarios.gerenciar)', 'GET /api/usuarios', 403, res.status);
    } catch (err) {
      record(4, 'Atendente tentando acessar listagem de usuários (requer usuarios.gerenciar)', 'GET /api/usuarios', 403, err.response?.status || 500, err.response?.data?.error);
    }

    // 4. Atendente acessando configuração de permissões (requer permissoes.configurar)
    try {
      const res = await axios.get(`${BASE_URL}/permissoes/matriz`, {
        headers: { Authorization: `Bearer ${tokenAtendente}`, ...testHeaders },
      });
      record(5, 'Atendente tentando acessar matriz de permissões (requer permissoes.configurar)', 'GET /api/permissoes/matriz', 403, res.status);
    } catch (err) {
      record(5, 'Atendente tentando acessar matriz de permissões (requer permissoes.configurar)', 'GET /api/permissoes/matriz', 403, err.response?.status || 500, err.response?.data?.error);
    }

    // 5. Usuário sem permissão caixa.transferir tentando transferir (Atendente)
    try {
      const res = await axios.post(`${BASE_URL}/caixa/transferencias`, {
        id_conta_origem: 1,
        id_conta_destino: 2,
        valor: 100.00,
        motivo: 'Tentativa indevida de transferência'
      }, {
        headers: { Authorization: `Bearer ${tokenAtendente}`, ...testHeaders },
      });
      record(6, 'Atendente tentando transferir caixa sem permissão caixa.transferir', 'POST /api/caixa/transferencias', 403, res.status);
    } catch (err) {
      record(6, 'Atendente tentando transferir caixa sem permissão caixa.transferir', 'POST /api/caixa/transferencias', 403, err.response?.status || 500, err.response?.data?.error);
    }

    // 6. Técnico tentando criar vendas no PDV (sem permissão vendas.criar)
    try {
      const res = await axios.post(`${BASE_URL}/vendas`, {
        id_cliente: 1,
        itens: [{ id_produto: 1, quantidade: 1, valor_unitario: 10 }],
        forma_pagamento: 'Dinheiro'
      }, {
        headers: { Authorization: `Bearer ${tokenTecnico}`, ...testHeaders },
      });
      record(7, 'Técnico tentando criar venda sem permissão vendas.criar', 'POST /api/vendas', 403, res.status);
    } catch (err) {
      record(7, 'Técnico tentando criar venda sem permissão vendas.criar', 'POST /api/vendas', 403, err.response?.status || 500, err.response?.data?.error);
    }

    // 7. Atendente tentando acessar relatório financeiro de faturamento/caixa
    try {
      const res = await axios.get(`${BASE_URL}/relatorios/caixa`, {
        headers: { Authorization: `Bearer ${tokenAtendente}`, ...testHeaders },
      });
      record(8, 'Atendente tentando acessar relatório financeiro de caixa (requer relatorios.caixa)', 'GET /api/relatorios/caixa', 403, res.status);
    } catch (err) {
      record(8, 'Atendente tentando acessar relatório financeiro de caixa (requer relatorios.caixa)', 'GET /api/relatorios/caixa', 403, err.response?.status || 500, err.response?.data?.error);
    }

    // 8. Burlar chamada DevTools/Postman para alterar perfil de usuário (injetar Gerente)
    try {
      const res = await axios.post(`${BASE_URL}/usuarios`, {
        nome: 'Tentativa Invasão',
        login: 'invasor',
        senha: '123',
        perfil: 'Gerente'
      }, {
        headers: { Authorization: `Bearer ${tokenAtendente}`, ...testHeaders },
      });
      record(9, 'Tentativa de burlar frontend via Postman/DevTools para criar Gerente com token de Atendente', 'POST /api/usuarios', 403, res.status);
    } catch (err) {
      record(9, 'Tentativa de burlar frontend via Postman/DevTools para criar Gerente com token de Atendente', 'POST /api/usuarios', 403, err.response?.status || 500, err.response?.data?.error);
    }

    // 9. Acessos legítimos de Gerente (Verificação de controle positivo)
    try {
      const res = await axios.get(`${BASE_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${tokenGerente}`, ...testHeaders },
      });
      record(10, 'Gerente acessando listagem de usuários (autorizado)', 'GET /api/usuarios', 200, res.status);
    } catch (err) {
      record(10, 'Gerente acessando listagem de usuários (autorizado)', 'GET /api/usuarios', 200, err.response?.status || 500, err.response?.data?.error);
    }

    try {
      const res = await axios.get(`${BASE_URL}/permissoes/matriz`, {
        headers: { Authorization: `Bearer ${tokenGerente}`, ...testHeaders },
      });
      record(11, 'Gerente acessando matriz de permissões (autorizado)', 'GET /api/permissoes/matriz', 200, res.status);
    } catch (err) {
      record(11, 'Gerente acessando matriz de permissões (autorizado)', 'GET /api/permissoes/matriz', 200, err.response?.status || 500, err.response?.data?.error);
    }

    // Grava resultados
    const fs = require('fs');
    fs.writeFileSync(path.resolve(__dirname, 'rbac_results.json'), JSON.stringify(results, null, 2));
    console.log('\nTodos os 11 testes RBAC foram executados com sucesso!');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module) {
  runRbacTests();
}

module.exports = { runRbacTests };
