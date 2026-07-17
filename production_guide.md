# 🚀 Guia de Implantação em Produção (Hostinger) — Guicell Manager

Este guia descreve detalhadamente o passo a passo para implantar o **Guicell Manager** em ambiente de produção na **Hostinger**, alinhado com a modelagem do TCC I.

---

## 📋 Arquitetura de Hospedagem

De acordo com a Seção 9.2 do documento de referência do TCC, o sistema é projetado para operar na infraestrutura da **Hostinger**:
* **Backend e Banco de Dados (MySQL 8.0):** Executados em uma VPS Linux Hostinger (Ubuntu Server recomendado).
* **Frontend (Vue 3):** Compilado para arquivos estáticos e servido via servidor web (Nginx/Apache) na VPS ou carregado diretamente no painel de Hospedagem Compartilhada Hostinger (hPanel).

---

## 🛠️ Passo a Passo da Configuração

### Passo 1: Configuração do Banco de Dados no Hostinger hPanel ou VPS

Se estiver usando a **Hospedagem Compartilhada Hostinger (hPanel)**:
1. Acesse o **hPanel** -> Menu **Banco de Dados** -> **Bancos de Dados MySQL**.
2. Crie um novo banco de dados (ex: `u123456_guicell`) e um usuário MySQL com privilégios de acesso completos. Defina uma senha forte.
3. Anote o host do banco de dados (geralmente fornecido na tela, ex: `mysql.hostinger.com.br` ou `127.0.0.1`).

Se estiver usando uma **VPS Hostinger**:
1. Conecte-se à VPS via SSH.
2. Acesse o MySQL e crie o banco de dados:
   ```sql
   CREATE DATABASE guicell_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

### Passo 2: Implantação do Backend na VPS Hostinger

1. **Instalar dependências essenciais na VPS:**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm git nginx mysql-client
   ```

2. **Clonar e configurar o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO> /var/www/guicell
   cd /var/www/guicell/backend
   npm install --production
   ```

3. **Configurar as Variáveis de Ambiente:**
   Crie o arquivo `.env` na pasta `backend/`:
   ```env
   PORT=3001
   NODE_ENV=production
   DB_HOST=localhost # Ou o host externo do hPanel
   DB_PORT=3306
   DB_NAME=guicell_manager
   DB_USER=root # Substituir pelo usuário criado
   DB_PASS=sua_senha_segura
   JWT_SECRET=sua_chave_secreta_longa_jwt_producao
   FRONTEND_URL=https://guicell.seudominio.com.br
   ```

4. **Executar as Migrations e Seeds em Produção:**
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

5. **Gerenciar o processo com PM2 (para manter a API rodando continuamente):**
   ```bash
   sudo npm install -g pm2
   pm2 start src/server.js --name "guicell-backend"
   pm2 save
   pm2 startup
   ```

---

### Passo 3: Implantação do Frontend

#### Opção A: Hospedando na VPS via Nginx (Recomendado)
1. No seu computador local, crie o arquivo `.env.production` na pasta `frontend/`:
   ```env
   VITE_API_URL=https://api.seudominio.com.br/api
   ```
2. Compile os arquivos estáticos localmente:
   ```bash
   npm run build
   ```
3. Transfira a pasta `dist` gerada para o servidor VPS (ex: `/var/www/guicell/frontend/dist`).
4. Configure o arquivo de configuração do Nginx (`/etc/nginx/sites-available/guicell`):
   ```nginx
   server {
       listen 80;
       server_name seudominio.com.br www.seudominio.com.br;

       location / {
           root /var/www/guicell/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
   }

   server {
       listen 80;
       server_name api.seudominio.com.br;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
5. Ative o site e reinicie o Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/guicell /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

#### Opção B: Hospedando na Hospedagem Compartilhada (hPanel File Manager)
1. Crie o arquivo `.env.production` localmente com `VITE_API_URL` apontando para a URL da API da VPS.
2. Rode `npm run build` na pasta `frontend/`.
3. Acesse o **Gerenciador de Arquivos** da Hostinger e faça upload de todos os arquivos da pasta `dist` para dentro da pasta pública (`public_html`).
4. Crie ou edite o arquivo `.htaccess` no diretório raiz (`public_html`) para gerenciar as rotas do Vue Router (HTML5 History Mode):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

---

## 🔒 Certificado de Segurança SSL (HTTPS)

É altamente recomendável utilizar SSL para proteger as senhas e os tokens JWT trafegados:
1. Na VPS Hostinger, instale o **Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br -d api.seudominio.com.br
   ```
2. O Certbot configurará o redirecionamento automático para HTTPS e renovará o certificado de forma automática a cada 90 dias.
