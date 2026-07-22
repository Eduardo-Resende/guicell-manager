# PROMPT PARA IA — TCC I: Guicell Manager
## Alunos: Eduardo Santana Resende e Emilly Gabrielly Pereira Silva
## Sistema ERP para Assistência Técnica de Celulares

---

## CONTEXTO GERAL

Você é um assistente especializado em Engenharia de Software. Sua tarefa é apoiar a elaboração do **TCC I** de um aluno de Engenharia de Software cujo projeto se chama **Guicell Manager**: um sistema ERP voltado para a gestão de assistências técnicas de celulares, integrando controle de ordens de serviço, estoque, vendas e fluxo de caixa.

O TCC I **não inclui desenvolvimento de código**. Ele é um documento acadêmico de planejamento e modelagem. Ao final, o aluno deve ter produzido um documento completo com todos os artefatos descritos abaixo.

Cada seção deste prompt corresponde a um capítulo ou entregável do TCC I. Siga a ordem, gere o conteúdo solicitado e, quando aplicável, produza os artefatos técnicos no formato indicado.

---

## SEÇÃO 1 — INTRODUÇÃO

### O que fazer
Escreva uma introdução acadêmica de 3 a 5 parágrafos apresentando:

1. **O cenário atual das assistências técnicas de celulares no Brasil**: crescimento do mercado de smartphones, aumento da demanda por reparos, perfil das empresas do setor (pequenas e médias, com gestão informal).
2. **O problema operacional**: a maioria dessas empresas ainda usa cadernos, planilhas ou controles verbais para gerenciar clientes, reparos, peças e caixa. Isso gera perda de informações, erros de estoque, inconsistências financeiras e dificuldade no acompanhamento dos serviços.
3. **A justificativa para um sistema ERP**: sistemas integrados de gestão (ERP) são amplamente utilizados em outros setores para resolver exatamente esses problemas. A proposta do Guicell Manager é levar esse benefício para as assistências técnicas.
4. **A relevância acadêmica**: o projeto permite aplicar na prática conceitos de Engenharia de Software, banco de dados, análise de sistemas e desenvolvimento web.

### Tom esperado
Formal, acadêmico, em terceira pessoa ou impessoal.

---

## SEÇÃO 2 — PROBLEMA DE PESQUISA

### O que fazer
Formule a **pergunta de pesquisa** central do TCC. Ela deve ser objetiva, responder "como" ou "de que forma" e conectar o problema (gestão manual) à solução proposta (sistema integrado).

### Exemplo de referência
> Como um sistema integrado de gestão pode melhorar o controle operacional, financeiro e de estoque de uma assistência técnica de celulares?

### Instruções adicionais
- Apresente também uma **hipótese** de resposta a essa pergunta.
- Adicione 2 a 3 **questões secundárias** que complementam a pergunta principal (ex.: quais funcionalidades são essenciais? quais tecnologias são adequadas?).

---

## SEÇÃO 3 — OBJETIVOS

### 3.1 Objetivo Geral
Escreva o objetivo geral em uma frase clara, iniciando com verbo no infinitivo. Deve expressar a entrega principal do projeto completo (TCC I + TCC II).

**Referência:** "Desenvolver uma proposta de sistema de gestão para assistência técnica de celulares, integrando ordens de serviço, controle de estoque, vendas e fluxo de caixa."

### 3.2 Objetivos Específicos
Liste de 6 a 8 objetivos específicos, cada um com verbo no infinitivo, concreto e mensurável. Cada objetivo deve corresponder a um entregável real do TCC I ou TCC II.

**Exemplos:**
- Levantar e documentar os requisitos funcionais e não funcionais do sistema;
- Modelar o banco de dados utilizando o Modelo Entidade-Relacionamento (MER);
- Elaborar os diagramas UML: casos de uso, classes e atividades;
- Definir a arquitetura do sistema e as tecnologias a serem utilizadas;
- Elaborar protótipos de interface (wireframes) das principais telas;
- Planejar o cronograma de desenvolvimento para o TCC II.

---

## SEÇÃO 4 — FUNDAMENTAÇÃO TEÓRICA

### O que fazer
Escreva um texto dissertativo, organizado em subtópicos, abordando os seguintes temas. Para cada tema, apresente: definição/conceito, importância para o projeto e referência bibliográfica sugerida.

---

### 4.1 Engenharia de Software
- Defina Engenharia de Software segundo Pressman (2021) e Sommerville (2019).
- Explique o conceito de ciclo de vida de software.
- Relacione com o projeto: por que aplicar uma metodologia estruturada ao Guicell Manager.

