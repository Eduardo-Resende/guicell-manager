# Documentação Técnica e Operacional: Módulo Relatórios Gerenciais (`RelatoriosView.vue`)

> **Documento de Arquitetura, Regras de Negócio e Manual Operacional**  
> **Status:** Atualizado com sincronização estrita de fuso horário (UTC-3), relatórios analíticos de Vendas, OS, Fluxo de Caixa multi-contas, Posição de Estoque e exportação em PDF.

---

## 1. Visão Geral e Propósito

O módulo de **Relatórios Gerenciais** consolida os dados operacionais, fiscais e contábeis do **Guicell Manager**, fornecendo subsídios quantitativos para tomada de decisão gerencial.

Seus principais objetivos são:
- Oferecer uma visão analítica com filtros dinâmicos de período (Hoje, 7 dias, Este mês ou Intervalo personalizado).
- Normalizar o tratamento de datas no fuso horário oficial de Brasília (`-03:00`), garantindo que movimentações noturnas sejam apuradas com exatidão no dia de sua ocorrência.
- Gerar demonstrativos setoriais: **Vendas no Balcão**, **Ordens de Serviço por Técnico/Status**, **Fluxo de Caixa Detalhado por Contas/Formas** e **Posição de Inventário do Estoque**.
- Segregar operações financeiras: receitas e despesas operacionais são diferenciadas de transferências e ajustes de conferência.
- Permitir a geração e exportação de relatórios em formato **PDF** para arquivamento ou prestação de contas.

---

## 2. Relatórios Disponíveis e Estrutura

A tela [`RelatoriosView.vue`](file:///c:/trabalho/clientes/guicell/guicell-manager/frontend/src/views/RelatoriosView.vue) disponibiliza 4 abas especializadas:

### 2.1. Relatório de Vendas (RF10)
- **Filtros:** Data Inicial e Data Final.
- **Cards de Resumo:**
  - *Total de Vendas Realizadas:* Quantidade de transações efetivadas (desconsidera vendas canceladas).
  - *Faturamento Bruto:* Valor total transacionado em produtos.
  - *Ticket Médio:* Faturamento dividido pelo total de vendas.
- **Tabela Analítica:** ID da venda, data/hora local, cliente, operador, relação de itens/quantidades e forma de pagamento utilizada.
- **Exportação:** Botão para emitir o relatório analítico de vendas em PDF.

### 2.2. Relatório de Ordens de Serviço (RF09)
- **Filtros:** Período (data início e fim), Filtro por Status da OS e Filtro por Técnico Responsável.
- **Cards de Resumo:**
  - *Total de Atendimentos no Período.*
  - *Faturamento Gerado:* Somatório do valor final das OS entregues.
  - *Distribuição por Status:* Contagem proporcional (Em Reparo, Aguardando Peça, Concluídas, Entregues).
- **Tabela Analítica:** Número da OS, data de abertura, cliente, aparelho, técnico encarregado, status e valor calculado.

### 2.3. Relatório de Fluxo de Caixa (RF11)
- **Filtros:** Período de consulta.
- **Demonstrativo Operacional (Receitas x Despesas):**
  - *Total de Entradas Operacionais* (Vendas + Recebimentos de OS).
  - *Total de Saídas Operacionais* (Despesas pagas + Compras de mercadorias).
  - *Saldo Operacional Líquido do Período* (Entradas - Saídas).
- **Detalhamento por Forma de Pagamento:**
  - Tabela com entradas, saídas e saldo individual de **Dinheiro**, **PIX**, **Cartão de Débito** e **Cartão de Crédito**.
- **Detalhamento por Conta Financeira:**
  - Saldos consolidados na **Gaveta do Caixa**, no **Cofre** e na **Conta da Loja (eletrônica)**.
- **Bloco "Outras Movimentações" (Não entram no faturamento):**
  - *Transferências Internas:* Quantidade e volume financeiro movimentado entre contas (gaveta e cofre).
  - *Ajustes de Conferência de Turno:* Volume de sobras (entradas de ajuste) e faltas (saídas de ajuste) apuradas na abertura e fechamento de caixa.

### 2.4. Relatório de Posição de Estoque
- **Cards de Resumo:** Total de itens cadastrados no catálogo e total de produtos em alerta de estoque mínimo.
- **Tabela de Inventário:** Descrição do produto, categoria, estoque atual, estoque mínimo de segurança, valor de custo e valor de venda.

---

## 3. Tratamento de Fuso Horário e Integridade de Consultas

Um dos pontos críticos de arquitetura financeira e de relatórios do sistema é a função `getPeriodo` em [`relatorios.controller.js`](file:///c:/trabalho/clientes/guicell/guicell-manager/backend/src/controllers/relatorios.controller.js#L7-L29):
- Como o banco de dados opera com colunas `DATETIME`, o backend normaliza as datas recebidas da interface (`YYYY-MM-DD`) concatenando explicitamente o offset do horário de Brasília (`-03:00`):
  - Início: `YYYY-MM-DDT00:00:00-03:00`
  - Fim: `YYYY-MM-DDT23:59:59.999-03:00`
- O Sequelize está configurado com `timezone: '-03:00'` em `database.js`. Isso assegura que transações realizadas à noite (após as 21:00 BRT) pertençam estritamente ao dia de sua execução no banco de dados e nos filtros de relatórios.

---

## 4. Integração com o Backend

### Principais Endpoints:
- **`GET /api/relatorios/vendas`** — Dados de vendas no período com includes completos.
- **`GET /api/relatorios/os`** — Dados de ordens de serviço filtrados por período, técnico e status.
- **`GET /api/relatorios/caixa`** — Extrato financeiro consolidado, quebra por contas, formas, transferências e conferências.
- **`GET /api/relatorios/estoque`** — Posição atual de inventário e contagem de itens em alerta.

---

## 5. Matriz de Permissões (RBAC) de Relatórios

| Permissão | Finalidade | Gerente | Atendente | Técnico |
| :--- | :--- | :---: | :---: | :---: |
| `relatorios.vendas` | Acessar e exportar o relatório de vendas de balcão. | Sim | Não | Não |
| `relatorios.os` | Acessar o relatório de ordens de serviço por técnico e status. | Sim | Não | Não |
| `relatorios.caixa` | Consultar o fluxo de caixa detalhado e faturamento líquido. | Sim | Não | Não |
| `relatorios.estoque` | Acessar o inventário e custos de produtos em estoque. | Sim | Não | Não |

