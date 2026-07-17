# 📱 Guicell Manager

> **Sistema de Gestão de Assistência Técnica de Celulares com Controle de Estoque, Vendas e Caixa**

Este repositório contém a implementação do **Guicell Manager**, um sistema ERP integrado desenvolvido como projeto de Trabalho de Conclusão de Curso (TCC) em Sistemas de Informação pelos autores **Eduardo Santana Resende** e **Emilly Gabrielly Pereira da Silva**.

O sistema foi projetado para modernizar a gestão operacional e financeira de assistências técnicas de celulares, fornecendo uma plataforma web integrada com banco de dados relacional para persistência de dados e controle de segurança através de perfis de usuário.

---

## 🎯 Objetivos do Projeto

O objetivo principal é solucionar os gargalos operacionais mais comuns em assistências técnicas de smartphones (como perda de informações, furos de estoque e inconsistências financeiras), fornecendo ferramentas integradas para:
* **Controle Operacional:** Acompanhamento ponta a ponta de ordens de serviço.
* **Controle de Inventário:** Gestão integrada de peças e acessórios, com débitos automáticos ao faturar ordens de serviço ou registrar vendas.
* **Controle Financeiro:** Gestão direta de vendas de balcão e fluxo de caixa diário (lançamentos manuais e automáticos).
* **Níveis de Acesso:** Separação de privilégios para **Atendente**, **Técnico** e **Gerente**.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **[Vue 3](https://vuejs.org/)** – Framework progressivo em Javascript para construção de interfaces reativas e modulares.
* **[Vue Router 4](https://router.vuejs.org/)** – Gerenciamento de rotas com Guards para autenticação e verificação de perfil de acesso.
* **[Axios](https://axios-http.com/)** – Cliente HTTP para integração de dados com o backend.
* **CSS Local / Vanilla** – Design responsivo, moderno e customizado.

### Backend
* **[Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)** – Ambiente de execução e framework para a construção da API RESTful.
* **[Sequelize ORM](https://sequelize.org/)** – Ferramenta para mapeamento objeto-relacional e gerenciamento de transações, migrações e seeds do banco de dados.
* **[JWT (JSON Web Token)](https://jwt.io/) & [BcryptJS](https://github.com/dcodeIO/bcrypt.js)** – Mecanismos para criptografia de senhas e autenticação segura baseada em tokens com expiração.

### Banco de Dados
* **[MySQL 8.0](https://www.mysql.com/)** – Banco de dados relacional robusto com chaves estrangeiras, restrições referenciais (`RESTRICT`/`CASCADE`) e mapeamento íntegro dos modelos do TCC.

---

## 📁 Estrutura de Diretórios

```bash
guicell/
├── backend/                  # API RESTful (Node.js + Express + Sequelize)
│   ├── src/
│   │   ├── config/           # Configurações de banco de dados (database.js)
│   │   ├── controllers/      # Controladores de rotas
│   │   ├── middlewares/      # Interceptores (autenticação e autorização por perfil)
│   │   ├── migrations/       # Migrations para estruturação das tabelas
│   │   ├── models/           # Mapeamento de tabelas com Sequelize
│   │   ├── routes/           # Rotas Express organizadas por domínio
│   │   ├── seeders/          # Carga de dados iniciais (usuários e produtos)
│   │   ├── app.js            # Configuração do Express (Helmet, CORS, Parsing)
│   │   └── server.js         # Inicialização do servidor e checagem de banco
│   ├── .env.example          # Exemplo de variáveis de ambiente do backend
│   ├── .sequelizerc          # Caminhos de mapeamento para o CLI do Sequelize
│   └── package.json          # Dependências do backend (Sequelize, Express, etc)
├── frontend/                 # Aplicação Web (Vue 3 + Vite)
│   ├── src/
│   │   ├── assets/           # Imagens e logotipos
│   │   ├── components/       # Componentes reutilizáveis (ex: Sidebar.vue)
│   │   ├── router/           # Configuração do Vue Router com Guards JWT
│   │   ├── services/         # Consumo da API através de instâncias Axios
│   │   ├── views/            # Telas da aplicação (Dashboard, OS, Clientes, etc)
│   │   ├── App.vue           # Componente raiz do aplicativo
│   │   ├── main.js           # Ponto de entrada do frontend Vue
│   │   └── style.css         # Design System e variáveis de estilo global
│   ├── package.json          # Dependências do frontend
│   └── vite.config.js        # Configurações do Vite
└── .gitignore                # Regras de arquivos ignorados no Git (inclui /tcc/ e .env)
```

> 📌 *Nota: A pasta `/tcc`, que contém os documentos de planejamento acadêmico, modelagens UML e protótipos iniciais, está ignorada no repositório via `.gitignore` conforme as diretrizes de desenvolvimento.*

---

## 💻 Como Executar o Projeto Localmente

### Pré-requisitos
Certifique-se de ter instalado:
* **Node.js** (versão 20 LTS recomendada)
* **MySQL 8.0** ativo localmente (porta padrão `3306`)

---

### Passo 1: Configurar o Banco de Dados (Backend)

1. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```

2. Instale as dependências de backend:
   ```bash
   npm install
   ```

3. Configure o arquivo de variáveis de ambiente:
   * Copie o arquivo `.env.example` para `.env`:
     ```bash
     cp .env.example .env
     ```
   * Abra o arquivo `.env` e configure as credenciais do seu MySQL local (`DB_USER`, `DB_PASS`, `DB_NAME`).

4. Crie o banco de dados e execute as migrações:
   ```bash
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   ```

5. Carregue os dados padrões de demonstração (seeders):
   ```bash
   npx sequelize-cli db:seed:all
   ```
   *Isso criará 3 usuários padrões para testes com a senha provisória `guicell123`:*
   * **Gerente:** login `gerente`
   * **Atendente:** login `atendente`
   * **Técnico:** login `tecnico`
   * Também criará alguns produtos demonstrativos em estoque.

6. Inicie o servidor do backend:
   ```bash
   npm run dev
   ```
   *O backend estará rodando em `http://localhost:3001`.*

---

### Passo 2: Configurar a Interface (Frontend)

1. Abra um novo terminal na raiz do projeto e navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências de frontend:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse o sistema:
   * Abra o navegador e acesse: `http://localhost:5173`
   * Faça login usando um dos usuários criados no seeder (ex: usuário `gerente` e senha `guicell123`).

---

## 👥 Autores & Contribuição

* **Desenvolvedor:** Eduardo Santana Resende e Emilly Gabrielly Pereira da Silva
* **Projeto:** Trabalho de Conclusão de Curso (TCC I & II) – Sistemas de Informação
