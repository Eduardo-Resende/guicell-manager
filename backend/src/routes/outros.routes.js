const { Router } = require('express');
const vendCtrl = require('../controllers/vendas.controller');
const caixaCtrl = require('../controllers/caixa.controller');
const relCtrl = require('../controllers/relatorios.controller');
const usuCtrl = require('../controllers/usuarios.controller');
const comprasCtrl = require('../controllers/compras.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Vendas
const vendasRouter = Router();
vendasRouter.use(authenticate);
vendasRouter.get('/pendentes', vendCtrl.listarPendentes);
vendasRouter.get('/', vendCtrl.listar);
vendasRouter.post('/', vendCtrl.criar);
vendasRouter.post('/:id/pagar', vendCtrl.pagarFiado);

// Caixa
const caixaRouter = Router();
caixaRouter.use(authenticate);
caixaRouter.get('/resumo-dia', caixaCtrl.resumoDia);
caixaRouter.get('/', caixaCtrl.listar);
caixaRouter.post('/abrir', caixaCtrl.abrirCaixa);
caixaRouter.post('/fechar', caixaCtrl.fecharCaixa);
caixaRouter.post('/', caixaCtrl.registrarManual);


// Relatórios
const relatoriosRouter = Router();
relatoriosRouter.use(authenticate);
relatoriosRouter.get('/os', relCtrl.relatorioOS);
relatoriosRouter.get('/vendas', relCtrl.relatorioVendas);
relatoriosRouter.get('/caixa', relCtrl.relatorioCaixa);
relatoriosRouter.get('/estoque', relCtrl.relatorioEstoque);

// Usuários (somente Gerente, exceto listagem de técnicos)
const usuariosRouter = Router();
usuariosRouter.get('/tecnicos', authenticate, usuCtrl.listarTecnicos);

usuariosRouter.use(authenticate, authorize(['Gerente']));
usuariosRouter.get('/', usuCtrl.listar);
usuariosRouter.post('/', usuCtrl.criar);
usuariosRouter.put('/:id', usuCtrl.atualizar);
usuariosRouter.patch('/:id/toggle-ativo', usuCtrl.toggleAtivo);

// Compras
const comprasRouter = Router();
comprasRouter.use(authenticate);
comprasRouter.get('/', comprasCtrl.listar);
comprasRouter.get('/:id', comprasCtrl.buscarPorId);
comprasRouter.post('/', comprasCtrl.criar);

module.exports = { vendasRouter, caixaRouter, relatoriosRouter, usuariosRouter, comprasRouter };
