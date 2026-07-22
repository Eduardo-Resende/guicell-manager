'use strict';

const MARCAS_INICIAIS = [
  'Apple',
  'Samsung',
  'Motorola',
  'Xiaomi',
  'LG',
  'ASUS',
  'Google',
  'Huawei',
  'Nokia',
  'OnePlus',
  'OPPO',
  'Positivo',
  'Realme',
  'Sony',
  'Tecno',
  'ZTE',
];

const MODELOS_INICIAIS = {
  Apple: [
    'iPhone 5', 'iPhone 5C', 'iPhone 5S', 'iPhone SE (1ª geração)',
    'iPhone 6', 'iPhone 6 Plus', 'iPhone 6S', 'iPhone 6S Plus', 'iPhone 7', 'iPhone 7 Plus',
    'iPhone 8', 'iPhone 8 Plus', 'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone SE (2ª geração)',
    'iPhone 12', 'iPhone 12 Mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
    'iPhone 13', 'iPhone 13 Mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone SE (3ª geração)',
    'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
    'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
  ],
  Samsung: [
    'Galaxy J2 Prime', 'Galaxy J4', 'Galaxy J5 Prime', 'Galaxy J7 Prime', 'Galaxy J8',
    'Galaxy Gran Prime', 'Galaxy A01', 'Galaxy A02', 'Galaxy A03', 'Galaxy A03s',
    'Galaxy A04', 'Galaxy A04e', 'Galaxy A05', 'Galaxy A05s', 'Galaxy A10', 'Galaxy A10s',
    'Galaxy A11', 'Galaxy A12', 'Galaxy A13', 'Galaxy A14', 'Galaxy A14 5G', 'Galaxy A15', 'Galaxy A15 5G',
    'Galaxy A20', 'Galaxy A20s', 'Galaxy A21s', 'Galaxy A22', 'Galaxy A23', 'Galaxy A24', 'Galaxy A25 5G',
    'Galaxy A30', 'Galaxy A30s', 'Galaxy A31', 'Galaxy A32', 'Galaxy A33 5G', 'Galaxy A34 5G', 'Galaxy A35 5G',
    'Galaxy A50', 'Galaxy A51', 'Galaxy A52', 'Galaxy A52s 5G', 'Galaxy A53 5G', 'Galaxy A54 5G', 'Galaxy A55 5G',
    'Galaxy A70', 'Galaxy A71', 'Galaxy A72', 'Galaxy A73 5G',
    'Galaxy S10', 'Galaxy S20 FE', 'Galaxy S21', 'Galaxy S21 FE', 'Galaxy S22', 'Galaxy S22 Ultra',
    'Galaxy S23', 'Galaxy S23 FE', 'Galaxy S23 Ultra', 'Galaxy S24', 'Galaxy S24 Ultra',
    'Galaxy Note 10', 'Galaxy Note 20 Ultra', 'Galaxy Z Flip 4', 'Galaxy Z Flip 5', 'Galaxy Z Fold 5',
    'Galaxy M14', 'Galaxy M15 5G', 'Galaxy M34 5G', 'Galaxy M54 5G',
  ],
  Motorola: [
    'Moto E6 Play', 'Moto E6 Plus', 'Moto E7', 'Moto E7 Plus', 'Moto E13', 'Moto E20', 'Moto E22', 'Moto E32', 'Moto E40',
    'Moto G6', 'Moto G6 Play', 'Moto G7 Play', 'Moto G7 Power', 'Moto G8 Play', 'Moto G8 Power', 'Moto G9 Play', 'Moto G9 Power',
    'Moto G10', 'Moto G13', 'Moto G14', 'Moto G20', 'Moto G22', 'Moto G23', 'Moto G24', 'Moto G30', 'Moto G31', 'Moto G32',
    'Moto G34 5G', 'Moto G42', 'Moto G52', 'Moto G53 5G', 'Moto G54 5G', 'Moto G60', 'Moto G73 5G', 'Moto G84 5G', 'Moto G85 5G',
    'Moto Edge 20', 'Moto Edge 30 Neo', 'Moto Edge 40', 'Moto Edge 40 Neo', 'Moto Edge 50 Fusion', 'Moto Edge 50 Pro',
  ],
  Xiaomi: [
    'Redmi 9', 'Redmi 9A', 'Redmi 9C', 'Redmi 10', 'Redmi 10C', 'Redmi 12', 'Redmi 12C', 'Redmi 13', 'Redmi 13C',
    'Redmi Note 8', 'Redmi Note 9', 'Redmi Note 9S', 'Redmi Note 10', 'Redmi Note 10S', 'Redmi Note 10 Pro',
    'Redmi Note 11', 'Redmi Note 11S', 'Redmi Note 11 Pro', 'Redmi Note 12', 'Redmi Note 12S', 'Redmi Note 12 Pro 5G',
    'Redmi Note 13', 'Redmi Note 13 5G', 'Redmi Note 13 Pro 5G', 'Redmi Note 13 Pro+',
    'POCO X3 Pro', 'POCO X4 Pro 5G', 'POCO X5 Pro 5G', 'POCO X6 Pro 5G', 'POCO M3', 'POCO M4 Pro', 'POCO M6 Pro', 'POCO C65',
    'Xiaomi 11 Lite 5G NE', 'Xiaomi 12T', 'Xiaomi 13T', 'Xiaomi 14',
  ],
  LG: ['K10', 'K11+', 'K12+', 'K22', 'K41S', 'K50S', 'K51S', 'K61', 'K62', 'Velvet'],
  ASUS: ['Zenfone Max Pro M1', 'Zenfone Max Shot', 'Zenfone 5', 'Zenfone 8', 'Zenfone 9', 'Zenfone 10', 'ROG Phone 6'],
  Google: ['Pixel 4a', 'Pixel 6', 'Pixel 6a', 'Pixel 7', 'Pixel 7a', 'Pixel 8', 'Pixel 8a', 'Pixel 8 Pro', 'Pixel 9'],
  Nokia: ['Nokia 2.4', 'Nokia 5.4', 'Nokia C20', 'Nokia G11 Plus', 'Nokia G21'],
  Huawei: ['P30 Lite', 'P30 Pro', 'Nova 5T'],
  OnePlus: ['OnePlus 7 Pro', 'OnePlus 8T', 'OnePlus 9', 'OnePlus 11', 'OnePlus Nord CE 2'],
  OPPO: ['A17', 'A57', 'A78', 'Reno 7', 'Reno 10', 'Reno 11'],
  Positivo: ['Twist 4', 'Twist 4 Pro', 'Q20'],
  Realme: ['Realme 7 5G', 'Realme 8 5G', 'Realme 9', 'Realme 10', 'Realme 11 5G', 'Realme C33', 'Realme C53', 'Realme C55', 'Realme C67'],
  Sony: ['Xperia XA1', 'Xperia 1 V', 'Xperia 10'],
  Tecno: ['Spark 10 Pro', 'Spark 20', 'Camon 20', 'Pova 5'],
  ZTE: ['Blade A51', 'Blade A52', 'Blade V30'],
};

