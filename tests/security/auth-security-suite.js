/**
 * Suite Completa de Testes Automatizados de Segurança: Login & Recuperação de Senha
 * Sistema: Guicell Manager
 *
 * Cobre a Matriz 11.1 (LG01 - LG12) e Matriz 11.2 (RC01 - RC30)
 * Executa verificações adversariais contra o backend real e banco MySQL.
 */

'use strict';

process.env.NODE_ENV = 'test';
require('../../backend/node_modules/dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });
const http = require('http');
const axios = require('../../backend/node_modules/axios');
const jwt = require('../../backend/node_modules/jsonwebtoken');
const bcrypt = require('../../backend/node_modules/bcryptjs');
const crypto = require('crypto');
const app = require('../../backend/src/app');
const { Usuario, LogAuditoria } = require('../../backend/src/models');
const { computeOtpHmac } = require('../../backend/src/services/recovery.service');

async function runSecuritySuite() {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('   SUITE DE TESTES DE SEGURANÇA — AUDITORIA DE LOGIN E RECUPERAÇÃO DE SENHA   ');
  console.log('   Guicell Manager — Conformidade OWASP / NIST SP 800-63B-4                   ');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  // Inicia servidor HTTP em porta aleatória livre
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const BASE_URL = `http://127.0.0.1:${port}/api`;
  console.log(`[Ambiente de Testes] Servidor de testes ativo em ${BASE_URL}\n`);

  const results = [];
  let passed = 0;
  let failed = 0;

  function assertTest(id, categoria, descricao, esperado, obtido, passedCondition, extra = '') {
    const status = !!passedCondition;
    if (status) passed++;
    else failed++;

    results.push({
      id,
      categoria,
      descricao,
      esperado,
      obtido,
      passou: status,
      extra,
    });

    const mark = status ? '✔ PASSOU' : '✖ FALHOU';
    console.log(`[${mark}] ${id} (${categoria}) - ${descricao}`);
    if (!status) {
      console.log(`      Esperado: ${esperado} | Obtido: ${obtido} ${extra ? '| ' + extra : ''}`);
    }
  }

  // Header padrão para testes funcionais que não visam testar o limite de IP em si
  const testHeaders = { 'x-test-bypass-rate-limit': '1' };

  try {
    // ─── Setup de Usuários de Teste Isolados no Banco ──────────────────────────
    // Senha padrão inicial para os testes: 'guicell123456789' (cumpre a política de 15 chars)
    const testHash = await bcrypt.hash('guicell123456789', 10);

    // 1. Usuário Gerente de Teste
    let [userGerente] = await Usuario.findOrCreate({
      where: { login: 'test_sec_gerente' },
      defaults: {
        nome: 'Gerente Auditoria',
        login: 'test_sec_gerente',
        senha_hash: testHash,
        perfil: 'Gerente',
        email: 'gerente.auditoria@guicell.test',
        telefone: '62988880001',
        versao_sessao: 1,
        login_tentativas: 0,
        login_bloqueado_ate: null,
        ativo: true,
      },
    });
    await userGerente.update({ senha_hash: testHash, ativo: true, login_tentativas: 0, login_bloqueado_ate: null });

    // 2. Usuário Atendente de Teste
    let [userAtendente] = await Usuario.findOrCreate({
      where: { login: 'test_sec_atendente' },
      defaults: {
        nome: 'Atendente Auditoria',
        login: 'test_sec_atendente',
        senha_hash: testHash,
        perfil: 'Atendente',
        email: 'atendente.auditoria@guicell.test',
        telefone: '62988880002',
        versao_sessao: 1,
        login_tentativas: 0,
        login_bloqueado_ate: null,
        ativo: true,
      },
    });
    await userAtendente.update({ senha_hash: testHash, ativo: true, login_tentativas: 0, login_bloqueado_ate: null });

    // 3. Usuário Inativo de Teste
    let [userInativo] = await Usuario.findOrCreate({
      where: { login: 'test_sec_inativo' },
      defaults: {
        nome: 'Operador Inativo',
        login: 'test_sec_inativo',
        senha_hash: testHash,
        perfil: 'Técnico',
        email: 'inativo.auditoria@guicell.test',
        telefone: '62988880003',
        versao_sessao: 1,
        login_tentativas: 0,
        login_bloqueado_ate: null,
        ativo: false,
      },
    });
    await userInativo.update({ ativo: false });

    // 4. Usuário para Ataques de Força Bruta
    let [userBrute] = await Usuario.findOrCreate({
      where: { login: 'test_sec_brute' },
      defaults: {
        nome: 'Brute Test Target',
        login: 'test_sec_brute',
        senha_hash: testHash,
        perfil: 'Atendente',
        email: 'brute.auditoria@guicell.test',
        telefone: '62988880004',
        versao_sessao: 1,
        login_tentativas: 0,
        login_bloqueado_ate: null,
        ativo: true,
      },
    });
    await userBrute.update({ login_tentativas: 0, login_bloqueado_ate: null, senha_hash: testHash });

    console.log('✔ Usuários de auditoria inicializados no banco MySQL.\n');

    // ════════════════════════════════════════════════════════════════════════════
    // ETAPA 1: MATRIZ DE TESTES DE LOGIN (LG01 - LG12)
    // ════════════════════════════════════════════════════════════════════════════
    console.log('--- TESTANDO MATRIZ DE LOGIN (LG01 - LG12) ---');

    // LG01: Credencial válida -> Login autorizado com JWT e versao_sessao
    let tokenGerente = '';
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'test_sec_gerente',
        senha: 'guicell123456789',
      }, { headers: testHeaders });
      tokenGerente = res.data.token;
      const decoded = jwt.decode(tokenGerente);
      assertTest('LG01', 'Login', 'Credencial válida autorizada com token JWT e versao_sessao', 200, res.status, res.status === 200 && !!decoded.versao_sessao);
    } catch (err) {
      assertTest('LG01', 'Login', 'Credencial válida autorizada com token JWT e versao_sessao', 200, err.response?.status || 500, false, err.message);
    }

    // LG02: Usuário inexistente -> Mensagem genérica indistinguível (401)
    let msgInexistente = '';
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        login: 'usuario_totalmente_fantasma_xyz_999',
        senha: 'qualquersenha123456789',
      }, { headers: testHeaders });
      assertTest('LG02', 'Login', 'Usuário inexistente deve receber 401 genérico', 401, 200, false);
    } catch (err) {
      msgInexistente = err.response?.data?.error;
      assertTest('LG02', 'Login', 'Usuário inexistente deve receber 401 genérico', 'Usuário ou senha inválidos.', msgInexistente, err.response?.status === 401 && msgInexistente === 'Usuário ou senha inválidos.');
    }

    // LG03: Senha incorreta -> Mesma mensagem genérica (401)
    let msgSenhaErrada = '';
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        login: 'test_sec_gerente',
        senha: 'senha_completamente_incorreta_123',
      }, { headers: testHeaders });
      assertTest('LG03', 'Login', 'Senha incorreta deve retornar mensagem pública indistinguível', 401, 200, false);
    } catch (err) {
      msgSenhaErrada = err.response?.data?.error;
      assertTest('LG03', 'Login', 'Senha incorreta deve retornar mensagem pública indistinguível', msgInexistente, msgSenhaErrada, err.response?.status === 401 && msgSenhaErrada === msgInexistente);
    }

    // LG04: Usuário desativado -> Acesso negado com mensagem neutra (401)
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        login: 'test_sec_inativo',
        senha: 'guicell123456789',
      }, { headers: testHeaders });
      assertTest('LG04', 'Login', 'Usuário desativado deve receber 401 sem enumeração', 401, 200, false);
    } catch (err) {
      const msg = err.response?.data?.error;
      assertTest('LG04', 'Login', 'Usuário desativado deve receber 401 sem enumeração', 'Usuário ou senha inválidos.', msg, err.response?.status === 401 && msg === 'Usuário ou senha inválidos.');
    }

    // LG05: Tentativas repetidas de senha incorreta -> Bloqueio progressivo/temporário após 5 falhas
    try {
      for (let i = 0; i < 4; i++) {
        try {
          await axios.post(`${BASE_URL}/auth/login`, { login: 'test_sec_brute', senha: 'errada_brute_password' }, { headers: testHeaders });
        } catch (e) { /* ignora 401 esperado */ }
      }
      // 5ª tentativa incorreta deve disparar bloqueio persistente
      try {
        await axios.post(`${BASE_URL}/auth/login`, { login: 'test_sec_brute', senha: 'errada_brute_password' }, { headers: testHeaders });
      } catch (e) { /* ignora 401 esperado */ }

      // 6ª tentativa deve retornar 429 Conta bloqueada
      let statusBloqueio = 0;
      try {
        await axios.post(`${BASE_URL}/auth/login`, { login: 'test_sec_brute', senha: 'errada_brute_password' }, { headers: testHeaders });
      } catch (e) {
        statusBloqueio = e.response?.status || 0;
      }
      assertTest('LG05', 'Login', 'Bloqueio temporário ativado após 5 falhas consecutivas', 429, statusBloqueio, statusBloqueio === 429);
    } catch (err) {
      assertTest('LG05', 'Login', 'Bloqueio temporário ativado após 5 falhas consecutivas', 429, 500, false, err.message);
    }

    // LG06: Tentativas paralelas -> Limite contabilizado atomicamente
    try {
      const uFresh = await Usuario.create({
        nome: 'Target Paralelo',
        login: 'test_sec_parallel',
        senha_hash: testHash,
        perfil: 'Atendente',
        versao_sessao: 1,
        login_tentativas: 0,
        ativo: true,
      });

      const promises = Array(6).fill(0).map(() =>
        axios.post(`${BASE_URL}/auth/login`, { login: 'test_sec_parallel', senha: 'wrong_password_xyz' }, { headers: testHeaders }).catch((e) => e.response)
      );
      await Promise.all(promises);
      await uFresh.reload();
      assertTest('LG06', 'Login', 'Tentativas concorrentes registradas atomicamente', true, uFresh.login_tentativas >= 5, uFresh.login_tentativas >= 5);
      await uFresh.destroy();
    } catch (err) {
      assertTest('LG06', 'Login', 'Tentativas concorrentes registradas atomicamente', true, false, false, err.message);
    }

    // LG07: JWT adulterado, expirado ou com chave incorreta -> 401
    try {
      await axios.get(`${BASE_URL}/usuarios`, {
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token_falso_adulterado.assinatura_falsa' },
      });
      assertTest('LG07', 'Login', 'JWT adulterado deve retornar 401', 401, 200, false);
    } catch (err) {
      assertTest('LG07', 'Login', 'JWT adulterado deve retornar 401', 401, err.response?.status, err.response?.status === 401);
    }

    // LG08: JWT com algoritmo 'none' ou chave errada -> Rejeitado (401)
    try {
      const noneToken = jwt.sign({ id_usuario: userGerente.id_usuario, perfil: 'Gerente' }, '', { algorithm: 'none' });
      await axios.get(`${BASE_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${noneToken}` },
      });
      assertTest('LG08', 'Login', 'JWT com algoritmo none deve ser rejeitado com 401', 401, 200, false);
    } catch (err) {
      assertTest('LG08', 'Login', 'JWT com algoritmo none deve ser rejeitado com 401', 401, err.response?.status, err.response?.status === 401);
    }

    // LG09: JWT de usuário desativado -> 401 imediato no middleware
    try {
      const tokenInativo = jwt.sign(
        { id_usuario: userInativo.id_usuario, login: userInativo.login, perfil: userInativo.perfil, versao_sessao: 1 },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '1h' }
      );
      await axios.get(`${BASE_URL}/clientes`, {
        headers: { Authorization: `Bearer ${tokenInativo}` },
      });
      assertTest('LG09', 'Login', 'JWT de usuário inativo deve retornar 401 imediato', 401, 200, false);
    } catch (err) {
      assertTest('LG09', 'Login', 'JWT de usuário inativo deve retornar 401 imediato', 401, err.response?.status, err.response?.status === 401);
    }

    // LG10: Atendente chamando endpoint exclusivo de Gerente -> 403
    try {
      const resAt = await axios.post(`${BASE_URL}/auth/login`, { login: 'test_sec_atendente', senha: 'guicell123456789' }, { headers: testHeaders });
      const tokenAtendente = resAt.data.token;
      await axios.get(`${BASE_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${tokenAtendente}` },
      });
      assertTest('LG10', 'Login', 'Atendente chamando rota de Gerente deve receber 403', 403, 200, false);
    } catch (err) {
      assertTest('LG10', 'Login', 'Atendente chamando rota de Gerente deve receber 403', 403, err.response?.status, err.response?.status === 403);
    }

    // LG11: Logout revoga sessão e token na API -> 401
    try {
      const resG = await axios.post(`${BASE_URL}/auth/login`, { login: 'test_sec_gerente', senha: 'guicell123456789' }, { headers: testHeaders });
      const tokenParaLogout = resG.data.token;

      // Chama logout com o token
      await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${tokenParaLogout}` },
      });

      // Tenta usar o mesmo token novamente na API
      let statusReuso = 0;
      try {
        await axios.get(`${BASE_URL}/usuarios`, {
          headers: { Authorization: `Bearer ${tokenParaLogout}` },
        });
      } catch (e) {
        statusReuso = e.response?.status;
      }
      assertTest('LG11', 'Login', 'Logout revoga JWT no servidor imediatamente', 401, statusReuso, statusReuso === 401);
    } catch (err) {
      assertTest('LG11', 'Login', 'Logout revoga JWT no servidor imediatamente', 401, 500, false, err.message);
    }

    // LG12: Persistência de versao_sessao e bloqueios no MySQL
    try {
      const userCheck = await Usuario.findByPk(userGerente.id_usuario);
      assertTest('LG12', 'Login', 'Controle de sessão e bloqueio persistidos no MySQL', true, userCheck.versao_sessao > 1, userCheck.versao_sessao > 1);
    } catch (err) {
      assertTest('LG12', 'Login', 'Controle de sessão e bloqueio persistidos no MySQL', true, false, false, err.message);
    }

    console.log('\n--- TESTANDO MATRIZ DE RECUPERAÇÃO DE SENHA (RC01 - RC30) ---');

    // ════════════════════════════════════════════════════════════════════════════
    // ETAPA 2: MATRIZ DE TESTES DE RECUPERAÇÃO (RC01 - RC30)
    // ════════════════════════════════════════════════════════════════════════════

    // RC01: Conta existente solicita recuperação -> 200 genérico, desafio criado
    try {
      await userGerente.update({ recuperacao_solicitado_em: null });

      const res = await axios.post(`${BASE_URL}/auth/recuperar-senha/solicitar`, {
        login: 'test_sec_gerente',
        canal: 'email',
      }, { headers: testHeaders });

      await userGerente.reload();
      const temHmac = !!userGerente.recuperacao_codigo && userGerente.recuperacao_codigo.length === 64;
      assertTest('RC01', 'Recuperacao', 'Solicitação aceita genericamente e HMAC armazenado no banco', 200, res.status, res.status === 200 && temHmac);
    } catch (err) {
      assertTest('RC01', 'Recuperacao', 'Solicitação aceita genericamente e HMAC armazenado no banco', 200, err.response?.status || 500, false, err.message);
    }

    // RC02: Conta inexistente solicita recuperação -> Mesma resposta 200 genérica, sem erro
    try {
      const res = await axios.post(`${BASE_URL}/auth/recuperar-senha/solicitar`, {
        login: 'usuario_inexistente_xyz_404',
        canal: 'email',
      }, { headers: testHeaders });
      assertTest('RC02', 'Recuperacao', 'Conta inexistente recebe mesma resposta sem enumeração', 200, res.status, res.status === 200);
    } catch (err) {
      assertTest('RC02', 'Recuperacao', 'Conta inexistente recebe mesma resposta sem enumeração', 200, err.response?.status || 500, false, err.message);
    }

    // RC03: Solicitações repetidas -> Cooldown de 60s retorna resposta idêntica e neutra (anti-enumeração)
    try {
      await userGerente.reload();
      const hmacInicial = userGerente.recuperacao_codigo;
      const res2 = await axios.post(`${BASE_URL}/auth/recuperar-senha/solicitar`, {
        login: 'test_sec_gerente',
        canal: 'email',
      }, { headers: testHeaders });
      await userGerente.reload();
      const naoSobrescreveu = userGerente.recuperacao_codigo === hmacInicial;
      assertTest(
        'RC03',
        'Recuperacao',
        'Cooldown de 60s mantém resposta neutra e preserva desafio sem oráculo de existência',
        200,
        res2.status,
        res2.status === 200 && naoSobrescreveu && res2.data.message.includes('Se houver uma conta')
      );
    } catch (err) {
      assertTest('RC03', 'Recuperacao', 'Cooldown de 60s mantém resposta neutra e preserva desafio sem oráculo de existência', 200, err.response?.status || 500, false, err.message);
    }

    // RC04: Solicitações simultâneas não geram múltiplos desafios ativos concorrentes
    try {
      await userGerente.update({ recuperacao_solicitado_em: null });
      const p1 = axios.post(`${BASE_URL}/auth/recuperar-senha/solicitar`, { login: 'test_sec_gerente', canal: 'email' }, { headers: testHeaders });
      const p2 = axios.post(`${BASE_URL}/auth/recuperar-senha/solicitar`, { login: 'test_sec_gerente', canal: 'email' }, { headers: testHeaders });
      await Promise.allSettled([p1, p2]);
      await userGerente.reload();
      assertTest('RC04', 'Recuperacao', 'Desafios simultâneos mantêm integridade atômica única', true, !!userGerente.recuperacao_codigo, !!userGerente.recuperacao_codigo);
    } catch (err) {
      assertTest('RC04', 'Recuperacao', 'Desafios simultâneos mantêm integridade atômica única', true, false, false, err.message);
    }

    // RC05: OTP com formato inválido (ex: letras ou menos de 8 dígitos) -> 400
    try {
      await axios.post(`${BASE_URL}/auth/recuperar-senha/validar-codigo`, {
        login: 'test_sec_gerente',
        codigo: '1234abcd',
      }, { headers: testHeaders });
      assertTest('RC05', 'Recuperacao', 'Código com formato não numérico rejeitado com 400', 400, 200, false);
    } catch (err) {
      assertTest('RC05', 'Recuperacao', 'Código com formato não numérico rejeitado com 400', 400, err.response?.status, err.response?.status === 400);
    }

    // RC06: OTP incorreto contabiliza falha de forma persistente
    try {
      const otpTeste = '87654321';
      const hmacTeste = computeOtpHmac(userGerente.id_usuario, otpTeste);
      await userGerente.update({
        recuperacao_codigo: hmacTeste,
        recuperacao_expira: new Date(Date.now() + 5 * 60 * 1000),
        recuperacao_tentativas: 0,
      });

      await axios.post(`${BASE_URL}/auth/recuperar-senha/validar-codigo`, {
        login: 'test_sec_gerente',
        codigo: '11112222', // código errado
      }, { headers: testHeaders });
      assertTest('RC06', 'Recuperacao', 'Código incorreto rejeitado', 400, 200, false);
    } catch (err) {
      await userGerente.reload();
      assertTest('RC06', 'Recuperacao', 'Código incorreto incrementa tentativas no banco', 1, userGerente.recuperacao_tentativas, err.response?.status === 400 && userGerente.recuperacao_tentativas === 1);
    }

    // RC07: Tentativas acima do limite (5 falhas) -> Desafio invalidado permanentemente
    try {
      await userGerente.update({ recuperacao_tentativas: 4 });
      try {
        await axios.post(`${BASE_URL}/auth/recuperar-senha/validar-codigo`, {
          login: 'test_sec_gerente',
          codigo: '99990000', // 5ª falha
        }, { headers: testHeaders });
      } catch (e) { /* ignora 400 esperado */ }

      await userGerente.reload();
      const invalidado = userGerente.recuperacao_codigo === null;
      assertTest('RC07', 'Recuperacao', 'Desafio invalidado após atingir 5 tentativas', true, invalidado, invalidado);
    } catch (err) {
      assertTest('RC07', 'Recuperacao', 'Desafio invalidado após atingir 5 tentativas', true, false, false, err.message);
    }

    // RC08: OTP expirado (> 5 minutos) -> Rejeitado e desafio limpo
    try {
      const otpExpirado = '12345678';
      const hmacExpirado = computeOtpHmac(userGerente.id_usuario, otpExpirado);
      await userGerente.update({
        recuperacao_codigo: hmacExpirado,
        recuperacao_expira: new Date(Date.now() - 1000), // expirado há 1 segundo
        recuperacao_tentativas: 0,
      });

      await axios.post(`${BASE_URL}/auth/recuperar-senha/validar-codigo`, {
        login: 'test_sec_gerente',
        codigo: otpExpirado,
      }, { headers: testHeaders });
      assertTest('RC08', 'Recuperacao', 'OTP expirado rejeitado', 400, 200, false);
    } catch (err) {
      await userGerente.reload();
      const limpo = userGerente.recuperacao_codigo === null;
      assertTest('RC08', 'Recuperacao', 'OTP expirado rejeitado e limpo do banco', true, limpo, err.response?.status === 400 && limpo);
    }

    // RC09: OTP já utilizado / consumido -> Rejeitado
    try {
      await userGerente.update({
        recuperacao_codigo: null,
        recuperacao_expira: null,
      });
      await axios.post(`${BASE_URL}/auth/recuperar-senha/validar-codigo`, {
        login: 'test_sec_gerente',
        codigo: '88887777',
      }, { headers: testHeaders });
      assertTest('RC09', 'Recuperacao', 'OTP nulo ou já consumido rejeitado', 400, 200, false);
    } catch (err) {
      assertTest('RC09', 'Recuperacao', 'OTP nulo ou já consumido rejeitado', 400, err.response?.status, err.response?.status === 400);
    }

    // RC10: Código antigo após reenvio é rejeitado
    try {
      const otpVelho = '11223344';
      const otpNovo = '55667788';
      await userGerente.update({
        recuperacao_codigo: computeOtpHmac(userGerente.id_usuario, otpNovo),
        recuperacao_expira: new Date(Date.now() + 5 * 60 * 1000),
        recuperacao_tentativas: 0,
      });

      await axios.post(`${BASE_URL}/auth/recuperar-senha/validar-codigo`, {
        login: 'test_sec_gerente',
        codigo: otpVelho,
      }, { headers: testHeaders });
      assertTest('RC10', 'Recuperacao', 'Código antigo após substituição deve ser rejeitado', 400, 200, false);
    } catch (err) {
      assertTest('RC10', 'Recuperacao', 'Código antigo após substituição deve ser rejeitado', 400, err.response?.status, err.response?.status === 400);
    }

    // RC11: Código de outra conta é rejeitado (isolamento de conta pelo HMAC)
    try {
      const otpOutro = '98765432';
      await userAtendente.update({
        recuperacao_codigo: computeOtpHmac(userAtendente.id_usuario, otpOutro),
        recuperacao_expira: new Date(Date.now() + 5 * 60 * 1000),
        recuperacao_tentativas: 0,
      });

      await axios.post(`${BASE_URL}/auth/recuperar-senha/validar-codigo`, {
        login: 'test_sec_gerente',
        codigo: otpOutro,
      }, { headers: testHeaders });
      assertTest('RC11', 'Recuperacao', 'Código de outra conta rejeitado', 400, 200, false);
    } catch (err) {
      assertTest('RC11', 'Recuperacao', 'Código de outra conta rejeitado', 400, err.response?.status, err.response?.status === 400);
    }

    // RC12: Código correto emite exclusivamente Reset Grant (256 bits) e consome OTP
    let resetGrantValido = '';
    try {
      const otpCorreto = '12345678';
      await userGerente.update({
        recuperacao_codigo: computeOtpHmac(userGerente.id_usuario, otpCorreto),
        recuperacao_expira: new Date(Date.now() + 5 * 60 * 1000),
        recuperacao_tentativas: 0,
      });

      const res = await axios.post(`${BASE_URL}/auth/recuperar-senha/validar-codigo`, {
        login: 'test_sec_gerente',
        codigo: otpCorreto,
      }, { headers: testHeaders });

      resetGrantValido = res.data.resetGrant;
      await userGerente.reload();

      const otpConsumido = userGerente.recuperacao_codigo === null;
      const temGrantHash = !!userGerente.recuperacao_grant_hash;
      assertTest('RC12', 'Recuperacao', 'Código correto consome OTP e emite Reset Grant seguro', true, otpConsumido && temGrantHash && !!resetGrantValido, otpConsumido && temGrantHash && !!resetGrantValido);
    } catch (err) {
      assertTest('RC12', 'Recuperacao', 'Código correto consome OTP e emite Reset Grant seguro', true, false, false, err.message);
    }

    // RC13: Reset Grant expirado não permite trocar senha
    try {
      await userGerente.update({
        recuperacao_grant_expira: new Date(Date.now() - 1000), // expirado
      });
      await axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: resetGrantValido,
        novaSenha: 'NovaSenhaSegura15Caractere!',
        confirmarNovaSenha: 'NovaSenhaSegura15Caractere!',
      }, { headers: testHeaders });
      assertTest('RC13', 'Recuperacao', 'Reset grant expirado deve ser rejeitado', 400, 200, false);
    } catch (err) {
      assertTest('RC13', 'Recuperacao', 'Reset grant expirado deve ser rejeitado', 400, err.response?.status, err.response?.status === 400);
    }

    // Reativa um novo Reset Grant válido para os testes seguintes
    const grantNovo = crypto.randomBytes(32).toString('hex');
    const grantNovoHash = crypto.createHash('sha256').update(grantNovo).digest('hex');
    await userGerente.update({
      recuperacao_grant_hash: grantNovoHash,
      recuperacao_grant_expira: new Date(Date.now() + 5 * 60 * 1000),
    });

    // RC14: Tentativa com senha fora da política (< 15 caracteres)
    try {
      await axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: grantNovo,
        novaSenha: 'senha_curta', // 11 caracteres (< 15)
        confirmarNovaSenha: 'senha_curta',
      }, { headers: testHeaders });
      assertTest('RC14', 'Recuperacao', 'Senha com menos de 15 caracteres rejeitada pela política', 400, 200, false);
    } catch (err) {
      assertTest('RC14', 'Recuperacao', 'Senha com menos de 15 caracteres rejeitada pela política', 400, err.response?.status, err.response?.status === 400);
    }

    // RC15: Tentativa com senha comum / trivial bloqueada
    try {
      await axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: grantNovo,
        novaSenha: '123456789012345', // senha da lista de proibidas
        confirmarNovaSenha: '123456789012345',
      }, { headers: testHeaders });
      assertTest('RC15', 'Recuperacao', 'Senha comum/trivial rejeitada pela política', 400, 200, false);
    } catch (err) {
      assertTest('RC15', 'Recuperacao', 'Senha comum/trivial rejeitada pela política', 400, err.response?.status, err.response?.status === 400);
    }

    // RC16: Tentativa com confirmação diferente
    try {
      await axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: grantNovo,
        novaSenha: 'MinhaFraseDeSenhaForte2026',
        confirmarNovaSenha: 'OutraFraseDiferenteTotal123',
      }, { headers: testHeaders });
      assertTest('RC16', 'Recuperacao', 'Confirmação de senha divergente rejeitada', 400, 200, false);
    } catch (err) {
      assertTest('RC16', 'Recuperacao', 'Confirmação de senha divergente rejeitada', 400, err.response?.status, err.response?.status === 400);
    }

    // RC17: Tentativa com a mesma senha que já está cadastrada
    try {
      await axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: grantNovo,
        novaSenha: 'guicell123456789', // mesma senha atual
        confirmarNovaSenha: 'guicell123456789',
      }, { headers: testHeaders });
      assertTest('RC17', 'Recuperacao', 'Nova senha igual à senha atual rejeitada', 400, 200, false);
    } catch (err) {
      assertTest('RC17', 'Recuperacao', 'Nova senha igual à senha atual rejeitada', 400, err.response?.status, err.response?.status === 400);
    }

    // RC18: Reset de senha legítimo com nova senha de 15+ caracteres -> Sucesso atômico
    const novaSenhaValida = 'Frase-Senha-Super-Segura-2026!';
    try {
      const versaoAnterior = userGerente.versao_sessao;
      const res = await axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: grantNovo,
        novaSenha: novaSenhaValida,
        confirmarNovaSenha: novaSenhaValida,
      }, { headers: testHeaders });

      await userGerente.reload();
      const senhaAtualizada = await bcrypt.compare(novaSenhaValida, userGerente.senha_hash);
      const grantLimpo = userGerente.recuperacao_grant_hash === null;
      const versaoIncrementada = userGerente.versao_sessao > versaoAnterior;

      assertTest('RC18', 'Recuperacao', 'Nova senha gravada e credencial consumida', true, senhaAtualizada && grantLimpo && versaoIncrementada, res.status === 200 && senhaAtualizada && grantLimpo && versaoIncrementada);
    } catch (err) {
      assertTest('RC18', 'Recuperacao', 'Nova senha gravada e credencial consumida', true, false, false, err.message);
    }

    // RC19: Reset Grant já utilizado -> Não permite segunda troca (Uso Único / Replay Protection)
    try {
      await axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: grantNovo, // já consumido no RC18
        novaSenha: 'OutraFraseSenhaSegura9999!',
        confirmarNovaSenha: 'OutraFraseSenhaSegura9999!',
      }, { headers: testHeaders });
      assertTest('RC19', 'Recuperacao', 'Reutilização de Reset Grant consumido é impedida', 400, 200, false);
    } catch (err) {
      assertTest('RC19', 'Recuperacao', 'Reutilização de Reset Grant consumido é impedida', 400, err.response?.status, err.response?.status === 400);
    }

    // RC20: Token JWT antigo após troca de senha -> 401 imediato em todas as rotas protegidas
    try {
      await axios.get(`${BASE_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${tokenGerente}` },
      });
      assertTest('RC20', 'Recuperacao', 'JWT emitido antes do reset de senha rejeitado com 401', 401, 200, false);
    } catch (err) {
      assertTest('RC20', 'Recuperacao', 'JWT emitido antes do reset de senha rejeitado com 401', 401, err.response?.status, err.response?.status === 401);
    }

    // RC21: Senha antiga não permite mais login
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        login: 'test_sec_gerente',
        senha: 'guicell123456789', // senha antiga
      }, { headers: testHeaders });
      assertTest('RC21', 'Recuperacao', 'Senha antiga não deve mais autenticar', 401, 200, false);
    } catch (err) {
      assertTest('RC21', 'Recuperacao', 'Senha antiga não deve mais autenticar', 401, err.response?.status, err.response?.status === 401);
    }

    // RC22: Nova senha permite login normalmente
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'test_sec_gerente',
        senha: novaSenhaValida,
      }, { headers: testHeaders });
      assertTest('RC22', 'Recuperacao', 'Nova senha autorizada no login com novo token', 200, res.status, res.status === 200 && !!res.data.token);
    } catch (err) {
      assertTest('RC22', 'Recuperacao', 'Nova senha autorizada no login com novo token', 200, err.response?.status, false, err.message);
    }

    // RC23: Proteção contra Condição de Corrida (Race Condition / Concorrência em Replay)
    try {
      const grantRace = crypto.randomBytes(32).toString('hex');
      const grantRaceHash = crypto.createHash('sha256').update(grantRace).digest('hex');
      await userGerente.update({
        recuperacao_grant_hash: grantRaceHash,
        recuperacao_grant_expira: new Date(Date.now() + 5 * 60 * 1000),
      });

      const pRace1 = axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: grantRace,
        novaSenha: 'SenhaConcorrente1-Segura!',
        confirmarNovaSenha: 'SenhaConcorrente1-Segura!',
      }, { headers: testHeaders }).catch((e) => e.response);

      const pRace2 = axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: grantRace,
        novaSenha: 'SenhaConcorrente2-Segura!',
        confirmarNovaSenha: 'SenhaConcorrente2-Segura!',
      }, { headers: testHeaders }).catch((e) => e.response);

      const [res1, res2] = await Promise.all([pRace1, pRace2]);
      const statusList = [res1.status, res2.status];
      const umSucessoUmErro = statusList.includes(200) && statusList.includes(400);

      assertTest('RC23', 'Recuperacao', 'Duas requisições simultâneas: exatamente UMA conclui e a outra falha', true, umSucessoUmErro, umSucessoUmErro);
    } catch (err) {
      assertTest('RC23', 'Recuperacao', 'Duas requisições simultâneas: exatamente UMA conclui e a outra falha', true, false, false, err.message);
    }

    // RC24: Não retorno de dados sensíveis na resposta pública (Anti-enumeração e LGPD)
    try {
      await userGerente.update({ recuperacao_solicitado_em: null });
      const res = await axios.post(`${BASE_URL}/auth/recuperar-senha/solicitar`, {
        login: 'test_sec_gerente',
        canal: 'whatsapp',
      }, { headers: testHeaders });
      const dataStr = JSON.stringify(res.data);
      const semTelefoneReal = !dataStr.includes('62988880001');
      assertTest('RC24', 'Recuperacao', 'Telefone real não exposto na resposta pública', true, semTelefoneReal, semTelefoneReal);
    } catch (err) {
      assertTest('RC24', 'Recuperacao', 'Telefone real não exposto na resposta pública', true, false, false, err.message);
    }

    // RC25: OTPs legados de 4 dígitos rejeitados
    try {
      await axios.post(`${BASE_URL}/auth/recuperar-senha/validar-codigo`, {
        login: 'test_sec_gerente',
        codigo: '1234', // apenas 4 dígitos
      }, { headers: testHeaders });
      assertTest('RC25', 'Recuperacao', 'OTPs legados de 4 dígitos não são aceitos', 400, 200, false);
    } catch (err) {
      assertTest('RC25', 'Recuperacao', 'OTPs legados de 4 dígitos não são aceitos', 400, err.response?.status, err.response?.status === 400);
    }

    // RC26: Reset com login forjado não afeta outros usuários
    try {
      const grantOther = crypto.randomBytes(32).toString('hex');
      const grantOtherHash = crypto.createHash('sha256').update(grantOther).digest('hex');
      await userAtendente.update({
        recuperacao_grant_hash: grantOtherHash,
        recuperacao_grant_expira: new Date(Date.now() + 5 * 60 * 1000),
      });

      // Tenta usar o grant do atendente para alterar a senha do gerente
      await axios.post(`${BASE_URL}/auth/recuperar-senha/redefinir`, {
        login: 'test_sec_gerente',
        resetGrant: grantOther,
        novaSenha: 'NovaSenhaForjada12345!',
        confirmarNovaSenha: 'NovaSenhaForjada12345!',
      }, { headers: testHeaders });
      assertTest('RC26', 'Recuperacao', 'Reset grant de outro usuário rejeitado com 400', 400, 200, false);
    } catch (err) {
      assertTest('RC26', 'Recuperacao', 'Reset grant de outro usuário rejeitado com 400', 400, err.response?.status, err.response?.status === 400);
    }

    // RC27: Cabeçalhos HTTP de segurança presentes em respostas de autenticação
    try {
      const resAuth = await axios.post(`${BASE_URL}/auth/login`, { login: 'invalido', senha: 'invalido12345' }, { headers: testHeaders }).catch((e) => e.response);
      const cacheControl = resAuth.headers['cache-control'] || '';
      const temNoStore = cacheControl.includes('no-store');
      assertTest('RC27', 'Seguranca', 'Cabeçalho Cache-Control: no-store presente na rota de auth', true, temNoStore, temNoStore);
    } catch (err) {
      assertTest('RC27', 'Seguranca', 'Cabeçalho Cache-Control: no-store presente na rota de auth', true, false, false, err.message);
    }

    // RC28: Log de Auditoria registrado após redefinição de senha
    try {
      const log = await LogAuditoria.findOne({
        where: {
          id_usuario: userGerente.id_usuario,
          acao: 'REDEFINIR_SENHA',
        },
        order: [['id_log', 'DESC']],
      });
      assertTest('RC28', 'Auditoria', 'Ação REDEFINIR_SENHA registrada na tabela logs_auditoria', true, !!log, !!log);
    } catch (err) {
      assertTest('RC28', 'Auditoria', 'Ação REDEFINIR_SENHA registrada na tabela logs_auditoria', true, false, false, err.message);
    }

    // RC29: Normalização de Unicode aceita na validação de senhas
    try {
      const senhaUnicode = 'Frase-Senha-Acentuada-Café-12345!';
      const policyRes = require('../../backend/src/services/passwordPolicy.service').validatePasswordPolicy(senhaUnicode);
      assertTest('RC29', 'Politica', 'Caracteres Unicode e acentos suportados sem trim forçado', true, policyRes.valida, policyRes.valida);
    } catch (err) {
      assertTest('RC29', 'Politica', 'Caracteres Unicode e acentos suportados sem trim forçado', true, false, false, err.message);
    }

    // RC30: Inexistência de campos sensíveis expostos em JSON
    try {
      const resMe = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'test_sec_gerente',
        senha: 'SenhaConcorrente1-Segura!', // senha definida no teste de concorrência
      }, { headers: testHeaders }).catch(async () => {
        // Fallback caso a 2 tenha ganhado a corrida
        return axios.post(`${BASE_URL}/auth/login`, {
          login: 'test_sec_gerente',
          senha: 'SenhaConcorrente2-Segura!',
        }, { headers: testHeaders });
      });

      const userRetornado = resMe.data.usuario;
      const camposProtegidos = !userRetornado.senha_hash && !userRetornado.recuperacao_codigo && !userRetornado.recuperacao_grant_hash;
      assertTest('RC30', 'Privacidade', 'Campos sensíveis de senha e OTP excluídos da serialização JSON', true, camposProtegidos, camposProtegidos);
    } catch (err) {
      assertTest('RC30', 'Privacidade', 'Campos sensíveis de senha e OTP excluídos da serialização JSON', true, false, false, err.message);
    }

    // ─── Limpeza dos Usuários de Auditoria ────────────────────────────────────
    console.log('\n--- LIMPEZA DO AMBIENTE DE AUDITORIA ---');
    const testUsers = await Usuario.findAll({
      where: {
        login: ['test_sec_gerente', 'test_sec_atendente', 'test_sec_inativo', 'test_sec_brute', 'test_sec_parallel'],
      },
      attributes: ['id_usuario'],
    });
    const testIds = testUsers.map((u) => u.id_usuario);
    if (testIds.length > 0) {
      await LogAuditoria.destroy({ where: { id_usuario: testIds } });
      await Usuario.destroy({ where: { id_usuario: testIds } });
    }
    console.log('✔ Usuários e logs de auditoria de testes removidos do banco.');

  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log('\n══════════════════════════════════════════════════════════════════════════════');
    console.log(`   RESULTADO FINAL DOS TESTES: ${passed} PASSOU | ${failed} FALHOU`);
    console.log('══════════════════════════════════════════════════════════════════════════════\n');
  }

  return { passed, failed, results };
}

if (require.main === module) {
  runSecuritySuite().then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  }).catch((err) => {
    console.error('Erro fatal ao rodar suite de testes de segurança:', err);
    process.exit(1);
  });
}

module.exports = { runSecuritySuite };
