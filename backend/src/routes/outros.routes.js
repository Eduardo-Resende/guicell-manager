const { Router } = require('express');
const vendCtrl = require('../controllers/vendas.controller');
const caixaCtrl = require('../controllers/caixa.controller');
const relCtrl = require('../controllers/relatorios.controller');
const usuCtrl = require('../controllers/usuarios.controller');
const comprasCtrl = require('../controllers/compras.controller');
const { authenticate, authorize, checkPermission } = require('../middlewares/auth.middleware');

// Vendas
const vendasRouter = Router();
vendasRouter.use(authenticate);
vendasRouter.get('/pendentes', checkPermission('vendas'), vendCtrl.listarPendentes);
vendasRouter.get('/', checkPermission('vendas'), vendCtrl.listar);
vendasRouter.post('/', checkPermission('vendas.criar'), vendCtrl.criar);
vendasRouter.post('/:id/pagar', checkPermission('vendas.criar'), vendCtrl.pagarFiado);
vendasRouter.post('/:id/cancelar', checkPermission('vendas.cancelar'), vendCtrl.cancelar);

// Caixa
const caixaRouter = Router();
caixaRouter.use(authenticate);
caixaRouter.get('/resumo-dia', checkPermission(['caixa', 'dashboard.faturamento']), caixaCtrl.resumoDia);
caixaRouter.get('/', checkPermission('caixa.ver'), caixaCtrl.listar);
caixaRouter.post('/abrir', checkPermission('caixa.abrir_fechar'), caixaCtrl.abrirCaixa);
caixaRouter.post('/fechar', checkPermission('caixa.abrir_fechar'), caixaCtrl.fecharCaixa);
caixaRouter.post('/', checkPermission('caixa.movimentar'), caixaCtrl.registrarManual);

// Relatórios
const relatoriosRouter = Router();
relatoriosRouter.use(authenticate);
relatoriosRouter.get('/os', checkPermission('relatorios.os'), relCtrl.relatorioOS);
relatoriosRouter.get('/vendas', checkPermission('relatorios.vendas'), relCtrl.relatorioVendas);
relatoriosRouter.get('/caixa', checkPermission('relatorios.caixa'), relCtrl.relatorioCaixa);
relatoriosRouter.get('/estoque', checkPermission('relatorios.estoque'), relCtrl.relatorioEstoque);

// Usuários (somente Gerente ou com permissão usuarios.gerenciar)
const usuariosRouter = Router();
usuariosRouter.get('/tecnicos', authenticate, usuCtrl.listarTecnicos);

usuariosRouter.use(authenticate, checkPermission('usuarios.gerenciar'));
usuariosRouter.get('/', usuCtrl.listar);
usuariosRouter.post('/', usuCtrl.criar);
usuariosRouter.put('/:id', usuCtrl.atualizar);
usuariosRouter.patch('/:id/toggle-ativo', usuCtrl.toggleAtivo);

// Compras
const comprasRouter = Router();
comprasRouter.use(authenticate);
comprasRouter.get('/', checkPermission('compras'), comprasCtrl.listar);
comprasRouter.get('/:id', checkPermission('compras'), comprasCtrl.buscarPorId);
comprasRouter.post('/', checkPermission('compras.criar'), comprasCtrl.criar);
comprasRouter.post('/:id/cancelar', checkPermission('compras.cancelar'), comprasCtrl.cancelar);

module.exports = { vendasRouter, caixaRouter, relatoriosRouter, usuariosRouter, comprasRouter };
