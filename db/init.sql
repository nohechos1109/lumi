-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role          text NOT NULL CHECK (role IN ('sales','manager','admin')),
    username      text UNIQUE NOT NULL,
    password_hash text NOT NULL
);

-- CUSTOMERS
CREATE TABLE customers (
    id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name  text NOT NULL,
    email text,
    phone text
);

-- PAYMENT_TERMS
CREATE TABLE payment_terms (
    id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL
);

-- GLOBAL_SETTINGS (single row)
CREATE TABLE global_settings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fx_mxn_per_usd  numeric(14,6) NOT NULL CHECK (fx_mxn_per_usd > 0)
);

-- PRODUCTS
CREATE TABLE products (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sku              text UNIQUE,
    name             text NOT NULL,
    description      text,
    currency         char(3) CHECK (currency IN ('MXN','USD')),
    cost_base        numeric(14,4) NOT NULL CHECK (cost_base >= 0),
    utility_fixed    numeric(14,4) NOT NULL DEFAULT 0,
    utility_factor   numeric(14,6) NOT NULL DEFAULT 1 CHECK (utility_factor >= 0),
    codigo_sat       text,
    codigo_proveedor text
);

-- QUOTES
CREATE TABLE quotes (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    number                  text UNIQUE NOT NULL,
    state                   text NOT NULL CHECK (state IN ('draft','sent','confirmed','cancelled','expired')),
    customer_id             uuid NOT NULL REFERENCES customers(id),
    payment_term_id         uuid REFERENCES payment_terms(id),
    user_id                 uuid REFERENCES users(id),
    quotation_date          timestamptz NOT NULL,
    expiration_date         date,
    fx_mxn_per_usd_snapshot numeric(14,6) NOT NULL CHECK (fx_mxn_per_usd_snapshot > 0),
    renewed_from_id         uuid REFERENCES quotes(id),
    description             text,
    unit_count              int NOT NULL DEFAULT 1 CHECK (unit_count >= 1),
    terms                   text,
    amount_untaxed          numeric(14,2) NOT NULL DEFAULT 0,
    amount_tax              numeric(14,2) NOT NULL DEFAULT 0,
    amount_total            numeric(14,2) NOT NULL DEFAULT 0,
    margin_amount           numeric(14,2) NOT NULL DEFAULT 0,
    margin_percent          numeric(6,2)  NOT NULL DEFAULT 0,
    version                 int           NOT NULL DEFAULT 1,
    project_id              uuid REFERENCES projects(id)
);

