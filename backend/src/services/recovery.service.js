'use strict';

const crypto = require('crypto');

/**
 * Retorna a chave secreta independente para HMAC de OTP.
 * Caso não definida explicitamente em RESET_OTP_HMAC_KEY, deriva do JWT_SECRET.
 */
const getHmacSecret = () => {
  return process.env.RESET_OTP_HMAC_KEY || `${process.env.JWT_SECRET || 'guicell_default_secret'}_otp_hmac_key_v1`;
};

/**
 * Gera um OTP criptograficamente seguro com 8 dígitos decimais (10000000 a 99999999).
 */
const generateOtp = () => {
  const codeInt = crypto.randomInt(10000000, 100000000);
  return codeInt.toString();
};

/**
 * Calcula HMAC-SHA-256 do OTP vinculado ao usuário e à finalidade PASSWORD_RESET.
 * Impede ataques de busca exaustiva (rainbow tables) mesmo que a coluna seja vazada.
 */
const computeOtpHmac = (userId, otp) => {
  const secret = getHmacSecret();
  const payload = `${userId}:PASSWORD_RESET:${String(otp).trim()}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

/**
 * Compara em tempo constante o OTP fornecido com o HMAC armazenado.
 */
const verifyOtpHmac = (userId, providedOtp, storedHmac) => {
  if (!providedOtp || !storedHmac) return false;
  try {
    const computed = computeOtpHmac(userId, providedOtp);
    const bufComputed = Buffer.from(computed, 'hex');
    const bufStored = Buffer.from(storedHmac, 'hex');

    if (bufComputed.length !== bufStored.length) return false;
    return crypto.timingSafeEqual(bufComputed, bufStored);
  } catch (err) {
    return false;
  }
};

/**
 * Gera um Reset Grant de alta entropia (256 bits aleatórios)
 * Retorna o token a ser enviado ao cliente, o hash SHA-256 a ser persistido no banco
 * e a data de expiração (5 minutos).
 */
const generateResetGrant = () => {
  const token = crypto.randomBytes(32).toString('hex'); // 64 hex chars = 256 bits
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expira = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
  return { token, hash, expira };
};

/**
 * Verifica se um Reset Grant corresponde ao hash armazenado e ainda é válido.
 */
const verifyResetGrant = (providedToken, storedHash, expira) => {
  if (!providedToken || !storedHash || !expira) return false;

  // Checagem de expiração temporal
  if (new Date() > new Date(expira)) return false;

  try {
    const computedHash = crypto.createHash('sha256').update(String(providedToken).trim()).digest('hex');
    const bufComputed = Buffer.from(computedHash, 'hex');
    const bufStored = Buffer.from(storedHash, 'hex');

    if (bufComputed.length !== bufStored.length) return false;
    return crypto.timingSafeEqual(bufComputed, bufStored);
  } catch (err) {
    return false;
  }
};

/**
 * Mascarar telefone para exibição segura sem expor dados pessoais (LGPD).
 */
const maskPhone = (tel) => {
  if (!tel) return '';
  const limpo = tel.replace(/\D/g, '');
  if (limpo.length >= 10) {
    const ddd = limpo.slice(0, 2);
    const digito = limpo.length === 11 ? limpo.charAt(2) : '';
    const ultimos = limpo.slice(-4);
    return `(${ddd}) ${digito ? digito + ' ' : ''}****-${ultimos}`;
  }
  return '****-' + limpo.slice(-4);
};

/**
 * Mascarar e-mail para exibição segura sem expor dados pessoais (LGPD).
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `*@${domain}`;
  return `${user.charAt(0)}****${user.charAt(user.length - 1)}@${domain}`;
};

module.exports = {
  generateOtp,
  computeOtpHmac,
  verifyOtpHmac,
  generateResetGrant,
  verifyResetGrant,
  maskPhone,
  maskEmail,
};

