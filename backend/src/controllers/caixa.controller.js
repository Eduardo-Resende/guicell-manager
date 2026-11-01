'use strict';

const { Op } = require('sequelize');
const {
  Caixa, CaixaPagamento, ContaFinanceira, FormaPagamento, SessaoCaixa, TransferenciaCaixa, Usuario,
} = require('../models');
const fin = require('../services/financeiro.service');

const { ErroNegocio, responderErro } = fin;

const perms = (req) => req.usuario?.permissoes || {};
const podeVerValores = (req) => !!(perms(req)['caixa.ver'] || perms(req)['dashboard.faturamento']);
const podeAutorizarExcecao = (req) => !!(req.body?.autorizar_saldo_negativo && perms(req)['caixa.aprovar']);

const inicioDoDia = (s) => new Date(s.includes('T') ? s : `${s}T00:00:00`);
const fimDoDia = (s) => new Date(s.includes('T') ? s : `${s}T23:59:59.999`);

// ─── Cadastros: formas de pagamento e contas ─────────────────────────────────
const formasPagamento = async (req, res) => {
  try {
    const cad = await fin.carregarCadastros();
    return res.json({
      formas: cad.formas.filter((f) => f.ativo).map((f) => ({
        codigo: f.codigo, nome: f.nome, conta_padrao: cad.contaPorId[f.id_conta].codigo, tipo_conta: cad.contaPorId[f.id_conta].tipo,
      })),
      contas: cad.contas.filter((c) => c.ativo).map((c) => ({ codigo: c.codigo, nome: c.nome, tipo: c.tipo })),
    });
  } catch (err) {
    return responderErro(res, err, 'Caixa/formas');
  }
};

// ─── Resumo: saldos agrupados/detalhados + situação da sessão ────────────────
const dadosSessao = (s) => ({
  id_sessao: s.id_sessao,
  data_abertura: s.data_abertura,
  valor_abertura: parseFloat(s.valor_abertura),
  valor_esperado_abertura: s.valor_esperado_abertura === null ? null : parseFloat(s.valor_esperado_abertura),
  diferenca_abertura: s.diferenca_abertura === null ? null : parseFloat(s.diferenca_abertura),
  abertura_inicial: !!s.abertura_inicial,
  operador: s.usuarioAbertura ? s.usuarioAbertura.nome : null,
});

const resumo = async (req, res) => {
  try {
    const sessao = await SessaoCaixa.findOne({
      where: { status: 'aberto' },
      include: [{ model: Usuario, as: 'usuarioAbertura', attributes: ['id_usuario', 'nome'] }],
    });
    const base = { caixaAberto: !!sessao, sessao: sessao ? dadosSessao(sessao) : null };

    if (!podeVerValores(req)) return res.json(base);

    const saldos = await fin.obterSaldos();
    const sessaoResumo = sessao ? await fin.resumoSessao(sessao) : null;
    const somaForma = (campo) => (sessaoResumo ? sessaoResumo.por_forma.reduce((acc, f) => acc + f[campo], 0) : 0);

    return res.json({
      ...base,
      saldos,
      sessao_resumo: sessaoResumo,
      // Campos mantidos por compatibilidade com a versão anterior da tela
      abertura: sessao ? parseFloat(sessao.valor_abertura) : 0,
      entradas: somaForma('entradas'),
      saidas: somaForma('saidas'),
      saldo: saldos.total,
    });
  } catch (err) {
    return responderErro(res, err, 'Caixa/resumo');
  }
};