-- PROJECTS
CREATE TABLE projects (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          text NOT NULL,
    customer_id   uuid NOT NULL REFERENCES customers(id),
    date          date NOT NULL DEFAULT CURRENT_DATE,
    status        text NOT NULL CHECK (status IN ('draft', 'process', 'approved', 'demo', 'follow_up', 'closed', 'deleted')),
    description   text,
    user_id       uuid REFERENCES users(id),
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- QUOTE_LINES
CREATE TABLE quote_lines (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id                 uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    sequence                 int  NOT NULL,
    display_type             text CHECK (display_type IN ('product','section','note','discount')),
    product_id               uuid REFERENCES products(id),
    name                     text NOT NULL,
    qty                      numeric(14,4),
    discount_percent         numeric(6,2)  NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    currency_snapshot        char(3),
    cost_base_snapshot       numeric(14,4) NOT NULL DEFAULT 0,
    utility_fixed_snapshot   numeric(14,4) NOT NULL DEFAULT 0,
    utility_factor_snapshot  numeric(14,6) NOT NULL DEFAULT 1,
    fx_snapshot              numeric(14,6) NOT NULL DEFAULT 1,
    unit_price_mxn_suggested numeric(14,4) NOT NULL DEFAULT 0,
    unit_price_mxn_manual    numeric(14,4),
    unit_price_mxn_effective numeric(14,4) NOT NULL DEFAULT 0,
    subtotal                 numeric(14,2) NOT NULL DEFAULT 0,
    tax_amount               numeric(14,2) NOT NULL DEFAULT 0,
    total                    numeric(14,2) NOT NULL DEFAULT 0,
    margin_amount            numeric(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_quote_lines_quote_id ON quote_lines(quote_id);

-- AUDIT_EVENTS
CREATE TABLE audit_events (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity     text,
    entity_id  uuid,
    type       text,
    payload    jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_entity    ON audit_events(entity);
CREATE INDEX idx_audit_entity_id ON audit_events(entity_id);
CREATE INDEX idx_audit_type      ON audit_events(type);

-- FILES
CREATE TABLE files (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity    text,
    entity_id uuid,
    provider  text NOT NULL,
    bucket    text NOT NULL,
    key       text UNIQUE NOT NULL,
    mime      text NOT NULL
);

CREATE INDEX idx_files_entity    ON files(entity);
CREATE INDEX idx_files_entity_id ON files(entity_id);

-- =============================================================
-- SEED DATA
-- =============================================================

INSERT INTO users (id, role, username, password_hash) VALUES
  ('00000000-0001-0000-0000-000000000001', 'admin', 'admin', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe'),
  ('00000000-0001-0000-0000-000000000002', 'manager', 'manager', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe'),
  ('00000000-0001-0000-0000-000000000003', 'sales', 'sales1', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe'),
  ('00000000-0001-0000-0000-000000000004', 'sales', 'sales2', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe');
-- Contraseña todos: demo1234

INSERT INTO customers (id, name) VALUES
  ('00000000-0002-0000-0000-000000000001', 'Constructora Vértice S.A. de C.V.'),
  ('00000000-0002-0000-0000-000000000002', 'Grupo Industrial Norteño'),
  ('00000000-0002-0000-0000-000000000003', 'TechSoluciones del Bajío'),
  ('00000000-0002-0000-0000-000000000004', 'Distribuidora Omega S.C.');

INSERT INTO payment_terms (id, name) VALUES
  ('00000000-0003-0000-0000-000000000001', 'Inmediato'),
  ('00000000-0003-0000-0000-000000000002', '15 días'),
  ('00000000-0003-0000-0000-000000000003', '30 días'),
  ('00000000-0003-0000-0000-000000000004', '50% anticipo / 50% entrega');

INSERT INTO global_settings (id, fx_mxn_per_usd) VALUES
  ('00000000-0004-0000-0000-000000000001', 17.850000);

-- Productos MXN
INSERT INTO products (id, sku, name, currency, cost_base, utility_fixed, utility_factor) VALUES
  ('00000000-0006-0000-0000-000000000001', 'MXN-001', 'Cable THW 12 AWG (rollo 100m)',    'MXN',  850.0000,    0.0000, 1.350000),
  ('00000000-0006-0000-0000-000000000002', 'MXN-002', 'Tablero eléctrico 12 circuitos',   'MXN', 1200.0000,  150.0000, 1.250000),
  ('00000000-0006-0000-0000-000000000003', 'MXN-003', 'Mano de obra instalación eléctrica','MXN',  600.0000,    0.0000, 1.400000),
  ('00000000-0006-0000-0000-000000000004', 'MXN-004', 'Conduit EMT 3/4" (tramo 3m)',      'MXN',   95.0000,    0.0000, 1.300000);

-- Productos USD
INSERT INTO products (id, sku, name, currency, cost_base, utility_fixed, utility_factor) VALUES
  ('00000000-0006-0000-0000-000000000005', 'USD-001', 'PLC Siemens S7-1200 CPU 1214C',    'USD',  320.0000,   50.0000, 1.200000),
  ('00000000-0006-0000-0000-000000000006', 'USD-002', 'Variador de frecuencia 5HP',        'USD',  210.0000,   30.0000, 1.180000),
  ('00000000-0006-0000-0000-000000000007', 'USD-003', 'HMI touchscreen 7"',               'USD',  175.0000,   25.0000, 1.200000),
  ('00000000-0006-0000-0000-000000000008', 'USD-004', 'Switch industrial 8 puertos',       'USD',   98.0000,   10.0000, 1.150000);

-- Quotes
INSERT INTO quotes (id, number, state, customer_id, payment_term_id, user_id, quotation_date, expiration_date, fx_mxn_per_usd_snapshot, description, unit_count, terms, amount_untaxed, amount_tax, amount_total, margin_amount, margin_percent, version) VALUES 
('00000000-0007-0000-0000-000000000001', 'COT-2026-001', 'draft', '00000000-0002-0000-0000-000000000001', NULL, '00000000-0001-0000-0000-000000000003', '2026-03-01 09:00:00-06', '2026-03-31', 17.850000, 'Instalación eléctrica nave industrial', 3, NULL, 5525.00, 884.00, 6409.00, 1775.00, 32.13, 1),
('00000000-0007-0000-0000-000000000002', 'COT-2026-002', 'sent', '00000000-0002-0000-0000-000000000002', '00000000-0003-0000-0000-000000000003', '00000000-0001-0000-0000-000000000003', '2026-03-10 10:30:00-06', '2026-04-09', 17.200000, 'Automatización línea de producción', 1, 'Precios sujetos al tipo de cambio indicado. Garantía de 12 meses en equipos.', 42680.00, 6828.80, 49508.80, 9560.00, 22.40, 1),
('00000000-0007-0000-0000-000000000003', 'COT-2026-003', 'confirmed', '00000000-0002-0000-0000-000000000003', '00000000-0003-0000-0000-000000000004', '00000000-0001-0000-0000-000000000003', '2026-02-15 08:00:00-06', '2026-03-17', 17.500000, 'Red industrial planta norte', 5, 'El tiempo de entrega es de 4 semanas a partir del anticipo.', 28900.00, 4624.00, 33524.00, 6300.00, 21.80, 2),
('00000000-0007-0000-0000-000000000004', 'COT-2026-004', 'cancelled', '00000000-0002-0000-0000-000000000004', '00000000-0003-0000-0000-000000000001', '00000000-0001-0000-0000-000000000004', '2026-01-20 11:00:00-06', '2026-02-19', 17.100000, 'Canalización eléctrica bodega', 2, NULL, 15200.00, 2432.00, 17632.00, 3040.00, 20.00, 1),
('00000000-0007-0000-0000-000000000005', 'COT-2026-005', 'expired', '00000000-0002-0000-0000-000000000001', '00000000-0003-0000-0000-000000000002', '00000000-0001-0000-0000-000000000003', '2026-01-05 09:00:00-06', '2026-01-20', 16.950000, 'Tableros y mano de obra', 1, NULL, 8750.00, 1400.00, 10150.00, 1925.00, 22.00, 1);

INSERT INTO quotes (id, number, state, customer_id, payment_term_id, user_id, quotation_date, expiration_date, fx_mxn_per_usd_snapshot, renewed_from_id, terms, amount_untaxed, amount_tax, amount_total, margin_amount, margin_percent, version) VALUES (
  '00000000-0007-0000-0000-000000000006', 'COT-2026-006', 'draft', '00000000-0002-0000-0000-000000000001', '00000000-0003-0000-0000-000000000002', '00000000-0001-0000-0000-000000000003', '2026-03-28 09:00:00-06', '2026-04-27', 17.850000, '00000000-0007-0000-0000-000000000005', NULL, 9200.00, 1472.00, 10672.00, 2024.00, 22.00, 1
);

-- Quote Lines 
INSERT INTO quote_lines (id, quote_id, sequence, display_type, product_id, name, qty, discount_percent, tax_id, currency_snapshot, cost_base_snapshot, utility_fixed_snapshot, utility_factor_snapshot, fx_snapshot, unit_price_mxn_suggested, unit_price_mxn_manual, unit_price_mxn_effective, subtotal, tax_amount, total, margin_amount) VALUES 
('00000000-0008-0001-0000-000000000001', '00000000-0007-0000-0000-000000000001', 10, 'section', NULL, 'Materiales eléctricos', NULL, 0, NULL, NULL, 0, 0, 1, 1, 0, NULL, 0, 0, 0, 0, 0),
('00000000-0008-0001-0000-000000000002', '00000000-0007-0000-0000-000000000001', 20, 'product', '00000000-0006-0000-0000-000000000001', 'Cable THW 12 AWG (rollo 100m)', 3, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 850.0000, 0.0000, 1.350000, 1.000000, 1147.5000, NULL, 1147.5000, 3442.50, 550.80, 3993.30, 892.50),
('00000000-0008-0001-0000-000000000003', '00000000-0007-0000-0000-000000000001', 30, 'product', '00000000-0006-0000-0000-000000000002', 'Tablero eléctrico 12 circuitos', 1, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 1200.0000, 150.0000, 1.250000, 1.000000, 1687.5000, NULL, 1687.5000, 1687.50, 270.00, 1957.50, 437.50),
('00000000-0008-0001-0000-000000000004', '00000000-0007-0000-0000-000000000001', 40, 'section', NULL, 'Mano de obra', NULL, 0, NULL, NULL, 0, 0, 1, 1, 0, NULL, 0, 0, 0, 0, 0),
('00000000-0008-0001-0000-000000000005', '00000000-0007-0000-0000-000000000001', 50, 'product', '00000000-0006-0000-0000-000000000003', 'Mano de obra instalación eléctrica', 2, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 600.0000, 0.0000, 1.400000, 1.000000, 840.0000, NULL, 840.0000, 1680.00, 268.80, 1948.80, 480.00),
('00000000-0008-0001-0000-000000000006', '00000000-0007-0000-0000-000000000001', 60, 'note', NULL, 'Los trabajos incluyen limpieza del área al finalizar la instalación.', NULL, 0, NULL, NULL, 0, 0, 1, 1, 0, NULL, 0, 0, 0, 0, 0),
('00000000-0008-0002-0000-000000000001', '00000000-0007-0000-0000-000000000002', 10, 'product', '00000000-0006-0000-0000-000000000005', 'PLC Siemens S7-1200 CPU 1214C', 2, 0, '00000000-0005-0000-0000-000000000001', 'USD', 320.0000, 50.0000, 1.200000, 17.200000, 7641.6000, NULL, 7641.6000, 15283.20, 2445.31, 17728.51, 1764.00),
('00000000-0008-0002-0000-000000000002', '00000000-0007-0000-0000-000000000002', 20, 'product', '00000000-0006-0000-0000-000000000006', 'Variador de frecuencia 5HP', 3, 0, '00000000-0005-0000-0000-000000000001', 'USD', 210.0000, 30.0000, 1.180000, 17.200000, 4871.0400, NULL, 4871.0400, 14613.12, 2338.10, 16951.22, 1966.80),
('00000000-0008-0002-0000-000000000003', '00000000-0007-0000-0000-000000000002', 30, 'discount', NULL, 'Descuento comercial por volumen (5%)', 1, 5, '00000000-0005-0000-0000-000000000001', NULL, 0, 0, 1, 1, 0, NULL, -1490.8200, -1490.82, -238.53, -1729.35, 0),
('00000000-0008-0002-0000-000000000004', '00000000-0007-0000-0000-000000000002', 40, 'product', '00000000-0006-0000-0000-000000000003', 'Mano de obra instalación y puesta en marcha', 5, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 600.0000, 0.0000, 1.400000, 1.000000, 840.0000, 900.0000, 900.0000, 4500.00, 720.00, 5220.00, 1500.00),
('00000000-0008-0003-0000-000000000001', '00000000-0007-0000-0000-000000000003', 10, 'product', '00000000-0006-0000-0000-000000000007', 'HMI touchscreen 7"', 4, 0, '00000000-0005-0000-0000-000000000001', 'USD', 175.0000, 25.0000, 1.200000, 17.500000, 4200.0000, NULL, 4200.0000, 16800.00, 2688.00, 19488.00, 2800.00),
('00000000-0008-0003-0000-000000000002', '00000000-0007-0000-0000-000000000003', 20, 'product', '00000000-0006-0000-0000-000000000008', 'Switch industrial 8 puertos', 4, 0, '00000000-0005-0000-0000-000000000001', 'USD', 98.0000, 10.0000, 1.150000, 17.500000, 1960.0000, NULL, 1960.0000, 7840.00, 1254.40, 9094.40, 630.00),
('00000000-0008-0003-0000-000000000003', '00000000-0007-0000-0000-000000000003', 30, 'product', '00000000-0006-0000-0000-000000000003', 'Mano de obra instalación y puesta en marcha', 3, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 600.0000, 0.0000, 1.400000, 1.000000, 840.0000, NULL, 840.0000, 2520.00, 403.20, 2923.20, 720.00),
('00000000-0008-0004-0000-000000000001', '00000000-0007-0000-0000-000000000004', 10, 'product', '00000000-0006-0000-0000-000000000004', 'Conduit EMT 3/4" (tramo 3m)', 80, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 95.0000, 0.0000, 1.300000, 1.000000, 123.5000, NULL, 123.5000, 9880.00, 1580.80, 11460.80, 2280.00),
('00000000-0008-0004-0000-000000000002', '00000000-0007-0000-0000-000000000004', 20, 'product', '00000000-0006-0000-0000-000000000001', 'Cable THW 12 AWG (rollo 100m)', 6, 10, '00000000-0005-0000-0000-000000000001', 'MXN', 850.0000, 0.0000, 1.350000, 1.000000, 1147.5000, NULL, 1147.5000, 6196.50, 991.44, 7187.94, 1777.50),
('00000000-0008-0005-0000-000000000001', '00000000-0007-0000-0000-000000000005', 10, 'product', '00000000-0006-0000-0000-000000000002', 'Tablero eléctrico 12 circuitos', 4, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 1200.0000, 150.0000, 1.250000, 1.000000, 1687.5000, NULL, 1687.5000, 6750.00, 1080.00, 7830.00, 1750.00),
('00000000-0008-0005-0000-000000000002', '00000000-0007-0000-0000-000000000005', 20, 'product', '00000000-0006-0000-0000-000000000003', 'Mano de obra instalación eléctrica', 3, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 600.0000, 0.0000, 1.400000, 1.000000, 840.0000, NULL, 840.0000, 2520.00, 403.20, 2923.20, 720.00),
('00000000-0008-0006-0000-000000000001', '00000000-0007-0000-0000-000000000006', 10, 'product', '00000000-0006-0000-0000-000000000002', 'Tablero eléctrico 12 circuitos', 4, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 1200.0000, 150.0000, 1.250000, 1.000000, 1687.5000, NULL, 1687.5000, 6750.00, 1080.00, 7830.00, 1750.00),
('00000000-0008-0006-0000-000000000002', '00000000-0007-0000-0000-000000000006', 20, 'product', '00000000-0006-0000-0000-000000000003', 'Mano de obra instalación eléctrica', 3, 0, '00000000-0005-0000-0000-000000000001', 'MXN', 600.0000, 0.0000, 1.400000, 1.000000, 840.0000, NULL, 840.0000, 2520.00, 403.20, 2923.20, 720.00);
