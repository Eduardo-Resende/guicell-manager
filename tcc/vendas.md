# Documentação Técnica e Operacional: Módulo Vendas / PDV Balcão (`VendasView.vue`)

> **Documento de Arquitetura, Regras de Negócio e Manual Operacional**  
> **Status:** Atualizado com suporte a leitor de código de barras, pagamentos divididos, controle de fiado, trava com caixa fechado e cancelamento auditado com estorno de estoque.

---

## 1. Visão Geral e Propósito

O módulo de **Vendas (Ponto de Venda - PDV)** gerencia a comercialização rápida de mercadorias, acessórios e produtos prontos de balcão da loja **Guicell** (capas, películas, carregadores, cabos e fones).

Seus principais objetivos são:
- Agilizar o atendimento no balcão com interface reativa de fácil operação.
- Oferecer busca rápida de itens por nome ou através de leitor de **código de barras**.
- Gerenciar o carrinho de compras com cálculo instantâneo de subtotais e controle de descontos.
- Permitir vendas anônimas (Consumidor Final) ou vinculadas a clientes cadastrados.
- Viabilizar **pagamentos divididos** entre múltiplas formas e contas financeiras (ex: parte em dinheiro na gaveta e parte no PIX na conta da loja).
- Gerenciar vendas a prazo (**Fiado**) com carteira de recebimentos pendentes.
- **Trava de Caixa:** Bloquear a conclusão de vendas quando o turno de caixa não estiver aberto.
- Suportar **cancelamento de vendas** com estorno automático do estoque e contra-lançamento financeiro auditado.

---

## 2. Interface do Usuário (`VendasView.vue`)

A tela é dividida em duas grandes áreas operacionais:

### 2.1. Terminal de Venda Ativa (PDV)
- **Seleção de Produtos:** Campo de busca com suporte a digitação livre e leitor de código de barras USB/Bluetooth. Ao bipar ou selecionar, o produto entra imediatamente no carrinho.
- **Carrinho de Compras:**
  - Descrição do item
  - Preço unitário de tabela
  - Controle de quantidade com botões de incremento/decremento e validação de estoque disponível
  - Subtotal do item
  - Ação de exclusão do item do carrinho
- **Vínculo de Cliente:** Permite associar um cliente da base ou manter como *Consumidor Final*. O vínculo de cliente torna-se obrigatório caso a forma de pagamento selecionada seja *Fiado*.
- **Controle de Desconto:** Campo para abatimento do valor da venda. Requer a permissão `vendas.desconto`.
- **Painel de Totais:** Subtotal dos itens, desconto aplicado e **Total a Pagar**.
- **Alerta de Caixa Fechado:** Se o caixa não tiver sessão aberta, um banner amarelo em destaque adverte o operador e desativa o botão "Finalizar Venda".

### 2.2. Modal de Pagamento & Rateio
Ao clicar em "Finalizar Venda", abre-se o modal de liquidação financeira:
- **Forma Única:** Seleção de Dinheiro, PIX, Cartão de Débito ou Cartão de Crédito.
- **Pagamento Dividido:** Permite adicionar múltiplas linhas de pagamento distribuindo os valores (ex: R$ 50,00 no Cartão de Débito + R$ 30,00 no PIX). O sistema valida se a soma bate centavo por centavo com o valor da venda.
- **Opção Fiado:** Registra a venda com status de pagamento `pendente`, gerando registro no contas a receber sem entrada imediata no caixa.

### 2.3. Aba de Histórico de Vendas
- Listagem completa de todas as vendas realizadas com filtros por período e status (`pago`, `pendente`, `cancelado`).
- Exibe ID da venda, data/hora, cliente, operador responsável, itens vendidos, valor total e forma de pagamento utilizada.
- Ação de **Cancelar Venda**: disponível para usuários com permissão `vendas.cancelar`. Solicita justificativa obrigatória.
- Ação de **Receber Fiado**: permite quitar vendas pendentes selecionando as formas de pagamento recebidas.

---

## 3. Regras de Negócio e Integridade de Estoque

1. **Baixa de Estoque:** Ao concluir a venda, a quantidade vendida de cada produto é imediatamente subtraída do campo `estoque_atual` na tabela `produtos` dentro de uma transação do banco.
2. **Estorno por Cancelamento:** Ao cancelar uma venda:
   - O status da venda em `movimentacao` passa para `cancelado`.
   - O estoque de cada item é devolvido automaticamente para a tabela `produtos`.
   - Se a venda já havia gerado entrada financeira no caixa, é criado automaticamente um lançamento de estorno (contra-lançamento com sinal inverso) para neutralizar o saldo.
   - Um registro na tabela `logs_auditoria` é gravado com a ação `CANCELAR`, snapshot do estado anterior e o motivo informado.

---

## 4. Integração com o Backend

### Principais Endpoints:
- **`GET /api/vendas`** — Listagem de vendas com includes de cliente, usuário e itens.
- **`POST /api/vendas`** — Criação de venda (baixa estoque + gera caixa se pago).
- **`POST /api/vendas/:id/cancelar`** — Cancelamento com estorno de estoque e financeiro.
- **`POST /api/vendas/:id/pagar-fiado`** — Liquidação de vendas a prazo pendentes.

---

## 5. Matriz de Permissões (RBAC) de Vendas

| Permissão | Finalidade | Gerente | Atendente | Técnico |
| :--- | :--- | :---: | :---: | :---: |
| `vendas.ver` | Visualizar histórico de vendas e consultar comprovantes. | Sim | Sim | Não |
| `vendas.criar` | Operar o PDV de balcão e registrar vendas. | Sim | Sim | Não |
| `vendas.desconto` | Aplicar descontos sobre o valor total do carrinho. | Sim | Sim | Não |
| `vendas.cancelar` | Cancelar vendas efetuadas com devolução de estoque e estorno. | Sim | Sim | Não |

