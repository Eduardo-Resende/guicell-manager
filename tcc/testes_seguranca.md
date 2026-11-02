# Documentação Técnica e Resultados: Testes de Segurança

> **Documento Acadêmico e Técnico para TCC**  
> **Sistema:** Guicell Manager — Sistema de Gestão para Assistência Técnica  
> **Ferramentas de Auditoria:** `npm audit`, OWASP ZAP (Zed Attack Proxy v2.17.0), Scanner Passivo de Cabeçalhos e Testes Automatizados de RBAC  
> **Ambiente de Teste:** Localhost / Homologação Local (MySQL 8.0, Node.js v24.15.0, Express)  
> **Data de Execução:** 02/11/2026  

---

## 1. Visão Geral e Princípio de Defesa em Profundidade

A avaliação de segurança do **Guicell Manager** foi estruturada sob o princípio arquitetural de **Defesa em Profundidade** (*Defense in Depth*), garantindo que a proteção do sistema não dependa de uma única barreira, mas sim de múltiplas camadas complementares:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Camada de Dependências (Software Composition Analysis)   │
│    Verificação de CVEs e supply chain com npm audit         │
├─────────────────────────────────────────────────────────────┤
│ 2. Camada de Transporte e Cabeçalhos (OWASP Baseline Scan) │
│    OWASP ZAP, Helmet, CORS, HSTS e política Stateless       │
├─────────────────────────────────────────────────────────────┤
│ 3. Camada de Autorização e Controle de Acesso (RBAC)        │
│    Validação granular de permissões no backend (Node/JWT)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Camada A: Análise de Dependências (Software Composition Analysis - SCA)

A análise de componentes de terceiros foi executada via `npm audit` em ambos os subprojetos (backend e frontend), identificando vulnerabilidades conhecidas cadastradas na base do GitHub Advisory Database / NVD.

### 2.1. Resultados Consolidados do `npm audit`

| Subprojeto | Baixa (*Low*) | Moderada (*Moderate*) | Alta (*High*) | Crítica (*Critical*) | Total de Vulnerabilidades | Total de Pacotes Avaliados |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Backend** (`guicell-backend`) | 0 | 11 | 5 | 1 | **17** | 246 dependências |
| **Frontend** (`guicell-frontend`) | 0 | 1 | 8 | 0 | **9** | 106 dependências |

---

### 2.2. Diagnóstico Técnico das Vulnerabilidades Encontradas

#### A. Backend
1. **Crítica (1 ocorrência):**
   - **Pacote:** `proxy-addr` (< 2.0.8)
   - **CVE/Advisory:** GHSA-jqcg-44mw-7w3h (CVSS 9.1)
   - **Descrição:** Risco de falsificação de IP (*IP spoofing*) quando o cabeçalho `X-Forwarded-For` é utilizado através de sub-redes IPv6 mapeadas em IPv4.
   - **Mitigação:** Resolvido nativamente com `npm audit fix` para atualizar a cadeia de roteamento do Express.
2. **Altas e Moderadas:**
   - **Pacote:** `axios` (versões < 1.20.0 com vulnerabilidades de ReDoS em *DataURI parser* e riscos de poluição de protótipo em adaptadores HTTP).
   - **Pacotes:** `qs`, `uuid` e `sequelize` (dependências indiretas de parsing de query strings e validação de buffers).

#### B. Frontend
1. **Altas (8 ocorrências):**
   - **Pacote:** `vite` (versão 5.1.0): vulnerabilidades no utilitário de desenvolvimento `launch-editor` em ambiente Windows e *path traversal* em depuração de *sourcemaps*. Risco restrito ao ambiente de desenvolvimento local, sem reflexo no build estático compilado (`dist/`) em produção.
   - **Pacote:** `@vue/server-renderer` / `vue`: vulnerabilidade teórica de XSS em renderização do lado do servidor (SSR). Como o Guicell Manager opera como SPA (*Single Page Application*) estática servida via Nginx, a superfície de ataque é nula.
   - **Pacote:** `axios` (< 1.20.0).

---

### 2.3. Diretrizes de Correção e Cuidados com `npm audit fix --force`

Para aplicar as correções de forma segura:

```bash
# Execução recomendada (aplica correções dentro da compatibilidade do package.json):
npm audit fix
```

> [!WARNING]
> **Por que EVITAR o uso cego de `npm audit fix --force`?**  
> O comando `--force` permite a instalação de versões principais (*major releases*, ex.: atualizar o Vite 5 para o Vite 8 ou o Sequelize 6 para versões com novas convenções de API). Isso causa quebras severas de retrocompatibilidade (*breaking changes*), alterando métodos fundamentais do framework e quebrando a compilação do sistema. A boa prática de engenharia de software preconiza testes manuais de regressão após qualquer atualização de versão maior.

---

## 3. Camada B: Auditoria Dinâmica e de Cabeçalhos HTTP (OWASP ZAP)

A auditoria dinâmica foi conduzida utilizando o **OWASP ZAP (Zed Attack Proxy v2.17.0)** em conformidade com o **OWASP API Security Top 10** e complementada por varredura passiva dos cabeçalhos e configurações de transporte.

