const { Router } = require('express');
const ctrl = require('../controllers/os.controller');
const notificacoesCtrl = require('../controllers/notificacoes.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

router.post('/enviar-email', notificacoesCtrl.enviarEmail);
router.post('/enviar-whatsapp', notificacoesCtrl.enviarWhatsapp);

router.get('/dashboard', ctrl.dashboard);
router.get('/pendentes', ctrl.listarOsPendentes);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.criar);
router.patch('/:id/status', ctrl.atualizarStatus);
router.post('/:id/fechar', ctrl.fechar);
router.post('/:id/pagar', ctrl.pagarOsFiado);

module.exports = router;
