const { Router } = require('express');
const { login, me, solicitarRecuperacao, redefinirSenha } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/recuperar-senha/solicitar', solicitarRecuperacao);
router.post('/recuperar-senha/redefinir', redefinirSenha);

module.exports = router;
