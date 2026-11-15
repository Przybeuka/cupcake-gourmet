-- =============================================================
-- Cupcake Gourmet — Projeto físico do banco de dados
-- SGBD: PostgreSQL 15+
-- =============================================================

CREATE TYPE perfil_usuario    AS ENUM ('CLIENTE', 'ADMIN');
CREATE TYPE modalidade_pedido AS ENUM ('DELIVERY', 'RETIRADA');
CREATE TYPE status_pedido     AS ENUM ('AGUARDANDO_PAGAMENTO', 'PAGO', 'EM_PREPARO',
                                       'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO');
CREATE TYPE metodo_pagamento  AS ENUM ('PIX', 'CARTAO');
CREATE TYPE status_pagamento  AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');

CREATE TABLE usuario (
    id               SERIAL       PRIMARY KEY,
    nome             VARCHAR(120) NOT NULL,
    email            VARCHAR(160) NOT NULL UNIQUE,                 -- RN01
    senha_hash       VARCHAR(255) NOT NULL,                        -- RN11
    perfil           perfil_usuario NOT NULL DEFAULT 'CLIENTE',
    tentativas_login SMALLINT     NOT NULL DEFAULT 0 CHECK (tentativas_login >= 0),
    bloqueado_ate    TIMESTAMP    NULL,                            -- RN03
    criado_em        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE categoria (
    id   SERIAL      PRIMARY KEY,
    nome VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE produto (
    id             SERIAL        PRIMARY KEY,
    nome           VARCHAR(100)  NOT NULL,
    descricao      TEXT          NOT NULL,
    ingredientes   TEXT          NOT NULL,
    alergenos      VARCHAR(255)  NULL,
    peso_gramas    INTEGER       NOT NULL CHECK (peso_gramas > 0),
    preco          NUMERIC(10,2) NOT NULL CHECK (preco > 0),
    estoque_diario INTEGER       NOT NULL DEFAULT 0 CHECK (estoque_diario >= 0),  -- RN07
    ativo          BOOLEAN       NOT NULL DEFAULT TRUE,                           -- RN04
    imagem_url     VARCHAR(500)  NULL,
    criado_em      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Relação N:N produto x categoria (RN05)
CREATE TABLE produto_categoria (
    produto_id   INTEGER NOT NULL REFERENCES produto(id)   ON DELETE CASCADE,
    categoria_id INTEGER NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    PRIMARY KEY (produto_id, categoria_id)
);

CREATE TABLE pedido (
    id            SERIAL        PRIMARY KEY,
    usuario_id    INTEGER       NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    status        status_pedido NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    modalidade    modalidade_pedido NOT NULL,
    subtotal      NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    taxa_entrega  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (taxa_entrega >= 0),     -- RN08
    total         NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    criado_em     TIMESTAMP     NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP     NOT NULL DEFAULT NOW(),
    CHECK (total = subtotal + taxa_entrega)
);

CREATE TABLE item_pedido (
    id             SERIAL        PRIMARY KEY,
    pedido_id      INTEGER       NOT NULL REFERENCES pedido(id)  ON DELETE CASCADE,
    produto_id     INTEGER       NOT NULL REFERENCES produto(id) ON DELETE RESTRICT,
    quantidade     INTEGER       NOT NULL CHECK (quantidade >= 1),               -- RN06
    preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario > 0),            -- RN10
    UNIQUE (pedido_id, produto_id)
);

-- 1:0..1 com pedido (só existe quando modalidade = DELIVERY)
CREATE TABLE endereco_entrega (
    pedido_id  INTEGER      PRIMARY KEY REFERENCES pedido(id) ON DELETE CASCADE,
    cep        CHAR(8)      NOT NULL CHECK (cep ~ '^[0-9]{8}$'),
    rua        VARCHAR(150) NOT NULL,
    numero     VARCHAR(10)  NOT NULL,
    bairro     VARCHAR(100) NOT NULL,
    cidade     VARCHAR(100) NOT NULL,
    referencia VARCHAR(150) NULL
);

CREATE TABLE pagamento (
    id        SERIAL           PRIMARY KEY,
    pedido_id INTEGER          NOT NULL UNIQUE REFERENCES pedido(id) ON DELETE CASCADE,
    metodo    metodo_pagamento NOT NULL,
    status    status_pagamento NOT NULL DEFAULT 'PENDENTE',
    valor     NUMERIC(10,2)    NOT NULL CHECK (valor > 0),
    pago_em   TIMESTAMP        NULL
);

-- Índices para as consultas mais frequentes
CREATE INDEX idx_produto_ativo   ON produto(ativo);
CREATE INDEX idx_pedido_usuario  ON pedido(usuario_id);
CREATE INDEX idx_pedido_status   ON pedido(status);   -- fila da cozinha (HU 14)

-- Dados iniciais
INSERT INTO categoria (nome) VALUES
    ('Tradicionais'), ('Veganos'), ('Zero Lactose'), ('Sem Glúten');
