'use strict';

/**
 * Middleware de Rate Limiting em memória com janela deslizante (Sliding Window)
 * Suporta chaves compostas (IP, Identificador de Conta, Canal de envio)
 * Evita vazamento de memória com expiração automática de entradas antigas.
 */

class MemoryRateLimiter {
  constructor({ windowMs, maxRequests, message }) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message || 'Muitas requisições. Por favor, tente novamente mais tarde.';
    this.hits = new Map();

    // Limpeza periódica a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.hits.entries()) {
        if (now - record.resetTime > this.windowMs) {
          this.hits.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  check(key) {
    const now = Date.now();
    let record = this.hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.hits.set(key, record);
      return { allowed: true, remaining: this.maxRequests - 1, resetInMs: this.windowMs };
    }

    record.count++;
    if (record.count > this.maxRequests) {
      const resetInMs = Math.max(0, record.resetTime - now);
      return { allowed: false, remaining: 0, resetInMs };
    }

    return { allowed: true, remaining: this.maxRequests - record.count, resetInMs: record.resetTime - now };
  }

  middleware(keyExtractor) {
    return (req, res, next) => {
      // Em modo de teste, permite simulação com x-test-ip ou bypass explícito para cenários funcionais
      if (process.env.NODE_ENV === 'test' && req.headers['x-test-bypass-rate-limit']) {
        return next();
      }

      const clientIp = (process.env.NODE_ENV === 'test' && req.headers['x-test-ip']) || req.ip;
      const key = keyExtractor ? keyExtractor(req, clientIp) : clientIp;
      const result = this.check(key);

      const retryAfterSec = Math.ceil(result.resetInMs / 1000);
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + result.resetInMs) / 1000));

      if (!result.allowed) {
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          error: this.message,
          retryAfter: retryAfterSec,
        });
      }

      next();
    };
  }
}

// 1. Rate limiter para requisições gerais à rota de autenticação (ex: 60 reqs/min por IP)
const authIpLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Limite de requisições excedido. Tente novamente em alguns instantes.',
});

// 2. Rate limiter para tentativas de Login por IP (ex: 20 tentativas por 15 min por IP)
const loginIpLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Muitas tentativas de login a partir deste endereço de rede. Tente novamente mais tarde.',
});

// 3. Rate limiter para solicitação de código de recuperação por IP (ex: 10 solicitações por hora por IP)
const solicitacaoIpLimiter = new MemoryRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message: 'Limite de solicitações de recuperação atingido para este endereço. Tente novamente mais tarde.',
});

// 4. Rate limiter para validação de OTP por IP (ex: 15 tentativas por 15 min por IP)
const validacaoOtpIpLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'Muitas tentativas de validação de código. Tente novamente mais tarde.',
});

module.exports = {
  MemoryRateLimiter,
  authIpLimiter: authIpLimiter.middleware((req, ip) => `ip:${ip || req.ip}`),
  loginIpLimiter: loginIpLimiter.middleware((req, ip) => `login_ip:${ip || req.ip}`),
  solicitacaoIpLimiter: solicitacaoIpLimiter.middleware((req, ip) => `recup_ip:${ip || req.ip}`),
  validacaoOtpIpLimiter: validacaoOtpIpLimiter.middleware((req, ip) => `otp_ip:${ip || req.ip}`),
};
