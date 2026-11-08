-- =====================================================================================
-- BANCO DE DADOS: GUICELL MANAGER
-- =====================================================================================
-- Sistema de gestão para assistência técnica de celulares e loja de acessórios.
-- Gerencia: clientes, aparelhos, ordens de serviço, estoque, compras, vendas e fluxo de caixa.
--
-- IMPORTANTE: Este arquivo reflete fielmente a estrutura ativa completa do banco de dados MySQL 8.0,
-- consolidando todas as migrations executadas em backend/src/migrations/.
--
-- Principais Destaques Arquiteturais:
-- 1. Movimentações unificadas (OS, Vendas e Compras) centralizadas na tabela `movimentacao`.
-- 2. Controle financeiro por múltiplas contas financeiras físicas e eletrônicas (`contas_financeiras`),
--    com formas de pagamento parametrizadas (`formas_pagamento`), transferências auditadas
--    (`transferencias_caixa`) e pernas contábeis individuais (`caixa_pagamentos`).
-- 3. Imutabilidade financeira e integridade referencial com rastreabilidade completa (`logs_auditoria`).
-- 4. Controle dinâmico de permissões de acesso por perfil e por usuário (`permissoes`).
-- =====================================================================================

-- =====================================================================================
-- SEÇÃO 1 — CADASTROS BASE E OPERACIONAIS
-- =====================================================================================

