'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const clientesRoutes = require('./routes/clientes.routes');
const osRoutes = require('./routes/os.routes');
const produtosRoutes = require('./routes/produtos.routes');
const aparelhosRoutes = require('./routes/aparelhos.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const fornecedoresRoutes = require('./routes/fornecedores.routes');
const permissoesRoutes = require('./routes/permissoes.routes');
const { vendasRouter, caixaRouter, relatoriosRouter, usuariosRouter, comprasRouter } = require('./routes/outros.routes');

const app = express();

// ─── Proxy Reverso Confiável ──────────────────────────────────────────────────
// Confia apenas no loopback (Nginx local) para derivar req.ip sem risco de IP Spoofing
app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');

// ─── Segurança e Headers HTTP ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' },
}));

// Aceita múltiplas origens separadas por vírgula no FRONTEND_URL
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (ex: Postman, ferramentas de teste internas)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origem não permitida — ${origin}`));
    }
  },
  credentials: true,
}));

// Desabilita cache em respostas de autenticação e recuperação de credenciais
app.use('/api/auth', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── Rotas da API ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ordens-servico', osRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/aparelhos', aparelhosRoutes);
app.use('/api/vendas', vendasRouter);
app.use('/api/caixa', caixaRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/permissoes', permissoesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/compras', comprasRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// ─── Error Handler Global ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Não expõe stack trace ou detalhes internos em produção
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error Handler]', err);
  }
  res.status(err.status || 500).json({
    error: err.status ? err.message : 'Erro interno do servidor.',
  });
});

module.exports = app;
