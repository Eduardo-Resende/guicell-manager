# 📱 Guicell Manager

> **Sistema de Gestão Integrada para Assistência Técnica de Celulares, Estoque, Vendas e Controle Financeiro por Contas**

Este repositório contém a implementação completa do **Guicell Manager**, uma plataforma web integrada desenvolvida como projeto de Trabalho de Conclusão de Curso (TCC) em Sistemas de Informação pelos autores **Eduardo Santana Resende** e **Emilly Gabrielly Pereira da Silva**.

O sistema foi projetado para modernizar e profissionalizar a gestão operacional e financeira de assistências técnicas e lojas de smartphones, solucionando problemas comuns como perda de informações de ordens de serviço, furos de estoque, falta de rastreabilidade contábil e descontrole de fluxo financeiro entre dinheiro físico e recebimentos eletrônicos (PIX e Cartões).

---

## 🎯 Principais Módulos do Sistema

1. **Ordens de Serviço (OS):**
   - Acompanhamento do ciclo de vida dos aparelhos através de quadro visual **Kanban** e listagem em tabela.
   - Registro de diagnóstico técnico, defeito relatado, prazos estimados, fotos/observações e controle de técnico responsável.
   - Apontamento de peças e serviços consumidos com baixa automática de estoque.
   - Visualizador de documento com layout profissional (`OsViewer.vue`), impressão de comprovante em PDF e **envio direto para o WhatsApp do cliente via Evolution API**.
   - Fechamento com pagamentos únicos ou divididos (Dinheiro, PIX, Débito, Crédito ou Fiado).

2. **Vendas de Balcão (PDV):**
   - Interface rápida para venda de acessórios e mercadorias com suporte a leitor de código de barras.
   - Seleção de múltiplos itens, cálculo automático de totais e aplicação de descontos autorizados.
   - Pagamentos divididos entre várias formas e contas financeiras.
   - Controle de clientes recorrentes e vendas a prazo (Fiado).
   - Bloqueio operacional inteligente: vendas bloqueadas automaticamente quando o caixa da loja estiver fechado.

3. **Compras & Fornecedores:**
   - Gestão de parceiros e distribuidores de peças e acessórios.
   - Registro de entrada de notas fiscais com atualização de custo de aquisição e sugestão de preço de venda.
   - Suporte a compras à vista ou a prazo/parciais (com débito apenas dos valores efetivamente desembolsados no caixa).

4. **Controle de Estoque & Categorias:**
   - Gestão centralizada de produtos para revenda e componentes técnicos para manutenção.
   - Categorização hierárquica (categorias pai e subcategorias) com filtro de destinação (`tipo_uso`: *Venda*, *OS* ou *Ambos*).
   - Monitoramento de estoque mínimo e geração automática de alertas visuais de reposição.
   - Histórico completo de movimentações de estoque rastreado e auditado.

5. **Caixa & Gestão Financeira Avançada:**
   - **Múltiplas Contas Financeiras:** Separação do **Caixa Físico (gaveta)**, **Cofre** (reserva) e **Conta da Loja (eletrônica: PIX e Cartões)**.
   - **Transferências Internas:** Movimentação segura entre gaveta e cofre (sangrias e reforço de troco) sem afetar o faturamento da loja.
   - **Turnos de Caixa:** Abertura e fechamento de turnos com conferência cega/assistida, registro de sobras e faltas, justificativa obrigatória e autorização gerencial.
   - **Lançamentos Divididos:** Despesas manuais rateadas entre dinheiro e transferências bancárias em uma única operação atômica.
   - **Imutabilidade:** Lançamentos financeiros protegidos contra alteração ou exclusão direta, com auditoria e suporte a contra-lançamento (estorno).

6. **Clientes & Aparelhos:**
   - Cadastro detalhado com validação de CPF/CNPJ, WhatsApp e histórico de serviços.
   - Registro de aparelhos com marca, modelo, IMEI (opcional) e observações técnicas.
   - Catálogo incremental de marcas e modelos com preenchimento preditivo.

7. **Relatórios Gerenciais:**
   - Relatórios analíticos de Vendas, Ordens de Serviço (por período, status e técnico), Fluxo de Caixa (por contas e formas de pagamento) e Posição de Estoque.
   - Normalização de períodos com sincronização estrita no fuso horário oficial de Brasília (`-03:00`).

