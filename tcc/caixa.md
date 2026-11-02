# Documentação Técnica e Operacional: Módulo Caixa & Gestão Financeira (Guicell Manager)

> **Documento de Arquitetura, Regras de Negócio e Manual Operacional**  
> **Status:** Atualizado com a arquitetura de Múltiplas Contas (Gaveta, Cofre e Loja), Formas de Pagamento Vinculadas, Despesas Divididas, Transferências Auditadas, Conferência de Turnos e Trava Operacional de Caixa Fechado.

---

## 1. Visão Geral e Propósito

O módulo de **Caixa & Gestão Financeira** é o núcleo contábil do **Guicell Manager**. Sua arquitetura evoluiu de um controle simplificado de saldo consolidado para um sistema robusto de **contabilidade de múltiplas localizações financeiras**, permitindo:
- Controlar separadamente onde os recursos estão armazenados: **Caixa Físico (gaveta)**, **Cofre** e **Conta da Loja (eletrônica: PIX e Cartões)**.
- Rastrear a forma de pagamento e a localização exata de cada entrada e saída.
- Permitir **pagamentos divididos** entre múltiplas formas e contas (em Vendas, Ordens de Serviço, Compras e Lançamentos Manuais).
- Realizar **transferências seguras** entre contas (ex: sangria da gaveta para o cofre, reforço de troco) sem alterar o faturamento nem o saldo total da loja.
- Controlar **turnos e sessões de caixa** com conferência cega/assistida baseada no fechamento anterior, apuração de divergências (sobras e faltas), justificativa obrigatória e autorização gerencial configurável.
- **Trava Operacional Transversal:** Não permite Vender, Comprar ou Entregar Ordens de Serviço se o caixa do estabelecimento estiver fechado.
- Tratamento próprio para compras a prazo ou parcialmente pagas, garantindo que apenas valores efetivamente desembolsados reduzam os saldos disponíveis.

---

## 2. Contas Financeiras e Formas de Pagamento

O sistema opera com três localizações financeiras ativas:

| Conta / Localização | Tipo | Finalidade e Movimentações |
| :--- | :--- | :--- |
| **Caixa físico (gaveta)** | Física | Dinheiro em espécie disponível para troco e operações imediatas no balcão. Recebe vendas/OS em dinheiro e transferências do cofre; paga despesas em dinheiro, sangrias e transferências para o cofre. |
| **Cofre** | Física | Dinheiro físico guardado fora da gaveta operacional. Permite reservas de valor, recebendo sangrias da gaveta e retornando troco quando necessário. |
| **Conta da loja (eletrônica)** | Eletrônica | Movimentações bancárias e eletrônicas agrupadas: PIX, Cartão de Débito e Cartão de Crédito. |

### Associação Automática:

| Forma de Pagamento | Localização Padrão | Tipo Permitido |
| :--- | :--- | :--- |
| **Dinheiro** | Caixa (gaveta) | Contas Físicas (Gaveta ou Cofre) |
| **PIX** | Conta da loja | Contas Eletrônicas |
| **Cartão de débito** | Conta da loja | Contas Eletrônicas |
| **Cartão de crédito** | Conta da loja | Contas Eletrônicas |

---

## 3. Interface do Usuário (`CaixaView.vue`)

A interface é estruturada em 3 abas operacionais:

### 3.1. Aba: Fluxo do Dia & Saldos
- **Estado de Caixa Fechado:** Quando o caixa está fechado, a interface exibe um card central seguro com botão de abertura. Os cards de saldos e a tabela de lançamentos ficam ocultos para operadores que não possuem permissão gerencial ou enquanto o turno não for iniciado.
- **Card Saldo Total da Loja:** Faturamento líquido consolidado ($\text{Dinheiro Físico} + \text{Conta Eletrônica}$).
- **Card Dinheiro Físico Total:** Somatório do Caixa (gaveta) + Cofre. Exibe detalhamento imediato de quanto está na gaveta e quanto está guardado no cofre.
- **Card Conta da Loja (Eletrônica):** Detalhamento individual dos saldos acumulados em PIX, Cartão de Débito e Cartão de Crédito.
- **Extrato Financeiro com Filtro da Sessão Atual:** Por padrão, exibe os lançamentos vinculados estritamente à **sessão de trabalho aberta**, com ordenação temporal decrescente (o mais recente sempre no topo).
  - Identificação de Hora, Descrição, Favorecido, Categoria/Origem, Formas e Contas envolvidas, Natureza/Badge, Valor com sinal e Operador responsável.
  - Botão de **Estorno** para lançamentos manuais com registro obrigatório de motivo e gravação em auditoria.

### 3.2. Aba: Transferências & Cofre
- Listagem de todas as transferências entre contas da loja.
- Ação **Nova Transferência**: permite mover valores entre gaveta e cofre (sangria/troco).
- Ação **Cancelar Transferência**: gera automaticamente a transferência inversa, preservando a rastreabilidade original.
- Acesso liberado para atendentes com permissão de visualização ou operação de caixa, sem exigir perfil de Gerente.

### 3.3. Aba: Sessões e Turnos
- Histórico completo de sessões de caixa (múltiplos turnos no mesmo dia).
- Exibe data/hora de abertura e fechamento, operadores responsáveis, saldo esperado, saldo contado, divergências apuradas, justificativas e autorizadores.

---

## 4. Modais Operacionais

