const { Router } = require('express');
const ctrl = require('../controllers/os.controller');
const notificacoesCtrl = require('../controllers/notificacoes.controller');
const { authenticate, checkPermission } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

router.post('/enviar-email', checkPermission('os.imprimir'), notificacoesCtrl.enviarEmail);
router.post('/enviar-whatsapp', checkPermission('os.imprimir'), notificacoesCtrl.enviarWhatsapp);

router.get('/dashboard', checkPermission(['dashboard.ver', 'dashboard.faturamento', 'os.ver']), ctrl.dashboard);
router.get('/pendentes', checkPermission('os'), ctrl.listarOsPendentes);
router.get('/', checkPermission(['os', 'dashboard.ver']), ctrl.listar);
router.get('/:id', checkPermission('os'), ctrl.buscarPorId);
router.post('/', checkPermission('os.criar'), ctrl.criar);
router.patch('/:id/status', checkPermission(['os.status', 'os.editar', 'os.excluir']), ctrl.atualizarStatus);
router.post('/:id/fechar', checkPermission('os.status'), ctrl.fechar);
router.post('/:id/pagar', checkPermission('os.status'), ctrl.pagarOsFiado);

module.exports = router;