module.exports = {
  async up(queryInterface, Sequelize) {
    // Limpeza de tabelas parciais caso existam
    await queryInterface.dropTable('modelos').catch(() => {});
    await queryInterface.dropTable('marcas').catch(() => {});

    // 1. Tabela: marcas
    await queryInterface.createTable('marcas', {
      id_marca: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // 2. Tabela: modelos
    await queryInterface.createTable('modelos', {
      id_modelo: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_marca: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'marcas', key: 'id_marca' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nome: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    }, {
      uniqueKeys: {
        unique_marca_modelo: {
          fields: ['id_marca', 'nome'],
        },
      },
    });

    // 3. Seed Inicial de Marcas e Modelos
    const now = new Date();
    for (const nomeMarca of MARCAS_INICIAIS) {
      await queryInterface.bulkInsert(
        'marcas',
        [{ nome: nomeMarca, criado_em: now, atualizado_em: now }],
        { ignoreDuplicates: true }
      );

      const [rows] = await queryInterface.sequelize.query(
        `SELECT id_marca FROM marcas WHERE nome = '${nomeMarca.replace(/'/g, "''")}' LIMIT 1;`
      );

      if (rows && rows.length > 0) {
        const idMarca = rows[0].id_marca;
        const listaModelos = MODELOS_INICIAIS[nomeMarca] || [];
        if (listaModelos.length > 0) {
          const modelosData = listaModelos.map((m) => ({
            id_marca: idMarca,
            nome: m,
            criado_em: now,
            atualizado_em: now,
          }));
          await queryInterface.bulkInsert('modelos', modelosData, { ignoreDuplicates: true });
        }
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('modelos');
    await queryInterface.dropTable('marcas');
  },
};
