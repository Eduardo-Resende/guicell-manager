const { OrdemServico, Cliente, Aparelho, Usuario, ItemOS, Produto, Caixa, sequelize } = require('../models');
const { Op } = require('sequelize');

// Gera número de OS sequencial: OS-YYYYMMDD-XXXX
const gerarNumeroOS = async () => {
  const hoje = new Date();
  const prefixo = `OS-${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}`;
  const count = await OrdemServico.count({
    where: { numero_os: { [Op.like]: `${prefixo}%` } },
  });
  return `${prefixo}-${String(count + 1).padStart(4, '0')}`;
};

const listar = async (req, res) => {
  try {
    const { status, id_tecnico, data_inicio, data_fim, busca } = req.query;
    const where = {};
    if (status) where.status = status;
    if (id_tecnico) where.id_tecnico = id_tecnico;
    if (data_inicio || data_fim) {
      where.data_abertura = {};
      if (data_inicio) where.data_abertura[Op.gte] = new Date(data_inicio);
      if (data_fim) where.data_abertura[Op.lte] = new Date(data_fim + 'T23:59:59');
    }
    if (busca) {
      where[Op.or] = [
        { numero_os: { [Op.like]: `%${busca}%` } },
        { defeito_relatado: { [Op.like]: `%${busca}%` } },
      ];
    }

    const ordens = await OrdemServico.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nome', 'telefone'] },
        { model: Aparelho, as: 'aparelho', attributes: ['id_aparelho', 'marca', 'modelo', 'imei'] },
        { model: Usuario, as: 'tecnico', attributes: ['id_usuario', 'nome'] },
        {
          model: ItemOS, as: 'itens',
          include: [{ model: Produto, as: 'produto', attributes: ['id_produto', 'descricao', 'valor_venda'] }]
        }
      ],
      order: [['data_abertura', 'DESC']],
    });
    return res.json(ordens);
  } catch (err) {
    console.error('[OS] Erro ao listar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const os = await OrdemServico.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Aparelho, as: 'aparelho' },
        { model: Usuario, as: 'tecnico', attributes: ['id_usuario', 'nome'] },
        {
          model: ItemOS, as: 'itens',
          include: [{ model: Produto, as: 'produto', attributes: ['id_produto', 'descricao', 'valor_venda'] }],
        },
      ],
    });
    if (!os) return res.status(404).json({ error: 'OS não encontrada.' });
    return res.json(os);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const criar = async (req, res) => {
  try {
    const { id_cliente, id_aparelho, id_tecnico, defeito_relatado, diagnostico, valor_orcado, prazo_estimado } = req.body;
    if (!id_cliente || !id_aparelho || !defeito_relatado) {
      return res.status(400).json({ error: 'Cliente, aparelho e defeito são obrigatórios.' });
    }
    const numero_os = await gerarNumeroOS();
    const os = await OrdemServico.create({
      numero_os, id_cliente, id_aparelho, id_tecnico,
      defeito_relatado, diagnostico, valor_orcado, prazo_estimado,
      status: 'Aguardando',
      data_abertura: new Date(),
    });
    return res.status(201).json(os);
  } catch (err) {
    console.error('[OS] Erro ao criar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const atualizarItensEstoque = async (osId, novosItens, transaction) => {
  // 1. Obter itens existentes no banco para esta OS
  const itensExistentes = await ItemOS.findAll({ where: { id_os: osId }, transaction });
  
  // Mapear quantidades existentes por id_produto
  const qtdExistenteMap = {};
  for (const item of itensExistentes) {
    qtdExistenteMap[item.id_produto] = (qtdExistenteMap[item.id_produto] || 0) + item.quantidade;
  }

  // Mapear quantidades novas por id_produto
  const qtdNovaMap = {};
  for (const item of novosItens) {
    qtdNovaMap[item.id_produto] = (qtdNovaMap[item.id_produto] || 0) + item.quantidade;
  }

  // Colecionar todos os ids de produtos envolvidos
  const todosProdutoIds = new Set([
    ...Object.keys(qtdExistenteMap).map(Number),
    ...Object.keys(qtdNovaMap).map(Number)
  ]);

  // 2. Verificar estoque e atualizar
  for (const prodId of todosProdutoIds) {
    const qtdAntiga = qtdExistenteMap[prodId] || 0;
    const qtdNova = qtdNovaMap[prodId] || 0;
    const diff = qtdNova - qtdAntiga; // positivo se adicionou, negativo se removeu

    if (diff !== 0) {
      const produto = await Produto.findByPk(prodId, { transaction });
      if (!produto) {
        throw new Error(`Produto #${prodId} não encontrado.`);
      }

      if (diff > 0 && produto.estoque_atual < diff) {
        throw new Error(`Estoque insuficiente para a peça: ${produto.descricao}`);
      }

      // Atualizar estoque
      await produto.update({ estoque_atual: produto.estoque_atual - diff }, { transaction });
    }
  }

  // 3. Deletar registros antigos de ItemOS
  await ItemOS.destroy({ where: { id_os: osId }, transaction });

  // 4. Criar novos registros de ItemOS
  if (novosItens && novosItens.length > 0) {
    for (const item of novosItens) {
      await ItemOS.create({
        id_os: osId,
        id_produto: item.id_produto,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario
      }, { transaction });
    }
  }
};

const atualizarStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { status, diagnostico, itens, valor_orcado } = req.body;
    const os = await OrdemServico.findByPk(req.params.id, { transaction: t });
    if (!os) {
      await t.rollback();
      return res.status(404).json({ error: 'OS não encontrada.' });
    }

    const statusValidos = ['Aguardando', 'Em Reparo', 'Aguardando Peça', 'Concluído', 'Entregue', 'Cancelado'];
    if (status && !statusValidos.includes(status)) {
      await t.rollback();
      return res.status(400).json({ error: 'Status inválido.' });
    }

    // Se a OS já está entregue ou cancelada, não deve permitir modificações normais
    if (os.status === 'Entregue' && status !== 'Entregue') {
      await t.rollback();
      return res.status(400).json({ error: 'Não é possível alterar uma OS já entregue.' });
    }

    // Atualizar itens e estoque se fornecidos
    if (itens !== undefined) {
      try {
        await atualizarItensEstoque(os.id_os, itens, t);
      } catch (error) {
        await t.rollback();
        return res.status(400).json({ error: error.message });
      }
    }

    // Montar payload de atualização com controle de data_fechamento
    const updatePayload = {};
    if (status) updatePayload.status = status;
    // Registrar data de conclusão quando reparo é finalizado (corrige contador do Dashboard)
    if (status === 'Concluído') updatePayload.data_fechamento = new Date();
    // Limpar data se OS voltou para andamento
    if (status && !['Concluído', 'Entregue'].includes(status)) updatePayload.data_fechamento = null;
    if (diagnostico !== undefined) updatePayload.diagnostico = diagnostico;
    if (valor_orcado !== undefined) updatePayload.valor_orcado = valor_orcado;

    await os.update(updatePayload, { transaction: t });

    await t.commit();

    const updatedOS = await OrdemServico.findByPk(os.id_os, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Aparelho, as: 'aparelho' },
        { model: Usuario, as: 'tecnico', attributes: ['id_usuario', 'nome'] },
        {
          model: ItemOS, as: 'itens',
          include: [{ model: Produto, as: 'produto', attributes: ['id_produto', 'descricao', 'valor_venda'] }],
        },
      ]
    });
    return res.json(updatedOS);
  } catch (err) {
    await t.rollback();
    console.error('[OS] Erro ao atualizar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const fechar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { valor_final, forma_pagamento, itens } = req.body;

    if (valor_final === undefined || !forma_pagamento) {
      await t.rollback();
      return res.status(400).json({ error: 'Valor final e forma de pagamento são obrigatórios.' });
    }

    const os = await OrdemServico.findByPk(req.params.id, { transaction: t });
    if (!os) { await t.rollback(); return res.status(404).json({ error: 'OS não encontrada.' }); }

    if (['Entregue', 'Cancelado'].includes(os.status)) {
      await t.rollback();
      return res.status(400).json({ error: 'OS já finalizada.' });
    }

    // Atualizar itens e debitar estoque
    if (itens !== undefined) {
      try {
        await atualizarItensEstoque(os.id_os, itens, t);
      } catch (error) {
        await t.rollback();
        return res.status(400).json({ error: error.message });
      }
    }

    // Fechar a OS
    await os.update({
      status: 'Entregue',
      valor_final,
      forma_pagamento,
      data_fechamento: new Date(),
    }, { transaction: t });

    // Lançar no caixa com proteção contra entradas duplicadas (RF14)
    const caixaExistente = await Caixa.findOne({ where: { id_os: os.id_os }, transaction: t });
    if (caixaExistente) {
      // Atualizar lançamento existente com o valor correto (evita duplicata)
      await caixaExistente.update({
        valor: valor_final,
        id_usuario: req.usuario.id_usuario,
      }, { transaction: t });
    } else {
      await Caixa.create({
        id_usuario: req.usuario.id_usuario,
        data: new Date(),
        tipo: 'entrada',
        valor: valor_final,
        descricao: `Fechamento da OS ${os.numero_os}`,
        categoria: 'OS',
        id_os: os.id_os,
      }, { transaction: t });
    }

    await t.commit();

    const updatedOS = await OrdemServico.findByPk(os.id_os, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Aparelho, as: 'aparelho' },
        { model: Usuario, as: 'tecnico', attributes: ['id_usuario', 'nome'] },
        {
          model: ItemOS, as: 'itens',
          include: [{ model: Produto, as: 'produto', attributes: ['id_produto', 'descricao', 'valor_venda'] }],
        },
      ],
    });
    return res.json({ message: 'OS fechada com sucesso.', os: updatedOS });
  } catch (err) {
    await t.rollback();
    console.error('[OS] Erro ao fechar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const dashboard = async (req, res) => {
  try {
    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia = new Date(new Date().setHours(23, 59, 59, 999));

    const [osAbertas, osConcluidas, prodEstoqueMinimo, statusCounts] = await Promise.all([
      OrdemServico.count({ where: { status: { [Op.in]: ['Aguardando', 'Em Reparo', 'Aguardando Peça'] } } }),
      OrdemServico.count({ where: { status: { [Op.in]: ['Concluído', 'Entregue'] }, data_fechamento: { [Op.between]: [inicioDia, fimDia] } } }),
      Produto.count({ where: { estoque_atual: { [Op.lte]: sequelize.col('estoque_minimo') } } }),
      OrdemServico.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id_os')), 'count']],
        group: ['status'],
        raw: true,
      })
    ]);

    const caixaHoje = await Caixa.findAll({
      where: { data: { [Op.between]: [inicioDia, fimDia] } },
      attributes: ['tipo', [sequelize.fn('SUM', sequelize.col('valor')), 'total']],
      group: ['tipo'],
      raw: true,
    });
    const entradas = caixaHoje.find(c => c.tipo === 'entrada')?.total || 0;
    const saidas = caixaHoje.find(c => c.tipo === 'saida')?.total || 0;
    const saldoDia = parseFloat(entradas) - parseFloat(saidas);

    const ultimasOS = await OrdemServico.findAll({
      limit: 5,
      order: [['data_abertura', 'DESC']],
      include: [
        { model: Cliente, as: 'cliente', attributes: ['nome'] },
        { model: Aparelho, as: 'aparelho', attributes: ['marca', 'modelo'] },
      ],
    });

    return res.json({ osAbertas, osConcluidas, saldoDia, prodEstoqueMinimo, ultimasOS, statusCounts });
  } catch (err) {
    console.error('[Dashboard] Erro:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizarStatus, fechar, dashboard };
