'use strict';

/**
 * Serviço financeiro do Caixa.
 *
 * Conceitos:
 *  - Lançamento (tabela `caixa`): uma operação (venda, compra, despesa, transferência, ajuste...).
 *  - Perna (tabela `caixa_pagamentos`): quanto entrou/saiu, em qual CONTA (gaveta, cofre, loja) e por qual FORMA.
 *    Uma despesa dividida é UM lançamento com várias pernas.
 *  - Todos os saldos são calculados somando as pernas. Nada é guardado como saldo "pronto".
 *  - Lançamentos e pernas são imutáveis: correção = estorno (inverso exato) ou ajuste identificado.
 *
 * Toda função que grava recebe `transaction` e NÃO faz commit/rollback: quem chama controla a atomicidade.
 * Valores são manipulados em centavos (inteiros) para evitar erros de ponto flutuante.
 */

const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');
const {
  sequelize, Caixa, CaixaPagamento, ContaFinanceira, FormaPagamento,
  SessaoCaixa, TransferenciaCaixa, LogAuditoria, Usuario,
} = require('../models');

// ─── Erros de negócio ─────────────────────────────────────────────────────────
class ErroNegocio extends Error {
  constructor(mensagem, status = 400, codigo = null, extra = {}) {
    super(mensagem);
    this.name = 'ErroNegocio';
    this.status = status;
    this.codigo = codigo;
    this.extra = extra;
  }
}

/** Responde erros de negócio com o status correto; qualquer outro erro vira 500 (logado). */
const responderErro = (res, err, contexto, mensagemPadrao = 'Erro interno.') => {
  if (err instanceof ErroNegocio) {
    return res.status(err.status).json({ error: err.message, codigo: err.codigo, ...err.extra });
  }
  console.error(`[${contexto}]`, err);
  return res.status(500).json({ error: mensagemPadrao });
};

// ─── Transação ────────────────────────────────────────────────────────────────
/** Executa `fn(transaction)`; commit se concluir, rollback em qualquer erro (que é relançado). */
const comTransacao = async (fn) => {
  const t = await sequelize.transaction();
  try {
    const resultado = await fn(t);
    await t.commit();
    return resultado;
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
};

// ─── Valores monetários (centavos) ────────────────────────────────────────────
const paraCentavos = (valor) => {
  if (valor === null || valor === undefined || valor === '') return NaN;
  const n = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};
const deCentavos = (c) => Math.round(c) / 100;
const formatarMoeda = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const centavosDoBanco = (v) => Math.round(parseFloat(v || 0) * 100);

const limiteDivergenciaCentavos = () => {
  const n = parseFloat(process.env.CAIXA_LIMITE_DIVERGENCIA ?? '10');
  return Math.round((Number.isFinite(n) ? n : 10) * 100);
};

// ─── Formas de pagamento ──────────────────────────────────────────────────────
const semAcento = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[\s_-]+/g, ' ');

/**
 * Converte o texto vindo das telas/APIs ("Dinheiro", "PIX", "Cartão de Débito", "cartao_credito"...)
 * no código interno. Retorna null quando não é possível identificar com segurança
 * (ex.: "Cartão" genérico não diz se é débito ou crédito).
 */
const normalizarFormaCodigo = (texto) => {
  if (texto === null || texto === undefined) return null;
  const s = semAcento(texto);
  if (s === 'dinheiro') return 'dinheiro';
  if (s === 'pix') return 'pix';
  if (['cartao de debito', 'cartao debito', 'debito'].includes(s)) return 'cartao_debito';
  if (['cartao de credito', 'cartao credito', 'credito'].includes(s)) return 'cartao_credito';
  return null;
};

const carregarCadastros = async (transaction) => {
  const [contas, formas] = await Promise.all([
    ContaFinanceira.findAll({ transaction, raw: true }),
    FormaPagamento.findAll({ transaction, raw: true, order: [['ordem', 'ASC']] }),
  ]);
  const cad = { contas, formas, contaPorCodigo: {}, contaPorId: {}, formaPorCodigo: {}, formaPorId: {} };
  contas.forEach((c) => { cad.contaPorCodigo[c.codigo] = c; cad.contaPorId[c.id_conta] = c; });
  formas.forEach((f) => { cad.formaPorCodigo[f.codigo] = f; cad.formaPorId[f.id_forma] = f; });
  return cad;
};

/**
 * Valida e normaliza uma lista de pagamentos [{ forma, valor, conta? }].
 *  - Associa automaticamente cada forma à conta padrão (Dinheiro→gaveta, PIX/cartões→loja);
 *  - Permite informar a conta explicitamente (ex.: dinheiro vindo do cofre), respeitando o tipo da forma
 *    (dinheiro só em contas físicas; formas eletrônicas só na conta da loja);
 *  - Agrupa pernas repetidas (mesma forma + conta).
 * Retorna [{ forma, conta, valorCent }] com os cadastros completos.
 */
