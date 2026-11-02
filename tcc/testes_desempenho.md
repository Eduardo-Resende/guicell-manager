# Documentação Técnica e Resultados: Testes de Desempenho e Carga

> **Documento Acadêmico e Técnico para TCC**  
> **Sistema:** Guicell Manager — Sistema de Gestão para Assistência Técnica  
> **Ferramenta de Carga:** Grafana k6 (v2.3.0)  
> **Ambiente de Teste:** Localhost / Ambiente de Homologação Local (MySQL 8.0, Node.js v24.15.0, Express)  
> **Data de Execução:** 02/11/2026  

---

## 1. Visão Geral e Metodologia

Os testes de desempenho têm como finalidade avaliar a capacidade de resposta, estabilidade, taxa de vazão (*throughput*) e comportamento sob concorrência do backend do **Guicell Manager**.

Para preservar a integridade do ambiente de produção (hospedado na VPS Hostinger com banco de dados e clientes reais), a bateria de testes de estresse e carga foi executada no ambiente de homologação local. Esse isolamento garante que grandes volumes de requisições concorrentes não degradem a experiência dos usuários da loja física durante o expediente.

### 1.1. Cenários de Carga Avaliados

Foram projetados três cenários progressivos de usuários simultâneos (*Virtual Users* - VUs), executados ininterruptamente durante **1 minuto (60 segundos)** cada:

1. **Cenário 1 — 1 Usuário Simultâneo (1 VU):** Simula o uso normal e contínuo de um operador na bancada ou no balcão da loja.
2. **Cenário 2 — 5 Usuários Simultâneos (5 VUs):** Simula o horário de pico de uma assistência técnica de médio porte (ex.: 2 atendentes, 2 técnicos e 1 gerente operando simultaneamente).
3. **Cenário 3 — 10 Usuários Simultâneos (10 VUs):** Simula um estresse operacional elevado, com requisições concorrentes massivas superando a rotina normal do estabelecimento.

### 1.2. Fluxos Críticos Avaliados por Iteração

A cada ciclo do usuário virtual, foram requisitados sequencialmente os seis principais fluxos do sistema:

| Ordem | Cenário / Fluxo | Método HTTP | Rota da API | Métrica Principal Avaliada |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Autenticação (Login)** | `POST` | `/api/auth/login` | Tempo de computação criptográfica do hash bcrypt e emissão de JWT. |
| **2** | **Listagem de Clientes** | `GET` | `/api/clientes` | Tempo de consulta e serialização do catálogo de clientes cadastrados. |
| **3** | **Listagem de OS** | `GET` | `/api/ordens-servico` | Tempo de resposta para consulta da fila de ordens de serviço ativas. |
| **4** | **Dashboard Operacional** | `GET` | `/api/ordens-servico/dashboard` | Tempo de agregação analítica (contagens por status, faturamento e OS concluídas). |
| **5** | **Controle de Estoque** | `GET` | `/api/produtos` | Tempo de resposta na listagem de produtos, peças e níveis de estoque. |
| **6** | **Caixa e Movimentações** | `GET` | `/api/caixa` | Tempo de resposta para recuperação do extrato e movimentações da sessão aberta. |

---

## 2. Resultados Consolidados de Desempenho

A tabela abaixo consolida os resultados reais obtidos pelo **k6** para cada nível de concorrência testado:

| Usuários Simultâneos (VUs) | Duração do Teste | Total de Requisições | Média (*avg*) | Mediana (*p50*) | Percentil 95 (*p95*) | Tempo Máximo (*max*) | Taxa de Erros |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1 VU** (Uso normal) | 1 min | **576** | **20,75 ms** | **6,93 ms** | **93,90 ms** | **106,13 ms** | **0,0%** |
| **5 VUs** (Pico de operação) | 1 min | **1.770** | **86,01 ms** | **18,18 ms** | **435,30 ms** | **541,93 ms** | **0,0%** |
| **10 VUs** (Carga elevada) | 1 min | **2.400** | **170,09 ms** | **34,66 ms** | **849,07 ms** | **975,37 ms** | **0,0%** |

> **Destaque:** Em todos os cenários de carga, a **taxa de falha foi rigorosamente 0,0%**, demonstrando alta robustez da API e do pool de conexões do MySQL sob demanda.

