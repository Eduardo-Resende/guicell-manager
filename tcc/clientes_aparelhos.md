# Documentação Técnica e Operacional: Módulo Clientes & Aparelhos (`ClientesView.vue`)

> **Documento de Arquitetura, Regras de Negócio e Manual Operacional**  
> **Status:** Atualizado com validação de documentos, integração com WhatsApp Web, vínculo 1:N de aparelhos, suporte a IMEI opcional e catálogo inteligente de marcas/modelos.

---

## 1. Visão Geral e Propósito

O módulo de **Clientes & Aparelhos** gerencia a base de contatos e o inventário de dispositivos móveis pertencentes aos clientes da **Guicell**.

Seus principais objetivos são:
- Manter o cadastro único e atualizado de clientes, unificando PF (Pessoa Física) e PJ (Pessoa Jurídica).
- Fornecer acesso rápido ao canal de contato (link direto para conversa no **WhatsApp** com um clique).
- Estruturar o relacionamento **1:N** entre cliente e seus aparelhos (um cliente pode possuir múltiplos smartphones, tablets ou smartwatches em atendimento).
- Padronizar o catálogo de marcas e modelos para evitar inconsistências textuais no banco de dados.
- Permitir o cadastro de aparelhos com ou sem número de **IMEI**, viabilizando a abertura de OS para aparelhos que não ligam ou não possuem identificador visível.
- Disponibilizar a ficha cadastral do cliente com seu histórico integrado de vendas e ordens de serviço já realizadas.

---

## 2. Interface do Usuário (`ClientesView.vue`)

A tela apresenta uma estrutura fluida dividida em duas colunas complementares:

### 2.1. Listagem de Clientes
- **Barra de Pesquisa:** Busca em tempo real por Nome, CPF/CNPJ, Telefone ou E-mail.
- **Card / Linha do Cliente:**
  - Nome completo e CPF/CNPJ formatado
  - Telefone com botão de ação rápida que abre o chat do WhatsApp Web diretamente
  - E-mail e Endereço
  - Contador de aparelhos cadastrados
  - Botões de ação: Selecionar/Visualizar Ficha, Editar e Excluir.

### 2.2. Modal de Cadastro e Edição de Cliente
- **Campos:** Nome (obrigatório), CPF ou CNPJ (opcional, com validação de máscara e unicidade no banco), Telefone (obrigatório com DDD), E-mail e Endereço completo.

### 2.3. Painel de Aparelhos do Cliente Selecionado
Ao clicar em um cliente na lista, o painel lateral carrega seus dados e a listagem de aparelhos associados:
- **Card do Aparelho:**
  - Marca e Modelo (com badge de destaque)
  - Número de IMEI (ou indicação de *"Não informado"* se não houver)
  - Observações gerais (estado da carcaça, película, marcas de queda)
  - Botão para **Abrir OS Imediata** para aquele aparelho específico
  - Ações para editar dados do aparelho ou inativá-lo.

### 2.4. Modal de Cadastro de Aparelho
- **Seleção de Marca:** Menu suspenso ou busca com catálogo das principais marcas do mercado (Apple, Samsung, Motorola, Xiaomi, Asus, LG, etc.).
- **Seleção de Modelo:** Lista filtrada de acordo com a marca selecionada, com suporte a inclusão de modelo personalizado.
- **IMEI:** Campo de 15 dígitos. O sistema aceita valores nulos (`NULL`) sem acusar erro de duplicidade, mas valida a unicidade caso o IMEI seja preenchido.
- **Observações:** Descrição do estado físico inicial do aparelho no ato do recebimento.

---

## 3. Catálogo de Marcas e Modelos (`phoneCatalog.service.js`)

Para manter a base consistente e facilitar a digitação do atendente:
- O sistema conta com as tabelas `marcas` e `modelos`.
- O serviço backend [`phoneCatalog.service.js`](file:///c:/trabalho/clientes/guicell/guicell-manager/backend/src/services/phoneCatalog.service.js) mantém um seed com as marcas mais comuns e adiciona novos modelos dinamicamente conforme forem sendo digitados pelos operadores, tornando o catálogo cada vez mais completo sem necessidade de manutenção manual.

---

## 4. Integração com o Backend

### Principais Endpoints:
- **`GET /api/clientes`** — Listagem de clientes com filtro de busca.
- **`POST /api/clientes`** — Cadastro de novo cliente.
- **`PUT /api/clientes/:id`** — Edição cadastral de cliente.
- **`DELETE /api/clientes/:id`** — Remoção de cliente (bloqueada caso haja OS ou vendas vinculadas).
- **`GET /api/clientes/:id/aparelhos`** — Listagem de aparelhos de um cliente específico.
- **`POST /api/clientes/:id/aparelhos`** — Cadastro de novo aparelho para o cliente.
- **`PUT /api/aparelhos/:id`** — Edição de dados do aparelho.
- **`GET /api/aparelhos/marcas`** e **`GET /api/aparelhos/modelos`** — Consulta do catálogo.

---

## 5. Matriz de Permissões (RBAC) de Clientes e Aparelhos

| Permissão | Finalidade | Gerente | Atendente | Técnico |
| :--- | :--- | :---: | :---: | :---: |
| `clientes.ver` | Visualizar listagem de clientes, fichas e telefones. | Sim | Sim | Sim |
| `clientes.criar` | Cadastrar novos clientes na recepção. | Sim | Sim | Sim |
| `clientes.editar` | Atualizar dados cadastrais de clientes existentes. | Sim | Sim | Sim |
| `clientes.excluir` | Excluir cadastros de clientes da base. | Sim | Não | Não |
| `aparelhos.gerenciar` | Cadastrar, alterar e vincular aparelhos a clientes. | Sim | Sim | Sim |