### 3.1. Relatório Consolidado de Alertas do OWASP ZAP

A varredura rápida realizada pelo OWASP ZAP contra a API do sistema gerou o seguinte resumo:

| Nível de Risco | Quantidade Detectada | Descrição dos Alertas |
| :--- | :---: | :--- |
| **Alto (*High*)** | **0** | Nenhuma vulnerabilidade de alta gravidade detectada. |
| **Médio (*Medium*)** | **0** | Nenhum alerta de médio risco. |
| **Baixo (*Low*)** | **0** | Nenhum alerta de baixo risco. |
| **Informativo (*Informational*)** | **1** | *User Agent Fuzzer* (5 testes automáticos de cabeçalhos de navegador). |

*O relatório oficial gerado pelo OWASP ZAP em formato HTML interativo (`zap_report.html`) e JSON (`zap_report.json`) está arquivado na pasta `tcc/relatorios_testes/`.*

---

### 3.2. Análise Detalhada dos 7 Pilares de Segurança de Tráfego e Cabeçalhos

Abaixo, apresenta-se a auditoria passiva detalhada dos cabeçalhos HTTP e comportamentos de segurança verificados na API:

| Item Auditado | Status / Valor Configurado | Nível de Risco | Avaliação Técnica e Regra de Segurança |
| :--- | :--- | :---: | :--- |
| **X-Content-Type-Options** | `nosniff` | Baixo | **Conforme.** Impede que navegadores executem arquivos simulando tipos MIME diferentes do declarado (*MIME-sniffing*). Configurado via biblioteca `helmet()`. |
| **X-Frame-Options** | `SAMEORIGIN` | Médio | **Conforme.** Bloqueia o carregamento do sistema dentro de `<iframe>` de domínios externos, neutralizando ataques de **Clickjacking**. |
| **Strict-Transport-Security (HSTS)** | `max-age=15552000; includeSubDomains` | Médio | **Conforme.** Força conexões HTTPS durante 180 dias. No ambiente de produção da Hostinger, o Nginx atua como proxy reverso com certificado SSL/TLS Let's Encrypt. |
| **Content-Security-Policy (CSP)** | `default-src 'self'; frame-ancestors 'self'; ...` | Médio | **Conforme.** Restringe fontes confiáveis de scripts, fontes e objetos externos, mitigando riscos de injeção de scripts (XSS). |
| **Referrer-Policy** | `no-referrer` | Baixo | **Conforme.** Protege a privacidade do usuário, garantindo que a URL de origem não seja vazada para domínios de terceiros. |
| **X-Powered-By** | **Omitido (Ausente)** | Baixo | **Conforme.** O cabeçalho padrão do Express (`X-Powered-By: Express`) foi removido pelo Helmet, impedindo que atacantes descubram a tecnologia do servidor. |
| **Política de CORS** | Origens restritas a whitelist do `.env` | Alto | **Conforme.** Requisições com origens não autorizadas (ex.: `http://malicious-site.com`) são rejeitadas pela regra dinâmica implementada no arquivo `app.js`. |

---

### 3.3. Avaliação de Cookies vs. Sessão Stateless (Mitigação de CSRF)

O **Guicell Manager** adota o padrão de arquitetura **Stateless** baseado em **JSON Web Tokens (JWT)**:
- O token é assinado no servidor com chave criptográfica robusta (`JWT_SECRET`) utilizando algoritmo HMAC-SHA256 (`HS256`).
- A aplicação não armazena identificadores de sessão em cookies HTTP tradicionais. O token trafega exclusivamente no cabeçalho HTTP:
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- **Benefício de Segurança:** O não uso de cookies de autenticação elimina por completo a vulnerabilidade a ataques de **Cross-Site Request Forgery (CSRF)**, já que requisições forjadas por páginas maliciosas não possuem acesso ao token em memória.

---

### 3.4. Prevenção de Vazamento de Dados Sensíveis nas Respostas da API

1. **Exclusão de Senhas em Consultas:**
   No arquivo `usuarios.controller.js`, a consulta de listagem utiliza exclusão explícita de atributos sensíveis via Sequelize:
   ```javascript
   const usuarios = await Usuario.findAll({
     attributes: { exclude: ['senha_hash', 'recuperacao_codigo', 'recuperacao_expira'] },
     order: [['nome', 'ASC']],
   });
   ```
   *Resultado do teste:* Em nenhuma rota da API de usuários ou autenticação o hash da senha (`senha_hash`) ou códigos de recuperação são expostos no payload JSON.

2. **Supressão de Stack Traces:**
   Erros 404 (rota não encontrada) e exceções genéricas retornam respostas JSON limpas e padronizadas (`{ "error": "Rota não encontrada..." }`), sem divulgar detalhes de arquivos internos, versão do Node ou stack traces do sistema operacional.

---

## 4. Camada C: Testes de Autorização e RBAC (Role-Based Access Control)

