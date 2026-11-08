# Relatório Técnico: Fechamento da Integridade Financeira e Regressão Final

**Projeto:** Guicell Manager — Sistema de Gestão para Assistência Técnica de Celulares  
**Contexto Acadêmico:** Trabalho de Conclusão de Curso (TCC II) — Bacharelado em Sistemas de Informação, UNIALFA (2026)  
**Ambiente de Execução:** Node.js v24.15.0, Express 4, Sequelize 6, MySQL 8.0.45 Community Server, Vue.js 3  
**Data da Execução e Validação:** 08 de Novembro de 2026  
**Status da Auditoria:** **CONCLUÍDO COM SUCESSO (13/13 Testes da Suíte de Fechamento Aprovados — 100%)**

---

## 1. Resumo Executivo

Este documento consolida as intervenções finais de integridade transacional, segurança de fluxos financeiros, paginação de histórico de clientes (RF13) e fechamento dos achados pendentes de autenticação no sistema **Guicell Manager**, em atendimento à revisão de pré-entrega do TCC II.

### Status dos Objetivos Principais:
- **Proteção do Estado Financeiro da OS:** **CORRIGIDO**. A rota genérica de atualização (`PUT /:id`, `PATCH /:id`, `PATCH /:id/status`) agora rejeita de forma estrita qualquer tentativa de mutação de campos financeiros (`forma_pagamento`, `status_pagamento`, `valor_total`, `valor_final`, `valor_pago`, `pagamentos`) com HTTP 400 Bad Request, direcionando exclusivamente para as rotas atômicas e auditadas de fechamento (`POST /:id/fechar`) e recebimento de fiado (`POST /:id/pagar`).
- **Histórico Completo do Cliente (RF13):** **CORRIGIDO**. Removida a limitação rígida arbitrária (`limit: 10`) no detalhe do cliente. Implementada paginação configurável e consulta ordenada por timestamp (`data_movimentacao DESC`), além do endpoint dedicado `GET /api/clientes/:id/historico-os`, garantindo que todas as OSs do cliente sejam consultáveis sem vazamento de dados de outros clientes e sem sobrecarga de memória.
- **Concorrência e Integridade de Estoque:** **CORRIGIDO**. Validados os bloqueios pessimistas (`lock: t.LOCK.UPDATE`) e ordenação determinística de produtos (`id_produto ASC`) em vendas, compras e ordens de serviço, evitando condições de corrida, saldo negativo e deadlocks sob concorrência simultânea.
- **Controle de Concorrência na Numeração de OS:** **CORRIGIDO**. Implementado sequenciamento com agregação bloqueante e *retry loop* transacional resiliente (até 10 tentativas com *exponential backoff jitter*), eliminando erros 500 por colisão de chave única em requisições paralelas.
- **Auditoria Física de Chaves Estrangeiras (DB01):** **CORRIGIDO**. Comprovada via consulta direta somente de leitura ao `information_schema.REFERENTIAL_CONSTRAINTS` do MySQL 8 a presença efetiva da regra `DELETE_RULE = RESTRICT` nas 4 constraints de integridade contábil.
- **Revisão Final de Autenticação:** **CORRIGIDO**.
  1. Eliminado o caminho alternativo de bypass por OTP no endpoint de redefinição de senha (`POST /api/auth/recuperar-senha/redefinir`), exigindo estritamente o token de alta entropia `resetGrant` (etapa 3), em plena conformidade com NIST SP 800-63B-4.
  2. Implementada verificação estrita em `recovery.service.js` para exigir obrigatoriamente a variável independente `RESET_OTP_HMAC_KEY` (mínimo 32 caracteres / 256 bits) em ambiente de produção, impedindo reutilização do segredo JWT.
- **Regressão Global:** **APROVADO**. Suítes de cancelamento de OS, RBAC (11/11), consistência de concorrência (13/13), autenticação (42/42) e compilação de produção do Vite executadas com 100% de sucesso.