---

## 3. Desdobramento por Fluxo e Rota da API

Abaixo, detalham-se os tempos de resposta específicos de cada rota individual nos três patamares de carga:

### 3.1. Cenário 1: 1 Usuário Simultâneo (576 requisições totais)

| Fluxo Testado | Endpoint | Média (*avg*) | Mediana (*p50*) | P95 | Maior Tempo (*max*) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Login** | `POST /api/auth/login` | 92,55 ms | 91,67 ms | 98,98 ms | 106,13 ms |
| **Clientes** | `GET /api/clientes` | 4,03 ms | 3,96 ms | 5,13 ms | 7,14 ms |
| **Ordens de Serviço** | `GET /api/ordens-servico` | 6,22 ms | 5,94 ms | 8,09 ms | 15,05 ms |
| **Dashboard** | `GET /api/ordens-servico/dashboard` | 8,47 ms | 8,31 ms | 10,70 ms | 13,86 ms |
| **Estoque** | `GET /api/produtos` | 4,92 ms | 4,88 ms | 6,06 ms | 7,21 ms |
| **Caixa** | `GET /api/caixa` | 8,30 ms | 8,10 ms | 10,79 ms | 11,36 ms |

### 3.2. Cenário 2: 5 Usuários Simultâneos (1.770 requisições totais)

| Fluxo Testado | Endpoint | Média (*avg*) | Mediana (*p50*) | P95 | Maior Tempo (*max*) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Login** | `POST /api/auth/login` | 434,17 ms | 430,01 ms | 458,71 ms | 541,93 ms |
| **Clientes** | `GET /api/clientes` | 9,12 ms | 8,79 ms | 11,33 ms | 14,69 ms |
| **Ordens de Serviço** | `GET /api/ordens-servico` | 14,76 ms | 14,45 ms | 20,08 ms | 24,82 ms |
| **Dashboard** | `GET /api/ordens-servico/dashboard` | 24,56 ms | 24,02 ms | 31,59 ms | 34,93 ms |
| **Estoque** | `GET /api/produtos` | 12,63 ms | 12,35 ms | 17,15 ms | 21,68 ms |
| **Caixa** | `GET /api/caixa` | 20,85 ms | 20,59 ms | 25,41 ms | 27,29 ms |

### 3.3. Cenário 3: 10 Usuários Simultâneos (2.400 requisições totais)

| Fluxo Testado | Endpoint | Média (*avg*) | Mediana (*p50*) | P95 | Maior Tempo (*max*) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Login** | `POST /api/auth/login` | 842,09 ms | 837,96 ms | 926,03 ms | 975,37 ms |
| **Clientes** | `GET /api/clientes` | 28,35 ms | 20,00 ms | 101,68 ms | 119,90 ms |
| **Ordens de Serviço** | `GET /api/ordens-servico` | 32,73 ms | 29,55 ms | 53,83 ms | 132,94 ms |
| **Dashboard** | `GET /api/ordens-servico/dashboard` | 53,69 ms | 48,89 ms | 75,31 ms | 231,70 ms |
| **Estoque** | `GET /api/produtos` | 27,56 ms | 25,59 ms | 36,11 ms | 114,49 ms |
| **Caixa** | `GET /api/caixa` | 36,12 ms | 35,63 ms | 44,90 ms | 58,43 ms |

---

## 4. Análise Técnica dos Resultados para o TCC

1. **Eficiência das Consultas ao Banco de Dados (CRUD e Dashboard):**
   - As rotas operacionais (`/clientes`, `/ordens-servico`, `/produtos`, `/caixa`) mantiveram médias inferiores a **37 ms**, mesmo com 10 usuários simultâneos disparando requisições sem pausa.
   - O endpoint analítico `/dashboard` realiza consultas agrupadas e contagens condicionais de status e faturamento. Sob carga de 10 VUs, respondeu em **53,69 ms** em média, comprovando a eficácia da indexação de chaves primárias e estrangeiras configuradas no Sequelize/MySQL.