const resolverPagamentos = (pagamentos, cad, { estorno = false, exigirConta = false } = {}) => {
  if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
    throw new ErroNegocio('Informe ao menos uma forma de pagamento.', 400, 'PAGAMENTO_OBRIGATORIO');
  }
  const mapa = new Map();
  for (const item of pagamentos) {
    const bruto = item.forma ?? item.forma_pagamento;
    const codigo = normalizarFormaCodigo(bruto) || (cad.formaPorCodigo[bruto] ? bruto : null);
    const forma = codigo ? cad.formaPorCodigo[codigo] : null;
    if (!forma) throw new ErroNegocio(`Forma de pagamento inválida ou não identificada: "${bruto ?? ''}".`, 400, 'FORMA_INVALIDA');
    if (!estorno && !forma.ativo) throw new ErroNegocio(`A forma de pagamento "${forma.nome}" está inativa.`, 400, 'FORMA_INATIVA');

    const valorCent = paraCentavos(item.valor);
    if (!Number.isFinite(valorCent) || valorCent <= 0) {
      throw new ErroNegocio(`Informe um valor maior que zero para a forma de pagamento "${forma.nome}".`, 400, 'VALOR_INVALIDO');
    }

    const contaPadrao = cad.contaPorId[forma.id_conta];
    if (exigirConta && !item.conta) {
      throw new ErroNegocio(`Informe de qual localização financeira sairá o valor pago em "${forma.nome}".`, 400, 'CONTA_OBRIGATORIA');
    }
    const conta = item.conta ? cad.contaPorCodigo[item.conta] : contaPadrao;
    if (!conta) throw new ErroNegocio(`Conta financeira inválida: "${item.conta}".`, 400, 'CONTA_INVALIDA');
    if (!estorno && !conta.ativo) throw new ErroNegocio(`A conta "${conta.nome}" está inativa.`, 400, 'CONTA_INATIVA');
    if (conta.tipo !== contaPadrao.tipo) {
      throw new ErroNegocio(`A forma "${forma.nome}" não pode ser movimentada na conta "${conta.nome}".`, 400, 'FORMA_CONTA_INCOMPATIVEL');
    }

    const chave = `${forma.id_forma}:${conta.id_conta}`;
    const atual = mapa.get(chave);
    if (atual) atual.valorCent += valorCent;
    else mapa.set(chave, { forma, conta, valorCent });
  }
  return [...mapa.values()];
};

const somaCentavos = (pernas) => pernas.reduce((acc, p) => acc + p.valorCent, 0);

/**
 * Pagamentos de uma operação (venda, OS, compra): aceita `pagamentos` (divididos) ou `forma_pagamento` (única).
 * Exige que a soma seja EXATAMENTE igual ao total. Retorna as pernas e o rótulo para Movimentacao.forma_pagamento.
 */
const pagamentosDaOperacao = ({ pagamentos, forma_pagamento, valorTotal }, cad, opcoes = {}) => {
  const totalCent = paraCentavos(valorTotal);
  const lista = Array.isArray(pagamentos) && pagamentos.length > 0
    ? pagamentos
    : [{ forma: forma_pagamento, valor: deCentavos(totalCent) }];
  const pernas = resolverPagamentos(lista, cad, opcoes);
  if (somaCentavos(pernas) !== totalCent) {
    throw new ErroNegocio(
      `A soma dos pagamentos (${formatarMoeda(somaCentavos(pernas))}) deve ser exatamente igual ao total (${formatarMoeda(totalCent)}).`,
      422, 'SOMA_DIVERGENTE'
    );
  }
  return { pernas, rotulo: rotuloFormas(pernas) };
};

const rotuloFormas = (pernas) => {
  const nomes = [...new Set(pernas.map((p) => p.forma.nome))];
  return nomes.length === 1 ? nomes[0] : 'Dividido';
};

/** Converte as pernas resolvidas de volta no formato aceito por registrarLancamento. */
const pernasParaPagamentos = (pernas) => pernas.map((p) => ({
  forma: p.forma.codigo, conta: p.conta.codigo, valor: deCentavos(p.valorCent),
}));

// ─── Saldos ───────────────────────────────────────────────────────────────────
const SQL_SALDO = "SUM(CASE WHEN p.tipo = 'entrada' THEN p.valor ELSE -p.valor END)";

/**
 * Saldos agrupados e detalhados, calculados somente a partir das pernas financeiras.
 *  - contas:  gaveta, cofre, loja
 *  - formas:  Dinheiro (= gaveta + cofre), PIX, Cartão de débito, Cartão de crédito
 *  - dinheiro_fisico = gaveta + cofre;  total = gaveta + cofre + loja
 * Os detalhes por forma são partes dos saldos agrupados e NÃO são somados de novo ao total.
 */
const obterSaldos = async (transaction = null) => {
  const [cad, linhas] = await Promise.all([
    carregarCadastros(transaction),
    sequelize.query(
      `SELECT c.codigo AS conta, f.codigo AS forma, ${SQL_SALDO} AS saldo
         FROM caixa_pagamentos p
         JOIN contas_financeiras c ON c.id_conta = p.id_conta
         JOIN formas_pagamento f ON f.id_forma = p.id_forma
        GROUP BY c.codigo, f.codigo`,
      { type: QueryTypes.SELECT, transaction }
    ),
  ]);

  const porConta = {};
  const porForma = {};
  linhas.forEach((l) => {
    const cent = centavosDoBanco(l.saldo);
    porConta[l.conta] = (porConta[l.conta] || 0) + cent;
    porForma[l.forma] = (porForma[l.forma] || 0) + cent;
  });

  const contas = cad.contas.map((c) => ({
    codigo: c.codigo, nome: c.nome, tipo: c.tipo, saldo: deCentavos(porConta[c.codigo] || 0),
  }));
  const formas = cad.formas.map((f) => ({
    codigo: f.codigo, nome: f.nome, conta_padrao: cad.contaPorId[f.id_conta].codigo, saldo: deCentavos(porForma[f.codigo] || 0),
  }));

  const gaveta = porConta.gaveta || 0;
  const cofre = porConta.cofre || 0;
  const loja = porConta.loja || 0;
  return {
    gaveta: deCentavos(gaveta),
    cofre: deCentavos(cofre),
    dinheiro_fisico: deCentavos(gaveta + cofre),
    loja: deCentavos(loja),
    total: deCentavos(gaveta + cofre + loja),
    contas,
    formas,
  };
};

/**
 * Saldo de uma conta com leitura travada (FOR UPDATE): serializa saídas/conferências concorrentes sobre
 * a mesma conta, impedindo que duas operações simultâneas gastem o mesmo dinheiro.
 */