### 4.1. Modal de Abertura de Caixa
1. Consulta o valor de dinheiro em espécie registrado no fechamento anterior.
2. O operador conta a gaveta e digita o valor encontrado.
3. O sistema calcula a diferença em tempo real:
   - Se houver divergência (falta ou sobra), o campo **Justificativa** torna-se obrigatório.
   - Se a divergência exceder o limite configurável (`CAIXA_LIMITE_DIVERGENCIA`, padrão R$ 10,00) e o operador não possuir permissão `caixa.aprovar`, o modal exige login e senha de um Gerente para autorização.
4. O valor contado passa a ser a base exata do ledger físico da gaveta.

### 4.2. Modal de Fechamento de Caixa
1. Apresenta o demonstrativo completo de conferência:
   - Fundo inicial da gaveta
   - (+) Entradas em dinheiro
   - (-) Saídas em dinheiro
   - (+) Transferências recebidas do cofre
   - (-) Transferências enviadas para o cofre
   - (=) Saldo Esperado na Gaveta
2. O operador digita o valor contado.
3. Se houver divergência, exige justificativa e autorização (se acima do limite).
4. **Regra de ouro:** O fechamento encerra o turno e **não gera saída técnica para zerar a gaveta**. O saldo remanescente permanece na gaveta para o turno seguinte.

### 4.3. Modal de Lançamento Manual (Despesas com Divisão)
- Permite adicionar uma ou mais formas de pagamento e especificar a conta de saída.
- Validação estrita: a soma das formas deve fechar exatamente o valor total informado.

### 4.4. Modal de Transferência
- Campos: Conta de Origem, Conta de Destino, Valor e Descrição.
- Valida se a conta de origem possui saldo disponível suficiente (não permitindo saídas a descoberto sem exceção gerencial autorizada).

---

## 5. Regras de Integração e Trava Transversal

O módulo Caixa impõe uma regra rigorosa de integridade operacional através da função `exigirSessaoAberta` em `financeiro.service.js`:

```javascript
await fin.exigirSessaoAberta(t, 'motivo_da_operacao');
```

- **Vendas (`VendasView.vue`):** O botão de finalizar venda é desativado e um alerta em destaque avisa que o caixa está fechado. Qualquer tentativa via API retorna `HTTP 400: Caixa fechado`.
- **Compras (`ComprasView.vue`):** Pagamento de compras exige caixa aberto para registrar a saída financeira correspondente.
- **Ordens de Serviço (`OsView.vue`):** A entrega e o recebimento de OS (à vista ou fiado) exigem caixa aberto.

---

## 6. Arquitetura do Backend e Modelo de Dados

### 6.1. Tabelas Envolvidas
- `contas_financeiras`: `id_conta`, `codigo`, `nome`, `tipo ('fisica'|'eletronica')`, `ativo`.
- `formas_pagamento`: `id_forma`, `codigo`, `nome`, `id_conta` (FK), `ordem`, `ativo`.
- `caixa_pagamentos`: tabela de pernas financeiras onde cada registro vincula `id_caixa`, `id_conta`, `id_forma`, `tipo`, `valor`, `data`, `id_sessao`. É a fonte de verdade para o cálculo de todos os saldos.
- `transferencias_caixa`: `id_transferencia`, `id_conta_origem`, `id_conta_destino`, `valor`, `data_hora`, `id_usuario`, `status`, `id_transferencia_estornada`, `motivo_cancelamento`.
- `caixa`: enriquecida com `natureza`, `origem`, `favorecido`, `fora_sessao`, `id_transferencia`, `id_lancamento_origem`.
- `sessoes_caixa`: enriquecida com `valor_esperado_abertura`, `diferenca_abertura`, `justificativa_abertura`, `id_usuario_autorizador_abertura`, `justificativa_fechamento`, `id_usuario_autorizador_fechamento`, `abertura_inicial`, `trava_aberta`.

### 6.2. Imutabilidade e Integridade
- Model `Caixa` e `CaixaPagamento` possuem hooks `beforeUpdate` e `beforeDestroy` que impedem alterações ou exclusões diretas de movimentações efetivadas.
- Todas as operações financeiras são atômicas através de transações de banco de dados (`sequelize.transaction`).
- Valores são calculados e manipulados em centavos (inteiros) no service para evitar dízimas periódicas.
- Sincronização estrita no fuso horário oficial de Brasília (`-03:00`).

---

## 7. Matriz de Permissões (RBAC) do Caixa

| Chave | Nome | Descrição | Gerente | Atendente | Técnico |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `caixa.ver` | Visualizar Caixa e Saldos | Visualiza extrato, cards de saldos consolidados e detalhados. | Sim | Sim | Não |
| `caixa.abrir_fechar` | Abrir e Fechar Sessões | Executa a conferência e abre/fecha turnos. | Sim | Sim | Não |
| `caixa.movimentar` | Lançar Movimentações | Registra despesas e receitas avulsas com divisão de formas. | Sim | Sim | Não |
| `caixa.transferir` | Transferências & Cofre | Realiza sangrias e transferências entre gaveta, cofre e loja. | Sim | Sim | Não |
| `caixa.estornar` | Estornar Lançamentos | Reverte lançamentos manuais com registro de motivo. | Sim | Não | Não |
| `caixa.aprovar` | Aprovar Divergências | Autoriza quebras de caixa acima do limite e saídas a descoberto. | Sim | Não | Não |
