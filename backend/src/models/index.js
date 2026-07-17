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

// Import all models
const Usuario = require('./Usuario')(sequelize, Sequelize.DataTypes);
const Cliente = require('./Cliente')(sequelize, Sequelize.DataTypes);
const Aparelho = require('./Aparelho')(sequelize, Sequelize.DataTypes);
const Categoria = require('./Categoria')(sequelize, Sequelize.DataTypes);
const Produto = require('./Produto')(sequelize, Sequelize.DataTypes);
const OrdemServico = require('./OrdemServico')(sequelize, Sequelize.DataTypes);
const ItemOS = require('./ItemOS')(sequelize, Sequelize.DataTypes);
const Venda = require('./Venda')(sequelize, Sequelize.DataTypes);
const ItemVenda = require('./ItemVenda')(sequelize, Sequelize.DataTypes);
const Caixa = require('./Caixa')(sequelize, Sequelize.DataTypes);

// Run associations
const models = {
  Usuario,
  Cliente,
  Aparelho,
  Categoria,
  Produto,
  OrdemServico,
  ItemOS,
  Venda,
  ItemVenda,
  Caixa,
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = { sequelize, Sequelize, ...models };
