const { Router } = require('express');
const catCtrl = require('../controllers/categorias.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', authenticate, catCtrl.listar);
router.post('/', authenticate, authorize(['Gerente']), catCtrl.criar);
router.put('/:id', authenticate, authorize(['Gerente']), catCtrl.atualizar);
router.delete('/:id', authenticate, authorize(['Gerente']), catCtrl.remover);

module.exports = router;
