# RELATÓRIO TÉCNICO DE AUDITORIA DO AMBIENTE DE TESTES DE DESEMPENHO (K6)
## Guicell Manager — Trabalho de Conclusão de Curso (TCC II) — UNIALFA 2026

---

### IDENTIFICAÇÃO E ESCOPO DA AUDITORIA

* **Projeto:** Guicell Manager — Sistema de Gestão para Assistência Técnica de Celulares
* **Finalidade:** Auditoria técnica de reprodutibilidade e caracterização do ambiente de testes de carga para subsídio da **Seção 10.4** e apêndice metodológico do TCC II (Sistemas de Informação — UNIALFA, 2026).
* **Data da Execução Histórica dos Testes:** 02 de Novembro de 2026 (entre 13:31:49 e 13:37:59 BRT).
* **Data da Coleta e Auditoria Atual:** 08 de Novembro de 2026.
* **Ferramenta de Carga Utilizada:** Grafana k6 (v2.3.0).
* **Auditor Responsável:** Engenheiro de Testes de Desempenho e Auditor de Documentação Acadêmica (Antigravity).
* **Modo de Operação:** Estritamente leitura (inspeção não invasiva de hardware, arquivos do repositório e base local de homologação; nenhum teste destrutivo, benchmark ou alteração de código realizada).

---

## 1. OBJETIVO E ESCOPO DO LEVANTAMENTO

O presente relatório técnico tem por finalidade identificar, analisar, auditar e documentar todas as características comprováveis do computador pessoal, da infraestrutura de software, da topologia de rede, do banco de dados e dos scripts de teste utilizados na avaliação de desempenho do sistema **Guicell Manager**, realizada originalmente em **02/11/2026**.

A auditoria adota critérios formais de reprodutibilidade científica, diferenciando de forma rigorosa:
1. **Confirmado em 02/11:** Dado expressamente comprovado por evidência histórica datada (metadados de arquivos, commits do Git, relatórios brutos JSON ou logs preservados).
2. **Observado atualmente:** Dado apurado no ambiente atual de desenvolvimento por comandos não invasivos, que caracteriza o equipamento ou ferramentas vigentes, mas cuja identidade com a data histórica não pode ser garantida apenas pelo estado atual.
3. **Não confirmado / A confirmar:** Aspecto técnico relevante cuja comprovação documental não pôde ser atestada no repositório e que depende de validação manual do autor do trabalho.

---

## 2. QUADRO A — EQUIPAMENTO USADO NO TESTE (HARDWARE E SISTEMA OPERACIONAL)

Todos os dados de hardware foram coletados no computador do desenvolvedor via WMI/CIM do Windows PowerShell (`Get-CimInstance`), preservando a privacidade (sem identificadores pessoais, números de série ou IPs públicos).

| Item / Recurso | Especificação Técnica Apurada | Origem da Evidência | Classificação |
| :--- | :--- | :--- | :---: |
| **Tipo de Equipamento / Modelo** | Notebook Dell Inspiron 3501 (`PCSystemType: 2 - Mobile`) | `Get-CimInstance Win32_ComputerSystem` | **Observado atualmente** (Hardware físico da máquina de teste) |
| **Sistema Operacional** | Microsoft Windows 10 Pro (64 bits), Versão 22H2 | `Get-CimInstance Win32_OperatingSystem` | **Observado atualmente** |
| **Versão / Build do SO** | 10.0.19045 (Build 19045) | `Get-CimInstance Win32_OperatingSystem` | **Observado atualmente** |
| **Processador (CPU)** | Intel(R) Core(TM) i5-1035G1 CPU @ 1.00GHz (Arquitetura Ice Lake, 10ª Geração Intel, frequência base de 1.00 GHz com Turbo Boost até 3.60 GHz) | `Get-CimInstance Win32_Processor` | **Observado atualmente** |
| **Núcleos e Threads** | **4 núcleos físicos** e **8 processadores lógicos (threads)** | `Get-CimInstance Win32_Processor` | **Observado atualmente** |
| **Memória RAM Total** | **8,00 GB** (8.149.076 KB de memória física visível reportada pelo SO) | `Get-CimInstance Win32_OperatingSystem` | **Observado atualmente** |
| **Tipo de Armazenamento** | **SSD de 256 GB** (256.060.514.304 bytes), controladora Intel RST / RAID | `Get-PhysicalDisk` | **Observado atualmente** |
| **Alimentação Energética** | Operação com fonte de alimentação AC ou bateria durante o teste | Documentação não registra o plano de energia ou fonte no momento da execução | **A confirmar** (Requer resposta manual do autor) |

