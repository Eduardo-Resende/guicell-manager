const { Router } = require('express');
const fornCtrl = require('../controllers/fornecedores.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

router.get('/', fornCtrl.listar);
router.get('/:id', fornCtrl.buscarPorId);
router.post('/', fornCtrl.criar);
router.put('/:id', fornCtrl.atualizar);
router.patch('/:id/toggle-ativo', fornCtrl.toggleAtivo);

module.exports = router;
