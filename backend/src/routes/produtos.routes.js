const { Router } = require('express');
const ctrl = require('../controllers/produtos.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

router.get('/alertas', ctrl.alertasEstoque);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.remover);
router.post('/:id/entrada', ctrl.registrarEntrada);

module.exports = router;
