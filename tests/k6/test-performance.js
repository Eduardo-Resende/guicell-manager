import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Métricas individuais por fluxo/cenário
const loginDuration = new Trend('tempo_login');
const clientesDuration = new Trend('tempo_clientes');
const osDuration = new Trend('tempo_os');
const dashboardDuration = new Trend('tempo_dashboard');
const estoqueDuration = new Trend('tempo_estoque');
const caixaDuration = new Trend('tempo_caixa');
const errorRate = new Rate('taxa_erros');

const BASE_URL = 'http://localhost:3001/api';

export const options = {
  // Configuração padrão pode ser sobrescrita via CLI: --vus X --duration 1m
  vus: 1,
  duration: '5s',
  thresholds: {
    taxa_erros: ['rate<0.05'], // erros < 5%
    http_req_duration: ['p(95)<1000'], // 95% das requisições abaixo de 1s
  },
};

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 1. Cenário: Login
  const loginPayload = JSON.stringify({
    login: 'gerente',
    senha: 'guicell123',
  });
  const resLogin = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  const okLogin = check(resLogin, {
    'Login: status 200': (r) => r.status === 200,
    'Login: possui token': (r) => {
      try {
        return !!r.json('token');
      } catch (e) {
        return false;
      }
    },
  });
  loginDuration.add(resLogin.timings.duration);
  errorRate.add(!okLogin);

  if (!okLogin) {
    sleep(1);
    return;
  }

  const token = resLogin.json('token');
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // 2. Cenário: Listagem de Clientes
  const resClientes = http.get(`${BASE_URL}/clientes`, authHeaders);
  const okClientes = check(resClientes, {
    'Clientes: status 200': (r) => r.status === 200,
  });
  clientesDuration.add(resClientes.timings.duration);
  errorRate.add(!okClientes);

  // 3. Cenário: Listagem de OS
  const resOS = http.get(`${BASE_URL}/ordens-servico`, authHeaders);
  const okOS = check(resOS, {
    'OS: status 200': (r) => r.status === 200,
  });
  osDuration.add(resOS.timings.duration);
  errorRate.add(!okOS);

  // 4. Cenário: Dashboard (Tempo de carregamento da API)
  const resDash = http.get(`${BASE_URL}/ordens-servico/dashboard`, authHeaders);
  const okDash = check(resDash, {
    'Dashboard: status 200': (r) => r.status === 200,
  });
  dashboardDuration.add(resDash.timings.duration);
  errorRate.add(!okDash);

  // 5. Cenário: Estoque
  const resEstoque = http.get(`${BASE_URL}/produtos`, authHeaders);
  const okEstoque = check(resEstoque, {
    'Estoque: status 200': (r) => r.status === 200,
  });
  estoqueDuration.add(resEstoque.timings.duration);
  errorRate.add(!okEstoque);

  // 6. Cenário: Caixa / Movimentações
  const resCaixa = http.get(`${BASE_URL}/caixa`, authHeaders);
  const okCaixa = check(resCaixa, {
    'Caixa: status 200': (r) => r.status === 200,
  });
  caixaDuration.add(resCaixa.timings.duration);
  errorRate.add(!okCaixa);

  // Intervalo simulando tempo de reflexão do usuário
  sleep(0.5);
}

export function handleSummary(data) {
  const summaryFileName = __ENV.SUMMARY_FILE || 'summary.json';
  const out = {};
  out[summaryFileName] = JSON.stringify(data, null, 2);
  return out;
}
