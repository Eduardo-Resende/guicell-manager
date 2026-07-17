# 📱 Guicell Manager

> **Sistema de Gestão de Assistência Técnica de Celulares com Controle de Estoque, Vendas e Caixa**

Este repositório contém a implementação do **Guicell Manager**, um sistema ERP integrado desenvolvido como projeto de Trabalho de Conclusão de Curso (TCC) em Engenharia de Software. O sistema foi projetado para modernizar a gestão operacional e financeira de assistências técnicas de celulares, substituindo controles manuais por uma plataforma web centralizada, ágil e segura.

---

## 🎯 Objetivos do Projeto

O objetivo principal é solucionar os gargalos operacionais mais comuns em assistências técnicas de smartphones (como perda de informações, furos de estoque e inconsistências financeiras), fornecendo ferramentas integradas para:
* **Controle Operacional:** Acompanhamento ponta a ponta de ordens de serviço.
* **Controle de Inventário:** Gestão integrada de peças e acessórios.
* **Controle Financeiro:** Gestão direta de vendas de balcão e fluxo de caixa diário.

---

## 🚀 Funcionalidades & Módulos

O sistema divide-se nos seguintes módulos principais:

### 👥 1. Cadastro de Clientes & Dispositivos
* Registro detalhado de clientes (nome, telefone, e-mail).
* Cadastro e vinculação dos aparelhos dos clientes, incluindo marca, modelo e identificação por IMEI.

### 🛠️ 2. Ordens de Serviço (O.S.)
* Abertura e controle de fluxo completo de ordens de serviço.
* Atualização em tempo real do status do reparo (Diagnóstico, Aprovação, Em Conserto, Pronto para Entrega).
* Vinculação de peças e insumos utilizados do estoque e cálculo automático da mão de obra.

### 📦 3. Controle de Estoque (Produtos & Peças)
* Cadastro de produtos (descrição, quantidade em estoque, valor de custo e venda).
* Inventário e controle automatizado de entradas e saídas.

### 💰 4. Frente de Caixa & Vendas
* Registro rápido de vendas de acessórios (capas, películas) e peças.
* Registro de movimentações financeiras (entradas de serviços/vendas e saídas de despesas).
* Acompanhamento do fechamento de caixa diário.

### 📊 5. Relatórios & Controle de Usuários
* Geração de relatórios gerenciais para tomada de decisão.
* Níveis de acesso diferenciados para cada tipo de usuário (**Atendente**, **Técnico** e **Gerente**).

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **[Vue 3](https://vuejs.org/)** – Framework progressivo em Javascript para construção de interfaces reativas e modulares.
* **[Vite](https://vitejs.dev/)** – Ferramenta de build de última geração para desenvolvimento rápido.
* **CSS Local / Vanilla** – Design responsivo e customizado.

### Banco de Dados (Planejado)
* **[MySQL](https://www.mysql.com/)** – Banco de dados relacional para persistência íntegra e segura das informações.

---

## 📁 Estrutura de Diretórios

```bash
guicell/
├── frontend/          # Código-fonte da aplicação web (Vue 3 + Vite)
│   ├── src/           # Componentes, views e assets
│   ├── public/        # Arquivos estáticos
│   ├── package.json   # Dependências e scripts npm
│   └── vite.config.js # Configuração do Vite
└── .gitignore         # Configurações de arquivos ignorados no controle de versão
```

> 📌 *Nota: A pasta `/tcc`, que contém os documentos de planejamento acadêmico, modelagens UML e protótipos iniciais, está ignorada no repositório via `.gitignore` conforme as diretrizes de desenvolvimento.*

---

## 💻 Como Executar o Projeto Localmente

### Pré-requisitos
Certifique-se de ter instalado em sua máquina:
* [Node.js](https://nodejs.org/) (versão LTS recomendada)
* [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Instruções

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/guicell.git
   cd guicell
   ```

2. **Acesse o diretório do frontend:**
   ```bash
   cd frontend
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse o sistema:**
   Abra o navegador e acesse o endereço fornecido no terminal (geralmente `http://localhost:5173`).

---

## 👥 Autores & Contribuição

* **Desenvolvedor:** Eduardo Santana Resende e Emilly Gabrielly Pereira da Silva
* **Projeto:** Trabalho de Conclusão de Curso (TCC I & II) – Sistemas de Informação
