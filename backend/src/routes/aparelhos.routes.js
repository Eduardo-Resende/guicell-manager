const { Router } = require('express');
const ctrl = require('../controllers/aparelhos.controller');
const { authenticate, checkPermission } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

// Endpoints REST de catálogo de aparelhos
router.get('/marcas', checkPermission(['clientes', 'os']), ctrl.buscarMarcas);
router.get('/modelos', checkPermission(['clientes', 'os']), ctrl.buscarModelos);
router.get('/buscar-externo', checkPermission(['clientes', 'os']), ctrl.consultarExterno);

// Endpoints de gestão de aparelhos por cliente
router.get('/cliente/:id_cliente', checkPermission(['clientes', 'os']), ctrl.listarPorCliente);
router.get('/cliente/:id_cliente/ativos', checkPermission(['clientes', 'os']), ctrl.listarAtivosPorCliente);
router.post('/', checkPermission('aparelhos.gerenciar'), ctrl.criar);
router.put('/:id', checkPermission('aparelhos.gerenciar'), ctrl.atualizar);
router.patch('/:id/toggle-ativo', checkPermission('aparelhos.gerenciar'), ctrl.toggleAtivo);

module.exports = router;
