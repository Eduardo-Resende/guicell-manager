const { Router } = require('express');
const ctrl = require('../controllers/aparelhos.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate);

// Endpoints REST de catálogo de aparelhos
router.get('/marcas', ctrl.buscarMarcas);
router.get('/modelos', ctrl.buscarModelos);
router.get('/buscar-externo', ctrl.consultarExterno);

// Endpoints de gestão de aparelhos por cliente
router.get('/cliente/:id_cliente', ctrl.listarPorCliente);
router.get('/cliente/:id_cliente/ativos', ctrl.listarAtivosPorCliente);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.patch('/:id/toggle-ativo', ctrl.toggleAtivo);

module.exports = router;
