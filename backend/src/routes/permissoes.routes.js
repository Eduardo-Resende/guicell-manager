'use strict';

const { Router } = require('express');
const {
  obterMatrizCompleta,
  salvarPermissoesPerfil,
  restaurarPadraoPerfil,
  salvarPermissoesUsuario,
  restaurarPadraoUsuario,
} = require('../controllers/permissoes.controller');
const { authenticate, checkPermission } = require('../middlewares/auth.middleware');

const router = Router();

// Apenas usuários com permissão permissoes.configurar podem gerenciar permissões
router.use(authenticate, checkPermission('permissoes.configurar'));

router.get('/matriz', obterMatrizCompleta);
router.put('/perfil/:perfil', salvarPermissoesPerfil);
router.post('/perfil/:perfil/restaurar', restaurarPadraoPerfil);
router.put('/usuario/:id', salvarPermissoesUsuario);
router.delete('/usuario/:id/restaurar', restaurarPadraoUsuario);

module.exports = router;