8. **Segurança, Perfis de Acesso & RBAC:**
   - Autenticação stateless baseada em **JWT (JSON Web Token)** e criptografia com **BcryptJS**.
   - Matriz de Permissões dinâmica (RBAC) com perfis padrões (**Gerente**, **Atendente** e **Técnico**) e personalização de regras individuais por usuário.
   - **Logs de Auditoria (RNF09):** Rastreabilidade de ações críticas (cancelamentos, estornos, fechamentos de caixa e ajustes de estoque) com snapshot do estado anterior e posterior.
   - Recuperação de senha com código temporário de 4 dígitos enviado via **WhatsApp** e **E-mail**.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **[Vue 3](https://vuejs.org/)** (Composition API & Options API) – Framework reativo modular.
* **[Vite](https://vitejs.dev/)** – Ferramenta de build de alta performance.
* **[Vue Router 4](https://router.vuejs.org/)** – Roteamento dinâmico com Navigation Guards para proteção de rotas por token e permissões.
* **[Axios](https://axios-http.com/)** – Cliente HTTP com interceptors para injeção de credenciais e tratamento de erros.
* **[HTML2Canvas](https://html2canvas.hertzen.com/) & [jsPDF](https://github.com/parallax/jsPDF)** – Renderização e exportação de relatórios e Ordens de Serviço em formato PDF.

### Backend
* **[Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)** – Arquitetura RESTful escalável.
* **[Sequelize ORM v6](https://sequelize.org/)** – Mapeamento objeto-relacional com suporte a transações ACID (`sequelize.transaction`), constraints, hooks de imutabilidade e migrations.
* **[Nodemailer](https://nodemailer.com/)** – Disparo de e-mails via SMTP com anexos em PDF.
* **[Evolution API](https://github.com/EvolutionAPI/evolution-api)** – Integração com WhatsApp para envio de mensagens e comprovantes.
* **[PM2](https://pm2.keymetrics.io/)** – Gerenciador de processos em produção.

### Banco de Dados
* **[MySQL 8.0](https://www.mysql.com/)** – Banco relacional íntegro, configurado em UTC-3, com 18 tabelas relacionais interligadas por chaves estrangeiras com ações `CASCADE`, `RESTRICT` e `SET NULL`.

---

## 📁 Estrutura de Diretórios

```bash
guicell-manager/
├── backend/                  # API RESTful (Node.js + Express + Sequelize)
│   ├── src/
│   │   ├── config/           # Configuração de conexão e fuso horário do banco (database.js)
│   │   ├── controllers/      # Controladores de regras de negócio (OS, Vendas, Caixa, etc.)
│   │   ├── middlewares/      # Interceptores JWT e verificação dinâmica de permissões
│   │   ├── migrations/       # Migrações versionadas da estrutura do banco de dados
│   │   ├── models/           # Modelos Sequelize com validações, associações e hooks
│   │   ├── routes/           # Rotas da API segregadas por domínio funcional
│   │   ├── seeders/          # Carga de dados iniciais (usuários padrões e estoque)
│   │   ├── services/         # Camada de serviços (financeiro.service.js, phoneCatalog.js)
│   │   ├── app.js            # Configuração do Express, CORS e tratamento global
│   │   └── server.js         # Inicialização do servidor HTTP na porta configurada
│   ├── .env.example          # Modelo de variáveis de ambiente
│   ├── .sequelizerc          # Mapeamento do CLI do Sequelize
│   └── package.json          # Dependências do backend
├── frontend/                 # Aplicação Single Page Application (Vue 3 + Vite)
│   ├── src/
│   │   ├── assets/           # Imagens, logotipos e ilustrações
│   │   ├── components/       # Componentes globais (Sidebar.vue, OsViewer.vue, etc.)
│   │   ├── composables/      # Funções de composição reativas (usePermissoes.js)
│   │   ├── router/           # Definição de rotas e guardas de navegação
│   │   ├── services/         # Serviços de consumo da API backend via Axios
│   │   ├── views/            # Telas da aplicação (Dashboard, OS, Vendas, Caixa, etc.)
│   │   ├── App.vue           # Componente raiz do Vue
│   │   ├── main.js           # Ponto de entrada da aplicação frontend
│   │   └── style.css         # Design System e variáveis de estilo global
│   ├── index.html            # Ponto de montagem da SPA
│   ├── package.json          # Dependências do frontend
│   └── vite.config.js        # Configuração do bundler Vite
├── tcc/                      # Documentação técnica e de engenharia de software
│   ├── banco_de_dados.sql    # DDL consolidado de todas as 18 tabelas ativas
│   ├── caixa.md              # Documentação detalhada do módulo Caixa e Finanças
│   └── ...                   # Manuais técnicos detalhados de cada tela
├── .github/workflows/        # CI/CD: Deploy automatizado via SSH para VPS Hostinger
├── ecosystem.config.cjs      # Configuração de inicialização PM2 em produção
└── README.md                 # Visão geral do repositório e guia de execução
```

---

## 💻 Como Executar o Projeto Localmente

### Pré-requisitos
* **Node.js** (versão 20 LTS recomendada)
* **MySQL 8.0** instalado e em execução (porta padrão `3306`)

---

### Passo 1: Configurar o Backend

1. Entre no diretório do backend e instale as dependências:
   ```bash
   cd backend
   npm install
   ```

2. Crie e configure o arquivo `.env`:
   * Copie o arquivo modelo:
     ```bash
     cp .env.example .env
     ```
   * Defina suas credenciais locais do MySQL (`DB_USER`, `DB_PASS`, `DB_NAME`).

3. Crie o banco de dados e execute todas as migrações:
   ```bash
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   ```

4. Popule os dados iniciais do sistema (seeders):
   ```bash
   npx sequelize-cli db:seed:all
   ```
   *Usuários demonstrativos criados com a senha inicial `guicell123`:*
   * **Gerente:** login `gerente`
   * **Atendente:** login `atendente`
   * **Técnico:** login `tecnico`

5. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   *O backend estará acessível em `http://localhost:3001`.*

---

### Passo 2: Configurar o Frontend

1. Em um novo terminal, entre no diretório do frontend e instale as dependências:
   ```bash
   cd frontend
   npm install
   ```

2. Inicie a aplicação no servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra seu navegador e acesse:
   * **URL:** `http://localhost:5173`
   * Entre com o usuário `gerente` e senha `guicell123`.

---

## 👥 Autores & Contribuição

* **Autores do Projeto:** Eduardo Santana Resende e Emilly Gabrielly Pereira da Silva
* **Curso:** Sistemas de Informação — Trabalho de Conclusão de Curso (TCC)
* **Orientação Acadêmica:** UNIALFA – CENTRO UNIVERSITÁRIO ALVES FARIA
* **Orientador:** Mestre Sandro Gouvea Cardoso Sousa e Silva