### 4.2 Levantamento de Requisitos
- Diferencie **requisitos funcionais** (o que o sistema faz) de **requisitos não funcionais** (como o sistema se comporta).
- Cite técnicas de elicitação de requisitos: entrevistas, questionários, observação.
- Relacione com o projeto: como os requisitos foram levantados para o Guicell Manager. (Com base em entrevistas e observação da assistência técnica Guicell)

### 4.3 Banco de Dados
- Explique o **Modelo Entidade-Relacionamento (MER)** e o modelo relacional.
- Conceitue **normalização** (1FN, 2FN, 3FN) e por que é importante.
- Justifique a escolha do MySQL para o projeto.

### 4.4 Sistemas ERP
- Defina ERP (Enterprise Resource Planning) e seus módulos típicos.
- Explique os benefícios de um sistema integrado vs. sistemas isolados.
- Cite exemplos de ERPs comerciais (SAP, TOTVS, Odoo, Sankhya) e compare com a proposta do Guicell Manager.

### 4.5 Gestão de Estoque
- Explique os processos de **entrada**, **saída** e **inventário** de estoque.
- Apresente conceitos de estoque mínimo, ponto de reposição e rastreabilidade de peças.
- Relacione com o contexto de uma assistência técnica (peças de reposição, acessórios).

### 4.6 Gestão Financeira
- Explique **fluxo de caixa**, **contas a pagar** e **contas a receber**.
- Diferencie receita de serviços (OS) e receita de vendas (acessórios).
- Relacione com o módulo de caixa do Guicell Manager.

### 4.7 Gestão de Assistência Técnica
- Explique o que é uma **Ordem de Serviço (OS)**: abertura, diagnóstico, aprovação, execução, entrega.
- Trate de **garantia de serviço** e rastreabilidade do reparo.
- Cite normas ou boas práticas do setor (ex.: Código de Defesa do Consumidor no contexto de garantia).

---

## SEÇÃO 5 — LEVANTAMENTO DE REQUISITOS

### O que fazer
Produza a **tabela completa de requisitos funcionais e não funcionais**, com identificador, descrição detalhada e prioridade (Alta / Média / Baixa).

---

### 5.1 Requisitos Funcionais

Gere uma tabela com no mínimo 20 requisitos funcionais, cobrindo os módulos abaixo. Para cada requisito, informe: ID, descrição completa (não apenas "Cadastrar X", mas o que exatamente o sistema deve fazer), prioridade e módulo relacionado.

| ID    | Descrição | Prioridade | Módulo |
|-------|-----------|------------|--------|
| RF01  | O sistema deve permitir o cadastro de clientes com nome completo, CPF/CNPJ, telefone, e-mail e endereço. | Alta | Clientes |
| RF02  | O sistema deve permitir o cadastro de aparelhos vinculados a um cliente, informando marca, modelo, IMEI e defeito relatado. | Alta | Aparelhos |
| RF03  | O sistema deve permitir a abertura de Ordens de Serviço com geração automática de número sequencial, data, técnico responsável, defeito, prazo estimado e valor orçado. | Alta | OS |
| RF04  | O sistema deve permitir atualizar o status da OS (Aguardando, Em Reparo, Aguardando Peça, Concluído, Entregue, Cancelado). | Alta | OS |
| RF05  | O sistema deve registrar as peças utilizadas em cada OS, debitando automaticamente do estoque. | Alta | OS / Estoque |
| RF06  | O sistema deve controlar o estoque de produtos com entradas (compras), saídas (vendas e uso em OS) e quantidade mínima com alerta. | Alta | Estoque |
| RF07  | O sistema deve registrar vendas de acessórios avulsas (sem OS), com seleção de produto, quantidade, desconto e forma de pagamento. | Alta | Vendas |
| RF08  | O sistema deve registrar entradas e saídas no caixa, com descrição, categoria e data. | Alta | Caixa |
| RF09  | O sistema deve gerar relatório de OS por período, por técnico e por status. | Média | Relatórios |
| RF10  | O sistema deve gerar relatório de vendas por período e por produto. | Média | Relatórios |
| RF11  | O sistema deve gerar relatório de fluxo de caixa por período. | Média | Relatórios |
| RF12  | O sistema deve permitir o cadastro e gerenciamento de usuários com diferentes perfis de acesso (Atendente, Técnico, Gerente). | Alta | Usuários |
| RF13  | O sistema deve permitir consulta ao histórico completo de OS de um cliente ou aparelho. | Média | OS / Clientes |
| RF14  | O sistema deve registrar o fechamento da OS com valor final cobrado, forma de pagamento e registro automático no caixa. | Alta | OS / Caixa |
| RF15  | O sistema deve emitir comprovante de OS (para impressão ou PDF) com dados do cliente, aparelho, serviço e garantia. | Média | OS |

