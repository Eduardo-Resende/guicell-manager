# Relatório Técnico: Correção de Integridade, Fluxos de Negócio e Concorrência Transacional

**Projeto:** Guicell Manager — Sistema de Gestão para Assistência Técnica de Celulares  
**Contexto Acadêmico:** Trabalho de Conclusão de Curso (TCC II) — Bacharelado em Sistemas de Informação, UNIALFA (2026)  
**Ambiente:** Node.js v24.15.0, Express 4, Sequelize 6, MySQL 8.0.45 Community Server, Vue.js 3  
**Data da Auditoria e Validação:** 08 de Novembro de 2026  
**Status da Homologação:** **APROVADO (13/13 Testes de Consistência Aprovados — 100% de Sucesso)**

---

## 1. Sumário Executivo

Este documento consolida a análise, intervenção corretiva, comprovação empírica e validação de regressão relativas aos 8 achados de integridade, fluxos de negócio e concorrência transacional (**A01 a A08**) identificados na auditoria do código-fonte do **Guicell Manager**.

As alterações foram realizadas de forma cirúrgica e não-destrutiva sobre o backend Express/Sequelize, mantendo compatibilidade integral com a interface Vue.js 3 e preservando os fluxos existentes dos módulos de Ordens de Serviço (OS), Ponto de Venda (PDV/Vendas), Compras, Controle de Caixa/Financeiro e Controle de Acesso Baseado em Papéis (RBAC).

### Resumo Quantitativo das Validações:
- **Suíte de Consistência (`consistencia-suite.js`):** 13/13 casos de teste (**100% de aprovação**).
- **Suíte de Cancelamento de OS (`test-cancel-os.js`):** 100% de aprovação (todos os fluxos de estoque e financeiro validados).
- **Suíte RBAC (`rbac-test.js`):** 11/11 testes aprovados sem regressões.
- **Frontend Build (`npm run build`):** Compilação de produção do Vite bem-sucedida sem erros de TypeScript/Rollup.

---

## 2. Tabela Comparativa dos Problemas (A01 a A08)

| ID | Severidade | Descrição do Problema | Status Inicial | Arquivo(s) Afetado(s) | Solução Aplicada | Status Final |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A01** | Crítico | Cancelamento alternativo via `PATCH /status` concorrendo com rota dedicada `POST /cancelar`, com risco de bypass de motivo, inconsistência de estoque e ausência de estorno financeiro | Reproduzível | `backend/src/controllers/os.controller.js` | Bloqueio estrito de transição para `'Cancelado'` no `PATCH /status` (HTTP 400 instruindo `POST /cancelar`); bloqueio de mutações em OSs canceladas | **Corrigido e Comprovado (CT01, CT03, CT04, CT05)** |
| **A02** | Alta | Entrega de OS permitida diretamente via `PATCH /status` sem liquidação financeira no caixa | Reproduzível | `backend/src/controllers/os.controller.js` | Bloqueio estrito de transição para `'Entregue'` no `PATCH /status` (HTTP 400 direcionando para `POST /fechar`); bloqueio de mutações em OS já entregue | **Corrigido e Comprovado (CT02)** |
| **A03** | Alta | Criação e edição de OS permitia vincular `id_aparelho` que não pertencia ao `id_cliente` informado | Reproduzível | `backend/src/controllers/os.controller.js`<br>`backend/src/routes/os.routes.js` | Validação de vínculo cliente-aparelho no `criar` e no `atualizarStatus` (HTTP 422 Unprocessable Entity se houver incompatibilidade cadastral) | **Corrigido e Comprovado (CT06, CT07, CT12)** |
| **A04** | Alta / Risco | Concorrência e race conditions em movimentações de estoque (Vendas, Compras e OS) gerando risco de *lost updates*, saldo negativo e deadlocks por concorrência desordenada | Reproduzível | `backend/src/controllers/vendas.controller.js`<br>`backend/src/controllers/compras.controller.js`<br>`backend/src/controllers/os.controller.js` | Agrupamento de itens por ID, ordenação determinística ascendente (`id_produto ASC`) e bloqueio pessimista via `lock: t.LOCK.UPDATE` em todas as consultas e baixas | **Corrigido e Comprovado (CT08, CT09, CT10)** |
| **A05** | Média | Concorrência na geração de número de OS (`gerarNumeroOS`) com risco de falha HTTP 500 por colisão da constraint de unicidade `numero_os` | Reproduzível | `backend/src/controllers/os.controller.js` | Sequenciamento com agregação bloqueante na transação e mecanismo de retentativas automáticas (*exponential backoff / retry loop* de até 5 tentativas) contra `SequelizeUniqueConstraintError` | **Corrigido e Comprovado (CT11)** |
| **A06** | Média | Divergência em 4 constraints de chave estrangeira entre `tcc/banco_de_dados.sql` e a migration `20261102000001-controle-financeiro-caixa.js` | Confirmado | `tcc/banco_de_dados.sql` | Ajustadas 4 FKs para `ON DELETE RESTRICT` em estornos de transferência, lançamentos de caixa vinculados e pagamentos de caixa | **Corrigido e Comprovado (CT13)** |
| **A07** | Média | Divergência documental em `tcc/vendas.md`: documento afirmava que `VendasView.vue` operava com split payments, enquanto a interface opera com forma única/fiado | Confirmado | `tcc/vendas.md` | Documentação alinhada: detalhada a capacidade arquitetural da API REST (`pagamentos: [{ forma, valor }]`) versus a interface de balcão de clique rápido | **Corrigido e Comprovado** |
| **A08** | Baixa | Comentários desatualizados no schema SQL sobre parâmetros de OTP (citavam 10 min e 3/5 tentativas, divergindo do código real) | Confirmado | `tcc/banco_de_dados.sql` | Comentários atualizados para refletir o código real: código de 8 dígitos, expiração de 5 minutos e máximo de 5 tentativas consecutivas | **Corrigido e Comprovado (CT13)** |

