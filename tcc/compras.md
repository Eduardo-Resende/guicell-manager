# Documentação Técnica e Operacional: Módulo Compras & Fornecedores (`ComprasView.vue`)

> **Documento de Arquitetura, Regras de Negócio e Manual Operacional**  
> **Status:** Atualizado com controle de fornecedores, entrada de mercadorias no estoque, compras a prazo vs à vista, saídas financeiras por conta e cancelamento auditado.

---

## 1. Visão Geral e Propósito

O módulo de **Compras & Fornecedores** gerencia a reposição de insumos, peças de reposição e mercadorias para revenda na **Guicell**.

Seus principais objetivos são:
- Manter o cadastro organizado de fornecedores, distribuidores e parceiros comerciais.
- Registrar notas de entrada de compras com atualização imediata do estoque.
- Atualizar o custo médio/custo de aquisição dos produtos e permitir ajustar o preço sugerido de venda.
- Suportar **compras à vista, compras divididas e compras a prazo / parcialmente pagas**, garantindo que apenas os valores efetivamente pagos reduzam o saldo disponível no caixa.
- Bloquear saídas de compras à vista quando o caixa da loja estiver fechado.
- Permitir o **cancelamento de compras**, com estorno reverso das quantidades adicionadas ao estoque e anulação das saídas financeiras com auditoria.

---

## 2. Interface do Usuário (`ComprasView.vue`)

A tela é estruturada em duas abas principais:

### 2.1. Aba: Compras & Entrada de Mercadorias
- **Painel de Registro de Compra:**
  - Seleção de Fornecedor cadastrado (com atalho para criar fornecedor sem sair da tela) ou opção de Fornecedor Avulso.
  - Tabela dinâmica de itens:
    - Seleção de Produto do catálogo (ou descrição de novo item).
    - Quantidade adquirida.
    - Valor de Custo Unitário (R$).
    - Valor de Venda Sugerido (R$).
    - Subtotal calculado automaticamente.
  - Opções de Liquidação Financeira:
    - *À Vista:* Pagamento integral no momento da compra (Dinheiro, PIX, Cartão Débito).
    - *Dividido:* Distribuição do pagamento entre gaveta e conta bancária.
    - *A Prazo / Parcial:* Informa o valor de entrada (ou R$ 0,00 se totalmente a prazo) e o saldo pendente.
  - **Trava de Caixa:** Se houver desembolso financeiro imediato e o caixa estiver fechado, a operação é bloqueada com banner de advertência.

### 2.2. Aba: Histórico de Compras Realizadas
- Listagem com busca e filtros por período e status (`pago`, `pendente`, `cancelado`).
- Exibe data/hora da compra, fornecedor, quantidade de itens, valor total da nota, valor já pago e saldo pendente.
- Ação **Ver Detalhes:** visualização completa dos itens da nota fiscal.
- Ação **Pagar Pendência:** permite quitar compras a prazo ou parcelas pendentes com lançamento de saída financeira.
- Ação **Cancelar Compra:** desfaz a entrada de estoque e estorna as saídas do caixa com justificativa obrigatória (requer permissão `compras.cancelar`).

### 2.3. Modal de Gestão de Fornecedores
- Cadastro completo: Razão Social / Nome Fantasia, CNPJ, Telefone, E-mail, Endereço e Nome do Contato / Representante.
- Status ativo/inativo para manter o histórico de compras antigas de fornecedores descontinuados.

---

## 3. Regras de Negócio e Integridade de Dados

1. **Atualização de Estoque:** Ao registrar uma compra, cada item tem sua quantidade somada ao `estoque_atual` em `produtos`, e o campo `valor_custo` é atualizado com o novo custo de aquisição.
2. **Tratamento de Compras a Prazo:** O campo `valor_pago` na tabela `movimentacao` registra o valor efetivamente liquidado. Apenas o `valor_pago` gera lançamentos de saída na tabela `caixa` e nas pernas de `caixa_pagamentos`. O saldo devedor restante não afeta antecipadamente as disponibilidades da loja.
3. **Cancelamento de Compra:**
   - O status da compra passa para `cancelado`.
   - As quantidades compradas são debitadas do estoque em `produtos`.
   - Caso já tenham ocorrido saídas financeiras no caixa para essa compra, são gerados contra-lançamentos de estorno (entradas compensatórias) com auditoria.
   - Um registro na tabela `logs_auditoria` é gravado com a ação `CANCELAR` e o snapshot anterior.

---

## 4. Integração com o Backend

### Principais Endpoints:
- **`GET /api/compras`** — Listagem de compras com fornecedor, itens e pagamentos.
- **`POST /api/compras`** — Criação de compra (alimenta estoque e debita caixa se pago).
- **`POST /api/compras/:id/pagar`** — Quitação de pendência financeira de compra a prazo.
- **`POST /api/compras/:id/cancelar`** — Cancelamento com estorno de estoque e financeiro.
- **`GET /api/fornecedores`** e **`POST /api/fornecedores`** — CRUD de fornecedores.

---

## 5. Matriz de Permissões (RBAC) de Compras

| Permissão | Finalidade | Gerente | Atendente | Técnico |
| :--- | :--- | :---: | :---: | :---: |
| `compras.ver` | Consultar compras realizadas e relatórios de fornecedores. | Sim | Sim | Sim |
| `compras.criar` | Lançar novas compras e entradas de notas fiscais. | Sim | Sim | Sim |
| `compras.cancelar` | Cancelar compras já homologadas com estorno de estoque. | Sim | Sim | Sim |
| `compras.fornecedores` | Cadastrar, editar e inativar fornecedores. | Sim | Sim | Sim |