> **Instrução para a IA:** complemente com mais 5 requisitos funcionais relevantes para o contexto do Guicell Manager, mantendo o mesmo padrão de detalhamento.

---

### 5.2 Requisitos Não Funcionais

Gere uma tabela com no mínimo 10 requisitos não funcionais, cobrindo aspectos de desempenho, segurança, usabilidade, portabilidade e manutenibilidade.

| ID     | Descrição | Categoria |
|--------|-----------|-----------|
| RNF01  | O sistema deve ser desenvolvido como aplicação web, acessível via navegador sem necessidade de instalação local. | Portabilidade |
| RNF02  | O acesso ao sistema deve ser restrito por autenticação com usuário e senha, com controle de sessão por inatividade. | Segurança |
| RNF03  | O sistema deve realizar backup automático do banco de dados diariamente. | Confiabilidade |
| RNF04  | O banco de dados utilizado deve ser MySQL na versão 8.0 ou superior. | Tecnologia |
| RNF05  | A interface deve ser responsiva, adaptando-se a telas de desktop, tablet e smartphone. | Usabilidade |
| RNF06  | As senhas dos usuários devem ser armazenadas com hash criptográfico (bcrypt ou equivalente). | Segurança |
| RNF07  | O sistema deve responder a qualquer consulta em menos de 3 segundos em condições normais de uso. | Desempenho |
| RNF08  | O código-fonte deve ser versionado em repositório Git com documentação de commits. | Manutenibilidade |
| RNF09  | O sistema deve registrar logs de ações críticas (abertura/fechamento de OS, movimentações de caixa). | Rastreabilidade |
| RNF10  | A interface deve seguir princípios de usabilidade (Nielsen), com menus intuitivos e fluxo de navegação claro. | Usabilidade |

---

## SEÇÃO 6 — MODELAGEM UML

### O que fazer
Descreva textualmente cada diagrama UML que deve ser produzido como entregável técnico do TCC I. Para cada diagrama, explique: objetivo, atores/classes envolvidos, e o que o diagrama deve demonstrar. O aluno deverá usar **Astah**, **draw.io**, **Lucidchart** ou **PlantUML** para desenhá-los.

---

### 6.1 Diagrama de Casos de Uso

**Objetivo:** Representar as interações entre os atores do sistema e as funcionalidades disponíveis.

**Atores:**
- **Atendente:** responsável pelo atendimento ao cliente, abertura de OS, registro de vendas.
- **Técnico:** responsável por atualizar o status da OS, registrar peças utilizadas.
- **Gerente:** acesso total ao sistema, incluindo relatórios, cadastro de usuários e caixa.

**Casos de uso a representar (mínimo):**
- Autenticar no sistema
- Cadastrar cliente
- Cadastrar aparelho
- Abrir Ordem de Serviço
- Consultar / Atualizar OS
- Fechar OS e registrar pagamento
- Controlar estoque (entrada e saída)
- Registrar venda de acessório
- Movimentar caixa
- Emitir relatórios
- Gerenciar usuários

**Inclua:** relações `<<include>>` e `<<extend>>` onde aplicável.

---

### 6.2 Diagrama de Classes

**Objetivo:** Representar a estrutura orientada a objetos do sistema com atributos, métodos e relacionamentos.

**Classes a representar:**

| Classe | Atributos principais | Métodos sugeridos |
|--------|---------------------|-------------------|
| Cliente | id, nome, cpf, telefone, email, endereco | cadastrar(), atualizar(), buscar() |
| Aparelho | id, marca, modelo, imei, id_cliente | cadastrar(), vincularCliente() |
| OrdemServico | id, numero, data_abertura, status, defeito, valor_orcado, valor_final, id_cliente, id_aparelho, id_tecnico | abrir(), atualizarStatus(), fechar(), emitirComprovante() |
| ItemOS | id, id_os, id_produto, quantidade, valor_unitario | registrar() |
| Produto | id, descricao, estoque_atual, estoque_minimo, valor_venda | atualizarEstoque(), verificarEstoqueMinimo() |
| Venda | id, data, valor_total, forma_pagamento | registrar(), cancelar() |
| ItemVenda | id, id_venda, id_produto, quantidade, valor_unitario | registrar() |
| Caixa | id, data, descricao, tipo (entrada/saída), valor, id_usuario | registrar(), fecharDia() |
| Usuario | id, nome, login, senha_hash, perfil | autenticar(), alterar() |

**Relacionamentos a representar:**
- Cliente 1 — N Aparelho
- Cliente 1 — N OrdemServico
- Aparelho 1 — N OrdemServico
- OrdemServico 1 — N ItemOS
- Produto 1 — N ItemOS
- Venda 1 — N ItemVenda
- Produto 1 — N ItemVenda
- Usuario 1 — N OrdemServico (técnico responsável)
- OrdemServico 1 — 1 Caixa (no fechamento)

