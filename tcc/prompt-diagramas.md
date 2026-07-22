Aqui está a lista completa de diagramas do TCC I - Guicell Manager, na ordem em que aparecem no documento:

Capítulo 6 — Modelagem UML

1. Diagrama de Casos de Uso — atores (Atendente, Técnico, Gerente) + 12 casos de uso com relações <<include>> e <<extend>>
2. Diagrama de Classes — 9 classes com atributos, métodos e relacionamentos (1:N, N:N via tabelas de junção)
3. Diagrama de Atividades — fluxo completo da OS com pontos de decisão (aprovação de orçamento, disponibilidade de peça, cancelamento)


Capítulo 7 — Banco de Dados

4. DER / MER gráfico — as 9 tabelas com PKs, FKs e relacionamentos desenhados visualmente

---

## PROMPT COMPLETO PARA GERAÇÃO DOS DIAGRAMAS

Você é um especialista em modelagem de software e banco de dados. Gere os 4 diagramas descritos abaixo para o sistema **Guicell Manager** — um ERP para assistência técnica de celulares, desenvolvido como TCC I do curso de Engenharia de Software da UNIALFA – Universidade Alves Farias (Goiânia, 2026), pelos alunos **Eduardo Santana Resende** e **Emilly Gabrielly Pereira Silva**, orientados pelo **Mestre Sandro Gouvea Cardoso Sousa e Silva**.

Os diagramas serão inseridos em um documento acadêmico (.docx) e devem ser desenvolvidos nas ferramentas **Astah, draw.io ou Lucidchart** (para os diagramas UML 1, 2 e 3) e **draw.io ou MySQL Workbench** (para o DER — Diagrama 4). Siga rigorosamente cada especificação.

**Contexto do negócio:** O sistema foi concebido a partir de entrevistas e observação direta da assistência técnica **Guicell**, de Goiânia/GO. A equipe real é composta por: 1 gerente, 2 técnicos e 1 atendente — o que fundamenta os 3 perfis de acesso do sistema.

---

## DIAGRAMA 1 — Diagrama de Casos de Uso (UML)

**Objetivo:** Representar as interações entre os atores humanos do sistema e todas as funcionalidades disponíveis, evidenciando quem pode executar o quê e as dependências entre casos de uso. Conforme definido no Capítulo 6.1 do TCC I, este diagrama demonstra o **escopo funcional do Guicell Manager do ponto de vista do usuário**.

**Ferramenta indicada:** Astah, draw.io ou Lucidchart.

### Atores (representados como bonecos fora do retângulo do sistema):

| Ator | Descrição |
|------|-----------|
| **Atendente** | Responsável pelo atendimento ao cliente: abertura de OS, registro de vendas e cadastro de clientes/aparelhos. |
| **Técnico** | Responsável pela execução técnica: atualização de status da OS e registro de peças utilizadas. |
| **Gerente** | Acesso total ao sistema: relatórios, gestão de usuários, movimentações de caixa e todas as funções dos demais perfis. |

### Casos de uso (representados como elipses dentro do retângulo do sistema "Guicell Manager"):

| ID | Nome do Caso de Uso | Atores envolvidos |
|----|---------------------|-------------------|
| UC01 | Autenticar no sistema | Atendente, Técnico, Gerente |
| UC02 | Cadastrar / Consultar / Editar cliente | Atendente, Gerente |
| UC03 | Cadastrar aparelho | Atendente, Gerente |
| UC04 | Abrir Ordem de Serviço | Atendente, Gerente |
| UC05 | Consultar / Atualizar OS | Atendente, Técnico, Gerente |
| UC06 | Registrar peças utilizadas na OS | Técnico, Gerente |
| UC07 | Fechar OS e registrar pagamento | Atendente, Gerente |
| UC08 | Emitir comprovante de OS | Atendente, Gerente |
| UC09 | Controlar estoque (entrada e saída) | Atendente, Gerente |
| UC10 | Registrar venda de acessório | Atendente, Gerente |
| UC11 | Movimentar caixa manualmente | Gerente |
| UC12 | Emitir relatórios | Gerente |
| UC13 | Gerenciar usuários | Gerente |

### Relações entre casos de uso:

