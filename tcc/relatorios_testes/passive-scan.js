const axios = require('../../backend/node_modules/axios');

const BASE_URL = 'http://localhost:3001/api';

async function passiveSecurityAudit() {
  console.log('=== AUDITORIA PASSIVA DE SEGURANÇA E HEADERS (OWASP BASELINE) ===\n');

  const findings = [];

  // 1. Inspecionar Headers HTTP
  const res = await axios.get(`${BASE_URL}/health`);
  const headers = res.headers;

  const headerChecks = [
    { header: 'x-content-type-options', expected: 'nosniff', risk: 'Baixo' },
    { header: 'x-frame-options', expected: 'SAMEORIGIN / DENY', risk: 'Médio' },
    { header: 'strict-transport-security', expected: 'max-age=...', risk: 'Médio', note: 'O HSTS é aplicado tipicamente em produção com terminação HTTPS/Reverse Proxy Nginx' },
    { header: 'content-security-policy', expected: 'default-src ...', risk: 'Médio' },
    { header: 'referrer-policy', expected: 'no-referrer / strict-origin-when-cross-origin', risk: 'Baixo' },
    { header: 'x-xss-protection', expected: '0 (Helmet default moderno)', risk: 'Informativo' },
    { header: 'x-powered-by', expected: 'AUSENTE (não divulgado)', risk: 'Baixo' },
  ];

  headerChecks.forEach(check => {
    const val = headers[check.header];
    const present = val !== undefined;
    findings.push({
      item: `Header: ${check.header}`,
      presente: present ? 'Sim' : 'Não',
      valor: val || 'Não definido',
      risco: check.risk,
      observacao: check.note || (present ? 'Configurado via Helmet' : 'Não enviado na resposta padrão')
    });
  });

  // 2. Testar vazamento de X-Powered-By
  const xPoweredBy = headers['x-powered-by'];
  const xPoweredByHidden = !xPoweredBy;

  // 3. Teste de CORS com origem não autorizada
  let corsBlocked = false;
  try {
    const corsTest = await axios.get(`${BASE_URL}/health`, {
      headers: { Origin: 'http://malicious-site.com' }
    });
    // Se respondeu, checar se liberou access-control-allow-origin
    if (corsTest.headers['access-control-allow-origin'] === 'http://malicious-site.com') {
      corsBlocked = false;
    } else {
      corsBlocked = true;
    }
  } catch (err) {
    corsBlocked = true; // se rejeitou, bloqueou com sucesso
  }

  // 4. Teste de CORS com origem autorizada (http://localhost:5173)
  let corsAllowedLegit = false;
  try {
    const corsLegit = await axios.get(`${BASE_URL}/health`, {
      headers: { Origin: 'http://localhost:5173' }
    });
    if (corsLegit.headers['access-control-allow-origin'] === 'http://localhost:5173') {
      corsAllowedLegit = true;
    }
  } catch (err) {
    corsAllowedLegit = false;
  }

  // 5. Teste de exposição de informações em erro 404 e 500
  let infoLeak404 = false;
  try {
    await axios.get(`${BASE_URL}/rota-inexistente-para-teste`);
  } catch (err) {
    const data = err.response?.data;
    // Checar se expõe stack trace
    if (typeof data === 'string' && (data.includes('node_modules') || data.includes('at '))) {
      infoLeak404 = true;
    } else if (data && data.stack) {
      infoLeak404 = true;
    }
  }

  // 6. Teste de exposição de hash de senha na API de Usuários
  let passwordLeak = false;
  try {
    const resLogin = await axios.post(`${BASE_URL}/auth/login`, { login: 'gerente', senha: 'guicell123' });
    const token = resLogin.data.token;
    const resUsers = await axios.get(`${BASE_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = resUsers.data;
    for (const u of users) {
      if (u.senha_hash || u.senha || u.recuperacao_codigo) {
        passwordLeak = true;
        break;
      }
    }
  } catch (err) {
    console.error('Erro ao testar exposição de senha:', err.message);
  }

  // 7. Cookies inseguros
  // A aplicação usa autenticação stateless via JWT no cabeçalho Authorization (Bearer), não usando cookies de sessão.
  const authMethod = 'Stateless Bearer JWT via Authorization Header (imune a ataques de CSRF padrão baseados em cookie)';

  const auditReport = {
    headers: findings,
    xPoweredByHidden,
    corsBlockedUnauthorized: corsBlocked,
    corsAllowedLegitimate: corsAllowedLegit,
    infoLeak404,
    passwordLeak,
    authMethod,
  };

  const fs = require('fs');
  fs.writeFileSync('./guicell-manager/tests/security/passive_audit_report.json', JSON.stringify(auditReport, null, 2));
  console.log('Auditoria passiva concluída com sucesso!');
  console.log(JSON.stringify(auditReport, null, 2));
}

passiveSecurityAudit();
