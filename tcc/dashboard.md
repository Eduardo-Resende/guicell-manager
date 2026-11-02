# Documentação Técnica e Operacional: Módulo Dashboard (`DashboardView.vue`)

> **Documento de Arquitetura, Regras de Negócio e Manual Operacional**  
> **Status:** Atualizado com controle de permissões dinâmicas (RBAC), métricas em tempo real e proteção de faturamento.

---

## 1. Visão Geral e Propósito

O **Dashboard** é o painel de controle central do **Guicell Manager**, projetado para oferecer uma visão executiva e operacional em tempo real do fluxo de atendimento da assistência técnica e da loja. 

Seus principais objetivos são:
- Apresentar a volumetria instantânea de ordens de serviço ativas na oficina.
- Monitorar a produtividade diária (aparelhos concluídos ou entregues no dia).
- Exibir a saúde financeira do dia (saldo líquido operacional) com controle de privacidade para cargos operacionais.
- Emitir alertas preditivos de estoque crítico para produtos que atingiram ou romperam o estoque mínimo.
- Mapear a distribuição das OS por etapa de atendimento (gráfico de barras por status).
- Listar os atendimentos mais recentes e prover botões de ação rápida para agilizar a rotina da loja.

---

## 2. Indicadores e Cards de Métricas

O topo da tela apresenta 4 cards de indicadores estratégicos consolidados pela API:

| Métrica | Identificador | Regra de Negócio / Origem | Permissão Exigida |
| :--- | :--- | :--- | :---: |
| **OS em Aberto** | `osAbertas` | Contagem de registros em `movimentacao` com `origem = 'os'` e `status_os` em: `['Aguardando Diagnóstico', 'Aguardando Cliente', 'Em Reparo', 'Aguardando Peça']`. | `dashboard.ver` |
| **OS Concluídas Hoje** | `osConcluidas` | Contagem de OS cujo `data_fechamento` ocorreu entre as 00:00:00 e 23:59:59 do dia atual e com status `Concluído` ou `Entregue`. | `dashboard.ver` |
| **Caixa do Dia** | `saldoDia` | Somatório de receitas operacionais menos despesas operacionais do dia registradas no `caixa` (ignora transferências e aberturas de turno). | `dashboard.faturamento` |
| **Estoque Crítico** | `prodEstoqueMinimo` | Contagem de produtos em `produtos` com `estoque_minimo > 0` e `estoque_atual <= estoque_minimo`. O card ganha destaque visual vermelho pulsante quando houver itens críticos. | `dashboard.ver` |

---

## 3. Gráficos e Distribuição Operacional

### 3.1. Gráfico de Ordens de Serviço por Status
- Componente de barras verticais proporcionais reativas que consolida o volume de OS por etapa:
  - *Aguardando Diagnóstico* (cor amarela/alerta)
  - *Aguardando Cliente* (cor roxa)
  - *Aguardando Peça* (cor vermelha)
  - *Em Reparo* (cor azul/info)
  - *Concluído* (cor verde claro)
  - *Entregue* (cor verde primário)
- Permite que o gerente ou atendente identifique imediatamente gargalos de produção (ex: muitos aparelhos aguardando aprovação do cliente ou peças).

### 3.2. Tabela de Últimas Ordens de Serviço
- Exibe os últimos 5 atendimentos abertos no sistema, com:
  - Número da OS
  - Nome do cliente
  - Aparelho (Marca + Modelo)
  - Status atual com badge colorido
  - Data de entrada formatada
- Botão direto para navegar para a tela completa de Ordens de Serviço.

### 3.3. Painel de Ações Rápidas (Quick Actions)
Atalhos com permissão condicional para agilizar a abertura de fluxos:
- **Nova Ordem de Serviço:** Abre o modal de criação de OS (`$pode('os.criar')`).
- **Nova Venda (PDV):** Direciona para o balcão de vendas (`$pode('vendas.criar')`).
- **Cadastrar Cliente:** Atalho para inclusão de cliente (`$pode('clientes.criar')`).
- **Cadastrar Produto:** Atalho para cadastro de mercadoria (`$pode('estoque.criar_editar')`).

---

## 4. Integração com o Backend

### Endpoint Principal:
- **`GET /api/ordens-servico/dashboard`**
  - **Middleware:** `autenticarToken`
  - **Controller:** [`backend/src/controllers/os.controller.js`](file:///c:/trabalho/clientes/guicell/guicell-manager/backend/src/controllers/os.controller.js#L340-L386)
  - **Retorno:**
    ```json
    {
      "osAbertas": 12,
      "osConcluidas": 4,
      "saldoDia": 450.00,
      "prodEstoqueMinimo": 2,
      "ultimasOS": [ ... ],
      "statusCounts": [
        { "status_os": "Em Reparo", "count": 5 },
        { "status_os": "Aguardando Peça", "count": 3 }
      ]
    }
    ```

---

## 5. Matriz de Permissões (RBAC) do Dashboard

| Permissão | Finalidade | Gerente | Atendente | Técnico |
| :--- | :--- | :---: | :---: | :---: |
| `dashboard.ver` | Acesso à tela, contadores de OS, gráfico de status e produtos críticos. | Sim | Sim | Sim |
| `dashboard.faturamento` | Visualização do card financeiro "Caixa do Dia" com valores em R$. | Sim | Não | Não |