---

## 2. Tabela "Antes × Depois" por Achado

| Achado / Requisito | Diagnóstico Inicial (Antes) | Causa Raiz | Risco Técnico / Negócio | Decisão de Implementação (Depois) | Impacto de Compatibilidade |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mutação Financeira Indevida em OS** | `atualizarStatus` aceitava `forma_pagamento` e definia `status_pagamento='pago'` sem gerar lançamento no caixa | Linhas 247-250 em `os.controller.js` atribuíam `'pago'` na rota genérica de status | OS constando como quitada sem conciliação contábil, evasão de caixa e enriquecimento sem causa | Rejeição explícita com HTTP 400 (`CAMPOS_FINANCEIROS_PROTEGIDOS`) para campos financeiros em rotas genéricas; fechamento apenas via `POST /fechar` | Compatível. Frontend ajustado para não enviar `forma_pagamento` em edições operacionais comuns |
| **Bypass de Permissão Financeira** | Usuário com permissão puramente operacional (`os.editar`) podia teoricamente enviar campos de liquidação | Falta de separação entre edição operacional e faturamento financeiro | Técnico de bancada podendo baixar pagamentos ou desviar receitas | Bloqueio de campos financeiros na rota genérica e restrição de `POST /fechar` e `POST /pagar` | Sem quebra. Operador de balcão / gerente utiliza as rotas dedicadas |
| **Histórico do Cliente (RF13)** | `buscarPorId` em `clientes.controller.js` continha `limit: 10` hardcoded na associação | Consulta limitada arbitrariamente sem paginação ou ordenação explícita | Não atendimento ao RF13 do TCC; cliente com mais de 10 OSs não conseguia consultar ordens antigas | Implementada paginação com parâmetros `pagina` e `limite` (padrão 50, até 500) e endpoint `GET /api/clientes/:id/historico-os` | Compatível. Modal do frontend passa a carregar até 50 OSs de imediato e API suporta paginação |
| **Bypass de Reset de Senha por OTP** | `redefinirSenha` em `auth.controller.js` aceitava `codigo` direto como alternativa a `resetGrant` | Caminho de fallback legado na etapa final de troca de senha | Falta de incremento de tentativas de falha em `redefinirSenha`, contornando a proteção contra força bruta | Exclusão do fallback direto por `codigo`; exigência obrigatória de `resetGrant` emitido após validação de OTP | Compatível. Frontend `LoginView.vue` já utilizava `resetGrant` |
| **Isolamento de Chave HMAC de OTP** | `recovery.service.js` derivava chave do `JWT_SECRET` se `RESET_OTP_HMAC_KEY` ausente | Ausência de validação de startup da chave de HMAC em ambiente produtivo | Comprometimento cruzado: vazamento de JWT Secret expunha hashes de OTP | Exigência obrigatória de `RESET_OTP_HMAC_KEY` (mínimo 32 caracteres) quando `NODE_ENV === 'production'` | Nenhuma quebra local; exige definição no `.env` da VPS em produção |
| **Chaves Estrangeiras Físicas (DB01)** | Documento `banco_de_dados.sql` divergia da migration | Divergência em script textual de referência | Risco de inconsistência relacional caso script manual fosse executado | Sincronizado script SQL com as migrations e comprovado no MySQL 8 físico que as 4 FKs possuem `DELETE_RULE = RESTRICT` | Transparente. Banco já operava com `RESTRICT` pela migration |

---

## 3. Arquivos e Funções Alterados

### Backend (Produção):
1. **`backend/src/controllers/os.controller.js`**:
   - `atualizarStatus` (Linhas 179-285): Adicionado filtro e rejeição de campos financeiros protegidos (`forma_pagamento`, `status_pagamento`, `valor_total`, `valor_final`, `valor_pago`, `pagamentos`) retornando HTTP 400 Bad Request com código `CAMPOS_FINANCEIROS_PROTEGIDOS`. Removida a atribuição automática de `status_pagamento = 'pago'`.
   - `criar` (Linhas 97-130): Ajustado laço de retentativas transacionais contra `SequelizeUniqueConstraintError` para 10 tentativas com *exponential backoff jitter*.