- **<<include>>** (dependência obrigatória — o caso de uso base SEMPRE inclui o incluído):
  - UC04 (Abrir OS) `<<include>>` UC01 (Autenticar no sistema)
  - UC07 (Fechar OS) `<<include>>` UC06 (Registrar peças utilizadas)
  - UC07 (Fechar OS) `<<include>>` UC11 (Movimentar caixa)
  - UC09 (Controlar estoque) `<<include>>` UC06 (Registrar peças utilizadas)

- **<<extend>>** (dependência opcional — ocorre apenas em determinadas condições):
  - UC08 (Emitir comprovante) `<<extend>>` UC07 (Fechar OS) — *somente após fechamento da OS*
  - UC12 (Emitir relatórios) `<<extend>>` UC07 (Fechar OS) — *somente se Gerente quiser gerar relatório*

### Instruções de layout:
- Coloque o retângulo do sistema com o rótulo "Guicell Manager" centralizado ao topo.
- Posicione Atendente e Técnico à esquerda; Gerente à direita.
- Use linhas sólidas para associações ator ↔ caso de uso.
- Use setas tracejadas com os estereótipos `<<include>>` e `<<extend>>` entre os casos de uso.
- O diagrama deve ser legível em formato A4 paisagem ou retrato (à escolha da IA, desde que caiba na página).

---

## DIAGRAMA 2 — Diagrama de Classes (UML)

**Objetivo:** Representar a **estrutura estática** do sistema, evidenciando as principais entidades, seus atributos, métodos e relacionamentos. Conforme definido no Capítulo 6.2 do TCC I (Tabela 4 – Classes do Sistema Guicell Manager).

**Ferramenta indicada:** Astah, draw.io ou Lucidchart.

### Classes (representadas como retângulos com 3 compartimentos: nome / atributos / métodos):

#### Classe: `Cliente`
- **Atributos:** `id: int`, `nome: String`, `cpf_cnpj: String`, `telefone: String`, `email: String`, `endereco: String`, `criadoEm: DateTime`
- **Métodos:** `cadastrar()`, `atualizar()`, `buscar()`

#### Classe: `Aparelho`
- **Atributos:** `id: int`, `marca: String`, `modelo: String`, `imei: String`, `observacoes: String`
- **Métodos:** `cadastrar()`, `vincularCliente()`

#### Classe: `OrdemServico`
- **Atributos:** `id: int`, `numero: String`, `dataAbertura: DateTime`, `dataFechamento: DateTime`, `status: String`, `defeito: String`, `diagnostico: String`, `valorOrcado: Decimal`, `valorFinal: Decimal`, `formaPagamento: String`, `prazoEstimado: Date`
- **Métodos:** `abrir()`, `atualizarStatus()`, `fechar()`, `emitirComprovante()`

#### Classe: `ItemOS`
- **Atributos:** `id: int`, `quantidade: int`, `valorUnitario: Decimal`
- **Métodos:** `registrar()`

#### Classe: `Produto`
- **Atributos:** `id: int`, `descricao: String`, `categoria: String`, `estoqueAtual: int`, `estoqueMinimo: int`, `valorCusto: Decimal`, `valorVenda: Decimal`
- **Métodos:** `atualizarEstoque()`, `verificarEstoqueMinimo()`

#### Classe: `Venda`
- **Atributos:** `id: int`, `dataVenda: DateTime`, `valorTotal: Decimal`, `formaPagamento: String`, `desconto: Decimal`
- **Métodos:** `registrar()`, `cancelar()`

#### Classe: `ItemVenda`
- **Atributos:** `id: int`, `quantidade: int`, `valorUnitario: Decimal`
- **Métodos:** `registrar()`

#### Classe: `Caixa`
- **Atributos:** `id: int`, `data: DateTime`, `tipo: String`, `valor: Decimal`, `descricao: String`, `categoria: String`
- **Métodos:** `registrar()`, `fecharDia()`

#### Classe: `Usuario`
- **Atributos:** `id: int`, `nome: String`, `login: String`, `senhaHash: String`, `perfil: String`, `ativo: boolean`, `criadoEm: DateTime`
- **Métodos:** `autenticar()`, `alterar()`

### Relacionamentos entre classes (com multiplicidades):

