/**
 * Utilitários de Máscaras, Formatação e Validação (Guicell Manager)
 */

/**
 * Remove todos os caracteres não numéricos.
 * Ex: "(62) 99999-9999" -> "62999999999"
 */
export function unmask(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\D/g, '');
}

/**
 * Formata telefone/celular:
 * 11 dígitos -> (XX) XXXXX-XXXX
 * 10 dígitos -> (XX) XXXX-XXXX
 */
export function formatPhone(value) {
  const clean = unmask(value);
  if (!clean) return '';
  
  if (clean.length > 10) {
    // 11 dígitos (ou truncated no máx 11)
    const limited = clean.slice(0, 11);
    return limited.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
                  .replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3')
                  .replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
  }
  
  // Até 10 dígitos
  return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
              .replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3')
              .replace(/^(\d{2})(\d{0,4})$/, '($1) $2');
}

/**
 * Formata CPF: XXX.XXX.XXX-XX (até 11 dígitos)
 */
export function formatCPF(value) {
  const clean = unmask(value).slice(0, 11);
  if (!clean) return '';
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
              .replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4')
              .replace(/^(\d{3})(\d{3})(\d{0,3})$/, '$1.$2.$3')
              .replace(/^(\d{3})(\d{0,3})$/, '$1.$2');
}

/**
 * Formata CNPJ: XX.XXX.XXX/XXXX-XX (até 14 dígitos)
 */
export function formatCNPJ(value) {
  const clean = unmask(value).slice(0, 14);
  if (!clean) return '';
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
              .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})$/, '$1.$2.$3/$4-$5')
              .replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/, '$1.$2.$3/$4')
              .replace(/^(\d{2})(\d{3})(\d{0,3})$/, '$1.$2.$3')
              .replace(/^(\d{2})(\d{0,3})$/, '$1.$2');
}

/**
 * Formata CPF (<= 11 dígitos) ou CNPJ (> 11 dígitos) dinamicamente
 */
export function formatCpfCnpj(value) {
  const clean = unmask(value);
  if (clean.length > 11) {
    return formatCNPJ(clean);
  }
  return formatCPF(clean);
}

/**
 * Formata CEP: XXXXX-XXX (até 8 dígitos)
 */
export function formatCEP(value) {
  const clean = unmask(value).slice(0, 8);
  if (!clean) return '';
  return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2')
              .replace(/^(\d{5})(\d{0,3})$/, '$1-$2');
}

/**
 * Validações de tamanho/dígitos mínimos
 */
export function validatePhone(value) {
  const clean = unmask(value);
  if (!clean) return true; // campo opcional ou tratado a parte
  return clean.length === 10 || clean.length === 11;
}

export function validateCpfCnpj(value) {
  const clean = unmask(value);
  if (!clean) return true;
  return clean.length === 11 || clean.length === 14;
}

export function validateCep(value) {
  const clean = unmask(value);
  if (!clean) return true;
  return clean.length === 8;
}