const saldoContaTravado = async (idConta, transaction) => {
  const [linha] = await sequelize.query(
    `SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) AS saldo
       FROM caixa_pagamentos WHERE id_conta = :idConta FOR UPDATE`,
    { replacements: { idConta }, type: QueryTypes.SELECT, transaction }
  );
  return centavosDoBanco(linha.saldo);
};

const travarContas = async (idsConta, transaction) => {
  const ids = [...new Set(idsConta)].sort((a, b) => a - b);
  if (ids.length === 0) return;
  await ContaFinanceira.findAll({
    where: { id_conta: ids }, order: [['id_conta', 'ASC']], lock: transaction.LOCK.UPDATE, transaction,
  });
};

/** Garante que as saídas não excedam o saldo disponível de cada conta de origem. */
const validarSaldoSuficiente = async (saidasPorConta, cad, transaction) => {
  const ids = Object.keys(saidasPorConta).map(Number);
  await travarContas(ids, transaction);
  for (const id of ids.sort((a, b) => a - b)) {
    const saldo = await saldoContaTravado(id, transaction);
    const necessario = saidasPorConta[id];
    if (saldo < necessario) {
      const conta = cad.contaPorId[id];
      throw new ErroNegocio(
        `Saldo insuficiente em "${conta.nome}": disponível ${formatarMoeda(Math.max(saldo, 0))}, necessário ${formatarMoeda(necessario)}.`,
        422, 'SALDO_INSUFICIENTE',
        { conta: conta.codigo, disponivel: deCentavos(saldo), necessario: deCentavos(necessario) }
      );
    }
  }
};

// ─── Sessão de caixa ──────────────────────────────────────────────────────────
const sessaoAberta = (transaction = null, lock = false) => SessaoCaixa.findOne({
  where: { status: 'aberto' },
  transaction,
  ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
});

const exigirSessaoAberta = async (transaction = null, operacao = 'esta operação') => {
  const sessao = await sessaoAberta(transaction);
  if (!sessao) {
    throw new ErroNegocio(
      `O caixa está fechado. Abra uma sessão de caixa antes de realizar ${operacao}.`,
      409,
      'CAIXA_FECHADO'
    );
  }
  return sessao;
};

const registrarAuditoria = (dados, transaction) => LogAuditoria.create({
  id_usuario: dados.id_usuario,
  acao: dados.acao,
  entidade: dados.entidade,
  id_registro: dados.id_registro ?? null,
  dados_anteriores: dados.anteriores ?? null,
  dados_posteriores: dados.posteriores ?? null,
  ip_origem: dados.ip || null,
}, { transaction });

// ─── Lançamentos ──────────────────────────────────────────────────────────────
/**
 * Registra UM lançamento com uma ou mais pernas, de forma atômica (na transação recebida).
 *
 * Regras aplicadas:
 *  - soma das pernas == valorTotal (quando informado);
 *  - saída não pode exceder o saldo da conta de origem (salvo permitirNegativo, que o chamador só habilita
 *    para usuários com autorização);
 *  - movimentação em dinheiro na gaveta exige sessão de caixa aberta;
 *  - movimentação sem sessão (somente contas eletrônicas/cofre) é marcada `fora_sessao` e auditada.
 */
const registrarLancamento = async (opts) => {
  const {
    tipo, descricao, categoria = null, origem = null, favorecido = null,
    id_usuario, id_movimentacao = null, data = new Date(), pagamentos, valorTotal = null,
    natureza = 'operacional', id_lancamento_origem = null, id_transferencia = null,
    id_sessao_forcada = null, permitirNegativo = false, estorno = false, exigirConta = false,
    ignorarRegraSessao = false, ip = null, transaction,
  } = opts;

  if (!transaction) throw new Error('registrarLancamento exige uma transação.');
  if (!['entrada', 'saida'].includes(tipo)) throw new ErroNegocio('Tipo de lançamento inválido.', 400);

  const cad = opts.cadastros || await carregarCadastros(transaction);
  const pernas = resolverPagamentos(pagamentos, cad, { estorno, exigirConta });
  const totalCent = somaCentavos(pernas);

  if (valorTotal !== null && paraCentavos(valorTotal) !== totalCent) {
    throw new ErroNegocio(
      `A soma dos valores distribuídos (${formatarMoeda(totalCent)}) deve ser exatamente igual ao valor total (${formatarMoeda(paraCentavos(valorTotal))}).`,
      422, 'SOMA_DIVERGENTE'
    );
  }

  let sessao = id_sessao_forcada ? { id_sessao: id_sessao_forcada } : await sessaoAberta(transaction);
  let foraSessao = false;
  if (!sessao && !ignorarRegraSessao) {
    if (pernas.some((p) => p.conta.codigo === 'gaveta')) {
      throw new ErroNegocio(
        'O caixa está fechado. Abra uma sessão de caixa para movimentar dinheiro da gaveta.',
        409, 'CAIXA_FECHADO'
      );
    }
    foraSessao = true;
  }

  if (tipo === 'saida' && !permitirNegativo) {
    const saidas = {};
    pernas.forEach((p) => { saidas[p.conta.id_conta] = (saidas[p.conta.id_conta] || 0) + p.valorCent; });
    await validarSaldoSuficiente(saidas, cad, transaction);
  }

  const lancamento = await Caixa.create({
    id_usuario,
    data,
    tipo,
    valor: deCentavos(totalCent),
    descricao: String(descricao).slice(0, 200),
    categoria,
    natureza,
    origem,
    favorecido: favorecido ? String(favorecido).slice(0, 150) : null,
    fora_sessao: foraSessao,
    id_movimentacao,
    id_sessao: sessao ? sessao.id_sessao : null,
    id_transferencia,
    id_lancamento_origem,
  }, { transaction });

  const registros = await CaixaPagamento.bulkCreate(pernas.map((p) => ({
    id_caixa: lancamento.id_caixa,
    id_conta: p.conta.id_conta,
    id_forma: p.forma.id_forma,
    tipo,
    valor: deCentavos(p.valorCent),
    data,
    id_sessao: sessao ? sessao.id_sessao : null,
  })), { transaction });

  if (foraSessao) {
    await registrarAuditoria({
      id_usuario, acao: 'LANCAMENTO_FORA_SESSAO', entidade: 'caixa', id_registro: lancamento.id_caixa, ip,
      posteriores: {
        tipo, valor: deCentavos(totalCent), descricao: lancamento.descricao, origem,
        pagamentos: pernas.map((p) => ({ forma: p.forma.codigo, conta: p.conta.codigo, valor: deCentavos(p.valorCent) })),
        motivo: 'Movimentação eletrônica registrada sem sessão de caixa aberta.',
      },
    }, transaction);
  }

  return { lancamento, pernas: registros };
};

