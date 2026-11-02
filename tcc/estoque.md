# Documentação Técnica e Operacional: Módulo Estoque & Produtos (`EstoqueView.vue`)

> **Documento de Arquitetura, Regras de Negócio e Manual Operacional**  
> **Status:** Atualizado com categorização hierárquica por tipo de uso, leitor de código de barras, controle de estoque mínimo, ajuste manual auditado e histórico consolidado.

---

## 1. Visão Geral e Propósito

O módulo de **Estoque & Produtos** é o repositório central de todos os itens físicos comercializados ou aplicados na assistência técnica da **Guicell**.

Seus principais objetivos são:
- Unificar o catálogo de **produtos acabados para venda** (capas, películas, carregadores) e **peças/componentes de reposição** (telas, baterias, conectores de carga, flex de câmera).
- Organizar os produtos em **categorias hierárquicas** com segmentação por finalidade de uso (`tipo_uso`: *Venda*, *OS* ou *Ambos*).
- Fornecer busca ágil por descrição, categoria ou leitor de **código de barras**.
- Prevenir a ruptura de estoque através de monitoramento contínuo de **estoque mínimo** com alertas visuais.
- Permitir **ajustes manuais de estoque** (perdas, avarias ou inventário) e **exclusões**, com registro compulsório em auditoria.
- Disponibilizar uma timeline detalhada de todas as entradas e saídas de estoque do estabelecimento.

---

## 2. Interface do Usuário (`EstoqueView.vue`)

A tela é organizada nas seguintes seções:

### 2.1. Catálogo e Tabela de Produtos
- **Barra de Ferramentas:** Campo de busca rápida (digitação ou bipagem de código de barras) e seletores de categoria e tipo de uso.
- **Tabela de Itens:**
  - Código de barras e descrição
  - Categoria vinculada (com badge indicativo)
  - Preço de custo e Preço de venda (com margem de lucro calculada)
  - Saldo em estoque com badge visual (verde para normal, amarelo para atenção, vermelho para crítico/zerado)
  - Ações: Editar produto, Ajustar estoque manualmente e Excluir.

### 2.2. Modal de Cadastro e Edição de Produto
- **Campos:** Código de Barras (opcional, único se preenchido), Descrição, Categoria, Estoque Atual, Estoque Mínimo, Valor de Custo e Valor de Venda.
- Validação automática: o valor de venda não pode ser menor ou igual a zero.

### 2.3. Modal de Ajuste Rápido de Estoque
- Utilizado para correções pontuais de contagem de prateleira, descarte de peças danificadas ou bonificações.
- Permite selecionar a operação (**Entrada** ou **Saída**) e a quantidade movimentada.
- Grava imediatamente uma entrada na tabela `logs_auditoria` com a ação `AJUSTE_ESTOQUE`, preservando o saldo anterior e o novo saldo.

### 2.4. Gestão de Categorias
- Permite criar categorias principais e subcategorias (através do campo `id_pai`).
- **Configuração do `tipo_uso`:**
  - *Venda:* Os produtos desta categoria aparecem apenas no PDV de Vendas.
  - *OS:* Os produtos desta categoria aparecem apenas na seleção de peças das Ordens de Serviço.
  - *Ambos:* Os produtos ficam disponíveis tanto para venda direta quanto para aplicação técnica em bancada.

### 2.5. Aba: Histórico de Movimentações de Estoque
- Apresenta um extrato unificado de todas as movimentações de estoque originadas no sistema:
  - Compras (Entradas) e seus respectivos cancelamentos (Saídas)
  - Vendas (Saídas) e seus cancelamentos (Entradas compensatórias)
  - Ordens de Serviço (Saídas por consumo técnico)
  - Ajustes manuais de inventário
- Exibe data/hora, produto, tipo (Entrada/Saída), quantidade movimentada, documento de origem e operador responsável.

---

## 3. Regras de Negócio e Alertas de Reposição

1. **Alerta de Estoque Crítico:** Um produto é classificado em estado crítico quando `estoque_minimo > 0` e `estoque_atual <= estoque_minimo`. Esses itens são contabilizados automaticamente no Dashboard e ganham destaque na listagem.
2. **Consumo Atômico em OS:** As peças adicionadas em uma OS são debitadas do estoque no momento em que a OS é salva. Se o técnico remover o item da OS antes do fechamento, a quantidade é estornada ao estoque.
3. **Exclusão de Produtos:** A exclusão física de um produto remove o registro do banco, mas grava antecipadamente um snapshot completo do item na tabela `logs_auditoria` (`acao: 'EXCLUIR'`).

---

## 4. Integração com o Backend

### Principais Endpoints:
- **`GET /api/produtos`** — Listagem de produtos com filtros de busca, categoria e `tipo_uso`.
- **`POST /api/produtos`** — Cadastro de novo produto.
- **`PUT /api/produtos/:id`** — Atualização cadastral.
- **`DELETE /api/produtos/:id`** — Exclusão auditada.
- **`POST /api/produtos/:id/entrada`** — Ajuste manual de quantidade (auditado).
- **`GET /api/produtos/alertas`** — Produtos que romperam o estoque mínimo.
- **`GET /api/produtos/movimentacoes`** — Extrato completo do histórico de estoque.
- **`GET /api/categorias`** e **`POST /api/categorias`** — CRUD de categorias.

---

## 5. Matriz de Permissões (RBAC) de Estoque

| Permissão | Finalidade | Gerente | Atendente | Técnico |
| :--- | :--- | :---: | :---: | :---: |
| `estoque.ver` | Consultar o catálogo de produtos e saldos de estoque. | Sim | Sim | Sim |
| `estoque.criar_editar` | Cadastrar novos produtos, alterar preços e custos. | Sim | Não | Não |
| `estoque.ajustar` | Realizar ajustes manuais rápidos de entrada e saída. | Sim | Não | Não |
| `estoque.categorias` | Gerenciar categorias e classificação de `tipo_uso`. | Sim | Sim | Sim |