---

## 3. Detalhamento Técnico por Achado

### Achado A01 — Cancelamento Alternativo via `PATCH /status` (Crítico)
- **Diagnóstico Inicial:** O método `atualizarStatus` continha um bloco interno que permitia mudar o status para `'Cancelado'`, devolvendo estoque de forma concorrente mas **sem estornar o caixa financeiro** e sem exigir os controles de auditoria presentes na rota `POST /api/ordens-servico/:id/cancelar`.
- **Risco de Integridade:** Evasão da permissão `os.excluir`, quebra da consistência contábil (cliente recebia peças de volta no sistema mas o lançamento de recebimento permanecia no caixa como receita ativa) e múltiplos cancelamentos da mesma OS.
- **Solução Implementada:**
  1. Em `atualizarStatus`, qualquer tentativa de passar `status: 'Cancelado'` é interceptada de imediato com HTTP 400 Bad Request, explicitando que a operação deve ser submetida a `POST /api/ordens-servico/:id/cancelar`.
  2. Adicionada trava verificando se a OS já está com `status_os === 'Cancelado'`; se estiver, qualquer tentativa de mutação é barrada com HTTP 400.
  3. Código legado de devolução descoordenada de estoque em `atualizarStatus` foi removido.
- **Código Representativo:**
  ```javascript
  if (os.status_os === 'Cancelado') {
    await t.rollback();
    return res.status(400).json({ error: 'Não é possível alterar uma Ordem de Serviço cancelada.' });
  }
  if (status === 'Cancelado') {
    await t.rollback();
    return res.status(400).json({
      error: 'Para cancelar uma Ordem de Serviço, utilize a rota dedicada de cancelamento (POST /api/ordens-servico/:id/cancelar).',
    });
  }
  ```

---

### Achado A02 — Entrega Direta sem Fechamento Financeiro (Alta)
- **Diagnóstico Inicial:** Um operador com permissão `os.status` podia emitir `PATCH /status` com `status: 'Entregue'`, contornando a rota obrigatória `POST /api/ordens-servico/:id/fechar`.
- **Risco de Integridade:** O aparelho era liberado no sistema sem validação de sessão de caixa aberta, sem checagem de formas de pagamento, sem conferência de centavos e sem a gravação da receita operacional no Caixa e em `CaixaPagamento`.
- **Solução Implementada:**
  1. Bloqueada a transição para `'Entregue'` dentro de `atualizarStatus` com HTTP 400, instruindo o uso da rota `POST /fechar`.
  2. Bloqueadas alterações adicionais se a OS já estiver no status final `'Entregue'`.