| Origem | Tipo | Destino | Multiplicidade |
|--------|------|---------|---------------|
| Cliente | Associação | Aparelho | 1 — N (um cliente possui vários aparelhos) |
| Cliente | Associação | OrdemServico | 1 — N (um cliente tem várias OS) |
| Aparelho | Associação | OrdemServico | 1 — N (um aparelho tem várias OS) |
| Usuario | Associação | OrdemServico | 1 — N (um técnico é responsável por várias OS) |
| OrdemServico | Composição | ItemOS | 1 — N (uma OS possui vários itens) |
| Produto | Associação | ItemOS | 1 — N (um produto aparece em vários itens de OS) |
| Venda | Composição | ItemVenda | 1 — N (uma venda possui vários itens) |
| Produto | Associação | ItemVenda | 1 — N (um produto aparece em vários itens de venda) |
| Usuario | Associação | Caixa | 1 — N (um usuário registra várias movimentações) |
| OrdemServico | Associação | Caixa | 1 — 1 (uma OS gera uma movimentação de caixa no fechamento) |
| Usuario | Associação | Venda | 1 — N (um usuário realiza várias vendas) |
| Cliente | Associação | Venda | 1 — N (cliente opcional na venda) |

### Instruções de layout:
- Coloque `OrdemServico` como classe central, pois é o núcleo do sistema.
- `Cliente` e `Aparelho` à esquerda ou acima de `OrdemServico`.
- `ItemOS` e `Produto` à direita ou abaixo de `OrdemServico`.
- `Venda` e `ItemVenda` em um bloco separado, mas conectado a `Produto`.
- `Caixa` e `Usuario` em posição periférica conectando-se às demais.
- Use notação UML padrão: linhas sólidas para associação, losango preenchido para composição.
- Exiba a multiplicidade (ex.: `1`, `0..*`, `1..*`) nas extremidades de cada relacionamento.

---

## DIAGRAMA 3 — Diagrama de Atividades (UML)

**Objetivo:** Representar o fluxo de atividades do **processo principal**: o atendimento ao cliente desde a entrada do aparelho até a sua entrega após o reparo. Conforme definido no Capítulo 6.3 do TCC I.

**Ferramenta indicada:** Astah, draw.io ou Lucidchart.

**Etapas numeradas conforme o documento original (sequência de referência):**
1. Início
2. Receber aparelho
3. Decisão — cliente já cadastrado? Não → cadastrar cliente e aparelho; Sim → selecionar existente
4. Abrir OS
5. Diagnóstico técnico
6. Elaborar orçamento
7. Comunicar cliente
8. Decisão — cliente aprovou? Não → cancelar OS e devolver aparelho (→ Fim); Sim → continuar
9. Realizar reparo
10. Decisão — peças disponíveis? Não → aguardar reposição (→ retornar ao passo 9); Sim → continuar
11. Registrar peças utilizadas (débito automático no estoque)
12. Concluir reparo
13. Notificar cliente
14. Cliente retira o aparelho
15. Fechar OS e registrar pagamento
16. Emitir comprovante
17. Atualizar caixa automaticamente → Fim

### Fluxo completo a representar (com símbolos UML):

```
[Início — nó inicial preenchido]
       ↓
[Receber aparelho do cliente]
       ↓
<Decisão: Cliente já cadastrado?>
   ├── [Não] → [Cadastrar cliente e aparelho no sistema]
   └── [Sim] → (continua)
       ↓ (merge)
[Abrir Ordem de Serviço]
       ↓
[Realizar diagnóstico técnico]
       ↓
[Orçar serviço]
       ↓
[Comunicar cliente sobre o orçamento]
       ↓
<Decisão: Cliente aprovou o orçamento?>
   ├── [Não] → [Atualizar status da OS para "Cancelada"]
   │              ↓
   │           [Devolver aparelho ao cliente]
   │              ↓
   │           [Fim — nó final]
   └── [Sim] → (continua)
       ↓
[Iniciar reparo]
       ↓
<Decisão: Peças disponíveis em estoque?>
   ├── [Não] → [Atualizar status da OS para "Aguardando Peça"]
   │              ↓
   │           [Notificar cliente sobre espera]
   │              ↓
   │           [Aguardar reposição de estoque]
   │              ↓
   │           (retornar ao início do reparo — merge)
   └── [Sim] → (continua)
       ↓ (merge)
[Registrar peças utilizadas — débito automático no estoque]
       ↓
[Concluir reparo]
       ↓
[Atualizar status da OS para "Concluído"]
       ↓
[Notificar cliente que aparelho está pronto]
       ↓
[Cliente retira o aparelho]
       ↓
[Fechar OS]
       ↓
[Registrar pagamento e forma de pagamento]
       ↓
[Emitir comprovante de OS]
       ↓
[Atualizar caixa automaticamente]
       ↓
[Atualizar status da OS para "Entregue"]
       ↓
[Fim — nó final]
```

