const { Router } = require('express');
const ctrl = require('../controllers/os.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

router.get('/dashboard', ctrl.dashboard);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.criar);
router.patch('/:id/status', ctrl.atualizarStatus);
router.post('/:id/fechar', ctrl.fechar);

module.exports = router;