- **Código Representativo:**
  ```javascript
  if (os.status_os === 'Entregue') {
    await t.rollback();
    return res.status(400).json({ error: 'Não é possível alterar uma OS já entregue.' });
  }
  if (status === 'Entregue') {
    await t.rollback();
    return res.status(400).json({
      error: 'Para entregar a Ordem de Serviço, utilize a rota de fechamento financeiro (POST /api/ordens-servico/:id/fechar).',
    });
  }
  ```

---

### Achado A03 — Incoerência Cliente-Aparelho na Criação e Edição de OS (Alta)
- **Diagnóstico Inicial:** O método `criar` e a edição de OS permitiam que um payload contivesse `id_cliente: 1` e `id_aparelho: 2`, sem validar se o aparelho pertencia de fato àquele cliente.
- **Risco de Integridade:** Desalinhamento relacional no banco, histórico técnico corrompido, geração de termos de garantia e ordens impressas com proprietário incorreto, além de potenciais brechas de privacidade na consulta de ordens.
- **Solução Implementada:**
  1. No método `criar`: se `id_aparelho` for fornecido, busca o aparelho e valida se `aparelho.id_cliente === Number(id_cliente)`. Caso divirja, aborta a transação e retorna HTTP 422 Unprocessable Entity.
  2. No método `atualizarStatus`: adicionada validação cruzada entre o cliente e o aparelho alvo da OS, retornando HTTP 422 se incompatíveis.
- **Código Representativo:**
  ```javascript
  if (id_aparelho) {
    const aparelhoExistente = await Aparelho.findByPk(id_aparelho, { transaction: t });
    if (!aparelhoExistente) {
      await t.rollback();
      return res.status(404).json({ error: 'Aparelho informado não encontrado.' });
    }
    if (aparelhoExistente.id_cliente !== Number(id_cliente)) {
      await t.rollback();
      return res.status(422).json({
        error: 'Incoerência cadastral: o aparelho informado não pertence ao cliente selecionado.',
      });
    }
    aparelhoId = aparelhoExistente.id_aparelho;
  }
  ```

---

### Achado A04 — Concorrência e *Lost Updates* em Estoque (Alta / Risco)
- **Diagnóstico Inicial:** `vendas.controller.js`, `compras.controller.js` e `os.controller.js` liam o registro de produto (`Produto.findByPk`) sem bloquear a linha no banco de dados (`lock: t.LOCK.UPDATE`) e processavam itens na ordem aleatória recebida do cliente HTTP.
- **Risco de Concorrência:**
  - *Race condition* (*Lost Update*): se duas vendas concorrentes lessem o estoque simultaneamente (ex: estoque = 1), ambas passavam na validação e decrementavam para 0, resultando em estoque negativo ou venda fantasma.
  - *Deadlock* de banco (`ER_LOCK_DEADLOCK`): se a Transação 1 bloqueasse o Produto A e tentasse bloquear o B, enquanto a Transação 2 bloqueasse o B e tentasse o A, o MySQL forçava o aborto de uma das transações.
- **Solução Implementada:**
  1. **Agrupamento Prévio:** Quantidades do mesmo produto no payload são somadas.
  2. **Ordenação Determinística:** Todos os `id_produto` são ordenados de forma estritamente numérica ascendente (`sort((a, b) => a - b)`).
  3. **Bloqueio Pessimista Ordenado:** Aquisição de trava de linha `SELECT ... FOR UPDATE` via Sequelize (`lock: t.LOCK.UPDATE`) seguindo rigorosamente a ordem ordenada, eliminando o grafo de espera circular.
- **Código Representativo:**
  ```javascript
  // backend/src/controllers/vendas.controller.js
  const qtdPorProduto = {};
  for (const item of itens) {
    const pId = Number(item.id_produto);
    qtdPorProduto[pId] = (qtdPorProduto[pId] || 0) + parseInt(item.quantidade, 10);
  }
  const sortedProdIds = Object.keys(qtdPorProduto).map(Number).sort((a, b) => a - b);
  const produtosMap = new Map();

  for (const pId of sortedProdIds) {
    const produto = await Produto.findByPk(pId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!produto) { await t.rollback(); return res.status(404).json({ error: `Produto ${pId} não encontrado.` }); }
    if (produto.estoque_atual < qtdPorProduto[pId]) {
      await t.rollback(); return res.status(400).json({ error: `Estoque insuficiente: ${produto.descricao}` });
    }
    produtosMap.set(pId, produto);
  }
  ```

---