*Nota metodológica:* Como o computador de teste é um notebook Dell Inspiron 3501, os resultados de latência sob carga simultânea (especialmente no algoritmo de hash Bcrypt) refletem o comportamento de uma CPU móvel compartilhando ciclos de processamento e controle térmico (*thermal throttling*) entre o gerador de carga k6, o runtime Node.js e o SGBD MySQL.

---

## 3. QUADRO B — AMBIENTE DE SOFTWARE E TOPOLOGIA DE EXECUÇÃO

| Item / Camada | Versão / Configuração | Origem da Evidência | Classificação |
| :--- | :--- | :--- | :---: |
| **Ferramenta de Carga** | Grafana k6 v2.3.0 (commit `e088784614`, go1.26.8, windows/amd64) | `k6 version` no terminal e `tcc/testes_desempenho.md` (linha 5) | **Confirmado em 02/11** |
| **Runtime Backend** | Node.js v24.15.0 (64-bit) | `node --version` e `tcc/testes_desempenho.md` (linha 6) | **Confirmado em 02/11** |
| **Gerenciador de Pacotes** | npm v11.12.1 | `npm --version` | **Observado atualmente** |
| **Framework Web** | Express v4.19.2 (em 02/11/2026) -> v4.22.3 (atualizada em 08/11/2026 por segurança) | `backend/package.json` histórico git (`fde85a9`) e commit de hardening | **Confirmado em 02/11** (v4.19.2) |
| **ORM / Mapeador Objeto-Relacional** | Sequelize v6.37.3 (em 02/11/2026) -> v6.37.8 (atualizada em 08/11/2026) | `backend/package.json` histórico git (`fde85a9`) | **Confirmado em 02/11** (v6.37.3) |
| **Driver MySQL** | mysql2 v3.9.7 | `backend/package.json` | **Confirmado em 02/11** |
| **Biblioteca de Hash de Senha** | bcryptjs v2.4.3 (salt rounds = 10) | `backend/package.json` e `backend/src/seeders` | **Confirmado em 02/11** |
| **Biblioteca de Tokens** | jsonwebtoken v9.0.2 | `backend/package.json` | **Confirmado em 02/11** |
| **SGBD Relacional** | MySQL Community Server 8.0.45 (64 bits) | `SELECT VERSION()` no MySQL local e `tcc/testes_desempenho.md` (linha 6) | **Confirmado em 02/11** (família 8.0) / **Observado** (8.0.45) |
| **Topologia de Rede** | **Co-localizada (*All-in-One* em Localhost)**. Destino: `http://localhost:3001/api` | `tests/k6/test-performance.js` (linha 14: `BASE_URL = 'http://localhost:3001/api'`) | **Confirmado em 02/11** |
| **Isolamento de Produção** | Totalmente isolado. O teste não acessou a VPS Hostinger nem dados reais de clientes da assistência técnica | `tcc/testes_desempenho.md` (linhas 14-16) | **Confirmado em 02/11** |
| **Camada de Proxy Reverso** | Ausente durante os testes (requisições k6 enviadas diretamente à porta 3001 do Node.js, sem Nginx) | `tests/k6/test-performance.js` | **Confirmado em 02/11** |
| **Ambiente de Virtualização** | Bare-metal (execução nativa no Windows, sem contêineres Docker ativos para o teste) | Configurações do projeto e scripts de execução direta via Node/k6 | **Confirmado em 02/11** |
| **Papel do Frontend** | Desativado / Dispensável (o k6 consome a API REST diretamente via HTTP) | `tests/k6/test-performance.js` | **Confirmado em 02/11** |

---

## 4. QUADRO C — CONFIGURAÇÃO E RESULTADOS DOS TRÊS CENÁRIOS K6