/** Carrega lançamentos com suas pernas (forma e conta) prontos para estorno/serialização. */
const INCLUDE_PERNAS = [{
  model: CaixaPagamento, as: 'pagamentos',
  include: [
    { model: FormaPagamento, as: 'forma', attributes: ['id_forma', 'codigo', 'nome'] },
    { model: ContaFinanceira, as: 'conta', attributes: ['id_conta', 'codigo', 'nome'] },
  ],
}];

/**
 * Estorno de UM lançamento: cria o lançamento inverso reutilizando exatamente as mesmas pernas
 * (mesmas formas, mesmas contas, mesmos valores). Os valores originais permanecem no histórico.
 */
const estornarLancamento = async (original, { id_usuario, descricao, permitirNegativo = false, ip = null, transaction, data = new Date() }) => {
  if (original.id_lancamento_origem) {
    throw new ErroNegocio('Um estorno não pode ser estornado.', 400, 'ESTORNO_DE_ESTORNO');
  }
  const jaEstornado = await Caixa.findOne({ where: { id_lancamento_origem: original.id_caixa }, transaction });
  if (jaEstornado) throw new ErroNegocio('Este lançamento já foi estornado.', 409, 'JA_ESTORNADO');

  const pagamentos = original.pagamentos.map((p) => ({
    forma: p.forma.codigo, conta: p.conta.codigo, valor: parseFloat(p.valor),
  }));
  return registrarLancamento({
    tipo: original.tipo === 'entrada' ? 'saida' : 'entrada',
    descricao,
    categoria: original.categoria,
    origem: original.origem,
    favorecido: original.favorecido,
    id_usuario,
    id_movimentacao: original.id_movimentacao,
    data,
    pagamentos,
    valorTotal: parseFloat(original.valor),
    natureza: original.natureza,
    id_lancamento_origem: original.id_caixa,
    estorno: true,
    permitirNegativo,
    ip,
    transaction,
  });
};

/**
 * Estorna todos os lançamentos operacionais vinculados a uma movimentação (venda/compra/OS) que ainda não
 * foram estornados. Preserva a divisão original entre formas de pagamento e contas.
 * Retorna a lista de estornos criados (vazia se a operação nunca gerou lançamento financeiro).
 */
const estornarPorMovimentacao = async (id_movimentacao, { id_usuario, descricao, permitirNegativo = false, ip = null, transaction }) => {
  const originais = await Caixa.findAll({
    where: { id_movimentacao, natureza: 'operacional', id_lancamento_origem: null },
    include: INCLUDE_PERNAS,
    order: [['id_caixa', 'ASC']],
    transaction,
  });
  const estornos = [];
  for (const original of originais) {
    const jaEstornado = await Caixa.findOne({ where: { id_lancamento_origem: original.id_caixa }, transaction });
    if (jaEstornado) continue;
    const { lancamento } = await estornarLancamento(original, { id_usuario, descricao, permitirNegativo, ip, transaction });
    estornos.push(lancamento);
  }
  return estornos;
};

// ─── Transferências ───────────────────────────────────────────────────────────
const formaDaConta = (conta, formaInformada, cad, estorno) => {
  if (conta.tipo === 'fisica') return cad.formaPorCodigo.dinheiro;
  const codigo = formaInformada ? (normalizarFormaCodigo(formaInformada) || formaInformada) : 'pix';
  const forma = cad.formaPorCodigo[codigo];
  if (!forma || cad.contaPorId[forma.id_conta].tipo !== 'eletronica') {
    throw new ErroNegocio(`Forma de pagamento inválida para a conta "${conta.nome}": "${formaInformada}".`, 400, 'FORMA_INVALIDA');
  }
  if (!estorno && !forma.ativo) throw new ErroNegocio(`A forma de pagamento "${forma.nome}" está inativa.`, 400, 'FORMA_INATIVA');
  return forma;
};

/**
 * Transfere valor entre contas (ex.: gaveta → cofre). Grava a saída na origem e a entrada no destino
 * com o mesmo id_transferencia. Não é receita nem despesa e não altera o saldo total da loja.
 */