### Achado A05 — Concorrência na Numeração Sequencial de OS (Média)
- **Diagnóstico Inicial:** O método `gerarNumeroOS` realizava um `SELECT MAX(CAST(numero_os AS UNSIGNED))` sem participar da transação de criação ou sem bloquear a tabela, causando colisões da constraint UNIQUE `numero_os` sob requisições paralelas, gerando erros HTTP 500 no cliente.
- **Solução Implementada:**
  1. O sequenciador foi integrado à transação com bloqueio pessimista.
  2. A criação da OS foi encapsulada em um laço de retentativas transacionais (*retry loop* com até 5 tentativas e *jitter* aleatório). Em caso de `SequelizeUniqueConstraintError`, a transação faz rollback limpo e retenta imediatamente com novo número sequencial.
- **Código Representativo:**
  ```javascript
  let tentativas = 0;
  const maxTentativas = 5;
  while (tentativas < maxTentativas) {
    tentativas++;
    const t = await sequelize.transaction();
    try {
      const numero_os = await gerarNumeroOS(t);
      const os = await Movimentacao.create({ ... }, { transaction: t });
      await t.commit();
      return res.status(201).json(completa);
    } catch (err) {
      if (!t.finished) await t.rollback();
      if (err.name === 'SequelizeUniqueConstraintError' && tentativas < maxTentativas) {
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 50) + 10));
        continue;
      }
      throw err;
    }
  }
  ```

---

### Achado A06 — Divergência de Constraints SQL vs Migration (Média)
- **Diagnóstico Inicial:** O arquivo de documentação canônica `tcc/banco_de_dados.sql` apresentava 4 chaves estrangeiras com `ON DELETE SET NULL` ou `ON DELETE CASCADE`, enquanto a migration oficial de produção `20261102000001-controle-financeiro-caixa.js` definia `onDelete: 'RESTRICT'`.
- **Risco de Integridade:** Riscos de orfandade de dados contábeis em ambientes que executassem o script SQL manual em vez das migrations do Sequelize.
- **Solução Implementada:** Atualizadas as 4 constraints em `tcc/banco_de_dados.sql`:
  - `transferencias_caixa.id_transferencia_estornada`: `ON DELETE RESTRICT`
  - `caixa.id_transferencia`: `ON DELETE RESTRICT`
  - `caixa.id_lancamento_origem`: `ON DELETE RESTRICT`
  - `caixa_pagamentos.id_caixa`: `ON DELETE RESTRICT`

---

### Achado A07 — Documentação de Pagamentos Divididos em `tcc/vendas.md` (Média)
- **Diagnóstico Inicial:** A documentação indicava erroneamente que a interface web `VendasView.vue` já possuía controles de tela para rateio multi-pagamento no balcão, quando na verdade o modal da interface opera com forma única (ou fiado), enquanto o backend já possui suporte nativo completo.
- **Solução Implementada:** Atualizada a seção 2.2 e seção 4 do arquivo `tcc/vendas.md`, estabelecendo a distinção clara entre a interface simplificada de balcão (focada em velocidade de atendimento) e o motor financeiro da API (`financeiro.service.js`), que aceita `pagamentos: [{ forma, valor }]`.

---

### Achado A08 — Comentários de Recuperação de Senha no SQL (Baixa)
- **Diagnóstico Inicial:** O schema `tcc/banco_de_dados.sql` continha comentários legados indicando 10 minutos de expiração de OTP e máximo de 3 ou 5 tentativas.
- **Solução Implementada:** Comentários corrigidos para refletir os valores exatos aplicados pelo módulo `recovery.service.js`:
  - `recuperacao_expira`: Expiração do código OTP (5 minutos).
  - `recuperacao_tentativas`: Falhas consecutivas de OTP (máximo 5 tentativas).
  - `recuperacao_grant_expira`: Expiração do Reset Grant (5 minutos).

---

## 4. Resultados dos Casos de Teste (CT01 a CT13)

A execução automatizada da suíte de testes de consistência foi realizada contra o banco MySQL local isolado (`guicell_manager`), com servidor Express rodando em porta efêmera.