// ─── Extrato ──────────────────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { data_inicio, data_fim, tipo, natureza, id_sessao, forma, conta, limite } = req.query;
    const where = {};

    where.natureza = natureza && natureza !== 'todas'
      ? natureza
      : { [Op.notIn]: ['abertura', 'fechamento'] }; // linhas técnicas do modelo antigo não poluem o extrato
    if (natureza === 'todas') delete where.natureza;
    if (tipo) where.tipo = tipo;

    if (id_sessao === 'atual') {
      const atual = await fin.sessaoAberta();
      if (!atual) return res.json([]);
      where.id_sessao = atual.id_sessao;
    } else if (id_sessao) {
      where.id_sessao = id_sessao;
    }

    if (data_inicio || data_fim) {
      where.data = {};
      if (data_inicio) where.data[Op.gte] = inicioDoDia(data_inicio);
      if (data_fim) where.data[Op.lte] = fimDoDia(data_fim);
    }

    if (forma || conta) {
      const filtroPerna = {};
      if (forma) {
        const f = await FormaPagamento.findOne({ where: { codigo: forma } });
        filtroPerna.id_forma = f ? f.id_forma : 0;
      }
      if (conta) {
        const c = await ContaFinanceira.findOne({ where: { codigo: conta } });
        filtroPerna.id_conta = c ? c.id_conta : 0;
      }
      const pernas = await CaixaPagamento.findAll({ where: filtroPerna, attributes: ['id_caixa'], group: ['id_caixa'], raw: true });
      where.id_caixa = pernas.map((p) => p.id_caixa);
    }

    const lancamentos = await Caixa.findAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nome'] },
        ...fin.INCLUDE_PERNAS,
        {
          model: TransferenciaCaixa, as: 'transferencia',
          include: [
            { model: ContaFinanceira, as: 'contaOrigem', attributes: ['nome'] },
            { model: ContaFinanceira, as: 'contaDestino', attributes: ['nome'] },
          ],
        },
      ],
      order: [['data', 'DESC'], ['id_caixa', 'DESC']],
      limit: Math.min(parseInt(limite, 10) || 500, 2000),
    });

    const estornados = await fin.marcarEstornados(lancamentos);
    return res.json(lancamentos.map((l) => fin.serializarLancamento(l, estornados)));
  } catch (err) {
    return responderErro(res, err, 'Caixa/listar');
  }
};

// ─── Sessões ──────────────────────────────────────────────────────────────────
const listarSessoes = async (req, res) => {
  try {
    const sessoes = await SessaoCaixa.findAll({
      include: [
        { model: Usuario, as: 'usuarioAbertura', attributes: ['id_usuario', 'nome'] },
        { model: Usuario, as: 'usuarioFechamento', attributes: ['id_usuario', 'nome'] },
        { model: Usuario, as: 'autorizadorAbertura', attributes: ['id_usuario', 'nome'] },
        { model: Usuario, as: 'autorizadorFechamento', attributes: ['id_usuario', 'nome'] },
      ],
      order: [['id_sessao', 'DESC']],
      limit: Math.min(parseInt(req.query.limite, 10) || 50, 200),
    });
    const num = (v) => (v === null || v === undefined ? null : parseFloat(v));
    return res.json(sessoes.map((s) => ({
      id_sessao: s.id_sessao,
      status: s.status,
      data_abertura: s.data_abertura,
      data_fechamento: s.data_fechamento,
      operador_abertura: s.usuarioAbertura?.nome || null,
      operador_fechamento: s.usuarioFechamento?.nome || null,
      valor_esperado_abertura: num(s.valor_esperado_abertura),
      valor_abertura: num(s.valor_abertura),
      diferenca_abertura: num(s.diferenca_abertura),
      justificativa_abertura: s.justificativa_abertura,
      autorizador_abertura: s.autorizadorAbertura?.nome || null,
      abertura_inicial: !!s.abertura_inicial,
      valor_sistema: num(s.valor_sistema),
      valor_contado: num(s.valor_contado),
      diferenca: num(s.diferenca),
      justificativa_fechamento: s.justificativa_fechamento,
      autorizador_fechamento: s.autorizadorFechamento?.nome || null,
    })));
  } catch (err) {
    return responderErro(res, err, 'Caixa/sessoes');
  }
};

const infoAbertura = async (req, res) => {
  try {
    return res.json(await fin.informacoesAbertura());
  } catch (err) {
    return responderErro(res, err, 'Caixa/abertura-info');
  }
};

const abrirCaixa = async (req, res) => {
  try {
    const { valor_contado, valor, justificativa, autorizador } = req.body;
    const sessao = await fin.comTransacao((transaction) => fin.abrirSessao({
      id_usuario: req.usuario.id_usuario,
      valor_contado: valor_contado ?? valor,
      justificativa,
      autorizador,
      permissoesOperador: perms(req),
      ip: req.ip,
      transaction,
    }));
    return res.status(201).json(sessao);
  } catch (err) {
    return responderErro(res, err, 'Caixa/abrir');
  }
};

/** Prévia da conferência do fechamento (não grava nada). */
const previaFechamento = async (req, res) => {
  try {
    const sessao = await fin.sessaoAberta();
    if (!sessao) return res.status(409).json({ error: 'Não há sessão de caixa aberta.', codigo: 'SEM_SESSAO' });
    const resumoSessao = await fin.resumoSessao(sessao);
    const saldos = await fin.obterSaldos();
    return res.json({
      sessao: dadosSessao(sessao),
      resumo: { ...resumoSessao, saldo_esperado: saldos.gaveta },
      limite_divergencia: fin.deCentavos(fin.limiteDivergenciaCentavos()),
    });
  } catch (err) {
    return responderErro(res, err, 'Caixa/previa-fechamento');
  }
};