const criarTransferencia = async (opts) => {
  const {
    conta_origem, conta_destino, valor, descricao = null, forma_origem = null, forma_destino = null,
    id_usuario, data = new Date(), permitirNegativo = false,
    id_transferencia_estornada = null, ip = null, transaction,
  } = opts;
  if (!transaction) throw new Error('criarTransferencia exige uma transação.');

  const cad = await carregarCadastros(transaction);
  const origem = cad.contaPorCodigo[conta_origem];
  const destino = cad.contaPorCodigo[conta_destino];
  const estorno = !!id_transferencia_estornada;
  if (!origem || !destino) throw new ErroNegocio('Informe a conta de origem e a conta de destino.', 400, 'CONTA_OBRIGATORIA');
  if (origem.id_conta === destino.id_conta) throw new ErroNegocio('Não é possível transferir entre a mesma conta.', 400, 'MESMA_CONTA');
  if (!estorno && (!origem.ativo || !destino.ativo)) throw new ErroNegocio('Conta financeira inativa.', 400, 'CONTA_INATIVA');

  const valorCent = paraCentavos(valor);
  if (!Number.isFinite(valorCent) || valorCent <= 0) throw new ErroNegocio('Informe um valor maior que zero.', 400, 'VALOR_INVALIDO');

  const formaOrigem = formaDaConta(origem, forma_origem, cad, estorno);
  const formaDestino = formaDaConta(destino, forma_destino, cad, estorno);

  const sessao = await sessaoAberta(transaction);
  if (!sessao && (origem.codigo === 'gaveta' || destino.codigo === 'gaveta')) {
    throw new ErroNegocio('O caixa está fechado. Abra uma sessão de caixa para transferir valores da/para a gaveta.', 409, 'CAIXA_FECHADO');
  }

  if (!permitirNegativo) {
    await validarSaldoSuficiente({ [origem.id_conta]: valorCent }, cad, transaction);
  }

  const transferencia = await TransferenciaCaixa.create({
    id_conta_origem: origem.id_conta,
    id_conta_destino: destino.id_conta,
    valor: deCentavos(valorCent),
    descricao: descricao ? String(descricao).slice(0, 200) : null,
    data_hora: data,
    id_usuario,
    id_sessao: sessao ? sessao.id_sessao : null,
    status: 'efetivada',
    id_transferencia_estornada,
  }, { transaction });

  const obs = descricao ? ` — ${descricao}` : '';
  const comum = {
    categoria: 'Transferência', origem: 'transferencia', id_usuario, data, natureza: 'transferencia',
    id_transferencia: transferencia.id_transferencia, id_sessao_forcada: sessao ? sessao.id_sessao : null,
    ignorarRegraSessao: true, permitirNegativo: true, estorno, ip, transaction, cadastros: cad,
  };
  const saida = await registrarLancamento({
    ...comum, tipo: 'saida', descricao: `Transferência #${transferencia.id_transferencia}: saída de ${origem.nome} para ${destino.nome}${obs}`,
    favorecido: destino.nome, pagamentos: [{ forma: formaOrigem.codigo, conta: origem.codigo, valor: deCentavos(valorCent) }],
  });
  const entrada = await registrarLancamento({
    ...comum, tipo: 'entrada', descricao: `Transferência #${transferencia.id_transferencia}: entrada em ${destino.nome} vinda de ${origem.nome}${obs}`,
    favorecido: origem.nome, pagamentos: [{ forma: formaDestino.codigo, conta: destino.codigo, valor: deCentavos(valorCent) }],
  });

  return { transferencia, lancamentos: [saida.lancamento, entrada.lancamento] };
};

/**
 * Cancela uma transferência efetivada gerando a transferência inversa (preserva o histórico original).
 * A original passa a "cancelada"; nenhum lançamento é apagado.
 */
const cancelarTransferencia = async ({ id_transferencia, motivo, id_usuario, permitirNegativo = false, ip = null, transaction }) => {
  const original = await TransferenciaCaixa.findByPk(id_transferencia, { transaction, lock: transaction.LOCK.UPDATE });
  if (!original) throw new ErroNegocio('Transferência não encontrada.', 404);
  if (original.status === 'cancelada') throw new ErroNegocio('Esta transferência já foi cancelada.', 409, 'JA_CANCELADA');
  if (original.id_transferencia_estornada) {
    throw new ErroNegocio('Esta é a transferência inversa gerada por um cancelamento e não pode ser cancelada.', 400, 'ESTORNO_DE_ESTORNO');
  }
  if (!motivo || String(motivo).trim().length < 3) throw new ErroNegocio('Informe o motivo do cancelamento.', 400, 'MOTIVO_OBRIGATORIO');

  const cad = await carregarCadastros(transaction);
  const lancamentos = await Caixa.findAll({ where: { id_transferencia: original.id_transferencia }, include: INCLUDE_PERNAS, transaction });
  const saidaOriginal = lancamentos.find((l) => l.tipo === 'saida');
  const entradaOriginal = lancamentos.find((l) => l.tipo === 'entrada');

  const resultado = await criarTransferencia({
    conta_origem: cad.contaPorId[original.id_conta_destino].codigo,
    conta_destino: cad.contaPorId[original.id_conta_origem].codigo,
    valor: parseFloat(original.valor),
    descricao: `Cancelamento da transferência #${original.id_transferencia} — ${String(motivo).trim()}`,
    forma_origem: entradaOriginal.pagamentos[0].forma.codigo,
    forma_destino: saidaOriginal.pagamentos[0].forma.codigo,
    id_usuario,
    permitirNegativo,
    id_transferencia_estornada: original.id_transferencia,
    ip,
    transaction,
  });

  await original.update({
    status: 'cancelada',
    motivo_cancelamento: String(motivo).trim(),
    id_usuario_cancelamento: id_usuario,
    data_cancelamento: new Date(),
  }, { transaction });

  await registrarAuditoria({
    id_usuario, acao: 'CANCELAR_TRANSFERENCIA', entidade: 'transferencias_caixa', id_registro: original.id_transferencia, ip,
    posteriores: { motivo: String(motivo).trim(), id_transferencia_inversa: resultado.transferencia.id_transferencia },
  }, transaction);

  return { original, inversa: resultado.transferencia, lancamentos: resultado.lancamentos };
};