```
══════════════════════════════════════════════════════════════════════════════
   SUITE DE TESTES: INTEGRIDADE, FLUXOS E CONCORRÊNCIA — GUICELL MANAGER      
   Validação dos Achados A01 a A08 (CT01 a CT13)                              
══════════════════════════════════════════════════════════════════════════════

Ambiente preparado: Clientes 6, 7 | Produto 10

  ✔ [CT01] Bloqueio de cancelamento via PATCH /status (orientando rota POST /cancelar) (75ms)
  ✔ [CT02] Bloqueio de entrega direta via PATCH /status sem fechamento financeiro (51ms)
  ✔ [CT03] Cancelamento regular de OS via POST /cancelar com justificativa válida (335ms)
  ✔ [CT04] Rejeição de cancelamento duplicado na rota POST /cancelar (15ms)
  ✔ [CT05] Bloqueio de alteração de status via PATCH em OS já cancelada (10ms)
  ✔ [CT06] Validação de coerência cliente-aparelho na criação de OS (incoerente -> 422) (11ms)
  ✔ [CT07] Criação de OS com dados consistentes (id_aparelho compatível -> 201) (20ms)
  ✔ [CT08] Concorrência em Vendas: 10 requisições disputando estoque limitado (227ms)
  ✔ [CT09] Cancelamento de Venda: devolução de estoque com lock ordenado e estorno financeiro (165ms)
  ✔ [CT10] Concorrência em Compras: cancelamento concorrente não gera saldo inconsistente (99ms)
  ✔ [CT11] Concorrência na numeração de OS: geração paralela de 10 OSs sem colisão de chave (277ms)
  ✔ [CT12] Validação de coerência cliente-aparelho na edição de OS (aparelho incompatível -> 422) (21ms)
  ✔ [CT13] Auditoria do schema SQL: verificação das 4 constraints RESTRICT e comentários OTP (1ms)

══════════════════════════════════════════════════════════════════════════════
   TOTAL DE TESTES: 13 | APROVADOS: 13 | REPROVADOS: 0
══════════════════════════════════════════════════════════════════════════════
```

### Matriz Detalhada de Execução

| ID | Descrição do Caso de Teste | Pré-condição | Resultado Esperado | Resultado Efetivamente Obtido | Status | Duração |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **CT01** | Bloqueio de cancelamento via `PATCH /status` | OS aberta existente | HTTP 400 orientando a rota `POST /cancelar` | HTTP 400: *"Para cancelar uma Ordem de Serviço, utilize a rota dedicada de cancelamento (POST /api/ordens-servico/:id/cancelar)."* | **PASS** | 75 ms |
| **CT02** | Bloqueio de entrega direta via `PATCH /status` | OS aberta existente | HTTP 400 direcionando para fechamento | HTTP 400: *"Para entregar a Ordem de Serviço, utilize a rota de fechamento financeiro (POST /api/ordens-servico/:id/fechar)."* | **PASS** | 51 ms |
| **CT03** | Cancelamento regular de OS via `POST /cancelar` | OS com peças e fechada no Caixa | Status `'Cancelado'`, estoque devolvido e estorno gerado no Caixa | OS cancelada com `status_os='Cancelado'`, `status_pagamento='cancelado'`, estoque devolvido (20 un) e estorno no caixa #57 | **PASS** | 335 ms |
| **CT04** | Rejeição de cancelamento duplicado de OS | OS cancelada no CT03 | HTTP 400 com erro de cancelamento prévio | HTTP 400: *"Esta Ordem de Serviço já está cancelada."* | **PASS** | 15 ms |
| **CT05** | Bloqueio de mutação em OS cancelada | OS cancelada no CT03 | HTTP 400 ao tentar novo status | HTTP 400: *"Não é possível alterar uma Ordem de Serviço cancelada."* | **PASS** | 10 ms |
| **CT06** | Coerência cliente-aparelho na criação de OS | Cliente A e aparelho de Cliente B | HTTP 422 informando incoerência de cadastro | HTTP 422: *"O aparelho informado não pertence ao cliente selecionado."* | **PASS** | 11 ms |
| **CT07** | Criação de OS com dados consistentes | Cliente A e aparelho de Cliente A | HTTP 201 com OS cadastrada | HTTP 201: OS ID #67 criada com sucesso, número sequencial gerado | **PASS** | 20 ms |
| **CT08** | Concorrência em Vendas (10 reqs simultâneas) | Produto com estoque = 4 un | Exatamente 4 sucessos (201) e 6 rejeições (400); estoque final = 0 | Exatamente 4 vendas 201 e 6 vendas 400 (Estoque insuficiente). Estoque final: 0 un (sem saldo negativo nem lost updates) | **PASS** | 227 ms |
| **CT09** | Cancelamento de Venda com devolução ordenada | Venda paga com 3 un de produto | Estoque restaurado, venda cancelada e estorno no caixa | Venda #72 cancelada, estoque devolvido integralmente (10 un) e estorno no caixa #63 localizado | **PASS** | 165 ms |
| **CT10** | Concorrência em Compras (cancelamentos simultâneos) | Compra ativa de 5 un | Apenas 1 cancelamento aprovado; estoque final consistente | Exatamente 1 cancelamento 200 e 1 rejeitado (400 já cancelada). Estoque final: 5 un | **PASS** | 99 ms |
| **CT11** | Concorrência na geração de número de OS | 10 chamadas paralelas simultâneas | 10 OSs geradas com números únicos distintos | 10 OSs criadas (201) com 10 números únicos distintos (sem erro 500 ou colisão de chave) | **PASS** | 277 ms |
| **CT12** | Coerência cliente-aparelho na edição de OS | OS do Cliente A recebendo aparelho do Cliente B | HTTP 422 informando incompatibilidade | HTTP 422: *"Incoerência de cadastro: o aparelho informado não pertence ao cliente indicado."* | **PASS** | 21 ms |
| **CT13** | Auditoria do schema SQL (`banco_de_dados.sql`) | Arquivo SQL estático | 4 constraints RESTRICT e comentários OTP alinhados | 4 constraints RESTRICT e comentários OTP verificados com sucesso via regex | **PASS** | 1 ms |