2. **`backend/src/controllers/clientes.controller.js`**:
   - `buscarPorId` (Linhas 23-64): Removida restrição estática `limit: 10`. Implementada consulta via `Movimentacao.findAndCountAll` ordenada por `data_movimentacao DESC, id_movimentacao DESC` com suporte a `pagina` e `limite` configuráveis.
   - `listarHistoricoOs` (Linhas 66-105): Nova função exportada que atende ao endpoint `GET /api/clientes/:id/historico-os`, fornecendo metadados paginados (`total`, `pagina`, `limite`, `total_paginas`, `ordens`).
3. **`backend/src/routes/clientes.routes.js`**:
   - Linha 10: Registrada a rota `GET /:id/historico-os` com middleware `checkPermission(['clientes', 'os', 'vendas'])`.
4. **`backend/src/controllers/auth.controller.js`**:
   - `redefinirSenha` (Linhas 451-515): Removido o parâmetro `codigo` e o bloco de validação direta por OTP. O método agora exige estritamente `resetGrant`, eliminando o bypass de etapa.
5. **`backend/src/services/recovery.service.js`**:
   - `getHmacSecret` (Linhas 5-18): Adicionada validação que lança erro crítico caso `NODE_ENV === 'production'` e `RESET_OTP_HMAC_KEY` não esteja configurada com no mínimo 32 caracteres.
6. **`backend/src/controllers/vendas.controller.js`**:
   - `criar` e `cancelar`: Validados com ordenação determinística (`id_produto ASC`) e bloqueio pessimista `lock: t.LOCK.UPDATE`.
7. **`backend/src/controllers/compras.controller.js`**:
   - `criar` e `cancelar`: Validados com ordenação ascendente de produtos e trava de linha pessimista.

### Frontend:
1. **`frontend/src/views/OsView.vue`**:
   - Linha 1018-1032: Removido o envio do argumento `selectedOS.value.formaPagamento` na chamada de `osService.atualizarStatus`, alinhando a interface com a separação entre edição operacional e faturamento financeiro.
2. **`frontend/src/services/index.js`**:
   - Linha 60: Removido `forma_pagamento` da assinatura de `atualizarStatus`.

### Documentação Técnica e Schema:
1. **`tcc/banco_de_dados.sql`**: Sincronizadas as 4 constraints para `ON DELETE RESTRICT` e atualizados os comentários de OTP (5 minutos e máximo 5 tentativas).
2. **`tcc/vendas.md`**: Esclarecida a distinção entre a UI de balcão (forma única/fiado) e a capacidade multi-pagamento da API backend.

---

## 4. Matriz de Resultados dos Casos de Teste (FIN01 a FIN08, RF13-01, CONC01, CONC02, DB01, REG01)