---

### 6.3 Diagrama de Atividades

**Objetivo:** Representar o fluxo de atividades do processo principal: atendimento ao cliente até a entrega do aparelho.

**Fluxo a representar:**

```
[Início]
   ↓
Receber aparelho do cliente
   ↓
Cliente já cadastrado? → Não → Cadastrar cliente e aparelho
   ↓ Sim
Abrir Ordem de Serviço
   ↓
Realizar diagnóstico técnico
   ↓
Orçar serviço
   ↓
Comunicar cliente sobre orçamento
   ↓
Cliente aprovou? → Não → Registrar OS como "Cancelada" → Devolver aparelho → [Fim]
   ↓ Sim
Realizar reparo
   ↓
Peças disponíveis em estoque? → Não → Aguardar reposição → Atualizar status OS → Notificar cliente
   ↓ Sim
Registrar peças utilizadas (débito automático no estoque)
   ↓
Concluir reparo → Atualizar status OS para "Concluído"
   ↓
Notificar cliente
   ↓
Cliente retira aparelho
   ↓
Fechar OS → Registrar pagamento → Emitir comprovante
   ↓
Atualizar caixa automaticamente
   ↓
[Fim]
```

---

## SEÇÃO 7 — MODELAGEM DO BANCO DE DADOS

### O que fazer
Descreva o **Modelo Entidade-Relacionamento (MER)** e o **Modelo Relacional** do sistema. Apresente todas as tabelas com seus campos, tipos de dados, chaves primárias (PK) e chaves estrangeiras (FK). Inclua também o **Dicionário de Dados**.

---

### 7.1 Tabelas do Banco de Dados

#### Tabela: `clientes`
| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| id_cliente | INT | PK, AUTO_INCREMENT | Identificador único do cliente |
| nome | VARCHAR(100) | NOT NULL | Nome completo |
| cpf_cnpj | VARCHAR(18) | UNIQUE | CPF ou CNPJ |
| telefone | VARCHAR(20) | NOT NULL | Telefone de contato |
| email | VARCHAR(100) | — | E-mail |
| endereco | VARCHAR(200) | — | Endereço completo |
| criado_em | DATETIME | DEFAULT NOW() | Data de cadastro |

#### Tabela: `aparelhos`
| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| id_aparelho | INT | PK, AUTO_INCREMENT | Identificador do aparelho |
| id_cliente | INT | FK → clientes | Dono do aparelho |
| marca | VARCHAR(50) | NOT NULL | Marca do aparelho |
| modelo | VARCHAR(100) | NOT NULL | Modelo |
| imei | VARCHAR(20) | UNIQUE | IMEI do aparelho |
| observacoes | TEXT | — | Observações gerais |

#### Tabela: `ordens_servico`
| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| id_os | INT | PK, AUTO_INCREMENT | Identificador da OS |
| numero_os | VARCHAR(20) | UNIQUE, NOT NULL | Número legível da OS |
| id_cliente | INT | FK → clientes | Cliente da OS |
| id_aparelho | INT | FK → aparelhos | Aparelho da OS |
| id_tecnico | INT | FK → usuarios | Técnico responsável |
| defeito_relatado | TEXT | NOT NULL | Defeito descrito pelo cliente |
| diagnostico | TEXT | — | Diagnóstico do técnico |
| status | ENUM | NOT NULL | Aguardando, Em Reparo, Aguardando Peça, Concluído, Entregue, Cancelado |
| valor_orcado | DECIMAL(10,2) | — | Valor do orçamento |
| valor_final | DECIMAL(10,2) | — | Valor cobrado no fechamento |
| forma_pagamento | VARCHAR(50) | — | Dinheiro, Cartão, PIX |
| data_abertura | DATETIME | NOT NULL | Data/hora de abertura |
| data_fechamento | DATETIME | — | Data/hora de fechamento |
| prazo_estimado | DATE | — | Previsão de entrega |

#### Tabela: `itens_os`
| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| id_item_os | INT | PK, AUTO_INCREMENT | Identificador |
| id_os | INT | FK → ordens_servico | OS relacionada |
| id_produto | INT | FK → produtos | Peça utilizada |
| quantidade | INT | NOT NULL | Quantidade usada |
| valor_unitario | DECIMAL(10,2) | NOT NULL | Valor na data de uso |