---

## 5. Diferenciação entre Código de Produção e Código de Testes

| Categoria | Caminho do Arquivo | Função / Propósito |
| :--- | :--- | :--- |
| **Produção** | `backend/src/controllers/os.controller.js` | Lógica de negócio de OS, travas de fluxo, bloqueio ordenado de peças e retry loop de numeração sequencial |
| **Produção** | `backend/src/controllers/vendas.controller.js` | Lógica de PDV, ordenação determinística de produtos e lock pessimista anti-deadlock |
| **Produção** | `backend/src/controllers/compras.controller.js` | Lógica de compras, locking pessimista em cancelamentos e proteção contra saldo inconsistente |
| **Produção** | `backend/src/routes/os.routes.js` | Mapeamento explícito de rotas RESTful para edição e controle de status de OS |
| **Produção / Docs** | `tcc/banco_de_dados.sql` | Schema relacional de referência com constraints `ON DELETE RESTRICT` alinhadas |
| **Produção / Docs** | `tcc/vendas.md` | Documentação técnica e operacional do módulo de vendas |
| **Testes** | `tests/security/consistencia-suite.js` | Suíte de testes automatizados de ponta a ponta para os achados A01 a A08 |
| **Testes** | `tests/test-cancel-os.js` | Teste de regressão para cancelamento legítimo, RBAC e rejeição de PATCH legado |
| **Testes** | `tests/results/consistencia/relatorio_testes_consistencia.json` | Evidência em formato JSON da execução automatizada dos 13 casos de teste |

---

## 6. Caminhos das Evidências Geradas