-- 1. TABELA DE USUÁRIOS
-- Onde é utilizada: Login do sistema, autenticação JWT, vínculo com OS (técnico),
-- movimentações (atendente) e lançamentos de caixa. Os campos `email` e `telefone`
-- são usados para recuperação de senha (via WhatsApp/E-mail).
-- Controles de Segurança: Hardening com OTP numérico 8 dígitos (SHA-256), Reset Grant de 256 bits,
-- versionamento de sessão (versao_sessao) e proteção contra força bruta (login_tentativas/bloqueio).
CREATE TABLE usuarios (
    id_usuario                INT AUTO_INCREMENT PRIMARY KEY,
    nome                      VARCHAR(100)                           NOT NULL,
    login                     VARCHAR(50)                            NOT NULL UNIQUE,
    senha_hash                VARCHAR(255)                           NOT NULL,         -- Hash Bcrypt (custo 10, Unicode NFKC, max 72 bytes)
    perfil                    ENUM('Atendente', 'Técnico', 'Gerente') NOT NULL,       -- Cargo base
    ativo                     BOOLEAN                                NOT NULL DEFAULT TRUE,
    email                     VARCHAR(100)                           NULL,             -- Recuperação de senha via SMTP
    telefone                  VARCHAR(20)                            NULL,             -- WhatsApp para envio de código via Evolution API
    recuperacao_codigo        VARCHAR(128)                           NULL,             -- Hash HMAC/SHA-256 do código OTP de 8 dígitos
    recuperacao_expira        DATETIME                               NULL,             -- Expiração do código OTP (5 minutos)
    recuperacao_tentativas    INT                                    NOT NULL DEFAULT 0, -- Falhas consecutivas de OTP (máximo 5 tentativas)
    recuperacao_solicitado_em DATETIME                               NULL,             -- Timestamp do envio para controle de cooldown (60s)
    recuperacao_grant_hash    VARCHAR(64)                            NULL,             -- Hash SHA-256 do token Reset Grant (256 bits, etapa 3)
    recuperacao_grant_expira   DATETIME                               NULL,             -- Expiração do Reset Grant (5 minutos, uso único)
    versao_sessao             INT                                    NOT NULL DEFAULT 1, -- Versão da credencial para revogação instantânea de JWTs
    login_tentativas          INT                                    NOT NULL DEFAULT 0, -- Falhas consecutivas de login (proteção força bruta)
    login_bloqueado_ate       DATETIME                               NULL,             -- Bloqueio progressivo temporário de acesso
    criado_em                 DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em             DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE CLIENTES
-- Onde é utilizada: Cadastro de clientes, vínculo com aparelhos e movimentações
-- do tipo 'os' e 'venda'.
CREATE TABLE clientes (
    id_cliente    INT AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(100)  NOT NULL,
    cpf_cnpj      VARCHAR(18)   UNIQUE,                  -- Opcional, único quando informado
    telefone      VARCHAR(20)   NOT NULL,
    email         VARCHAR(100),
    endereco      VARCHAR(200),
    criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE MARCAS
-- Onde é utilizada: Catálogo de marcas de aparelhos alimentado incrementalmente
-- pelo serviço `phoneCatalog.service.js` (via API externa ou cadastro manual).
CREATE TABLE marcas (
    id_marca      INT AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(100)  NOT NULL UNIQUE,
    criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE MODELOS
-- Onde é utilizada: Catálogo de modelos vinculados a uma marca para autocompletar aparelhos.
CREATE TABLE modelos (
    id_modelo     INT AUTO_INCREMENT PRIMARY KEY,
    id_marca      INT           NOT NULL,
    nome          VARCHAR(150)  NOT NULL,
    criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_marca) REFERENCES marcas(id_marca) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 5. TABELA DE APARELHOS
-- Onde é utilizada: Aparelhos dos clientes para abertura de OS. IMEI aceita NULL.
-- Campo `ativo` permite inativar aparelhos sem perder o histórico.
CREATE TABLE aparelhos (
    id_aparelho   INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente    INT           NOT NULL,
    marca         VARCHAR(50)   NOT NULL,
    modelo        VARCHAR(100)  NOT NULL,
    imei          VARCHAR(20)   UNIQUE,                  -- NULL para aparelhos sem IMEI
    observacoes   TEXT,
    ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 6. TABELA DE CATEGORIAS (Produtos e Peças)
-- Onde é utilizada: Organização hierárquica do estoque. `id_pai` permite subcategorias.
-- `tipo_uso` filtra o que aparece no PDV (Venda), na OS (OS) ou em ambos.
CREATE TABLE categorias (
    id_categoria  INT AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(100)                   NOT NULL,
    id_pai        INT,                            -- FK para si mesma (subcategoria)
    tipo_uso      ENUM('Venda', 'OS', 'Ambos')   NOT NULL DEFAULT 'Ambos',
    criado_em     DATETIME                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pai) REFERENCES categorias(id_categoria) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 7. TABELA DE PRODUTOS
-- Onde é utilizada: Peças para OS e produtos para venda no PDV.
-- `estoque_atual` é debitado ou creditado em transações atômicas nas movimentações.
CREATE TABLE produtos (
    id_produto    INT AUTO_INCREMENT PRIMARY KEY,
    codigo_barras VARCHAR(50)   UNIQUE,           -- Suporte a leitor de código de barras
    descricao     VARCHAR(200)  NOT NULL,
    id_categoria  INT,
    estoque_atual INT           DEFAULT 0,
    estoque_minimo INT          DEFAULT 1,        -- Threshold para alertas de reposição
    valor_custo   DECIMAL(10,2),                  -- Custo de aquisição
    valor_venda   DECIMAL(10,2) NOT NULL,
    criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 8. TABELA DE FORNECEDORES
-- Onde é utilizada: Cadastro de parceiros/fornecedores para reposição de peças e mercadorias.
CREATE TABLE fornecedores (
    id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(150)  NOT NULL,
    cnpj          VARCHAR(18)   UNIQUE,
    telefone      VARCHAR(20),
    email         VARCHAR(100),
    endereco      VARCHAR(255),
    contato       VARCHAR(100),
    observacoes   TEXT,
    ativo         BOOLEAN        NOT NULL DEFAULT TRUE,
    criado_em     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================================
-- SEÇÃO 2 — MOVIMENTAÇÕES DE NEGÓCIO (OS, VENDAS E COMPRAS)
-- =====================================================================================

-- 9. TABELA DE MOVIMENTAÇÃO
-- Onde é utilizada: Tabela central polimórfica que unifica OS, Vendas e Compras.
CREATE TABLE movimentacao (
    id_movimentacao        INT AUTO_INCREMENT PRIMARY KEY,
    origem                 ENUM('os', 'venda', 'compra') NOT NULL,

    -- ── Campos em Comum ──────────────────────────────────────────────────────
    id_usuario             INT           NOT NULL,
    data_movimentacao      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_total            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status_pagamento       ENUM('pago', 'pendente', 'cancelado'),
    observacao             TEXT,
    motivo_cancelamento    TEXT,                       -- Justificativa ao cancelar
    criado_em              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- ── Específico: Vendas e OS ───────────────────────────────────────────────
    id_cliente             INT,
    forma_pagamento        VARCHAR(50),                -- Rótulo principal ou discriminado
    desconto               DECIMAL(10,2) DEFAULT 0.00,

    -- ── Específico: Compras ───────────────────────────────────────────────────
    id_fornecedor          INT,
    nome_fornecedor_avulso VARCHAR(150),
    valor_pago             DECIMAL(10,2),              -- Valor quitado (suporte a compras parciais/a prazo)

    -- ── Específico: OS ────────────────────────────────────────────────────────
    numero_os              VARCHAR(20)   UNIQUE,        -- Sequencial (ex: "001", "002"...)
    id_aparelho           INT,
    id_tecnico            INT,
    defeito_relatado      TEXT,
    diagnostico           TEXT,
    status_os             ENUM(
                            'Aguardando',
                            'Aguardando Diagnóstico',
                            'Aguardando Cliente',
                            'Em Reparo',
                            'Aguardando Peça',
                            'Concluído',
                            'Entregue',
                            'Cancelado'
                          ),
    valor_orcado          DECIMAL(10,2),
    data_fechamento       DATETIME,
    prazo_estimado        DATE,

    FOREIGN KEY (id_usuario)    REFERENCES usuarios(id_usuario)        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_cliente)    REFERENCES clientes(id_cliente)        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_aparelho)   REFERENCES aparelhos(id_aparelho)      ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_tecnico)    REFERENCES usuarios(id_usuario)        ON UPDATE CASCADE ON DELETE SET NULL
);

-- 10. TABELA DE ITENS DA MOVIMENTAÇÃO
-- Onde é utilizada: Discriminação dos produtos de cada movimentação (itens vendidos,
-- peças aplicadas na OS ou itens recebidos na nota de compra).
CREATE TABLE itens_movimentacao (
    id_item_movimentacao INT AUTO_INCREMENT PRIMARY KEY,
    id_movimentacao      INT           NOT NULL,
    id_produto           INT           NOT NULL,
    quantidade           INT           NOT NULL,
    valor_unitario       DECIMAL(10,2) NOT NULL,  -- Preço histórico imutável
    descricao_item       VARCHAR(200),             -- Opcional para nota de compras
    valor_venda_unitario DECIMAL(10,2),            -- Sugestão de venda na compra
    criado_em            DATETIME      DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_movimentacao) REFERENCES movimentacao(id_movimentacao) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_produto)      REFERENCES produtos(id_produto)          ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================================================================
-- SEÇÃO 3 — GESTÃO FINANCEIRA, CONTAS, FORMAS DE PAGAMENTO E TURNOS DE CAIXA
-- =====================================================================================

-- 11. TABELA DE CONTAS FINANCEIRAS
-- Onde é utilizada: Representa onde os recursos da loja estão custodiados.
-- Base para a segregação contábil física vs eletrônica.
CREATE TABLE contas_financeiras (
    id_conta INT AUTO_INCREMENT PRIMARY KEY,
    codigo   VARCHAR(20)                   NOT NULL UNIQUE, -- 'gaveta', 'cofre', 'loja'
    nome     VARCHAR(60)                   NOT NULL,        -- 'Caixa (gaveta)', 'Cofre', 'Conta da loja'
    tipo     ENUM('fisica', 'eletronica')  NOT NULL,        -- Classificação para conferência física
    ativo    BOOLEAN                       NOT NULL DEFAULT TRUE
);

-- 12. TABELA DE FORMAS DE PAGAMENTO
-- Onde é utilizada: Meios de pagamento aceitos pelo estabelecimento, vinculados
-- diretamente à conta financeira de custódia padrão.
CREATE TABLE formas_pagamento (
    id_forma INT AUTO_INCREMENT PRIMARY KEY,
    codigo   VARCHAR(30)  NOT NULL UNIQUE, -- 'dinheiro', 'pix', 'cartao_debito', 'cartao_credito'
    nome     VARCHAR(60)  NOT NULL,
    id_conta INT          NOT NULL,        -- Conta financeira de destino padrão
    ordem    INT          NOT NULL DEFAULT 0,
    ativo    BOOLEAN      NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_conta) REFERENCES contas_financeiras(id_conta) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 13. TABELA DE SESSÕES DE CAIXA (Turnos Operacionais)
-- Onde é utilizada: Controle formal de turnos de trabalho. Gerencia saldo inicial,
-- saldo esperado pelo sistema, conferência cega/assistida, divergências (sobras/faltas),
-- justificativa e aprovação gerencial.
CREATE TABLE sessoes_caixa (
    id_sessao                          INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_abertura                INT           NOT NULL,
    data_abertura                      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_abertura                     DECIMAL(10,2) NOT NULL,
    data_fechamento                    DATETIME,
    valor_contado                      DECIMAL(10,2),
    valor_sistema                      DECIMAL(10,2),
    diferenca                          DECIMAL(10,2),
    id_usuario_fechamento              INT,
    status                             ENUM('aberto', 'fechado') NOT NULL DEFAULT 'aberto',
    observacao                         TEXT,
    valor_esperado_abertura            DECIMAL(10,2),
    diferenca_abertura                 DECIMAL(10,2),
    justificativa_abertura             TEXT,
    id_usuario_autorizador_abertura    INT,
    justificativa_fechamento           TEXT,
    id_usuario_autorizador_fechamento  INT,
    abertura_inicial                   BOOLEAN       NOT NULL DEFAULT FALSE,
    trava_aberta                       BOOLEAN       NULL UNIQUE, -- Garante unicidade de sessão aberta

    FOREIGN KEY (id_usuario_abertura)               REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario_fechamento)             REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_usuario_autorizador_abertura)   REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_usuario_autorizador_fechamento) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 14. TABELA DE TRANSFERÊNCIAS DE CAIXA