#### Tabela: `produtos`
| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| id_produto | INT | PK, AUTO_INCREMENT | Identificador do produto |
| descricao | VARCHAR(200) | NOT NULL | Descrição do produto/peça |
| categoria | VARCHAR(50) | — | Tela, Bateria, Acessório, etc. |
| estoque_atual | INT | DEFAULT 0 | Quantidade em estoque |
| estoque_minimo | INT | DEFAULT 1 | Alerta quando atingir |
| valor_custo | DECIMAL(10,2) | — | Valor de compra |
| valor_venda | DECIMAL(10,2) | NOT NULL | Valor de venda |

#### Tabela: `vendas`
| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| id_venda | INT | PK, AUTO_INCREMENT | Identificador da venda |
| id_cliente | INT | FK → clientes (nullable) | Cliente (opcional) |
| id_usuario | INT | FK → usuarios | Atendente que realizou |
| data_venda | DATETIME | NOT NULL | Data/hora da venda |
| valor_total | DECIMAL(10,2) | NOT NULL | Valor total da venda |
| forma_pagamento | VARCHAR(50) | NOT NULL | Forma de pagamento |
| desconto | DECIMAL(10,2) | DEFAULT 0 | Desconto aplicado |

#### Tabela: `itens_venda`
| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| id_item_venda | INT | PK, AUTO_INCREMENT | Identificador |
| id_venda | INT | FK → vendas | Venda relacionada |
| id_produto | INT | FK → produtos | Produto vendido |
| quantidade | INT | NOT NULL | Quantidade |
| valor_unitario | DECIMAL(10,2) | NOT NULL | Valor unitário na venda |

#### Tabela: `caixa`
| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| id_caixa | INT | PK, AUTO_INCREMENT | Identificador |
| id_usuario | INT | FK → usuarios | Usuário que registrou |
| data | DATETIME | NOT NULL | Data/hora do registro |
| tipo | ENUM('entrada','saida') | NOT NULL | Tipo de movimentação |
| valor | DECIMAL(10,2) | NOT NULL | Valor |
| descricao | VARCHAR(200) | NOT NULL | Descrição da movimentação |
| categoria | VARCHAR(50) | — | OS, Venda, Despesa, etc. |
| id_os | INT | FK → ordens_servico (nullable) | OS de origem (se houver) |
| id_venda | INT | FK → vendas (nullable) | Venda de origem (se houver) |

#### Tabela: `usuarios`
| Campo | Tipo | Restrição | Descrição |
|-------|------|-----------|-----------|
| id_usuario | INT | PK, AUTO_INCREMENT | Identificador |
| nome | VARCHAR(100) | NOT NULL | Nome completo |
| login | VARCHAR(50) | UNIQUE, NOT NULL | Login de acesso |
| senha_hash | VARCHAR(255) | NOT NULL | Senha criptografada |
| perfil | ENUM | NOT NULL | Atendente, Técnico, Gerente |
| ativo | BOOLEAN | DEFAULT TRUE | Status do usuário |
| criado_em | DATETIME | DEFAULT NOW() | Data de criação |

---

## SEÇÃO 8 — PROTÓTIPOS DE TELA

### O que fazer
Descreva em detalhes o que cada tela do sistema deve conter. O aluno usará **Figma** ou **draw.io** para criá-las com base nessas descrições. Cada tela deve ser documentada com: objetivo, elementos de interface, campos, botões e navegação.

---

### Tela 1 — Login
- **Objetivo:** Autenticar o usuário no sistema.
- **Elementos:** Logo Guicell Manager, campo "Usuário", campo "Senha" (com opção de mostrar/ocultar), botão "Entrar", link "Esqueci minha senha".
- **Comportamento:** Em caso de erro, exibir mensagem inline. Redirecionar para Dashboard após login.

### Tela 2 — Dashboard
- **Objetivo:** Visão geral do negócio em tempo real.
- **Elementos:** Cards com indicadores: Total de OS abertas, OS concluídas hoje, Valor em caixa (dia atual), Produtos com estoque mínimo. Gráfico de barras: OS por status. Lista das últimas 5 OS abertas. Menu lateral de navegação.

### Tela 3 — Clientes
- **Objetivo:** Gerenciar cadastro de clientes.
- **Elementos:** Tabela paginada com busca por nome/CPF/telefone. Botão "Novo Cliente". Modal de cadastro/edição com todos os campos. Botão "Ver histórico de OS" por cliente.

### Tela 4 — Ordens de Serviço
- **Objetivo:** Gerenciar todo o ciclo de vida das OS.
- **Elementos:** Tabela paginada com filtros por status, técnico e período. Botão "Nova OS". Formulário de abertura com busca de cliente e aparelho. Tela de detalhe da OS com: dados do cliente/aparelho, histórico de atualizações de status, peças utilizadas, botões de ação (Atualizar Status, Fechar OS, Imprimir).