// ─── Conferência (abertura/fechamento) ────────────────────────────────────────
const validarAutorizador = async (autorizador) => {
  if (!autorizador || !autorizador.login || !autorizador.senha) return null;
  const { resolverPermissoesUsuario } = require('../controllers/permissoes.controller');
  const usuario = await Usuario.findOne({ where: { login: autorizador.login, ativo: true } });
  const senhaOk = usuario ? await bcrypt.compare(String(autorizador.senha), usuario.senha_hash) : false;
  if (!usuario || !senhaOk) {
    throw new ErroNegocio('Credenciais do autorizador inválidas.', 403, 'AUTORIZACAO_INVALIDA');
  }
  const permissoes = await resolverPermissoesUsuario(usuario);
  if (!permissoes['caixa.aprovar']) {
    throw new ErroNegocio('O usuário informado não tem permissão para aprovar divergências de caixa.', 403, 'AUTORIZACAO_INVALIDA');
  }
  return usuario.id_usuario;
};

/**
 * Regras de divergência de conferência:
 *  - qualquer diferença exige justificativa;
 *  - acima do limite configurável (CAIXA_LIMITE_DIVERGENCIA, em R$), exige aprovação de quem tem
 *    `caixa.aprovar` — o próprio operador (se tiver a permissão) ou um gerente que informe login/senha.
 */
const avaliarDivergencia = async ({ diferencaCent, justificativa, autorizador, id_usuario, permissoesOperador }) => {
  if (diferencaCent === 0) return { justificativa: null, id_autorizador: null };

  const texto = String(justificativa || '').trim();
  if (texto.length < 5) {
    throw new ErroNegocio(
      'Há divergência entre o valor esperado e o valor contado: informe uma justificativa (mínimo de 5 caracteres).',
      422, 'JUSTIFICATIVA_OBRIGATORIA',
      { diferenca: deCentavos(diferencaCent) }
    );
  }

  const limite = limiteDivergenciaCentavos();
  let idAutorizador = null;
  if (Math.abs(diferencaCent) > limite) {
    if (permissoesOperador && permissoesOperador['caixa.aprovar']) {
      idAutorizador = id_usuario;
    } else {
      idAutorizador = await validarAutorizador(autorizador);
      if (!idAutorizador) {
        throw new ErroNegocio(
          `A diferença de ${formatarMoeda(Math.abs(diferencaCent))} excede o limite de ${formatarMoeda(limite)} e exige autorização de um gerente.`,
          403, 'AUTORIZACAO_NECESSARIA',
          { diferenca: deCentavos(diferencaCent), limite: deCentavos(limite) }
        );
      }
    }
  }
  return { justificativa: texto, id_autorizador: idAutorizador };
};

const lancarAjusteConferencia = ({ diferencaCent, fase, id_sessao, id_usuario, justificativa, ip, transaction, origem }) => {
  const falta = diferencaCent < 0;
  const rotulo = fase === 'abertura' ? 'na abertura' : 'no fechamento';
  return registrarLancamento({
    tipo: falta ? 'saida' : 'entrada',
    descricao: origem === 'implantacao'
      ? 'Saldo inicial da gaveta informado na primeira abertura'
      : `Ajuste de conferência ${rotulo}: ${falta ? 'falta' : 'sobra'} de ${formatarMoeda(Math.abs(diferencaCent))}${justificativa ? ` — ${justificativa}` : ''}`,
    categoria: 'Ajuste de Conferência',
    origem: origem || `conferencia_${fase}`,
    id_usuario,
    pagamentos: [{ forma: 'dinheiro', conta: 'gaveta', valor: deCentavos(Math.abs(diferencaCent)) }],
    natureza: 'ajuste_conferencia',
    id_sessao_forcada: id_sessao,
    ignorarRegraSessao: true,
    permitirNegativo: true,
    ip,
    transaction,
  });
};

const gavetaId = async (transaction) => {
  const conta = await ContaFinanceira.findOne({ where: { codigo: 'gaveta' }, transaction });
  if (!conta) throw new ErroNegocio('Conta "Caixa (gaveta)" não cadastrada.', 500);
  return conta.id_conta;
};

/** Dados para o modal de abertura: saldo esperado = dinheiro que ficou na gaveta no fechamento anterior. */
const informacoesAbertura = async () => {
  const idGaveta = await gavetaId(null);
  const [linha] = await sequelize.query(
    `SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) AS saldo
       FROM caixa_pagamentos WHERE id_conta = :idGaveta`,
    { replacements: { idGaveta }, type: QueryTypes.SELECT }
  );
  const totalSessoes = await SessaoCaixa.count();
  const ultima = await SessaoCaixa.findOne({
    where: { status: 'fechado' }, order: [['id_sessao', 'DESC']],
    include: [{ model: Usuario, as: 'usuarioFechamento', attributes: ['id_usuario', 'nome'] }],
  });
  return {
    saldo_esperado: deCentavos(centavosDoBanco(linha.saldo)),
    primeira_abertura: totalSessoes === 0,
    limite_divergencia: deCentavos(limiteDivergenciaCentavos()),
    ultima_sessao: ultima ? {
      id_sessao: ultima.id_sessao,
      data_fechamento: ultima.data_fechamento,
      valor_contado: ultima.valor_contado === null ? null : parseFloat(ultima.valor_contado),
      operador: ultima.usuarioFechamento ? ultima.usuarioFechamento.nome : null,
    } : null,
  };
};