-- Onde é utilizada: Movimentação interna entre contas da loja (sangria da gaveta para o cofre,
-- reposição de troco, etc.). Não altera o faturamento nem o patrimônio total da loja.
CREATE TABLE transferencias_caixa (
    id_transferencia           INT AUTO_INCREMENT PRIMARY KEY,
    id_conta_origem            INT           NOT NULL,
    id_conta_destino           INT           NOT NULL,
    valor                      DECIMAL(12,2) NOT NULL,
    descricao                  VARCHAR(200),
    data_hora                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario                 INT           NOT NULL,
    id_sessao                  INT,
    status                     ENUM('efetivada', 'cancelada') NOT NULL DEFAULT 'efetivada',
    id_transferencia_estornada INT,
    motivo_cancelamento        TEXT,
    id_usuario_cancelamento    INT,
    data_cancelamento          DATETIME,

    FOREIGN KEY (id_conta_origem)            REFERENCES contas_financeiras(id_conta)  ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_conta_destino)           REFERENCES contas_financeiras(id_conta)  ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario)                 REFERENCES usuarios(id_usuario)          ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_sessao)                  REFERENCES sessoes_caixa(id_sessao)      ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_transferencia_estornada) REFERENCES transferencias_caixa(id_transferencia) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario_cancelamento)    REFERENCES usuarios(id_usuario)          ON UPDATE CASCADE ON DELETE SET NULL
);