2. **Impacto Computacional do Bcrypt no Login:**
   - O endpoint de Login apresentou tempo médio sensivelmente maior em relação às leituras (de **92,55 ms** com 1 VU para **842,09 ms** com 10 VUs).
   - *Explicação teórica para a banca:* O algoritmo de derivação de chaves `bcrypt` adota intencionalmente um fator de custo elevado (*salt rounds = 10*) para prevenir ataques de força bruta e tabelas arco-íris (*rainbow tables*). Trata-se de uma operação CPU-bound (*intensa em processador*). Na prática real de um sistema corporativo, os usuários realizam o login apenas uma vez por expediente (obtendo um token JWT com validade de 8 horas), consumindo preponderantemente as rotas de negócio rápidas (abaixo de 40 ms).

3. **Conclusão de Desempenho:**
   - O sistema atende com ampla folga os critérios de usabilidade da norma **ISO/IEC 25010** e as diretrizes de Jakob Nielsen para tempo de resposta interativo (inferior a 1 segundo para feedback visual instantâneo).

---

## 5. Script Completo de Teste Utilizado no k6

O script oficial parametrizado executado nos testes encontra-se registrado no repositório em `tests/k6/test-performance.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Métricas individuais por fluxo de negócio
const loginDuration = new Trend('tempo_login');
const clientesDuration = new Trend('tempo_clientes');
const osDuration = new Trend('tempo_os');
const dashboardDuration = new Trend('tempo_dashboard');
const estoqueDuration = new Trend('tempo_estoque');
const caixaDuration = new Trend('tempo_caixa');
const errorRate = new Rate('taxa_erros');

const BASE_URL = 'http://localhost:3001/api';

export const options = {
  thresholds: {
    taxa_erros: ['rate<0.05'], // tolerância de erro máxima de 5%
    http_req_duration: ['p(95)<1000'], // 95% das requisições abaixo de 1 segundo
  },
};

export default function () {
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // 1. Cenário: Login
  const loginPayload = JSON.stringify({ login: 'gerente', senha: 'guicell123' });
  const resLogin = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  const okLogin = check(resLogin, {
    'Login: status 200': (r) => r.status === 200,
    'Login: possui token': (r) => {
      try { return !!r.json('token'); } catch (e) { return false; }
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
  const okClientes = check(resClientes, { 'Clientes: status 200': (r) => r.status === 200 });
  clientesDuration.add(resClientes.timings.duration);
  errorRate.add(!okClientes);

  // 3. Cenário: Listagem de Ordens de Serviço (OS)
  const resOS = http.get(`${BASE_URL}/ordens-servico`, authHeaders);
  const okOS = check(resOS, { 'OS: status 200': (r) => r.status === 200 });
  osDuration.add(resOS.timings.duration);
  errorRate.add(!okOS);

  // 4. Cenário: Dashboard (Métricas em Tempo Real)
  const resDash = http.get(`${BASE_URL}/ordens-servico/dashboard`, authHeaders);
  const okDash = check(resDash, { 'Dashboard: status 200': (r) => r.status === 200 });
  dashboardDuration.add(resDash.timings.duration);
  errorRate.add(!okDash);

  // 5. Cenário: Consulta de Produtos em Estoque
  const resEstoque = http.get(`${BASE_URL}/produtos`, authHeaders);
  const okEstoque = check(resEstoque, { 'Estoque: status 200': (r) => r.status === 200 });
  estoqueDuration.add(resEstoque.timings.duration);
  errorRate.add(!okEstoque);

  // 6. Cenário: Consulta de Movimentações de Caixa
  const resCaixa = http.get(`${BASE_URL}/caixa`, authHeaders);
  const okCaixa = check(resCaixa, { 'Caixa: status 200': (r) => r.status === 200 });
  caixaDuration.add(resCaixa.timings.duration);
  errorRate.add(!okCaixa);

  // Intervalo de reflexão entre ciclos
  sleep(0.5);
}

export function handleSummary(data) {
  const summaryFileName = __ENV.SUMMARY_FILE || 'summary.json';
  const out = {};
  out[summaryFileName] = JSON.stringify(data, null, 2);
  return out;
}
```

> **Arquivos brutos disponíveis:**  
> Os relatórios brutos completos em formato JSON emitidos pelo k6 (`summary_1vu.json`, `summary_5vu.json` e `summary_10vu.json`) estão arquivados na pasta `tcc/relatorios_testes/` para fins de comprovação e auditoria.

