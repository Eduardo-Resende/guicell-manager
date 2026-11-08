require('dotenv').config();

const baseConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || null,
  database: process.env.DB_NAME || 'guicell_manager',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  timezone: '-03:00',
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
  },
};

module.exports = {
  development: { ...baseConfig },
  test: { ...baseConfig },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    timezone: '-03:00',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  },
};