-- 15. TABELA DE CAIXA (Extrato Financeiro Principal)
-- Onde é utilizada: Registro histórico de todas as transações financeiras.
-- Cada lançamento é imutável: correções são feitas via contra-lançamento (estorno).
CREATE TABLE caixa (
    id_caixa             INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario           INT           NOT NULL,
    data                 DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo                 ENUM('entrada', 'saida') NOT NULL,
    valor                DECIMAL(10,2) NOT NULL,
    descricao            VARCHAR(200)  NOT NULL,
    categoria            VARCHAR(50),
    natureza             ENUM('operacional', 'transferencia', 'ajuste_conferencia', 'abertura', 'fechamento') NOT NULL DEFAULT 'operacional',
    origem               VARCHAR(30),  -- 'venda', 'compra', 'os', 'manual', 'transferencia', 'ajuste_conferencia', 'implantacao'
    favorecido           VARCHAR(150), -- Cliente, Fornecedor ou Favorecido
    fora_sessao          BOOLEAN       NOT NULL DEFAULT FALSE,
    id_movimentacao      INT,
    id_sessao            INT,
    id_transferencia     INT,
    id_lancamento_origem INT,          -- Preenchido se for estorno de outro lançamento

    FOREIGN KEY (id_usuario)           REFERENCES usuarios(id_usuario)             ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_movimentacao)      REFERENCES movimentacao(id_movimentacao)    ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_sessao)            REFERENCES sessoes_caixa(id_sessao)         ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_transferencia)     REFERENCES transferencias_caixa(id_transferencia) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_lancamento_origem) REFERENCES caixa(id_caixa)                  ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 16. TABELA DE CAIXA PAGAMENTOS (Pernas Financeiras / Multi-Pagamento)