const fecharCaixa = async (req, res) => {
  try {
    const { valor_contado, justificativa, autorizador, observacao } = req.body;
    const { sessao, resumo: resumoFechamento } = await fin.comTransacao((transaction) => fin.fecharSessao({
      id_usuario: req.usuario.id_usuario,
      valor_contado,
      justificativa,
      autorizador,
      observacao,
      permissoesOperador: perms(req),
      ip: req.ip,
      transaction,
    }));
    return res.status(201).json({ sessao, resumo: resumoFechamento });
  } catch (err) {
    return responderErro(res, err, 'Caixa/fechar');
  }
};

// ─── Lançamento manual (entrada ou saída, com uma ou mais formas) ────────────
const registrarManual = async (req, res) => {
  try {
    const { tipo, valor, descricao, categoria, favorecido, pagamentos, forma_pagamento, conta } = req.body;
    if (!['entrada', 'saida'].includes(tipo)) throw new ErroNegocio('Tipo deve ser "entrada" ou "saida".', 400);
    if (!descricao || !String(descricao).trim()) throw new ErroNegocio('Descrição é obrigatória.', 400);
    const totalCent = fin.paraCentavos(valor);
    if (!Number.isFinite(totalCent) || totalCent <= 0) throw new ErroNegocio('Informe um valor maior que zero.', 400);

    const lista = Array.isArray(pagamentos) && pagamentos.length > 0
      ? pagamentos
      : (forma_pagamento ? [{ forma: forma_pagamento, conta, valor }] : []);
    if (lista.length === 0) throw new ErroNegocio('Informe a forma de pagamento.', 400, 'PAGAMENTO_OBRIGATORIO');

    const resultado = await fin.comTransacao((transaction) => fin.registrarLancamento({
      tipo,
      descricao: String(descricao).trim(),
      categoria: categoria || null,
      origem: 'manual',
      favorecido: favorecido ? String(favorecido).trim() : null,
      id_usuario: req.usuario.id_usuario,
      pagamentos: lista,
      valorTotal: valor,
      exigirConta: tipo === 'saida', // saída: obrigatório informar de onde o valor sai
      permitirNegativo: tipo === 'saida' && podeAutorizarExcecao(req),
      ip: req.ip,
      transaction,
    }));

    const completo = await Caixa.findByPk(resultado.lancamento.id_caixa, {
      include: [{ model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nome'] }, ...fin.INCLUDE_PERNAS],
    });
    return res.status(201).json(fin.serializarLancamento(completo));
  } catch (err) {
    return responderErro(res, err, 'Caixa/manual');
  }
};

/** Estorno de lançamento manual: lançamento inverso com as mesmas formas e contas do original. */
const estornarManual = async (req, res) => {
  try {
    const motivo = String(req.body?.motivo || '').trim();
    if (motivo.length < 3) throw new ErroNegocio('O motivo do estorno é obrigatório.', 400, 'MOTIVO_OBRIGATORIO');

    const resultado = await fin.comTransacao(async (transaction) => {
      const original = await Caixa.findByPk(req.params.id, { include: fin.INCLUDE_PERNAS, transaction, lock: transaction.LOCK.UPDATE });
      if (!original) throw new ErroNegocio('Lançamento não encontrado.', 404);
      if (original.natureza !== 'operacional' || original.origem !== 'manual') {
        throw new ErroNegocio(
          'Apenas lançamentos manuais podem ser estornados aqui. Vendas, OS e compras devem ser canceladas no módulo de origem; transferências, pelo cancelamento de transferência.',
          400, 'ESTORNO_NAO_PERMITIDO'
        );
      }
      return fin.estornarLancamento(original, {
        id_usuario: req.usuario.id_usuario,
        descricao: `Estorno: ${original.descricao} — Motivo: ${motivo}`,
        permitirNegativo: podeAutorizarExcecao(req),
        ip: req.ip,
        transaction,
      });
    });
    return res.status(201).json({ id_caixa: resultado.lancamento.id_caixa });
  } catch (err) {
    return responderErro(res, err, 'Caixa/estornar');
  }
};

// ─── Transferências ───────────────────────────────────────────────────────────
const includeTransferencia = [
  { model: ContaFinanceira, as: 'contaOrigem', attributes: ['codigo', 'nome'] },
  { model: ContaFinanceira, as: 'contaDestino', attributes: ['codigo', 'nome'] },
  { model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nome'] },
  { model: Usuario, as: 'usuarioCancelamento', attributes: ['id_usuario', 'nome'] },
];

const serializarTransferencia = (t) => ({
  id_transferencia: t.id_transferencia,
  data_hora: t.data_hora,
  valor: parseFloat(t.valor),
  descricao: t.descricao,
  status: t.status,
  origem: t.contaOrigem ? { codigo: t.contaOrigem.codigo, nome: t.contaOrigem.nome } : null,
  destino: t.contaDestino ? { codigo: t.contaDestino.codigo, nome: t.contaDestino.nome } : null,
  usuario: t.usuario ? t.usuario.nome : null,
  id_sessao: t.id_sessao,
  id_transferencia_estornada: t.id_transferencia_estornada,
  motivo_cancelamento: t.motivo_cancelamento,
  usuario_cancelamento: t.usuarioCancelamento ? t.usuarioCancelamento.nome : null,
  data_cancelamento: t.data_cancelamento,
});

const listarTransferencias = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const where = {};
    if (data_inicio || data_fim) {
      where.data_hora = {};
      if (data_inicio) where.data_hora[Op.gte] = inicioDoDia(data_inicio);
      if (data_fim) where.data_hora[Op.lte] = fimDoDia(data_fim);
    }
    const lista = await TransferenciaCaixa.findAll({
      where, include: includeTransferencia, order: [['id_transferencia', 'DESC']],
      limit: Math.min(parseInt(req.query.limite, 10) || 200, 1000),
    });
    return res.json(lista.map(serializarTransferencia));
  } catch (err) {
    return responderErro(res, err, 'Caixa/transferencias');
  }
};

const buscarTransferencia = async (req, res) => {
  try {
    const t = await TransferenciaCaixa.findByPk(req.params.id, { include: includeTransferencia });
    if (!t) return res.status(404).json({ error: 'Transferência não encontrada.' });
    const lancamentos = await Caixa.findAll({
      where: { id_transferencia: t.id_transferencia },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nome'] }, ...fin.INCLUDE_PERNAS],
      order: [['id_caixa', 'ASC']],
    });
    const inversa = await TransferenciaCaixa.findOne({ where: { id_transferencia_estornada: t.id_transferencia }, include: includeTransferencia });
    return res.json({
      ...serializarTransferencia(t),
      lancamentos: lancamentos.map((l) => fin.serializarLancamento(l)),
      transferencia_inversa: inversa ? serializarTransferencia(inversa) : null,
    });
  } catch (err) {
    return responderErro(res, err, 'Caixa/transferencia');
  }
};

const criarTransferencia = async (req, res) => {
  try {
    const { conta_origem, conta_destino, valor, descricao, forma_origem, forma_destino } = req.body;
    const resultado = await fin.comTransacao((transaction) => fin.criarTransferencia({
      conta_origem, conta_destino, valor, descricao, forma_origem, forma_destino,
      id_usuario: req.usuario.id_usuario,
      permitirNegativo: podeAutorizarExcecao(req),
      ip: req.ip,
      transaction,
    }));
    const t = await TransferenciaCaixa.findByPk(resultado.transferencia.id_transferencia, { include: includeTransferencia });
    return res.status(201).json(serializarTransferencia(t));
  } catch (err) {
    return responderErro(res, err, 'Caixa/criar-transferencia');
  }
};

const cancelarTransferencia = async (req, res) => {
  try {
    const resultado = await fin.comTransacao((transaction) => fin.cancelarTransferencia({
      id_transferencia: req.params.id,
      motivo: req.body?.motivo,
      id_usuario: req.usuario.id_usuario,
      permitirNegativo: podeAutorizarExcecao(req),
      ip: req.ip,
      transaction,
    }));
    return res.json({
      cancelada: resultado.original.id_transferencia,
      transferencia_inversa: resultado.inversa.id_transferencia,
    });
  } catch (err) {
    return responderErro(res, err, 'Caixa/cancelar-transferencia');
  }
};

module.exports = {
  formasPagamento, resumo, listar, listarSessoes, infoAbertura, abrirCaixa, previaFechamento, fecharCaixa,
  registrarManual, estornarManual,
  listarTransferencias, buscarTransferencia, criarTransferencia, cancelarTransferencia,
  // mantido: nome antigo usado pela rota /resumo-dia
  resumoDia: resumo,
};