### Símbolos UML a usar:
- **Nó inicial:** círculo preenchido (●)
- **Nó final:** círculo preenchido com borda dupla (⊙)
- **Atividades:** retângulos com cantos arredondados
- **Decisões:** losangos (◇) com label da condição e rótulos [Sim] / [Não] nas saídas
- **Merge (junção):** losango de merge sem condição
- **Fluxo de controle:** setas sólidas

### Instruções de layout:
- Layout vertical (top-down), com leitura de cima para baixo.
- Os caminhos alternativos (ramificações do [Não]) devem sair para a direita e retornar ao fluxo principal ou levar ao nó de fim.
- Utilize um retângulo de raia (swimlane) se quiser separar as responsabilidades por ator: **Atendente** (abertura, comunicação, fechamento), **Técnico** (diagnóstico, reparo), **Sistema** (débito de estoque, atualização de status, lançamento no caixa).
- O diagrama deve ser legível em formato A4 retrato.

---

## DIAGRAMA 4 — DER / MER Gráfico (Modelo Entidade-Relacionamento)

**Objetivo:** Representar visualmente o modelo de banco de dados do Guicell Manager, com todas as **9 tabelas normalizadas até a Terceira Forma Normal (3FN)**, seus campos (indicando PKs e FKs), tipos de dados e os relacionamentos entre elas com as respectivas cardinalidades. Este diagrama constitui **entregável técnico separado** do documento escrito, a ser desenvolvido no **draw.io ou MySQL Workbench**, conforme indicado no Capítulo 7 do TCC I.

**Contexto:** A normalização até 3FN garante integridade referencial e eliminação de redundâncias. As tabelas `itens_os` e `itens_venda` são tabelas de junção criadas para resolver o relacionamento N:N entre OS/Vendas e Produtos.

### Tabelas e campos:

#### `clientes`
| Campo | Tipo | Chave |
|-------|------|-------|
| id_cliente | INT | PK |
| nome | VARCHAR(100) | |
| cpf_cnpj | VARCHAR(18) | UNIQUE |
| telefone | VARCHAR(20) | |
| email | VARCHAR(100) | |
| endereco | VARCHAR(200) | |
| criado_em | DATETIME | |

#### `aparelhos`
| Campo | Tipo | Chave |
|-------|------|-------|
| id_aparelho | INT | PK |
| id_cliente | INT | FK → clientes |
| marca | VARCHAR(50) | |
| modelo | VARCHAR(100) | |
| imei | VARCHAR(20) | UNIQUE |
| observacoes | TEXT | |

#### `usuarios`
| Campo | Tipo | Chave |
|-------|------|-------|
| id_usuario | INT | PK |
| nome | VARCHAR(100) | |
| login | VARCHAR(50) | UNIQUE |
| senha_hash | VARCHAR(255) | |
| perfil | ENUM(Atendente, Técnico, Gerente) | |
| ativo | BOOLEAN | |
| criado_em | DATETIME | |

#### `ordens_servico`
| Campo | Tipo | Chave |
|-------|------|-------|
| id_os | INT | PK |
| numero_os | VARCHAR(20) | UNIQUE |
| id_cliente | INT | FK → clientes |
| id_aparelho | INT | FK → aparelhos |
| id_tecnico | INT | FK → usuarios |
| defeito_relatado | TEXT | |
| diagnostico | TEXT | |
| status | ENUM(Aguardando, Em Reparo, Aguardando Peça, Concluído, Entregue, Cancelado) | |
| valor_orcado | DECIMAL(10,2) | |
| valor_final | DECIMAL(10,2) | |
| forma_pagamento | VARCHAR(50) | |
| data_abertura | DATETIME | |
| data_fechamento | DATETIME | |
| prazo_estimado | DATE | |

