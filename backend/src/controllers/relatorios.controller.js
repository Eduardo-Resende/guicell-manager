const { OrdemServico, Venda, Caixa, Produto, Categoria, Cliente, ItemVenda, sequelize } = require('../models');
const { Op } = require('sequelize');

// Validação de período
const getPeriodo = (data_inicio, data_fim) => ({
  [Op.between]: [
    new Date(data_inicio || '2020-01-01'),
    new Date((data_fim || new Date().toISOString().split('T')[0]) + 'T23:59:59'),
  ],
});

// RF09: Relatório de OS por período, técnico e status
const relatorioOS = async (req, res) => {
  try {
    const { data_inicio, data_fim, status, id_tecnico } = req.query;
    const where = { data_abertura: getPeriodo(data_inicio, data_fim) };
    if (status) where.status = status;
    if (id_tecnico) where.id_tecnico = id_tecnico;

    const ordens = await OrdemServico.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['nome', 'telefone'] },
        { model: require('../models').Aparelho, as: 'aparelho', attributes: ['marca', 'modelo'] },
        { model: require('../models').Usuario, as: 'tecnico', attributes: ['nome'] },
        {
          model: require('../models').ItemOS, as: 'itens',
          attributes: ['quantidade', 'valor_unitario'],
        },
      ],
      order: [['data_abertura', 'ASC']],
    });

    // Para OSs entregues usa valor_final; para as demais, usa valor_orcado (mão de obra) + valor das peças
    const calcularValorOS = (os) => {
      if (os.status === 'Entregue' && os.valor_final != null) {
        return parseFloat(os.valor_final);
      }
      const pecas = (os.itens || []).reduce((s, it) => s + parseFloat(it.valor_unitario) * it.quantidade, 0);
      return parseFloat(os.valor_orcado || 0) + pecas;
    };

    const totais = {
      total: ordens.length,
      valor_total: ordens.reduce((sum, os) => sum + calcularValorOS(os), 0),
      por_status: {},
    };
    ordens.forEach(os => {
      totais.por_status[os.status] = (totais.por_status[os.status] || 0) + 1;
    });

    // Adiciona campo valor_calculado em cada OS para o frontend exibir corretamente
    const ordensComValor = ordens.map(os => ({
      ...os.toJSON(),
      valor_calculado: calcularValorOS(os),
    }));

    return res.json({ ordens: ordensComValor, totais });
  } catch (err) {
    console.error('[Relatórios] Erro OS:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// RF10: Relatório de vendas por período e produto
const relatorioVendas = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const vendas = await Venda.findAll({
      where: { data_venda: getPeriodo(data_inicio, data_fim) },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['nome'] },
        {
          model: ItemVenda, as: 'itens',
          include: [
            {
              model: Produto, as: 'produto',
              attributes: ['descricao'],
              include: [
                {
                  model: Categoria, as: 'categoriaRef',
                  attributes: ['nome'],
                  include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }]
                }
              ]
            }
          ],
        },
      ],
      order: [['data_venda', 'ASC']],
    });

    const totais = {
      total_vendas: vendas.length,
      valor_total: vendas.reduce((sum, v) => sum + parseFloat(v.valor_total), 0),
    };

    return res.json({ vendas, totais });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// RF11: Relatório de fluxo de caixa por período
const relatorioCaixa = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const movimentacoes = await Caixa.findAll({
      where: { data: getPeriodo(data_inicio, data_fim) },
      order: [['data', 'ASC']],
    });

    const totais = await Caixa.findAll({
      where: { data: getPeriodo(data_inicio, data_fim) },
      attributes: ['tipo', [sequelize.fn('SUM', sequelize.col('valor')), 'total']],
      group: ['tipo'],
      raw: true,
    });

    const entradas = parseFloat(totais.find(t => t.tipo === 'entrada')?.total || 0);
    const saidas = parseFloat(totais.find(t => t.tipo === 'saida')?.total || 0);

    return res.json({ movimentacoes, totais: { entradas, saidas, saldo: entradas - saidas } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// Relatório de estoque com alertas de mínimo
const relatorioEstoque = async (req, res) => {
  try {
    const produtos = await Produto.findAll({
      include: [
        {
          model: Categoria,
          as: 'categoriaRef',
          include: [{ model: Categoria, as: 'pai', attributes: ['nome'] }]
        }
      ],
      order: [['descricao', 'ASC']]
    });
    const emAlerta = produtos.filter(p => p.estoque_atual <= p.estoque_minimo).length;
    return res.json({ produtos, totais: { total: produtos.length, em_alerta: emAlerta } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { relatorioOS, relatorioVendas, relatorioCaixa, relatorioEstoque };