### Tela 5 — Estoque
- **Objetivo:** Controlar produtos e peças.
- **Elementos:** Tabela de produtos com alerta visual para estoque mínimo. Botão "Novo Produto". Modal de cadastro com todos os campos. Aba de "Movimentações" com histórico de entradas e saídas. Botão "Registrar Entrada".

### Tela 6 — Vendas
- **Objetivo:** Registrar venda de acessórios e produtos.
- **Elementos:** Interface tipo PDV (ponto de venda): campo de busca de produto, tabela de itens da venda atual, campo de desconto, seleção de forma de pagamento, botão "Finalizar Venda". Histórico de vendas com filtro por data.

### Tela 7 — Caixa
- **Objetivo:** Visualizar e registrar movimentações financeiras.
- **Elementos:** Resumo do dia (total entradas, total saídas, saldo). Botão "Registrar movimentação manual". Tabela de movimentações do dia com filtro por tipo. Botão "Fechar Caixa".

### Tela 8 — Relatórios
- **Objetivo:** Gerar relatórios gerenciais.
- **Elementos:** Seleção de tipo de relatório (OS, Vendas, Caixa, Estoque). Filtros de período (data inicial / data final). Opção de exportar em PDF ou Excel. Pré-visualização do relatório na tela.

### Tela 9 — Usuários *(acesso restrito ao Gerente)*
- **Objetivo:** Gerenciar usuários do sistema.
- **Elementos:** Tabela de usuários com status ativo/inativo. Botão "Novo Usuário". Modal de cadastro com definição de perfil. Botão de redefinição de senha.

---

## SEÇÃO 9 — ARQUITETURA DO SISTEMA

### O que fazer
Descreva a arquitetura do sistema Guicell Manager, apresentando: estilo arquitetural escolhido, camadas, tecnologias e justificativa para cada escolha.

---

### 9.1 Estilo Arquitetural: MVC em 3 Camadas

O sistema seguirá o padrão **MVC (Model-View-Controller)** organizado em 3 camadas lógicas:

```
┌─────────────────────────────────────────┐
│         CAMADA DE APRESENTAÇÃO          │
│  Interface Web (HTML, CSS, JavaScript)  │
│  Framework: Vue.js ou React             │
└──────────────────┬──────────────────────┘
                   │ HTTP/REST API (JSON)
┌──────────────────▼──────────────────────┐
│         CAMADA DE NEGÓCIO               │
│  Backend: Node.js + Express             │
│  (Controllers, Services, Validações)    │
└──────────────────┬──────────────────────┘
                   │ ORM / SQL
┌──────────────────▼──────────────────────┐
│         CAMADA DE DADOS                 │
│  Banco de Dados: MySQL 8                │
│  ORM: Sequelize ou Prisma               │
└─────────────────────────────────────────┘
```

### 9.2 Tecnologias e Justificativas

| Componente | Tecnologia escolhida | Justificativa |
|------------|---------------------|---------------|
| Frontend | HTML5 + CSS3 + JavaScript / Vue.js | Leveza, curva de aprendizado acessível, reatividade |
| Backend | Node.js + Express | Ecossistema maduro, REST API simples, alta produtividade |
| Banco de Dados | MySQL 8.0 | Gratuito, amplamente suportado, robusto para o porte do sistema |
| ORM | Sequelize ou Prisma | Abstração do banco, facilita migrações e relacionamentos |
| Autenticação | JWT (JSON Web Token) | Stateless, seguro, fácil de integrar |
| Hospedagem | Hostinger | Baixo custo, painel simplificado e suporte à hospedagem da aplicação |
| Versionamento | Git + GitHub | Controle de versão, colaboração, histórico |

### 9.3 Fluxo de uma Requisição
```
Usuário acessa tela → Frontend envia requisição HTTP para a API
→ Controller recebe e valida a requisição
→ Service executa a regra de negócio
→ Model acessa o banco de dados
→ Resposta retorna em JSON
→ Frontend atualiza a tela dinamicamente
```

---

## SEÇÃO 10 — CRONOGRAMA TCC II

### O que fazer
Elabore um cronograma detalhado de desenvolvimento para o TCC II, mês a mês, com as etapas, atividades e entregáveis esperados.