const abrirSessao = async ({ id_usuario, valor_contado, justificativa, autorizador, permissoesOperador, ip = null, transaction }) => {
  const contadoCent = paraCentavos(valor_contado);
  if (!Number.isFinite(contadoCent) || contadoCent < 0) {
    throw new ErroNegocio('Informe o valor contado na gaveta (pode ser R$ 0,00).', 400, 'VALOR_INVALIDO');
  }

  if (await sessaoAberta(transaction, true)) {
    throw new ErroNegocio('Já existe uma sessão de caixa aberta. Feche-a antes de abrir outra.', 409, 'SESSAO_JA_ABERTA');
  }

  const idGaveta = await gavetaId(transaction);
  await travarContas([idGaveta], transaction);
  const saldoGaveta = await saldoContaTravado(idGaveta, transaction);
  const primeira = (await SessaoCaixa.count({ transaction })) === 0;

  // Na primeiríssima abertura não há "fechamento anterior": o valor contado é o saldo inicial.
  const esperadoCent = primeira ? contadoCent : saldoGaveta;
  const diferencaCent = contadoCent - esperadoCent;

  const { justificativa: textoJustificativa, id_autorizador } = await avaliarDivergencia({
    diferencaCent, justificativa, autorizador, id_usuario, permissoesOperador,
  });

  let sessao;
  try {
    sessao = await SessaoCaixa.create({
      id_usuario_abertura: id_usuario,
      data_abertura: new Date(),
      valor_abertura: deCentavos(contadoCent),
      valor_esperado_abertura: deCentavos(esperadoCent),
      diferenca_abertura: deCentavos(diferencaCent),
      justificativa_abertura: textoJustificativa,
      id_usuario_autorizador_abertura: id_autorizador,
      abertura_inicial: primeira,
      status: 'aberto',
      trava_aberta: 1,
    }, { transaction });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new ErroNegocio('Já existe uma sessão de caixa aberta. Feche-a antes de abrir outra.', 409, 'SESSAO_JA_ABERTA');
    }
    throw err;
  }

  // O ledger da gaveta passa a refletir exatamente o que foi contado.
  const ajusteCent = contadoCent - saldoGaveta;
  if (ajusteCent !== 0) {
    await lancarAjusteConferencia({
      diferencaCent: ajusteCent, fase: 'abertura', id_sessao: sessao.id_sessao, id_usuario,
      justificativa: textoJustificativa, ip, transaction, origem: primeira ? 'implantacao' : null,
    });
  }

  await registrarAuditoria({
    id_usuario, acao: 'ABRIR_CAIXA', entidade: 'sessoes_caixa', id_registro: sessao.id_sessao, ip,
    posteriores: {
      valor_esperado: deCentavos(esperadoCent), valor_contado: deCentavos(contadoCent), diferenca: deCentavos(diferencaCent),
      justificativa: textoJustificativa, id_autorizador, abertura_inicial: primeira,
    },
  }, transaction);

  return sessao;
};

/** Resumo da gaveta na sessão: base da conferência no fechamento. */
const resumoSessao = async (sessao, transaction = null) => {
  const [movimentos, formas] = await Promise.all([
    sequelize.query(
      `SELECT p.tipo AS tipo, c.natureza AS natureza, SUM(p.valor) AS total
         FROM caixa_pagamentos p
         JOIN caixa c ON c.id_caixa = p.id_caixa
         JOIN contas_financeiras ct ON ct.id_conta = p.id_conta
        WHERE p.id_sessao = :id AND ct.codigo = 'gaveta'
          AND (c.origem IS NULL OR c.origem NOT IN ('conferencia_abertura', 'conferencia_fechamento', 'implantacao'))
        GROUP BY p.tipo, c.natureza`,
      { replacements: { id: sessao.id_sessao }, type: QueryTypes.SELECT, transaction }
    ),
    sequelize.query(
      `SELECT f.codigo AS forma, f.nome AS nome, p.tipo AS tipo, SUM(p.valor) AS total
         FROM caixa_pagamentos p
         JOIN caixa c ON c.id_caixa = p.id_caixa
         JOIN formas_pagamento f ON f.id_forma = p.id_forma
        WHERE p.id_sessao = :id AND c.natureza = 'operacional'
        GROUP BY f.codigo, f.nome, p.tipo`,
      { replacements: { id: sessao.id_sessao }, type: QueryTypes.SELECT, transaction }
    ),
  ]);

  const soma = (tipo, natureza) => movimentos
    .filter((m) => m.tipo === tipo && m.natureza === natureza)
    .reduce((acc, m) => acc + centavosDoBanco(m.total), 0);

  const inicial = centavosDoBanco(sessao.valor_abertura);
  const entradas = soma('entrada', 'operacional');
  const saidas = soma('saida', 'operacional');
  const transfRecebidas = soma('entrada', 'transferencia');
  const transfEnviadas = soma('saida', 'transferencia');
  const calculado = inicial + entradas - saidas + transfRecebidas - transfEnviadas;

  const porForma = {};
  formas.forEach((f) => {
    porForma[f.forma] = porForma[f.forma] || { forma: f.forma, nome: f.nome, entradas: 0, saidas: 0 };
    porForma[f.forma][f.tipo === 'entrada' ? 'entradas' : 'saidas'] = parseFloat(f.total);
  });

  const [{ qtd }] = await sequelize.query(
    'SELECT COUNT(*) AS qtd FROM caixa WHERE id_sessao = :id AND natureza = \'operacional\'',
    { replacements: { id: sessao.id_sessao }, type: QueryTypes.SELECT, transaction }
  );

  return {
    saldo_inicial: deCentavos(inicial),
    entradas_dinheiro: deCentavos(entradas),
    saidas_dinheiro: deCentavos(saidas),
    transferencias_recebidas: deCentavos(transfRecebidas),
    transferencias_enviadas: deCentavos(transfEnviadas),
    saldo_esperado: deCentavos(calculado),
    por_forma: Object.values(porForma),
    quantidade_lancamentos: Number(qtd),
  };
};

