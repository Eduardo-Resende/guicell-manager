const { Router } = require('express');
const ctrl = require('../controllers/clientes.controller');
const { authenticate, checkPermission } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

router.get('/', checkPermission(['clientes', 'os', 'vendas']), ctrl.listar);
router.get('/:id', checkPermission(['clientes', 'os', 'vendas']), ctrl.buscarPorId);
router.get('/:id/historico-os', checkPermission(['clientes', 'os', 'vendas']), ctrl.listarHistoricoOs);
router.post('/', checkPermission('clientes.criar'), ctrl.criar);
router.put('/:id', checkPermission('clientes.editar'), ctrl.atualizar);
router.delete('/:id', checkPermission('clientes.excluir'), ctrl.remover);

module.exports = router;
