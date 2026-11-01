const { Router } = require('express');
const catCtrl = require('../controllers/categorias.controller');
const { authenticate, checkPermission } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', authenticate, catCtrl.listar);
router.post('/', authenticate, checkPermission('estoque.categorias'), catCtrl.criar);
router.put('/:id', authenticate, checkPermission('estoque.categorias'), catCtrl.atualizar);
router.delete('/:id', authenticate, checkPermission('estoque.categorias'), catCtrl.remover);

module.exports = router;