A execução automatizada da suíte completa [`tests/security/fechamento-integridade-suite.js`](file:///c:/trabalho/clientes/guicell/guicell-manager/tests/security/fechamento-integridade-suite.js) gerou o arquivo de evidências JSON em [`tests/results/fechamento-integridade/relatorio_fechamento_integridade.json`](file:///c:/trabalho/clientes/guicell/guicell-manager/tests/results/fechamento-integridade/relatorio_fechamento_integridade.json).

```
══════════════════════════════════════════════════════════════════════════════
   SUITE: FECHAMENTO DA INTEGRIDADE FINANCEIRA E REGRESSÃO (GUICELL)          
   Casos de Teste: FIN01-FIN08, RF13-01, CONC01-02, DB01, REG01               
══════════════════════════════════════════════════════════════════════════════

Ambiente base preparado: Cliente #20 | Aparelho #21 | Produto #34

  ✔ [FIN01] Bloqueio de forma_pagamento em PATCH /os/:id/status sem status (79ms)
  ✔ [FIN02] Rejeição de campos financeiros em PUT e PATCH (com e sem status) (93ms)
  ✔ [FIN03] Usuário restrito a os.editar não consegue confirmar recebimento por nenhuma rota (275ms)
  ✔ [FIN04] Fechamento legítimo gera movimentação, caixa e pernas financeiras conciliadas (116ms)
  ✔ [FIN05] Entrega fiada permanece pendente sem caixa e pagamento posterior efetiva baixa (83ms)
  ✔ [FIN06] Dois fechamentos simultâneos não geram recebimento duplicado (idempotência) (63ms)
  ✔ [FIN07] Falha induzida antes do commit desfaz todas as alterações (rollback atômico) (65ms)
  ✔ [FIN08] Cancelamento e estorno de OS recebida preservam saldos e não duplicam estoque (231ms)
  ✔ [RF13-01] Mais de 10 OS de um cliente consultáveis por paginação sem mistura de clientes (504ms)
  ✔ [CONC01] OS e Venda concorrentes disputando o mesmo produto preservam integridade de estoque (214ms)
  ✔ [CONC02] Compra e Venda concorrentes envolvendo o mesmo produto preservam saldo exato (208ms)
  ✔ [DB01] Conferência física das FKs no information_schema do MySQL 8 (DELETE_RULE=RESTRICT) (32ms)
  ✔ [REG01] Regressão completa: Cancelamento, RBAC (11/11), Consistência (13/13) e Build Frontend (39197ms)

══════════════════════════════════════════════════════════════════════════════
   TOTAL DE TESTES: 13 | APROVADOS: 13 | REPROVADOS: 0
══════════════════════════════════════════════════════════════════════════════
```

### Tabela Detalhada dos Resultados

| ID | Nome do Caso de Teste | Endpoint & Método | Condição Testada | Resultado Esperado | Resultado Efetivamente Obtido | Status | Duração |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **FIN01** | Bloqueio de `forma_pagamento` em `PATCH /status` sem status | `PATCH /api/ordens-servico/:id/status` | Payload `{ forma_pagamento: 'PIX' }` sem campo status | Rejeição HTTP 400 sem mutação de status nem gravação em caixa | HTTP 400 Bad Request (`CAMPOS_FINANCEIROS_PROTEGIDOS`). Status mantido como não-pago e 0 lançamentos em caixa | **PASS** | 79 ms |
| **FIN02** | Rejeição de campos financeiros em PUT e PATCH (com e sem status) | `PUT /:id`<br>`PATCH /:id`<br>`PATCH /:id/status` | Injeção de `status_pagamento='pago'`, `forma_pagamento='Dinheiro'` e `valor_total=500` | Todas as 4 requisições rejeitadas com HTTP 400 | Todas as 4 requisições rejeitadas com HTTP 400. Status da OS no banco não alterado para pago | **PASS** | 93 ms |
| **FIN03** | Usuário restrito a `os.editar` não liquida OS | `POST /fechar`<br>`POST /pagar`<br>`PATCH /:id` | Usuário com permissão apenas de edição tentando operações de recebimento | Bloqueio em todas as vias (HTTP 403 e 400) | Bloqueado em `POST /fechar` (403), `POST /pagar` (403) e `PATCH` genérico (400) | **PASS** | 275 ms |
| **FIN04** | Fechamento legítimo com conciliação contábil | `POST /api/ordens-servico/:id/fechar` | Fechamento regular com PIX de R$ 180,50 | Lançamento atômico em `movimentacao`, `caixa` e `caixa_pagamentos` | R$ 180,50 conciliado exatamente nas 3 entidades: OS entregue, Caixa #114 e CaixaPagamento #123 | **PASS** | 116 ms |
| **FIN05** | Entrega fiada pendente e quitação posterior | `POST /:id/fechar`<br>`POST /:id/pagar` | Fechamento com `Fiado` seguido de quitação com `Cartão de débito` | Entrega sem caixa inicial; entrada financeira apenas na quitação | Fiado gravou OS pendente sem caixa; quitação posterior gerou entrada de R$ 250,00 no caixa #115 | **PASS** | 83 ms |
| **FIN06** | Idempotência e bloqueio de fechamentos concorrentes | `POST /api/ordens-servico/:id/fechar` | 2 requisições simultâneas de fechamento da mesma OS | Apenas 1 conclusão; segunda falha com 400 | Exatamente 1 fechamento 200 e 1 rejeitado (400 OS já finalizada). Exatamente 1 lançamento em caixa | **PASS** | 63 ms |
| **FIN07** | Rollback atômico em falha antes do commit | `POST /api/ordens-servico/:id/fechar` | Fechamento induzido ao erro por falta de estoque em peça | Reversão completa de banco sem resíduo | Transação revertida com sucesso. OS preservada em estado aberto, estoque inalterado (50 un) e 0 caixas | **PASS** | 65 ms |
| **FIN08** | Cancelamento e estorno sem duplicação de devolução | `POST /api/ordens-servico/:id/cancelar` | Cancelamento de OS recebida seguido de tentativa duplicada | Devolução de peças uma única vez e estorno no caixa | Estorno gerado no caixa #118; estoque restaurado para 10 un e tentativa duplicada rejeitada sem novo estorno | **PASS** | 231 ms |
| **RF13-01** | Paginação e isolamento de clientes no histórico de OS | `GET /api/clientes/:id`<br>`GET /:id/historico-os` | Cliente C com 12 OSs e Cliente D com 3 OSs | Todas as 12 OSs de C acessíveis por página, sem ordens de D | 12/12 OSs de C consultadas (5+5+2 em 3 páginas). Ordenação temporal exata e zero vazamento de D | **PASS** | 504 ms |
| **CONC01** | Concorrência OS × Venda no mesmo produto | `POST /api/vendas`<br>`POST /api/ordens-servico/:id/fechar` | 4 operações concorrentes (2 Vendas + 2 OS) disputando estoque = 3 | Exatamente 3 sucessos e 1 rejeição; saldo final = 0 | Exatamente 3 sucessos e 1 rejeição (400 Estoque insuficiente). Saldo final = 0 un (sem saldo negativo) | **PASS** | 214 ms |
| **CONC02** | Concorrência Compra × Venda no mesmo produto | `POST /api/compras`<br>`POST /api/vendas` | 3 Vendas (-2 cada) e 1 Compra (+4) simultâneas com estoque inicial = 5 | Execução sem deadlock e conferência matemática do saldo | Zero deadlocks. 1 compra (+4) e 2 vendas (-4) processadas com sucesso. Saldo final exato: 5 un | **PASS** | 208 ms |
| **DB01** | Auditoria física das FKs via `information_schema` | Consulta SQL física de metadados | Verificação de `DELETE_RULE = RESTRICT` nas 4 constraints | Todas com `RESTRICT` | 4 FKs inspecionadas fisicamente no MySQL 8 local com `DELETE_RULE = RESTRICT` | **PASS** | 32 ms |
| **REG01** | Execução de suítes de regressão e build de produção | CLI / Scripts automatizados | Execução de `test-cancel-os.js`, `rbac-test.js`, `consistencia-suite.js` e Vite build | 100% de aprovação em todos | Cancelamento: OK; RBAC (11/11): OK; Consistência (13/13): OK; Vite Build: OK (4.81s) | **PASS** | 39.197 ms |

---

## 5. Provas de Consistência e Conciliação

### 5.1. Conciliação Centavo por Centavo (FIN04)
- **Valor da OS:** R$ 180,50
- **Lançamento em `movimentacao`:** `valor_total = 180.50`, `status_pagamento = 'pago'`, `forma_pagamento = 'PIX'`.
- **Lançamento em `caixa`:** ID #114, `tipo = 'entrada'`, `valor = 180.50`, `natureza = 'operacional'`.
- **Lançamento em `caixa_pagamentos`:** ID #123, `id_caixa = 114`, `valor = 180.50`, `id_forma = 2 (PIX)`.
- **Divergência apurada:** R$ 0,00 (diferença nula).

### 5.2. Resultado da Consulta Física às Foreign Keys (DB01)
Consulta executada contra o banco MySQL 8 local:
```sql
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
  AND rc.TABLE_NAME IN ('transferencias_caixa', 'caixa', 'caixa_pagamentos');
```

**Resultado Físico Retornado pelo MySQL 8:**
```json
[
  {
    "TABLE_NAME": "transferencias_caixa",
    "COLUMN_NAME": "id_transferencia_estornada",
    "REFERENCED_TABLE_NAME": "transferencias_caixa",
    "DELETE_RULE": "RESTRICT"
  },
  {
    "TABLE_NAME": "caixa",
    "COLUMN_NAME": "id_transferencia",
    "REFERENCED_TABLE_NAME": "transferencias_caixa",
    "DELETE_RULE": "RESTRICT"
  },
  {
    "TABLE_NAME": "caixa",
    "COLUMN_NAME": "id_lancamento_origem",
    "REFERENCED_TABLE_NAME": "caixa",
    "DELETE_RULE": "RESTRICT"
  },
  {
    "TABLE_NAME": "caixa_pagamentos",
    "COLUMN_NAME": "id_caixa",
    "REFERENCED_TABLE_NAME": "caixa",
    "DELETE_RULE": "RESTRICT"
  }
]
```

---

## 6. Procedimentos de Reprodução em Ambiente de Homologação

Para reproduzir localmente todos os testes em um banco MySQL de homologação/desenvolvimento:

1. **Configurar variáveis de ambiente (`backend/.env`):**
   ```ini
   NODE_ENV=test
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha_local
   DB_NAME=guicell_manager
   JWT_SECRET=segredo_local_de_teste
   RESET_OTP_HMAC_KEY=chave_secreta_local_minimo_32_caracteres_hex
   ```
2. **Executar a Suíte de Fechamento de Integridade:**
   ```bash
   node guicell-manager/tests/security/fechamento-integridade-suite.js
   ```
3. **Executar a Suíte Completa de Segurança de Autenticação (OWASP / NIST):**
   ```bash
   node guicell-manager/tests/security/auth-security-suite.js
   ```
4. **Executar a Suíte de Consistência e Concorrência:**
   ```bash
   node guicell-manager/tests/security/consistencia-suite.js
   ```
5. **Executar a Verificação de Build do Frontend:**
   ```bash
   npm --prefix guicell-manager/frontend run build
   ```

---

## 7. Recomendações e Configurações para Produção (VPS Hostinger)

Antes do deploy em produção, o mantenedor do sistema deverá atentar para as seguintes configurações:

1. **Definição Obrigatória de `RESET_OTP_HMAC_KEY` no `.env` da VPS:**
   - Gerar uma chave de alta entropia (256 bits) via OpenSSL no servidor:
     ```bash
     openssl rand -hex 32
     ```
   - Adicionar no arquivo `.env` do backend em produção:
     ```ini
     RESET_OTP_HMAC_KEY=<hash_de_64_caracteres_gerado_acima>
     ```
   - *Nota de Segurança:* O backend agora abortará a inicialização caso `NODE_ENV === 'production'` e essa chave não possua ao menos 32 caracteres, garantindo que o segredo JWT nunca seja reutilizado como chave de HMAC.
2. **Reinicialização do Serviço Node via PM2:**
   ```bash
   pm2 restart guicell-backend
   ```
3. **Imutabilidade Contábil:**
   - Não tentar executar comandos manuais de deleção física (`DELETE FROM caixa`) ou `sync({force: true})`, pois as constraints `ON DELETE RESTRICT` rejeitarão qualquer operação que destrua o histórico financeiro.

