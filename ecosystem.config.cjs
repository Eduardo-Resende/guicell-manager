// PM2 Ecosystem — Guicell Manager
// Usado para manter o backend rodando em produção no VPS
module.exports = {
  apps: [
    {
      name: 'guicell-backend',
      script: 'src/server.js',
      cwd: '/var/www/guicell/guicell-manager/backend',

      // Rodar apenas 1 instância (VPS KVM1 tem 1 vCPU)
      instances: 1,
      exec_mode: 'fork',

      // Reiniciar automaticamente em caso de crash
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',

      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: '/var/log/guicell/backend-out.log',
      error_file: '/var/log/guicell/backend-error.log',
      merge_logs: true,
    },
  ],
};