const fecharSessao = async ({ id_usuario, valor_contado, justificativa, autorizador, observacao, permissoesOperador, ip = null, transaction }) => {
  const contadoCent = paraCentavos(valor_contado);
  if (!Number.isFinite(contadoCent) || contadoCent < 0) {
    throw new ErroNegocio('Informe o valor contado na gaveta (pode ser R$ 0,00).', 400, 'VALOR_INVALIDO');
  }

  const sessao = await sessaoAberta(transaction, true);
  if (!sessao) throw new ErroNegocio('Não há sessão de caixa aberta para fechar.', 409, 'SEM_SESSAO');

  const idGaveta = await gavetaId(transaction);
  await travarContas([idGaveta], transaction);
  const esperadoCent = await saldoContaTravado(idGaveta, transaction);
  const diferencaCent = contadoCent - esperadoCent;

  const { justificativa: textoJustificativa, id_autorizador } = await avaliarDivergencia({
    diferencaCent, justificativa, autorizador, id_usuario, permissoesOperador,
  });

  const resumo = await resumoSessao(sessao, transaction);

  // Nunca há saída técnica para "zerar" a gaveta: fechar encerra a sessão; só uma eventual divergência vira ajuste.
  if (diferencaCent !== 0) {
    await lancarAjusteConferencia({
      diferencaCent, fase: 'fechamento', id_sessao: sessao.id_sessao, id_usuario,
      justificativa: textoJustificativa, ip, transaction,
    });
  }

  await sessao.update({
    status: 'fechado',
    trava_aberta: null,
    data_fechamento: new Date(),
    valor_contado: deCentavos(contadoCent),
    valor_sistema: deCentavos(esperadoCent),
    diferenca: deCentavos(diferencaCent),
    id_usuario_fechamento: id_usuario,
    justificativa_fechamento: textoJustificativa,
    id_usuario_autorizador_fechamento: id_autorizador,
    observacao: observacao ? String(observacao).slice(0, 1000) : sessao.observacao,
  }, { transaction });

  await registrarAuditoria({
    id_usuario, acao: 'FECHAR_CAIXA', entidade: 'sessoes_caixa', id_registro: sessao.id_sessao, ip,
    posteriores: {
      valor_esperado: deCentavos(esperadoCent), valor_contado: deCentavos(contadoCent), diferenca: deCentavos(diferencaCent),
      justificativa: textoJustificativa, id_autorizador,
    },
  }, transaction);

  return { sessao, resumo: { ...resumo, saldo_esperado: deCentavos(esperadoCent) } };
};

// ─── Consultas ────────────────────────────────────────────────────────────────
const serializarLancamento = (l, estornados = new Set()) => {
  const json = typeof l.toJSON === 'function' ? l.toJSON() : l;
  return {
    id_caixa: json.id_caixa,
    data: json.data,
    tipo: json.tipo,
    valor: parseFloat(json.valor),
    descricao: json.descricao,
    categoria: json.categoria,
    natureza: json.natureza,
    origem: json.origem,
    favorecido: json.favorecido,
    fora_sessao: !!json.fora_sessao,
    id_sessao: json.id_sessao,
    id_movimentacao: json.id_movimentacao,
    id_transferencia: json.id_transferencia,
    id_lancamento_origem: json.id_lancamento_origem,
    estorno: !!json.id_lancamento_origem,
    estornado: estornados.has(json.id_caixa),
    usuario: json.usuario ? { id_usuario: json.usuario.id_usuario, nome: json.usuario.nome } : null,
    transferencia: json.transferencia ? {
      id_transferencia: json.transferencia.id_transferencia,
      status: json.transferencia.status,
      id_transferencia_estornada: json.transferencia.id_transferencia_estornada,
      origem: json.transferencia.contaOrigem ? json.transferencia.contaOrigem.nome : null,
      destino: json.transferencia.contaDestino ? json.transferencia.contaDestino.nome : null,
    } : null,
    pagamentos: (json.pagamentos || []).map((p) => ({
      forma: p.forma ? { codigo: p.forma.codigo, nome: p.forma.nome } : null,
      conta: p.conta ? { codigo: p.conta.codigo, nome: p.conta.nome } : null,
      tipo: p.tipo,
      valor: parseFloat(p.valor),
    })),
  };
};

const marcarEstornados = async (lancamentos, transaction = null) => {
  const ids = lancamentos.map((l) => l.id_caixa);
  if (ids.length === 0) return new Set();
  const estornos = await Caixa.findAll({ where: { id_lancamento_origem: ids }, attributes: ['id_lancamento_origem'], transaction });
  return new Set(estornos.map((e) => e.id_lancamento_origem));
};

/** Pagamentos efetivamente feitos/recebidos por movimentação (para telas de Compras etc.). */
const pagamentosPorMovimentacoes = async (idsMovimentacao) => {
  if (!idsMovimentacao.length) return {};
  const lancamentos = await Caixa.findAll({
    where: { id_movimentacao: idsMovimentacao, natureza: 'operacional', id_lancamento_origem: null },
    include: INCLUDE_PERNAS,
    order: [['id_caixa', 'ASC']],
  });
  const estornados = await marcarEstornados(lancamentos);
  const mapa = {};
  lancamentos.forEach((l) => {
    (mapa[l.id_movimentacao] = mapa[l.id_movimentacao] || []).push({
      id_caixa: l.id_caixa,
      data: l.data,
      tipo: l.tipo,
      estornado: estornados.has(l.id_caixa),
      pagamentos: l.pagamentos.map((p) => ({
        forma: p.forma.nome, forma_codigo: p.forma.codigo, conta: p.conta.nome, conta_codigo: p.conta.codigo, valor: parseFloat(p.valor),
      })),
    });
  });
  return mapa;
};

module.exports = {
  ErroNegocio, responderErro, comTransacao,
  paraCentavos, deCentavos, formatarMoeda,
  normalizarFormaCodigo, carregarCadastros, resolverPagamentos, pagamentosDaOperacao, rotuloFormas, somaCentavos, pernasParaPagamentos,
  obterSaldos, saldoContaTravado,
  sessaoAberta, exigirSessaoAberta, registrarAuditoria,
  registrarLancamento, estornarLancamento, estornarPorMovimentacao,
  criarTransferencia, cancelarTransferencia,
  informacoesAbertura, abrirSessao, fecharSessao, resumoSessao,
  serializarLancamento, marcarEstornados, pagamentosPorMovimentacoes,
  INCLUDE_PERNAS, limiteDivergenciaCentavos,
};