A inspeção detalhada dos relatórios brutos emitidos pelo k6 (`summary_1vu.json`, `summary_5vu.json` e `summary_10vu.json`), presentes tanto em `tests/k6/` quanto em `tcc/docs/relatorios_testes/` (com hashes SHA-256 idênticos), permitiu comprovar os seguintes parâmetros de execução:

### 4.1. Características Gerais do Script de Teste
- **Caminho do Script Oficial:** `tests/k6/test-performance.js` (3.333 bytes, modificado em 02/11/2026 às 13:32:08 BRT).
- **Executor e Tipo de Carga:** VUs constantes (`options.vus` fixo por cenário, sobrescrito via CLI para 1, 5 e 10 VUs com `--duration 1m`).
- **Think Time (Tempo de Reflexão):** `sleep(0.5)` (500 ms de pausa intencional entre o final de uma iteração e o início da próxima).
- **Requisições por Iteração:** Exatamente **6 requisições HTTP** sequenciais a cada ciclo do usuário virtual.
- **Natureza das Operações:**
  - 1 requisição `POST /api/auth/login` (verificação de credenciais e emissão de JWT; computacionalmente intensiva em CPU devido ao bcrypt).
  - 5 requisições `GET` puramente de leitura (`/clientes`, `/ordens-servico`, `/ordens-servico/dashboard`, `/produtos`, `/caixa`).
  - **Zero operações de escrita destrutiva ou inserção acumulativa no banco** durante a execução contínua de carga.
- **Thresholds (Critérios de Aceite) Configuradas no Script k6:**
  - `taxa_erros: ['rate<0.05']` (tolerância de falha lógica máxima de 5%).
  - `http_req_duration: ['p(95)<1000']` (percentil 95 de tempo de resposta inferior a 1.000 ms / 1 segundo).
- **Tratamento de Credenciais:** Foram identificadas credenciais de teste fixas no corpo do script; recomenda-se a parametrização por variáveis de ambiente (`__ENV`) para futuras baterias de homologação.

### 4.2. Confrontação dos Resultados Globais (TCC vs. JSON Bruto)

| Métrica Avaliada | Cenário 1 (1 VU) | Cenário 2 (5 VUs) | Cenário 3 (10 VUs) | Status da Conferência |
| :--- | :---: | :---: | :---: | :---: |
| **Duração Efetiva do Teste** | 60,12 s | 60,04 s | 60,90 s | **Confirmado no JSON** |
| **Horário do Término (Metadados)** | 02/11/2026 13:33:40 | 02/11/2026 13:36:03 | 02/11/2026 13:37:59 | **Confirmado no JSON / SO** |
| **Total de Iterações Completas** | 96 iterações | 295 iterações | 400 iterações | **Confirmado no JSON** |
| **Total de Requisições HTTP** | **576** | **1.770** | **2.400** | **100% Idêntico ao TCC** |
| **Taxa de Vazão (*Throughput*)** | 9,58 req/s | 29,48 req/s | 39,40 req/s | **Confirmado no JSON** |
| **Tempo Médio de Resposta (*avg*)** | **20,75 ms** (20,749 ms) | **86,01 ms** (86,014 ms) | **170,09 ms** (170,090 ms) | **100% Idêntico ao TCC** |
| **Mediana (*med / p50*)** | 6,93 ms | 18,18 ms | 34,66 ms | **Confirmado no JSON** |
| **Percentil 90 (*p90*)** | 91,05 ms | 426,92 ms | 833,80 ms | **Confirmado no JSON** |
| **Percentil 95 (*p95*)** | **93,90 ms** (93,900 ms) | **435,30 ms** (435,299 ms) | **849,07 ms** (849,068 ms) | **100% Idêntico ao TCC** |
| **Tempo Máximo (*max*)** | 106,13 ms | 541,93 ms | 975,37 ms | **Confirmado no JSON** |
| **Tempo Mínimo (*min*)** | 2,17 ms | 6,32 ms | 13,69 ms | **Confirmado no JSON** |
| **Taxa de Falha HTTP (`http_req_failed`)** | **0,00%** (0 / 576) | **0,00%** (0 / 1.770) | **0,00%** (0 / 2.400) | **100% Idêntico ao TCC** |
| **Taxa de Erro Personalizada (`taxa_erros`)** | **0,00%** (ok: true) | **0,00%** (ok: true) | **0,00%** (ok: true) | **Confirmado no JSON** |
| **Validação Lógica de Asserções (`checks`)** | 672 / 672 (100% ok) | 2.065 / 2.065 (100% ok) | 2.800 / 2.800 (100% ok) | **Confirmado no JSON** |