-- Onde é utilizada: Permite pagamentos divididos entre várias formas e contas financeiras.
-- É a fonte canônica para o cálculo dos saldos individuais de cada conta.
CREATE TABLE caixa_pagamentos (
    id_caixa_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_caixa           INT           NOT NULL,
    id_conta           INT           NOT NULL,
    id_forma           INT           NOT NULL,
    tipo               ENUM('entrada', 'saida') NOT NULL,
    valor              DECIMAL(12,2) NOT NULL,
    data               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_sessao          INT,

    FOREIGN KEY (id_caixa)   REFERENCES caixa(id_caixa)              ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_conta)   REFERENCES contas_financeiras(id_conta) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_forma)   REFERENCES formas_pagamento(id_forma)   ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_sessao)  REFERENCES sessoes_caixa(id_sessao)     ON UPDATE CASCADE ON DELETE SET NULL
);

-- =====================================================================================
-- SEÇÃO 4 — SEGURANÇA, AUDITORIA E PERMISSÕES (RBAC)
-- =====================================================================================

-- 17. TABELA DE LOGS DE AUDITORIA
-- Onde é utilizada: Registra ações críticas (cancelamentos, fechamentos, ajustes de estoque,
-- exclusões) preservando o snapshot JSON do registro antes e depois da ação (RNF09).
CREATE TABLE logs_auditoria (
    id_log            INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario        INT          NOT NULL,
    acao              VARCHAR(50)  NOT NULL,          -- 'CRIAR', 'EDITAR', 'CANCELAR', 'FECHAR', 'EXCLUIR', 'AJUSTE_ESTOQUE'
    entidade          VARCHAR(50)  NOT NULL,          -- 'movimentacao', 'produtos', 'sessoes_caixa', etc.
    id_registro       INT,                            -- PK do registro afetado
    dados_anteriores  JSON,                           -- Estado ANTES da ação
    dados_posteriores JSON,                           -- Estado DEPOIS da ação
    data_hora         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origem         VARCHAR(45),                    -- IPv4 ou IPv6 da requisição
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 18. TABELA DE PERMISSÕES (Perfis de Acesso Unificado)
-- Onde é utilizada: Controle de permissões dinâmicas por Perfil de Acesso (Gerente,
-- Atendente, Técnico) ou com personalização individual por usuário (`id_usuario`).
CREATE TABLE permissoes (
    id_permissao  INT AUTO_INCREMENT PRIMARY KEY,
    perfil        ENUM('Gerente', 'Atendente', 'Técnico') NULL UNIQUE,
    id_usuario    INT                                     NULL UNIQUE,
    regras        JSON                                    NOT NULL, -- Mapa chave-valor booleano de permissões
    criado_em     DATETIME                                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME                                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
);