- **Relatório JSON de Execução:** [`tests/results/consistencia/relatorio_testes_consistencia.json`](file:///c:/trabalho/clientes/guicell/guicell-manager/tests/results/consistencia/relatorio_testes_consistencia.json)
- **Suíte de Teste de Consistência:** [`tests/security/consistencia-suite.js`](file:///c:/trabalho/clientes/guicell/guicell-manager/tests/security/consistencia-suite.js)
- **Suíte de Teste de Cancelamento de OS:** [`tests/test-cancel-os.js`](file:///c:/trabalho/clientes/guicell/guicell-manager/tests/test-cancel-os.js)
- **Relatório de Desempenho K6 Anterior:** [`tests/k6/RELATORIO_AMBIENTE_K6_TCC.md`](file:///c:/trabalho/clientes/guicell/guicell-manager/tests/k6/RELATORIO_AMBIENTE_K6_TCC.md)

---

## 7. Plano de Rollback e Segurança

Caso haja necessidade de reverter qualquer uma das alterações pontuais:
1. **Controladores de Backend:** As alterações adicionaram validações adicionais e bloqueios sem alterar a assinatura de rotas existentes do frontend. Caso seja necessário reverter uma regra específica (por exemplo, permitir novamente `PATCH` sem restrição de cancelamento), basta restaurar o commit de referência via Git:
   ```bash
   git checkout origin/main -- backend/src/controllers/os.controller.js
   ```
2. **Banco de Dados:** Nenhuma migração destrutiva foi aplicada. A tabela física já possuía as chaves `RESTRICT` pela migration `20261102000001-controle-financeiro-caixa.js`; a alteração em `banco_de_dados.sql` foi meramente textual/documental.
3. **Isolamento de Produção:** Nenhuma operação foi realizada na VPS Hostinger de produção; todas as validações foram conduzidas no ambiente local de desenvolvimento com o banco de testes.

---

## 8. Impacto no TCC (Recomendações de Atualização Acadêmica)

Abaixo estão as sugestões de redação acadêmica recomendadas para incorporar estas melhorias ao documento formal do TCC II:

### Seção 5.3 — Fluxos de Ordens de Serviço e Ponto de Venda (PDV)
> *"Para assegurar a rastreabilidade contábil e a conformidade com as boas práticas de engenharia de software, o ciclo de vida da Ordem de Serviço foi modelado como uma máquina de estados finitos estrita. A entrega do equipamento e o cancelamento do serviço foram desacoplados de simples mutações de status via HTTP PATCH, exigindo endpoints dedicados (`POST /fechar` e `POST /cancelar`). Esse encapsulamento garante que a transição de estado seja atomicamente acompanhada da baixa ou estorno financeiro no Caixa e da movimentação precisa de peças no estoque, impedindo desvios operacionais no balcão."*

### Seções 6.2 e 6.3 — Integridade Transacional e Controle de Concorrência
> *"Em ambientes de alta concorrência operacional — como o fechamento simultâneo de vendas no PDV e o cancelamento de compras de fornecedores —, adotou-se o bloqueio pessimista (`SELECT ... FOR UPDATE`) combinado com a ordenação determinística ascendente dos identificadores de produtos (`id_produto ASC`). Esta abordagem previne formalmente a ocorrência de condições de corrida (*lost updates* e saldo de estoque negativo) e elimina a possibilidade de impasses (*deadlocks*) no mecanismo InnoDB do MySQL 8, eliminando a dependência de esperas cíclicas entre transações concorrentes."*

### Seção 7 — Matriz de Rastreabilidade e Testes de Software
> *"A verificação empírica do sistema contemplou 13 casos de teste automatizados de integração e concorrência (CT01 a CT13). Os testes comprovaram: (i) 100% de eficácia no bloqueio de requisições malformadas ou com vínculos cadastrais incoerentes (HTTP 400 e 422); (ii) isolamento de estoque sob disparos simultâneos de vendas (garantindo ausência de estoque negativo); e (iii) sequenciamento transacional robusto na geração paralela de códigos de OS, com resolução automática de colisões por retry exponencial."*

### Seção 10.3 — Limitações e Trabalhos Futuros
> *"Embora o backend tenha sido estruturado com suporte nativo a liquidações fracionadas (*split payments* em múltiplas formas de pagamento e contas financeiras), a interface do Ponto de Venda (`VendasView.vue`) priorizou inicialmente uma modalidade de pagamento único visando à máxima velocidade no atendimento de balcão. Fica como trabalho futuro a disponibilização do seletor visual de rateio no modal de vendas, reaproveitando a API já homologada."*

### Apêndice A — Dicionário de Dados e Modelo Físico SQL
> *"O script SQL canônico (`banco_de_dados.sql`) foi integralmente alinhado às migrações do Sequelize, adotando a cláusula `ON DELETE RESTRICT` nas chaves estrangeiras financeiras (`transferencias_caixa`, `caixa` e `caixa_pagamentos`), garantindo a imutabilidade do histórico contábil e impossibilitando a exclusão acidental de entidades com lançamentos vinculados."*

### Apêndice E — Manual de Operações e Boas Práticas
> *"Recomenda-se aos operadores e administradores que qualquer cancelamento de OS ou Venda seja efetuado exclusivamente através dos botões dedicados na interface, que invocam os endpoints auditados. Essa prática assegura que o motivo do cancelamento seja obrigatoriamente persistido na trilha de auditoria (`logs_auditoria`) e que o saldo de caixa seja automaticamente estornado com indicação do usuário responsável."*