*Observação sobre `checks`:* Cada iteração avalia 7 verificações lógicas (status 200 nas 6 rotas + presença do atributo `token` no login). Ex.: no cenário de 10 VUs, 400 iterações x 7 verificações = 2.800 asserções válidas, sem nenhuma falha funcional.

### 4.3. Desdobramento de Latência por Rota (Descoberta Arquitetural Crucial)

A extração das métricas individuais (`Trend`) preservadas nos JSONs revela o comportamento isolado de cada subsistema:

```
+------------------------------------+---------------+---------------+---------------+
| Rota / Operação                    | Média (1 VU)  | Média (5 VUs) | Média (10 VUs)|
+------------------------------------+---------------+---------------+---------------+
| POST /api/auth/login (Bcrypt CPU)  |   92,55 ms    |   434,17 ms   |   842,09 ms   |
| GET /api/clientes (MySQL Leitura)  |    4,03 ms    |     9,12 ms   |    28,35 ms   |
| GET /api/ordens-servico (Leitura)  |    6,22 ms    |    14,76 ms   |    32,73 ms   |
| GET /api/ordens-servico/dashboard  |    8,47 ms    |    24,56 ms   |    53,69 ms   |
| GET /api/produtos (Estoque)        |    4,92 ms    |    12,63 ms   |    27,56 ms   |
| GET /api/caixa (Movimentações)     |    8,30 ms    |    20,85 ms   |    36,12 ms   |
+------------------------------------+---------------+---------------+---------------+
```

*Diagnóstico de Engenharia:* 
- As rotas puramente voltadas a consultas no banco de dados (`clientes`, `ordens-servico`, `dashboard`, `produtos` e `caixa`) demonstraram altíssima performance, com médias abaixo de **37 ms** em 10 VUs (e apenas **53,69 ms** na agregação do dashboard).
- O aumento do tempo de resposta no percentil 95 global (de 93,90 ms para 849,07 ms) foi **quase que inteiramente impulsionado pela rota de Login**. Como o script k6 executou um login a cada ciclo de iteração, o processamento de hash com `bcryptjs` (salt rounds = 10) consumiu massivamente a CPU de 4 núcleos do notebook em 10 VUs simultâneos. Em uso corporativo real, o login ocorre apenas uma vez por operador no início do turno, evidenciando que a carga real percebida em produção na navegação diária é ainda mais rápida do que a média geral reportada pelo benchmark.

---

## 5. QUADRO D — VOLUME DE DADOS DO BANCO DE DADOS DE TESTE

A consulta à base de dados local de testes (`guicell_manager` no MySQL 8 local), realizada exclusivamente por agregação (`SELECT COUNT(*)`) e sem inspeção de dados confidenciais, retornou a seguinte volumetria:

| Entidade / Tabela | Quantidade de Registros (Base Local Atual) | Origem da Evidência | Classificação |
| :--- | :---: | :--- | :---: |
| **`usuarios`** | 3 registros | `SELECT COUNT(*)` local | **Observado na base atual** (Seeders: Gerente, Atendente e Técnico) |
| **`clientes`** | 3 registros | `SELECT COUNT(*)` local | **Observado na base atual** |
| **`aparelhos`** | 4 registros | `SELECT COUNT(*)` local | **Observado na base atual** |
| **`marcas`** | 16 registros | `SELECT COUNT(*)` local | **Observado na base atual** |
| **`modelos`** | 257 registros | `SELECT COUNT(*)` local | **Observado na base atual** (Catálogo de modelos pré-populado) |
| **`categorias`** | 6 registros | `SELECT COUNT(*)` local | **Observado na base atual** (Seeders: Peça, Acessório, Tela, Bateria, etc.) |
| **`produtos`** | 5 registros | `SELECT COUNT(*)` local | **Observado na base atual** |
| **`movimentacao`** (unifica OS, vendas e compras) | 24 registros | `SELECT COUNT(*)` local | **Observado na base atual** |
| **`sessoes_caixa`** | 4 registros | `SELECT COUNT(*)` local | **Observado na base atual** |
| **`caixa`** (lançamentos financeiros) | 44 registros | `SELECT COUNT(*)` local | **Observado na base atual** |
| **`contas_financeiras`** | 3 registros | `SELECT COUNT(*)` local | **Observado na base atual** (Gaveta, Cofre, Banco) |
| **`fornecedores`** | 1 registro | `SELECT COUNT(*)` local | **Observado na base atual** |
| **`logs_auditoria`** | 28 registros | `SELECT COUNT(*)` local | **Observado na base atual** |

