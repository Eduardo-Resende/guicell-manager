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
const { vendasRouter, caixaRouter, relatoriosRouter, usuariosRouter } = require('./routes/outros.routes');

const app = express();

// ─── Segurança e Parsing ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/categorias', categoriasRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[App] Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

module.exports = app;
