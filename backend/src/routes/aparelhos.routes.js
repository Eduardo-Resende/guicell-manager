const { Router } = require('express');
const ctrl = require('../controllers/aparelhos.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

router.get('/cliente/:id_cliente', ctrl.listarPorCliente);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);

module.exports = router;