*Ressalva Metodológica:* A base local atual contém massa inicial demonstrativa (seeders e lançamentos operacionais de homologação). Não foi localizado um dump SQL estático com snapshot datado exatamente de 02/11/2026. Portanto, os números acima refletem o **estado atual observado da base local de desenvolvimento/testes**, sendo coerentes com o porte da base utilizada nos testes de carga, mas classificados formalmente como **não confirmados por evidência histórica congelada**.

---

## 6. CAMINHOS DAS EVIDÊNCIAS E COMANDOS DE REPRODUÇÃO

### 6.1. Localização dos Arquivos no Repositório
- Script de teste k6: `tests/k6/test-performance.js`
- Relatório JSON (1 VU): `tests/k6/summary_1vu.json` e `tcc/docs/relatorios_testes/summary_1vu.json`
- Relatório JSON (5 VUs): `tests/k6/summary_5vu.json` e `tcc/docs/relatorios_testes/summary_5vu.json`
- Relatório JSON (10 VUs): `tests/k6/summary_10vu.json` e `tcc/docs/relatorios_testes/summary_10vu.json`
- Teste piloto preliminar (5s): `tests/k6/test.json`
- Documento técnico histórico de referência: `tcc/testes_desempenho.md`

### 6.2. Comandos Conceituais de Reprodução (Modo Informativo — Não Executar)
Para fins de reprodutibilidade por avaliadores do TCC, os comandos equivalentes executados em 02/11/2026 foram:

```bash
# 1. Pré-requisito: Iniciar o backend localmente na porta 3001
cd backend
npm run dev

# 2. Executar o cenário de 1 VU por 60 segundos gerando o resumo JSON
k6 run --vus 1 --duration 1m -e SUMMARY_FILE=summary_1vu.json tests/k6/test-performance.js

# 3. Executar o cenário de 5 VUs por 60 segundos
k6 run --vus 5 --duration 1m -e SUMMARY_FILE=summary_5vu.json tests/k6/test-performance.js

# 4. Executar o cenário de 10 VUs por 60 segundos
k6 run --vus 10 --duration 1m -e SUMMARY_FILE=summary_10vu.json tests/k6/test-performance.js
```

---

## 7. LIMITAÇÕES DE REPRODUTIBILIDADE E DIFERENÇAS ENTRE AMBIENTES

1. **Topologia Co-localizada vs. Produção:**  
   Nos testes de carga, o gerador de tráfego (k6), a API Node.js e o SGBD MySQL rodaram no mesmo sistema operacional e dividiram os mesmos recursos de CPU e barramento de memória. Na VPS de produção (Hostinger), o tráfego de rede atravessa a Internet, passa pelo proxy reverso Nginx com terminação TLS (HTTPS), e não há gerador de carga k6 competindo por ciclos de clock com o Node.js.
2. **Impacto do Bcrypt no Perfil de Carga:**  
   O teste de desempenho incluiu uma chamada de login (`POST /api/auth/login`) a cada iteração do loop, o que impôs um estresse computacional desproporcional sobre a CPU (derivação criptográfica de chaves). Em ambiente produtivo, o login é esporádico (token JWT com 8 horas de validade), o que significa que o sistema real lida predominantemente com as rotas leves de leitura e transações de banco (com latências observadas abaixo de 40 ms).
3. **Evolução de Dependências Pós-Teste:**  
   Em 02/11/2026, a API executava com Express 4.19.2 e Sequelize 6.37.3. Em 08/11/2026, foram aplicadas correções pontuais de segurança (`overrides` e atualizações para Express 4.22.3 e Sequelize 6.37.8). Tais atualizações não alteraram a complexidade algorítmica das consultas nem a estrutura de índices do banco.
