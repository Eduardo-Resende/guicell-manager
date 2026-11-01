const { Router } = require('express');
const fornCtrl = require('../controllers/fornecedores.controller');
const { authenticate, checkPermission } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

router.get('/', checkPermission('compras'), fornCtrl.listar);
router.get('/:id', checkPermission('compras'), fornCtrl.buscarPorId);
router.post('/', checkPermission('compras.fornecedores'), fornCtrl.criar);
router.put('/:id', checkPermission('compras.fornecedores'), fornCtrl.atualizar);
router.patch('/:id/toggle-ativo', checkPermission('compras.fornecedores'), fornCtrl.toggleAtivo);

module.exports = router;
