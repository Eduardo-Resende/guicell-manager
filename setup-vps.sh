#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
#   setup-vps.sh — Configuração inicial do VPS Hostinger para Guicell Manager
#   Execute este script como root no VPS: bash setup-vps.sh
#   Ubuntu 22.04 LTS — Hostinger KVM1
# ════════════════════════════════════════════════════════════════════════════

set -e  # Para na primeira falha

# ─── Credenciais (ALTERE ANTES DE RODAR) ─────────────────────────────────────
DB_SENHA="Gu1c3ll@DB2024!"
JWT_SECRET="7f3a9b2c1d4e5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
VPS_IP="179.197.228.65"
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     Guicell Manager — Setup VPS Hostinger KVM1      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Atualizar sistema ──────────────────────────────────────────────────
echo "▶ [1/10] Atualizando sistema..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git ufw

# ─── 2. Instalar Node.js 20 LTS ───────────────────────────────────────────
echo "▶ [2/10] Instalando Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "    Node: $(node -v) | npm: $(npm -v)"

# ─── 3. Instalar PM2 globalmente ───────────────────────────────────────────
echo "▶ [3/10] Instalando PM2..."
npm install -g pm2
echo "    PM2: $(pm2 -v)"

# ─── 4. Instalar Nginx ────────────────────────────────────────────────────
echo "▶ [4/10] Instalando Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# ─── 5. Instalar MySQL 8 ──────────────────────────────────────────────────
echo "▶ [5/10] Instalando MySQL 8..."
apt-get install -y mysql-server
systemctl enable mysql
systemctl start mysql

# Configurar banco de dados e usuário
echo "    Configurando banco de dados..."
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS guicell_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'guicell_app'@'localhost'
  IDENTIFIED BY '${DB_SENHA}';

GRANT ALL PRIVILEGES ON guicell_manager.*
  TO 'guicell_app'@'localhost';

FLUSH PRIVILEGES;
SQL
echo "    Banco 'guicell_manager' e usuário 'guicell_app' criados."

# ─── 6. Clonar repositório ────────────────────────────────────────────────
echo "▶ [6/10] Clonando repositório do GitHub..."
mkdir -p /var/www/guicell
cd /var/www/guicell

if [ -d "guicell-manager" ]; then
  echo "    Repositório já existe. Fazendo pull..."
  cd guicell-manager && git pull origin main
else
  git clone https://github.com/Eduardo-Resende/guicell-manager.git
  cd guicell-manager
fi

# ─── 7. Configurar Backend ────────────────────────────────────────────────
echo "▶ [7/10] Configurando backend..."
cd /var/www/guicell/guicell-manager/backend

# Instalar dependências de produção
npm ci --omit=dev

# Criar .env de produção no VPS (fora do git)
cat > .env <<ENV
# Guicell Manager — Variáveis de Produção
PORT=3001
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_NAME=guicell_manager
DB_USER=guicell_app
DB_PASS=${DB_SENHA}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=8h

FRONTEND_URL=http://${VPS_IP}
ENV

echo "    Arquivo .env de produção criado."

# Rodar migrations
echo "    Rodando migrations do banco..."
npx sequelize-cli db:migrate

# Rodar seeds (dados iniciais)
echo "    Populando dados iniciais..."
npx sequelize-cli db:seed:all || echo "    (Seeds ignorados — podem já ter sido rodados)"

# ─── 8. Configurar Frontend ───────────────────────────────────────────────
echo "▶ [8/10] Buildando frontend..."
cd /var/www/guicell/guicell-manager/frontend
npm ci
npm run build
echo "    Build concluído: $(du -sh dist/ | cut -f1)"

# ─── 9. Iniciar PM2 ───────────────────────────────────────────────────────
echo "▶ [9/10] Iniciando backend com PM2..."
mkdir -p /var/log/guicell
cd /var/www/guicell/guicell-manager

pm2 delete guicell-backend 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save

# Configurar PM2 para reiniciar automaticamente ao ligar o servidor
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

echo "    Backend rodando na porta 3001."

# ─── 10. Configurar Nginx ─────────────────────────────────────────────────
echo "▶ [10/10] Configurando Nginx..."

cat > /etc/nginx/sites-available/guicell <<NGINX
server {
    listen 80;
    server_name ${VPS_IP} guicell.cloud www.guicell.cloud;

    # ── Frontend (Vue 3 + HTML5 History Mode) ──────────────────────────────
    root /var/www/guicell/guicell-manager/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # ── Backend API (proxy para Node.js na porta 3001) ─────────────────────
    location /api {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade            \$http_upgrade;
        proxy_set_header   Connection         'upgrade';
        proxy_set_header   Host               \$host;
        proxy_set_header   X-Real-IP          \$remote_addr;
        proxy_set_header   X-Forwarded-For    \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto  \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }

    # ── Headers de segurança ───────────────────────────────────────────────
    add_header X-Frame-Options     "SAMEORIGIN"    always;
    add_header X-Content-Type-Options "nosniff"   always;
    add_header X-XSS-Protection   "1; mode=block" always;

    # ── Gzip ──────────────────────────────────────────────────────────────
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
NGINX

# Ativar o site e desativar o default
ln -sf /etc/nginx/sites-available/guicell /etc/nginx/sites-enabled/guicell
rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar Nginx
nginx -t && systemctl reload nginx

# ─── Firewall básico ──────────────────────────────────────────────────────
echo "    Configurando firewall (UFW)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ─── Resultado Final ──────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              ✅ Setup Concluído!                     ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Frontend:  http://${VPS_IP}              ║"
echo "║  API:       http://${VPS_IP}/api/health   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
pm2 status
