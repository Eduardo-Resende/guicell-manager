'use strict';

const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// ─── Models ativos ────────────────────────────────────────────────────────────
const Usuario        = require('./Usuario')(sequelize, Sequelize.DataTypes);
const Cliente        = require('./Cliente')(sequelize, Sequelize.DataTypes);
const Aparelho       = require('./Aparelho')(sequelize, Sequelize.DataTypes);
const Categoria      = require('./Categoria')(sequelize, Sequelize.DataTypes);
const Produto        = require('./Produto')(sequelize, Sequelize.DataTypes);
const Caixa          = require('./Caixa')(sequelize, Sequelize.DataTypes);
const Marca          = require('./Marca')(sequelize, Sequelize.DataTypes);
const Modelo         = require('./Modelo')(sequelize, Sequelize.DataTypes);
const Fornecedor     = require('./Fornecedor')(sequelize, Sequelize.DataTypes);
const SessaoCaixa    = require('./SessaoCaixa')(sequelize, Sequelize.DataTypes);
const LogAuditoria   = require('./LogAuditoria')(sequelize, Sequelize.DataTypes);
const Movimentacao   = require('./Movimentacao')(sequelize, Sequelize.DataTypes);
const ItemMovimentacao = require('./ItemMovimentacao')(sequelize, Sequelize.DataTypes);

// ─── Mapa de models ───────────────────────────────────────────────────────────
const models = {
  Usuario,
  Cliente,
  Aparelho,
  Categoria,
  Produto,
  Caixa,
  Marca,
  Modelo,
  Fornecedor,
  SessaoCaixa,
  LogAuditoria,
  Movimentacao,
  ItemMovimentacao,
};

// Dispara as associações de cada model
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = { sequelize, Sequelize, ...models };