O modelo de segurança do Guicell Manager opera com controle de acesso baseado em papéis (**RBAC**), estruturado nos perfis:
- **Gerente:** Administrador do sistema, com acesso irrestrito a todos os módulos, relatórios financeiros, gestão de usuários e matriz de permissões.
- **Atendente:** Operador de balcão, com foco em atendimento a clientes, cadastro de OS, vendas no PDV e controle de abertura/fechamento do seu turno de caixa, mas **bloqueado** para transferências bancárias, exclusão de registros, visualização de relatórios gerenciais e gerenciamento de permissões.
- **Técnico:** Foco estritamente na bancada de manutenção (diagnóstico de aparelhos, execução de reparos e atualização de status de OS), com bloqueio a vendas, transferências de caixa e configurações do sistema.

### 4.1. Tabela de Testes de Autorização Executados

Para comprovar formalmente a eficácia dos bloqueios, foi executado um script automatizado (`tests/security/rbac-test.js`) simulando tentativas de intrusão, adulteração de token e burla de frontend:

| ID | Cenário de Teste de Segurança | Método e Rota da API | Perfil Utilizado | Resultado Esperado | Resultado Obtido | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **01** | Acesso a rota protegida sem enviar cabeçalho Authorization | `GET /api/usuarios` | Anônimo (Sem token) | **401 Unauthorized** | **401** | **✔ Aprovado** |
| **02** | Acesso à listagem de clientes sem autenticação | `GET /api/clientes` | Anônimo (Sem token) | **401 Unauthorized** | **401** | **✔ Aprovado** |
| **03** | Acesso utilizando token JWT adulterado / assinatura inválida | `GET /api/usuarios` | Token forjado | **403 Forbidden** | **403** | **✔ Aprovado** |
| **04** | Atendente tentando listar usuários (requer `usuarios.gerenciar`) | `GET /api/usuarios` | Atendente | **403 Forbidden** | **403** | **✔ Aprovado** |
| **05** | Atendente tentando acessar matriz de permissões (`permissoes.configurar`) | `GET /api/permissoes/matriz` | Atendente | **403 Forbidden** | **403** | **✔ Aprovado** |
| **06** | Atendente tentando transferir valores entre contas sem permissão | `POST /api/caixa/transferencias` | Atendente | **403 Forbidden** | **403** | **✔ Aprovado** |
| **07** | Técnico tentando abrir venda no PDV (sem permissão `vendas.criar`) | `POST /api/vendas` | Técnico | **403 Forbidden** | **403** | **✔ Aprovado** |
| **08** | Atendente tentando acessar relatório financeiro de faturamento | `GET /api/relatorios/caixa` | Atendente | **403 Forbidden** | **403** | **✔ Aprovado** |
| **09** | Tentativa de burlar o frontend via Postman para criar usuário Gerente | `POST /api/usuarios` | Atendente | **403 Forbidden** | **403** | **✔ Aprovado** |
| **10** | Gerente autenticado acessando listagem de usuários do sistema | `GET /api/usuarios` | Gerente | **200 OK** | **200** | **✔ Aprovado** |
| **11** | Gerente autenticado acessando a matriz completa de permissões | `GET /api/permissoes/matriz` | Gerente | **200 OK** | **200** | **✔ Aprovado** |

> **Taxa de Conformidade:** **100% dos testes de autorização foram aprovados.**  
> O middleware `checkPermission()` validou rigorosamente as credenciais no banco de dados e bloqueou tentativas de acesso não autorizado antes que qualquer operação fosse executada no banco.

---

### 4.2. Por que a Proteção no Backend é Crucial? (Argumentação para a Banca)

Muitas aplicações web cometem a falha crítica de restringir o acesso apenas na interface visual (ocultando menus ou desabilitando botões no frontend com Vue.js/React). 

O Guicell Manager adota o padrão de **Autorização em Camada Dupla**:
1. **Frontend:** Oculta botões e rotas visuais (`v-if="$pode('chave')"` e guardas de navegação do `vue-router`) para prover boa experiência do usuário (*UX*).
2. **Backend (Autoridade Real):** Toda e qualquer requisição HTTP é interceptada pelo middleware `checkPermission(chave)`. Mesmo que um atacante adultere a URL no navegador ou envie requisições diretas via Postman, curl ou DevTools simulando o perfil de outro usuário, o backend consulta a matriz de permissões resolvida e rejeita imediatamente com código **HTTP 403 Forbidden**.

---

## 5. Conclusão da Avaliação de Segurança

Os resultados demonstram que o **Guicell Manager** cumpre integralmente os requisitos de segurança de software corporativo:
- O ecossistema de dependências foi auditado e possui caminho claro de saneamento sem quebras de versão.
- A configuração de cabeçalhos de resposta segue as melhores práticas da **OWASP**, prevenindo ataques de Clickjacking, MIME-sniffing e injeção de código.
- A comunicação é estritamente restrita a origens legítimas via CORS.
- O controle de acesso por papéis (**RBAC**) é consistente, robusto e validado no servidor, garantindo a proteção e integridade dos dados financeiros e cadastrais da assistência técnica.

