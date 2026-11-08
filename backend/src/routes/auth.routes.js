'use strict';

const { Router } = require('express');
const {
  login,
  me,
  logout,
  solicitarRecuperacao,
  validarCodigo,
  redefinirSenha,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  loginIpLimiter,
  solicitacaoIpLimiter,
  validacaoOtpIpLimiter,
} = require('../middlewares/rateLimiter.middleware');

const router = Router();

// Endpoint de login protegido com rate limiting por IP e bloqueio persistente por conta
router.post('/login', loginIpLimiter, login);

// Perfil do operador autenticado
router.get('/me', authenticate, me);

// Logout com revogação ativa no servidor (incremento de versao_sessao)
router.post('/logout', authenticate, logout);

// Solicitação de código de recuperação (WhatsApp / E-mail) com limite e cooldown
router.post('/recuperar-senha/solicitar', solicitacaoIpLimiter, solicitarRecuperacao);

// Validação de OTP de 8 dígitos e emissão de Reset Grant
router.post('/recuperar-senha/validar-codigo', validacaoOtpIpLimiter, validarCodigo);

// Redefinição de senha com Reset Grant ou OTP sob transação atômica
router.post('/recuperar-senha/redefinir', validacaoOtpIpLimiter, redefinirSenha);

module.exports = router;
