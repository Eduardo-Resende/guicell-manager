const { Router } = require('express');
const ctrl = require('../controllers/produtos.controller');
const { authenticate, checkPermission } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

router.get('/alertas', checkPermission(['estoque', 'dashboard.ver']), ctrl.alertasEstoque);
router.get('/movimentacoes', checkPermission('estoque'), ctrl.listarMovimentacoes);
router.get('/', checkPermission(['estoque', 'os', 'vendas', 'compras']), ctrl.listar);
router.get('/:id', checkPermission(['estoque', 'os', 'vendas', 'compras']), ctrl.buscarPorId);
router.post('/', checkPermission(['estoque.criar_editar', 'compras.criar']), ctrl.criar);
router.put('/:id', checkPermission('estoque.criar_editar'), ctrl.atualizar);
router.delete('/:id', checkPermission('estoque.criar_editar'), ctrl.remover);
router.post('/:id/entrada', checkPermission('estoque.ajustar'), ctrl.registrarEntrada);

module.exports = router;