#### `produtos`
| Campo | Tipo | Chave |
|-------|------|-------|
| id_produto | INT | PK |
| descricao | VARCHAR(200) | |
| categoria | VARCHAR(50) | |
| estoque_atual | INT | |
| estoque_minimo | INT | |
| valor_custo | DECIMAL(10,2) | |
| valor_venda | DECIMAL(10,2) | |

#### `itens_os` *(tabela de junção OS ↔ Produto)*
| Campo | Tipo | Chave |
|-------|------|-------|
| id_item_os | INT | PK |
| id_os | INT | FK → ordens_servico |
| id_produto | INT | FK → produtos |
| quantidade | INT | |
| valor_unitario | DECIMAL(10,2) | |

#### `vendas`
| Campo | Tipo | Chave |
|-------|------|-------|
| id_venda | INT | PK |
| id_cliente | INT | FK → clientes (nullable) |
| id_usuario | INT | FK → usuarios |
| data_venda | DATETIME | |
| valor_total | DECIMAL(10,2) | |
| forma_pagamento | VARCHAR(50) | |
| desconto | DECIMAL(10,2) | |

#### `itens_venda` *(tabela de junção Venda ↔ Produto)*
| Campo | Tipo | Chave |
|-------|------|-------|
| id_item_venda | INT | PK |
| id_venda | INT | FK → vendas |
| id_produto | INT | FK → produtos |
| quantidade | INT | |
| valor_unitario | DECIMAL(10,2) | |

#### `caixa`
| Campo | Tipo | Chave |
|-------|------|-------|
| id_caixa | INT | PK |
| id_usuario | INT | FK → usuarios |
| data | DATETIME | |
| tipo | ENUM(entrada, saida) | |
| valor | DECIMAL(10,2) | |
| descricao | VARCHAR(200) | |
| categoria | VARCHAR(50) | |
| id_os | INT | FK → ordens_servico (nullable) |
| id_venda | INT | FK → vendas (nullable) |

### Relacionamentos e cardinalidades:

| Tabela pai | Cardinalidade | Tabela filha | Campo FK |
|------------|---------------|--------------|----------|
| clientes | 1 : N | aparelhos | id_cliente |
| clientes | 1 : N | ordens_servico | id_cliente |
| clientes | 1 : N (opcional) | vendas | id_cliente |
| aparelhos | 1 : N | ordens_servico | id_aparelho |
| usuarios | 1 : N | ordens_servico | id_tecnico |
| usuarios | 1 : N | vendas | id_usuario |
| usuarios | 1 : N | caixa | id_usuario |
| ordens_servico | 1 : N | itens_os | id_os |
| ordens_servico | 1 : N (opcional) | caixa | id_os |
| produtos | 1 : N | itens_os | id_produto |
| vendas | 1 : N | itens_venda | id_venda |
| vendas | 1 : N (opcional) | caixa | id_venda |
| produtos | 1 : N | itens_venda | id_produto |

### Instruções de layout:
- Use o estilo **DER (Diagrama Entidade-Relacionamento)** no padrão de caixas retangulares com o nome da tabela no cabeçalho e os campos listados internamente.
- Destaque visualmente: **PK** em negrito ou com ícone de chave 🔑; **FK** com ícone de chave ou indicação "FK"; campos **UNIQUE** marcados com "UQ".
- Posicione `ordens_servico` no centro do diagrama, pois é a entidade principal.
- Posicione `clientes` e `aparelhos` acima à esquerda; `usuarios` acima à direita.
- Posicione `produtos` abaixo à direita; `itens_os` e `itens_venda` no meio, ligando `ordens_servico`/`vendas` a `produtos`.
- Posicione `vendas` abaixo à esquerda; `caixa` no centro-inferior.
- Represente as linhas de relacionamento com notação de **pé-de-galinha (crow's foot)** indicando 1:N e 1:1, ou use losangos com cardinalidades — escolha o padrão mais claro.
- O diagrama deve ser legível em formato **A4 paisagem**.
- As FKs opcionais (nullable) de `vendas.id_cliente`, `caixa.id_os` e `caixa.id_venda` devem ser indicadas com linha tracejada ou notação de opcionalidade (0..1 no lado da FK).
- Adicione no rodapé do diagrama a legenda: **"Fonte: Elaborado pelos autores (2026)"**, padrão ABNT exigido pelo documento acadêmico.