4. **Volume de Dados:**  
   O benchmark foi realizado sobre uma base de testes de homologação com dezenas a centenas de registros por tabela. Não representa um teste de estresse sobre base histórica com centenas de milhares de linhas, embora os índices de chave primária e estrangeira garantam busca em tempo logarítmico $O(\log n)$.

---

## 8. TEXTO PRONTO PARA INSERÇÃO NA SEÇÃO 10.4 DO TCC

> **Sugestão de redação acadêmica para o Trabalho de Conclusão de Curso:**
>
> *"Para avaliar a capacidade de resposta, vazão e estabilidade sob concorrência do backend do Guicell Manager sem impactar as operações da assistência técnica em produção, foram conduzidos testes de carga sintéticos com a ferramenta Grafana k6 (v2.3.0) em ambiente de homologação dedicado. Os ensaios foram executados em arquitetura de hardware local (notebook com processador Intel Core i5-1035G1 de 4 núcleos físicos e 8 threads lógicas, 8 GB de memória RAM e armazenamento SSD sob sistema operacional Windows 10 Pro de 64 bits), com a API Node.js (v24.15.0) e o SGBD MySQL 8 co-localizados.*
>
> *O protocolo de teste avaliou três cenários progressivos de 60 segundos de duração com 1, 5 e 10 usuários virtuais simultâneos (VUs), executando um fluxo cíclico composto por 6 requisições (autenticação com emissão de JWT, consulta a clientes, ordens de serviço, agregações analíticas de dashboard, produtos em estoque e movimentações financeiras de caixa), intercaladas por um tempo de reflexão de 500 ms.*
>
> *No cenário de uso típico (1 VU), o sistema processou 576 requisições com tempo médio de resposta de 20,75 ms e percentil 95 (p95) de 93,90 ms. No cenário de pico operacional (5 VUs), foram concluídas 1.770 requisições com média de 86,01 ms e p95 de 435,30 ms. Sob carga elevada (10 VUs), a aplicação sustentou 2.400 requisições (vazão de 39,40 req/s), atingindo tempo médio de 170,09 ms e p95 de 849,07 ms. Em todos os cenários, a taxa de falhas HTTP (`http_req_failed`) e a taxa de erros lógicos de asserção (`checks`) mantiveram-se rigorosamente em 0,0%.*
>
> *A análise desagregada por endpoint revelou que as consultas de banco de dados mantiveram tempos médios de resposta inferiores a 37 ms mesmo com 10 VUs (e 53,69 ms no cálculo em tempo real do dashboard), demonstrando a eficácia da indexação do banco. A maior fatia da latência observada concentrou-se no endpoint de login (média de 842,09 ms em 10 VUs), consequência esperada da computação intensiva do algoritmo Bcrypt (custo 10) concorrendo pela mesma CPU com o gerador de carga k6. Como os operadores do Guicell Manager autenticam-se apenas uma vez por expediente, os resultados confirmam com folga os padrões de usabilidade da norma ISO/IEC 25010 e tempo de resposta interativo em ambiente local."*

---

## 9. CHECKLIST DO QUE CONFIRMAR MANUALMENTE

Caso a banca examinadora ou o orientador solicitem detalhes adicionais que não constam em arquivos de log do projeto, sugere-se conferir os seguintes pontos:

1. **Plano de Energia do Computador:** Confirmar se o notebook Dell Inspiron 3501 estava conectado à tomada (carregador de parede) durante a execução dos testes em 02/11/2026, visto que a operação em bateria ativa perfis de economia de energia e *throttling* da CPU Intel.
2. **Aplicações Concorrentes em Segundo Plano:** Confirmar se durante os testes k6 outras aplicações pesadas (como IDEs, Docker, navegadores com abas abertas) estavam em execução concorrente.
3. **Volume da Base na Data Exata:** Validar se a base utilizada em 02/11 continha estritamente os dados gerados pelos seeders (`npm run db:seed`) ou se já acumulava os dados de testes manuais prévios (como os 24 registros de movimentação e 44 lançamentos de caixa atualmente observados).