| Mês | Etapa | Atividades | Entregável |
|-----|-------|------------|------------|
| Agosto | Configuração e Banco de Dados | Configurar ambiente, criar banco, implementar migrações e seeds | Banco de dados funcional |
| Setembro | Backend – Módulos Core | Desenvolver APIs de: Clientes, Aparelhos, OS, Usuários, Autenticação | API REST funcional com autenticação |
| Outubro (1ª quinzena) | Backend – Módulos Financeiros | Desenvolver APIs de: Estoque, Vendas, Caixa, Relatórios | Módulos financeiros e de estoque integrados |
| Outubro (2ª quinzena) | Frontend – Telas Principais | Implementar: Login, Dashboard, Clientes, OS | Telas principais funcionais |
| Novembro (1ª quinzena) | Frontend – Telas Secundárias | Implementar: Estoque, Vendas, Caixa, Relatórios, Usuários | Sistema completo integrado |
| Novembro (2ª quinzena) | Testes e Correções | Testes funcionais, correção de bugs, validação dos requisitos | Sistema testado e estável |
| Dezembro (1ª quinzena) | Documentação Final | Complementar documento TCC II, capturas de tela, manual do usuário | Documento TCC II completo |
| Dezembro (2ª quinzena) | Defesa | Preparação da apresentação, ensaio, defesa perante a banca | Aprovação no TCC II |

---

## SEÇÃO 11 — METODOLOGIA

### O que fazer
Escreva o capítulo de Metodologia, detalhando como o projeto será conduzido. Com base no modelo de TCC, defina:

- **Tipo de Pesquisa:** Especifique se é pesquisa aplicada, estudo de caso, exploratória, etc.
- **Metodologia de Desenvolvimento:** Explique a abordagem (ex.: adaptada de métodos ágeis, prototipação) e o ciclo que será adotado no TCC II.
- **Ferramentas Utilizadas:** Liste e justifique as ferramentas que serão usadas (ex: VS Code, GitHub, Figma, MySQL Workbench).
- **Universo e Amostra:** Se aplicável (ex: a própria assistência técnica).

---

## SEÇÃO 12 — CONCLUSÃO (OU CONSIDERAÇÕES FINAIS)

### O que fazer
Escreva a conclusão referente à etapa do **TCC I**, sintetizando o que foi alcançado nesta fase de planejamento e modelagem.

- **Considerações Finais:** Recapitule o problema abordado e como a modelagem e o planejamento propostos solucionam a questão levantada.
- **Limitações:** Cite possíveis desafios encontrados durante o planejamento e levantamento de requisitos desta primeira etapa.
- **Trabalhos Futuros:** Reforce os próximos passos, ou seja, a transição para a fase de implementação técnica e testes do sistema (foco do TCC II).

---

## SEÇÃO 13 — REFERÊNCIAS E ELEMENTOS PRÉ/PÓS-TEXTUAIS

### O que fazer
Elabore os elementos pré-textuais e pós-textuais obrigatórios do documento acadêmico.

- **Resumo e Abstract:** Escreva o resumo (e sua respectiva tradução) cobrindo contexto, problema, metodologia e objetivo do trabalho em um único parágrafo. Liste as palavras-chave/keywords.
- **Lista de Abreviaturas e Siglas:** Mapeie as siglas usadas ao longo do documento (ex: ERP, MER, OS, MVC, API).
- **Referências Bibliográficas:** Formate todas as referências utilizadas na fundamentação teórica (Pressman, Sommerville, etc.) seguindo estritamente os padrões ABNT (NBR 6023).

---

## SEÇÃO 14 — DADOS E FORMATAÇÃO DOS ELEMENTOS PRÉ-TEXTUAIS

### O que fazer
Gere o conteúdo exato das páginas iniciais (Capa, Folha de Rosto e Folha de Aprovação), mantendo a mesma formatação estrutural e os textos padrão da instituição (UNIALFA) apresentados no documento de referência, mas adaptados para o contexto deste trabalho.

Utilize as seguintes informações e menções para montar o conteúdo dessas páginas:

**Capa:**
- **Instituição:** UNIALFA - UNIVERSIDADE ALVES FARIAS
- **Cursos:** ENGENHARIA DE SOFTWARE
- **Alunos:** EDUARDO SANTANA RESENDE / EMILLY GABRIELLY PEREIRA SILVA
- **Título do Trabalho:** GUICELL MANAGER: DESENVOLVIMENTO DE UM SISTEMA DE GESTÃO PARA ASSISTÊNCIA TÉCNICA DE CELULARES
- **Local e Ano:** Goiânia / 2026

**Folha de Rosto:**
- **Alunos e Título do Trabalho** (centralizados).
- **Texto de Apresentação (alinhado à direita):** "Trabalho de Conclusão de Curso apresentado como requisito parcial para obtenção do título de Bacharel, pelo Curso de Engenharia de Software da Universidade Alves Farias."
- **Orientador:** Mestre Sandro Gouvea Cardoso Sousa e Silva.
- **Local e Ano:** Goiânia / 2026

