'use strict';

/**
 * Serviço de Política de Senhas em conformidade com NIST SP 800-63B-4 e OWASP
 * - Mínimo de 15 caracteres para novas senhas (contados em code points Unicode)
 * - Máximo de 64 caracteres
 * - Limite estrito de 72 bytes codificados em UTF-8 (prevenção explícita contra truncamento silencioso do Bcrypt)
 * - Normalização Unicode consistente (NFKC)
 * - Aceita caracteres Unicode, espaços e frases-senha (passphrases)
 * - Não realiza trim() ou alteração silenciosa
 * - Bloqueio de senhas comuns/óbvias
 */

const COMMON_PASSWORDS = new Set([
  '123456789012345',
  '1234567890123456',
  'password1234567',
  'password12345678',
  'administrador123',
  'administrador1234',
  'administrador12345',
  'guicellmanager123',
  'guicellmanager1234',
  'senha12345678901',
  'qwertyuiop12345',
  'trocarsenhadepois',
  'mudarminhasenha1',
]);

const normalizePassword = (senha) => {
  if (typeof senha !== 'string') return '';
  return senha.normalize('NFKC');
};

const validatePasswordPolicy = (senha) => {
  if (typeof senha !== 'string') {
    return {
      valida: false,
      mensagem: 'A senha informada deve ser uma cadeia de caracteres válida.',
    };
  }

  // Normalização consistente de Unicode (NFKC)
  const normalizada = senha.normalize('NFKC');

  // Comprimento em code points Unicode reais (evita contagem errônea de pares substitutos em emojis)
  const codePoints = [...normalizada].length;

  if (codePoints < 15) {
    return {
      valida: false,
      mensagem: 'A nova senha deve possuir no mínimo 15 caracteres (recomenda-se o uso de uma frase-senha segura).',
    };
  }

  if (codePoints > 64) {
    return {
      valida: false,
      mensagem: 'A senha não pode exceder o limite de 64 caracteres.',
    };
  }

  // Limite estrito de 72 bytes UTF-8 para prevenir truncamento silencioso do algoritmo Bcrypt
  const byteLength = Buffer.byteLength(normalizada, 'utf8');
  if (byteLength > 72) {
    return {
      valida: false,
      mensagem: `A senha excede o limite seguro de 72 bytes UTF-8 suportado pela função de hash Bcrypt (tamanho: ${byteLength} bytes). Reduza caracteres multi-byte mantendo no mínimo 15 caracteres.`,
    };
  }

  // Checagem de lista de senhas fracas ou comuns
  const senhaMin = normalizada.toLowerCase();
  if (COMMON_PASSWORDS.has(senhaMin)) {
    return {
      valida: false,
      mensagem: 'A senha escolhida é excessivamente comum e fácil de adivinhar. Por favor, escolha uma senha mais complexa ou uma frase-senha.',
    };
  }

  // Bloqueio de sequências triviais repetidas (ex: 'aaaaaaaaaaaaaaa', '111111111111111')
  if (/^(.)\1+$/u.test(normalizada)) {
    return {
      valida: false,
      mensagem: 'A senha não pode ser composta apenas por repetição de um único caractere.',
    };
  }

  return { valida: true, normalizada };
};

module.exports = {
  validatePasswordPolicy,
  normalizePassword,
  COMMON_PASSWORDS,
};
