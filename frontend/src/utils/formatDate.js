/**
 * Utilitário central de formatação de datas.
 *
 * Problema: O banco salva datas como ISO-8601 UTC (ex: "2026-09-25T12:00:00.000Z").
 * new Date(isoStr).toLocaleDateString() converte para o horário local e pode
 * retornar um dia anterior dependendo do fuso do usuário (ex: UTC-3 -> "2026-09-24").
 *
 * Solução: sempre extrair a parte "YYYY-MM-DD" antes de formatar, evitando qualquer
 * conversão de fuso.
 */

/**
 * Formata uma string de data ISO ou YYYY-MM-DD como "DD/MM/YYYY".
 * @param {string|null|undefined} dateStr
 * @returns {string}
 */
export function formatarData(dateStr) {
  if (!dateStr) return '—';
  try {
    const datePart = String(dateStr).split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [y, m, d] = datePart.split('-');
      return ${d}//;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('pt-BR');
  } catch {
    return String(dateStr);
  }
}

/**
 * Formata uma string de data ISO como "DD/MM/YYYY HH:mm" (data e hora locais).
 * @param {string|null|undefined} dateStr
 * @returns {string}
 */
export function formatarDataHora(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(dateStr);
  }
}