**Folha de Aprovação:**
- **Alunos e Título do Trabalho**.
- **Texto de Apresentação:** "Trabalho de Graduação Integrado (TGI) apresentado à Faculdade de Engenharia de Software da Universidade Alves Farias para obtenção do título de Bacharel em Engenharia de Software."
- **Data de Aprovação:** "Aprovado em: ___/___/_______"
- **Banca Examinadora:** Estruture 3 linhas com sublinhados para assinatura, seguidas por "Prof. Dr. _________________________ - Instituição".

**Dedicatória, Agradecimentos e Epígrafe (Elementos Opcionais):**
- Crie marcadores ou forneça parágrafos de sugestão acadêmica (inspirados na área de tecnologia) para que os alunos possam apenas revisar ou assinar depois.

---

## ENTREGÁVEIS TÉCNICOS — CHECKLIST FINAL

Use esta lista para verificar se todos os artefatos do TCC I foram produzidos:

### Documento Escrito
- [ ] Elementos pré-textuais: Capa, folha de rosto, aprovação, dedicatória, epígrafe e listas (Seções 13 e 14)
- [ ] Resumo e Abstract (Seção 13)
- [ ] Introdução (Seção 1)
- [ ] Problema de Pesquisa e Hipótese (Seção 2)
- [ ] Objetivos Geral e Específicos (Seção 3)
- [ ] Fundamentação Teórica com referências (Seção 4)
- [ ] Tabela de Requisitos Funcionais (mín. 20) (Seção 5.1)
- [ ] Tabela de Requisitos Não Funcionais (mín. 10) (Seção 5.2)
- [ ] Metodologia (Seção 11)
- [ ] Cronograma TCC II (Seção 10)
- [ ] Conclusão / Considerações Finais do TCC I (Seção 12)
- [ ] Referências Bibliográficas em ABNT (Seção 13)

### Artefatos de Modelagem
- [ ] Diagrama de Casos de Uso (UML)
- [ ] Diagrama de Classes (UML)
- [ ] Diagrama de Atividades (UML)
- [ ] MER — Modelo Entidade-Relacionamento
- [ ] Modelo Relacional (tabelas com PKs e FKs)
- [ ] Dicionário de Dados (Seção 7)

### Artefatos de Design
- [ ] Protótipo das 9 telas (Figma ou equivalente)
- [ ] Documento de Arquitetura do Sistema (Seção 9)

---

## PONTOS DE MELHORIA EM RELAÇÃO AO DOCUMENTO ORIGINAL

Os itens abaixo foram identificados como lacunas ou pontos fracos no rascunho original e foram aprimorados neste prompt:

1. **Requisitos superficiais:** O documento original listava requisitos de 1 linha. Aqui, cada requisito tem descrição completa, prioridade e módulo associado — padrão esperado em documentos de Engenharia de Software.

2. **Falta de dicionário de dados:** O MER original não especificava tipos de dados, restrições ou relacionamentos. Este prompt inclui todas as tabelas com tipos, PKs, FKs e descrições de cada campo.

3. **Ausência de tabela `itens_os` e `itens_venda`:** O modelo original ignorava o relacionamento N:N entre OS/Venda e Produtos. Incluímos as tabelas de junção necessárias para normalização correta.

4. **Diagrama de atividades simplificado:** O fluxo original era linear e não contemplava decisões (aprovação do orçamento, disponibilidade de peças, cancelamento). Este prompt inclui um fluxo completo com pontos de decisão.

5. **Falta de especificação de protótipos:** O original apenas listava nomes de telas. Aqui cada tela tem objetivo, elementos, campos e comportamento descritos para guiar o design.

6. **Arquitetura vaga:** O documento original citava "MVC" sem detalhar tecnologias, justificativas ou o fluxo de uma requisição. Este prompt especifica o stack tecnológico completo com justificativas.

7. **Cronograma sem atividades detalhadas:** O original tinha apenas etapa + mês. Este prompt inclui as atividades específicas de cada etapa e o entregável esperado.

8. **Ausência de hipótese e questões secundárias:** O problema de pesquisa original era apenas uma pergunta. Este prompt orienta a incluir hipótese e questões secundárias, como esperado em trabalhos acadêmicos.

9. **Fundamentação teórica sem conexão com o projeto:** Os tópicos de fundamentação eram listados sem orientação de como relacioná-los ao Guicell Manager. Este prompt instrui explicitamente essa conexão em cada subtópico.

10. **Falta de checklist de entregáveis:** O original não tinha um guia claro do que precisava ser entregue. Este prompt inclui um checklist completo para uso do aluno e do orientador.

11. **Ausência de tópicos estruturais do TCC:** O documento original pulava seções importantes e obrigatórias no padrão acadêmico. Foram incluídas as seções de Metodologia, Conclusão (focada no encerramento do TCC I) e os Elementos Pré/Pós-textuais (Resumo, Abstract, Siglas e Referências ABNT).
