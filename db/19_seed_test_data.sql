-- ============================================================
-- Lumi Test Data Seed
-- Generated: 2026-04-15
-- Module: full
-- ============================================================
-- IDs use prefix dddddddd- to identify test rows.
-- Safe to re-run: all INSERTs use ON CONFLICT DO NOTHING.
-- ============================================================

BEGIN;

-- ── CONTACTS ─────────────────────────────────────────────────
-- 3 companies + 2 persons

INSERT INTO contacts (id, type, name, email, phone, tax_id)
VALUES
  ('dddddddd-0001-0000-0000-000000000001', 'company', 'Transportes García S.A. de C.V.',        'contacto@transportesgarcia.com.mx', '+52 81 1234 5678', 'TGA900312AB1'),
  ('dddddddd-0001-0000-0000-000000000002', 'company', 'Grupo Seguridad Monterrey S.A. de C.V.', 'info@gsm-seguridad.mx',             '+52 81 9876 5432', 'GSM980601XY2'),
  ('dddddddd-0001-0000-0000-000000000003', 'company', 'Logística Del Norte S.A.',               'ventas@logisticanorte.mx',          '+52 81 5555 0001', 'LNO010215CD3')
ON CONFLICT DO NOTHING;

INSERT INTO contacts (id, type, name, first_name, email, phone, job_title)
VALUES
  ('dddddddd-0001-0000-0000-000000000004', 'person', 'Mendoza Reyes Juan Carlos',       'Juan Carlos',    'jcmendoza@transportesgarcia.com.mx', '+52 81 1234 5699', 'Gerente de Flotilla'),
  ('dddddddd-0001-0000-0000-000000000005', 'person', 'López Torres María Fernanda',     'María Fernanda', 'mflopez@gsm-seguridad.mx',           '+52 81 9876 5400', 'Directora de Operaciones')
ON CONFLICT DO NOTHING;

-- ── CONTACT COMPANY LINKS ─────────────────────────────────────

INSERT INTO contact_company_links (contact_id, company_id, role, is_primary)
VALUES
  ('dddddddd-0001-0000-0000-000000000004', 'dddddddd-0001-0000-0000-000000000001', 'Gerente de Flotilla',         true),
  ('dddddddd-0001-0000-0000-000000000005', 'dddddddd-0001-0000-0000-000000000002', 'Directora de Operaciones',    true)
ON CONFLICT (contact_id, company_id) DO NOTHING;

-- ── RUTAS ────────────────────────────────────────────────────

INSERT INTO rutas (id, name, cliente_id)
VALUES
  ('dddddddd-0002-0000-0000-000000000001', 'Ruta Norte MTY-SLP', 'dddddddd-0001-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ── UNIDADES ─────────────────────────────────────────────────

INSERT INTO unidades (id, name, ruta_id, empresa_id, dueno_id, dashcam, pantalla, impresora, reversa, reconocimiento_facial, fecha_instalacion, descripcion_instalacion)
VALUES
  ('dddddddd-0003-0000-0000-000000000001', 'EJC-101', 'dddddddd-0002-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'dashcam',  true,  false, true,  false, '2025-11-20', 'Instalación DVR-DASH + SD 128GB + cables'),
  ('dddddddd-0003-0000-0000-000000000002', 'EJC-102', 'dddddddd-0002-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'dashcam',  true,  false, true,  false, '2025-11-20', 'Instalación DVR-DASH + SD 128GB + cables'),
  ('dddddddd-0003-0000-0000-000000000003', 'EJC-103', 'dddddddd-0002-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'streamax', true,  true,  true,  false, '2025-11-21', 'Instalación sistema Streamax con pantalla e impresora')
ON CONFLICT DO NOTHING;

-- ── PROJECTS ─────────────────────────────────────────────────

INSERT INTO projects (id, name, customer_id, date, status, description, user_id, ruta_id)
VALUES
  ('dddddddd-0004-0000-0000-000000000001',
   'Instalación Flota Transportes García',
   'dddddddd-0001-0000-0000-000000000001',
   '2025-11-01', 'active',
   'Sistema de videovigilancia vehicular para flotilla de 3 unidades ruta MTY-SLP',
   (SELECT id FROM users WHERE username = 'sales1' LIMIT 1),
   'dddddddd-0002-0000-0000-000000000001'),
  ('dddddddd-0004-0000-0000-000000000002',
   'Sistema Monitoreo Grupo Seguridad MTY',
   'dddddddd-0001-0000-0000-000000000002',
   '2025-12-01', 'active',
   'Implementación de grabadores M1N con hospedaje en plataforma para 4 unidades',
   (SELECT id FROM users WHERE username = 'sales2' LIMIT 1),
   NULL)
ON CONFLICT DO NOTHING;

-- ── QUOTES ───────────────────────────────────────────────────
-- COT-1001: confirmed  (3 units, Transportes García)
-- COT-1002: confirmed  (4 units, Grupo Seguridad)
-- COT-1003: draft      (2 units, Logística Del Norte)
--
-- Amounts pre-calculated:
--   COT-1001: untaxed=26482.92, tax=4237.26, total=30720.18
--   COT-1002: untaxed=40709.84, tax=6513.57, total=47223.41
--   COT-1003: untaxed=13845.32, tax=2215.26, total=16060.58

INSERT INTO quotes (
  id, number, state, customer_id, payment_term_id, user_id,
  quotation_date, expiration_date, fx_mxn_per_usd_snapshot,
  description, unit_count,
  amount_untaxed, amount_tax, amount_total,
  margin_amount, margin_percent, version, project_id
)
VALUES
  ('dddddddd-0005-0000-0000-000000000001',
   'COT-1001', 'confirmed',
   'dddddddd-0001-0000-0000-000000000001',
   (SELECT id FROM payment_terms WHERE name = '50% anticipo / 50% entrega' LIMIT 1),
   (SELECT id FROM users WHERE username = 'sales1' LIMIT 1),
   '2025-11-15 10:00:00-06', '2025-12-15',
   20.000000,
   'Sistema videovigilancia vehicular – flotilla 3 unidades', 3,
   26482.92, 4237.26, 30720.18,
   10800.12, 40.78, 1,
   'dddddddd-0004-0000-0000-000000000001'),

  ('dddddddd-0005-0000-0000-000000000002',
   'COT-1002', 'confirmed',
   'dddddddd-0001-0000-0000-000000000002',
   (SELECT id FROM payment_terms WHERE name = '30 días' LIMIT 1),
   (SELECT id FROM users WHERE username = 'sales2' LIMIT 1),
   '2025-12-01 09:30:00-06', '2026-01-01',
   20.000000,
   'Grabadores M1N con hospedaje y servicios – 4 unidades', 4,
   40709.84, 6513.57, 47223.41,
   15893.04, 39.04, 1,
   'dddddddd-0004-0000-0000-000000000002'),

  ('dddddddd-0005-0000-0000-000000000003',
   'COT-1003', 'draft',
   'dddddddd-0001-0000-0000-000000000003',
   (SELECT id FROM payment_terms WHERE name = 'Inmediato' LIMIT 1),
   (SELECT id FROM users WHERE username = 'sales1' LIMIT 1),
   '2026-03-10 14:00:00-06', '2026-04-10',
   20.000000,
   'Propuesta sistema vigilancia – 2 unidades', 2,
   13845.32, 2215.26, 16060.58,
   3648.92, 26.36, 1,
   NULL)
ON CONFLICT DO NOTHING;

-- ── QUOTE LINES ──────────────────────────────────────────────
-- COT-1001 (q1): seq 1=section, 2=DVR-DASH×3, 3=SD-128GB×3,
--                4=CBL-IP-5M×3, 5=section, 6=INST-DASH×3, 7=POL-DASH×3
-- COT-1002 (q2): seq 1=MDVRCH5×4, 2=SD-256GB×4, 3=INST-M1N×4, 4=HOSP-SMART×4
-- COT-1003 (q3): seq 1=DVR-DASH×2, 2=SD-128GB×2, 3=SRV-SITIO-1×1
--
-- Pricing formula (USD products): price = cost × factor × fx
-- Pricing formula (MXN products): price = cost × factor + fixed
-- tax = subtotal × 0.16

-- COT-1001 lines
INSERT INTO quote_lines (
  id, quote_id, sequence, display_type, product_id, name, qty,
  currency_snapshot, cost_base_snapshot, utility_fixed_snapshot,
  utility_factor_snapshot, fx_snapshot,
  unit_price_mxn_suggested, unit_price_mxn_effective,
  subtotal, tax_amount, total, margin_amount, discount_approval_status
)
VALUES
  -- seq 1: section header
  ('dddddddd-0006-0000-0000-000000000001',
   'dddddddd-0005-0000-0000-000000000001', 1, 'section', NULL,
   'Equipos de Video y GPS', NULL,
   NULL, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 'approved'),

  -- seq 2: DVR-DASH × 3 — cost=242.55 USD, factor=1.3, fx=20 → price=6306.30
  ('dddddddd-0006-0000-0000-000000000002',
   'dddddddd-0005-0000-0000-000000000001', 2, 'product',
   (SELECT id FROM products WHERE sku = 'DVR-DASH' LIMIT 1),
   'DVR DASHCAM', 3,
   'USD', 242.5500, 0, 1.300000, 20.000000,
   6306.30, 6306.30,
   18918.90, 3027.02, 21945.92, 4365.90, 'approved'),

  -- seq 3: SD-128GB-WD × 3 — cost=12.36 USD, factor=1.3, fx=20 → price=321.36
  ('dddddddd-0006-0000-0000-000000000003',
   'dddddddd-0005-0000-0000-000000000001', 3, 'product',
   (SELECT id FROM products WHERE sku = 'SD-128GB-WD' LIMIT 1),
   'SD128GBWD', 3,
   'USD', 12.3600, 0, 1.300000, 20.000000,
   321.36, 321.36,
   964.08, 154.25, 1118.33, 222.48, 'approved'),

  -- seq 4: CBL-IP-5M × 3 — cost=6.47 USD, factor=1.7, fx=20 → price=219.98
  ('dddddddd-0006-0000-0000-000000000004',
   'dddddddd-0005-0000-0000-000000000001', 4, 'product',
   (SELECT id FROM products WHERE sku = 'CBL-IP-5M' LIMIT 1),
   'CABLE IP 5MTS', 3,
   'USD', 6.4700, 0, 1.700000, 20.000000,
   219.98, 219.98,
   659.94, 105.59, 765.53, 271.74, 'approved'),

  -- seq 5: section header
  ('dddddddd-0006-0000-0000-000000000005',
   'dddddddd-0005-0000-0000-000000000001', 5, 'section', NULL,
   'Servicios', NULL,
   NULL, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 'approved'),

  -- seq 6: INST-DASH × 3 — MXN, cost=0, fixed=790 → price=790
  ('dddddddd-0006-0000-0000-000000000006',
   'dddddddd-0005-0000-0000-000000000001', 6, 'product',
   (SELECT id FROM products WHERE sku = 'INST-DASH' LIMIT 1),
   'INSTALACION DASH', 3,
   'MXN', 0, 790.0000, 1.000000, 1.000000,
   790.00, 790.00,
   2370.00, 379.20, 2749.20, 2370.00, 'approved'),

  -- seq 7: POL-DASH × 3 — MXN, cost=0, fixed=1190 → price=1190
  ('dddddddd-0006-0000-0000-000000000007',
   'dddddddd-0005-0000-0000-000000000001', 7, 'product',
   (SELECT id FROM products WHERE sku = 'POL-DASH' LIMIT 1),
   'POLIZA DASHCAM', 3,
   'MXN', 0, 1190.0000, 1.000000, 1.000000,
   1190.00, 1190.00,
   3570.00, 571.20, 4141.20, 3570.00, 'approved')

ON CONFLICT DO NOTHING;

-- COT-1002 lines
INSERT INTO quote_lines (
  id, quote_id, sequence, display_type, product_id, name, qty,
  currency_snapshot, cost_base_snapshot, utility_fixed_snapshot,
  utility_factor_snapshot, fx_snapshot,
  unit_price_mxn_suggested, unit_price_mxn_effective,
  subtotal, tax_amount, total, margin_amount, discount_approval_status
)
VALUES
  -- seq 1: MDVRCH5 × 4 — cost=240 USD, factor=1.3, fx=20 → price=6240
  ('dddddddd-0006-0000-0000-000000000008',
   'dddddddd-0005-0000-0000-000000000002', 1, 'product',
   (SELECT id FROM products WHERE sku = 'MDVRCH5' LIMIT 1),
   'DVR M1N (5Ch)', 4,
   'USD', 240.0000, 0, 1.300000, 20.000000,
   6240.00, 6240.00,
   24960.00, 3993.60, 28953.60, 5760.00, 'approved'),

  -- seq 2: SD-256GB-WD × 4 — cost=37.21 USD, factor=1.3, fx=20 → price=967.46
  ('dddddddd-0006-0000-0000-000000000009',
   'dddddddd-0005-0000-0000-000000000002', 2, 'product',
   (SELECT id FROM products WHERE sku = 'SD-256GB-WD' LIMIT 1),
   'SD256GBWD', 4,
   'USD', 37.2100, 0, 1.300000, 20.000000,
   967.46, 967.46,
   3869.84, 619.17, 4489.01, 893.04, 'approved'),

  -- seq 3: INST-M1N × 4 — MXN, cost=0, fixed=990 → price=990
  ('dddddddd-0006-0000-0000-000000000010',
   'dddddddd-0005-0000-0000-000000000002', 3, 'product',
   (SELECT id FROM products WHERE sku = 'INST-M1N' LIMIT 1),
   'INSTALACION M1N', 4,
   'MXN', 0, 990.0000, 1.000000, 1.000000,
   990.00, 990.00,
   3960.00, 633.60, 4593.60, 3960.00, 'approved'),

  -- seq 4: HOSP-SMART × 4 — MXN, cost=660, factor=3 → price=1980
  ('dddddddd-0006-0000-0000-000000000011',
   'dddddddd-0005-0000-0000-000000000002', 4, 'product',
   (SELECT id FROM products WHERE sku = 'HOSP-SMART' LIMIT 1),
   'HOSPEDAJE SMART', 4,
   'MXN', 660.0000, 0, 3.000000, 1.000000,
   1980.00, 1980.00,
   7920.00, 1267.20, 9187.20, 5280.00, 'approved')

ON CONFLICT DO NOTHING;

-- COT-1003 lines
INSERT INTO quote_lines (
  id, quote_id, sequence, display_type, product_id, name, qty,
  currency_snapshot, cost_base_snapshot, utility_fixed_snapshot,
  utility_factor_snapshot, fx_snapshot,
  unit_price_mxn_suggested, unit_price_mxn_effective,
  subtotal, tax_amount, total, margin_amount, discount_approval_status
)
VALUES
  -- seq 1: DVR-DASH × 2
  ('dddddddd-0006-0000-0000-000000000012',
   'dddddddd-0005-0000-0000-000000000003', 1, 'product',
   (SELECT id FROM products WHERE sku = 'DVR-DASH' LIMIT 1),
   'DVR DASHCAM', 2,
   'USD', 242.5500, 0, 1.300000, 20.000000,
   6306.30, 6306.30,
   12612.60, 2018.02, 14630.62, 2910.60, 'approved'),

  -- seq 2: SD-128GB-WD × 2
  ('dddddddd-0006-0000-0000-000000000013',
   'dddddddd-0005-0000-0000-000000000003', 2, 'product',
   (SELECT id FROM products WHERE sku = 'SD-128GB-WD' LIMIT 1),
   'SD128GBWD', 2,
   'USD', 12.3600, 0, 1.300000, 20.000000,
   321.36, 321.36,
   642.72, 102.84, 745.56, 148.32, 'approved'),

  -- seq 3: SRV-SITIO-1 × 1 — MXN, cost=0, fixed=590 → price=590
  ('dddddddd-0006-0000-0000-000000000014',
   'dddddddd-0005-0000-0000-000000000003', 3, 'product',
   (SELECT id FROM products WHERE sku = 'SRV-SITIO-1' LIMIT 1),
   'SERVICIO SITIO', 1,
   'MXN', 0, 590.0000, 1.000000, 1.000000,
   590.00, 590.00,
   590.00, 94.40, 684.40, 590.00, 'approved')

ON CONFLICT DO NOTHING;

-- ── SALES ────────────────────────────────────────────────────
-- VTA-1001: active  (from COT-1001, Transportes García)  — partially paid
-- VTA-1002: paid    (from COT-1002, Grupo Seguridad)    — fully paid

INSERT INTO sales (
  id, number, quote_id, customer_id, project_id, user_id,
  state, unit_count,
  amount_untaxed, amount_tax, amount_total, amount_paid, amount_balance,
  created_at
)
VALUES
  ('dddddddd-0007-0000-0000-000000000001',
   'VTA-1001',
   'dddddddd-0005-0000-0000-000000000001',
   'dddddddd-0001-0000-0000-000000000001',
   'dddddddd-0004-0000-0000-000000000001',
   (SELECT id FROM users WHERE username = 'sales1' LIMIT 1),
   'active', 3,
   26482.92, 4237.26, 30720.18, 6890.40, 23829.78,
   '2025-11-20 08:00:00-06'),

  ('dddddddd-0007-0000-0000-000000000002',
   'VTA-1002',
   'dddddddd-0005-0000-0000-000000000002',
   'dddddddd-0001-0000-0000-000000000002',
   'dddddddd-0004-0000-0000-000000000002',
   (SELECT id FROM users WHERE username = 'sales2' LIMIT 1),
   'paid', 4,
   40709.84, 6513.57, 47223.41, 47223.41, 0.00,
   '2025-12-05 09:00:00-06')

ON CONFLICT DO NOTHING;

-- ── SALE NOTES ───────────────────────────────────────────────
-- NV-1001: confirmed, unpaid  (VTA-1001, equipment delivery, unit EJC-101)
-- NV-1002: paid               (VTA-1001, services)
-- NV-1003: paid               (VTA-1002, full delivery)

INSERT INTO sale_notes (
  id, number, sale_id, state, concept,
  amount_untaxed, amount_tax, amount_total, amount_paid, amount_balance,
  unit_id, created_at
)
VALUES
  ('dddddddd-0008-0000-0000-000000000001',
   'NV-1001',
   'dddddddd-0007-0000-0000-000000000001',
   'confirmed',
   'Equipo de videovigilancia vehicular (DVR + almacenamiento + cableado)',
   20542.92, 3286.86, 23829.78, 0.00, 23829.78,
   'dddddddd-0003-0000-0000-000000000001',
   '2025-11-22 10:00:00-06'),

  ('dddddddd-0008-0000-0000-000000000002',
   'NV-1002',
   'dddddddd-0007-0000-0000-000000000001',
   'paid',
   'Servicios de instalación y póliza de garantía',
   5940.00, 950.40, 6890.40, 6890.40, 0.00,
   NULL,
   '2025-11-22 10:30:00-06'),

  ('dddddddd-0008-0000-0000-000000000003',
   'NV-1003',
   'dddddddd-0007-0000-0000-000000000002',
   'paid',
   'Grabadores M1N + almacenamiento + instalación + hospedaje anual',
   40709.84, 6513.57, 47223.41, 47223.41, 0.00,
   NULL,
   '2025-12-10 11:00:00-06')

ON CONFLICT DO NOTHING;

-- ── SALE NOTE LINES ──────────────────────────────────────────

-- NV-1001 lines (equipment from COT-1001)
INSERT INTO sale_note_lines (
  id, sale_note_id, sequence, display_type, product_id, name, qty,
  unit_price_mxn, subtotal, tax_amount, total, quote_line_id
)
VALUES
  ('dddddddd-0009-0000-0000-000000000001',
   'dddddddd-0008-0000-0000-000000000001', 1, 'product',
   (SELECT id FROM products WHERE sku = 'DVR-DASH' LIMIT 1),
   'DVR DASHCAM', 3, 6306.30,
   18918.90, 3027.02, 21945.92,
   'dddddddd-0006-0000-0000-000000000002'),

  ('dddddddd-0009-0000-0000-000000000002',
   'dddddddd-0008-0000-0000-000000000001', 2, 'product',
   (SELECT id FROM products WHERE sku = 'SD-128GB-WD' LIMIT 1),
   'SD128GBWD', 3, 321.36,
   964.08, 154.25, 1118.33,
   'dddddddd-0006-0000-0000-000000000003'),

  ('dddddddd-0009-0000-0000-000000000003',
   'dddddddd-0008-0000-0000-000000000001', 3, 'product',
   (SELECT id FROM products WHERE sku = 'CBL-IP-5M' LIMIT 1),
   'CABLE IP 5MTS', 3, 219.98,
   659.94, 105.59, 765.53,
   'dddddddd-0006-0000-0000-000000000004')

ON CONFLICT DO NOTHING;

-- NV-1002 lines (services from COT-1001)
INSERT INTO sale_note_lines (
  id, sale_note_id, sequence, display_type, product_id, name, qty,
  unit_price_mxn, subtotal, tax_amount, total, quote_line_id
)
VALUES
  ('dddddddd-0009-0000-0000-000000000004',
   'dddddddd-0008-0000-0000-000000000002', 1, 'product',
   (SELECT id FROM products WHERE sku = 'INST-DASH' LIMIT 1),
   'INSTALACION DASH', 3, 790.00,
   2370.00, 379.20, 2749.20,
   'dddddddd-0006-0000-0000-000000000006'),

  ('dddddddd-0009-0000-0000-000000000005',
   'dddddddd-0008-0000-0000-000000000002', 2, 'product',
   (SELECT id FROM products WHERE sku = 'POL-DASH' LIMIT 1),
   'POLIZA DASHCAM', 3, 1190.00,
   3570.00, 571.20, 4141.20,
   'dddddddd-0006-0000-0000-000000000007')

ON CONFLICT DO NOTHING;

-- NV-1003 lines (all from COT-1002)
INSERT INTO sale_note_lines (
  id, sale_note_id, sequence, display_type, product_id, name, qty,
  unit_price_mxn, subtotal, tax_amount, total, quote_line_id
)
VALUES
  ('dddddddd-0009-0000-0000-000000000006',
   'dddddddd-0008-0000-0000-000000000003', 1, 'product',
   (SELECT id FROM products WHERE sku = 'MDVRCH5' LIMIT 1),
   'DVR M1N (5Ch)', 4, 6240.00,
   24960.00, 3993.60, 28953.60,
   'dddddddd-0006-0000-0000-000000000008'),

  ('dddddddd-0009-0000-0000-000000000007',
   'dddddddd-0008-0000-0000-000000000003', 2, 'product',
   (SELECT id FROM products WHERE sku = 'SD-256GB-WD' LIMIT 1),
   'SD256GBWD', 4, 967.46,
   3869.84, 619.17, 4489.01,
   'dddddddd-0006-0000-0000-000000000009'),

  ('dddddddd-0009-0000-0000-000000000008',
   'dddddddd-0008-0000-0000-000000000003', 3, 'product',
   (SELECT id FROM products WHERE sku = 'INST-M1N' LIMIT 1),
   'INSTALACION M1N', 4, 990.00,
   3960.00, 633.60, 4593.60,
   'dddddddd-0006-0000-0000-000000000010'),

  ('dddddddd-0009-0000-0000-000000000009',
   'dddddddd-0008-0000-0000-000000000003', 4, 'product',
   (SELECT id FROM products WHERE sku = 'HOSP-SMART' LIMIT 1),
   'HOSPEDAJE SMART', 4, 1980.00,
   7920.00, 1267.20, 9187.20,
   'dddddddd-0006-0000-0000-000000000011')

ON CONFLICT DO NOTHING;

-- ── CUSTOMER PAYMENTS ────────────────────────────────────────
-- PAG-1001: 6890.40 MXN transferencia — Transportes García → applied to NV-1002
-- PAG-1002: 47223.41 MXN transferencia — Grupo Seguridad   → applied to NV-1003
--           (also registered as anticipo ANT-1001 for VTA-1002)

INSERT INTO customer_payments (
  id, number, customer_id, state, concept,
  amount, payment_method, payment_date, reference, registered_by, created_at
)
VALUES
  ('dddddddd-0010-0000-0000-000000000001',
   'PAG-1001',
   'dddddddd-0001-0000-0000-000000000001',
   'confirmed',
   'Pago servicios instalación y póliza – VTA-1001',
   6890.40, 'transferencia', '2025-12-20',
   'SPEI-TXN-2025-001',
   (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
   '2025-12-20 15:00:00-06'),

  ('dddddddd-0010-0000-0000-000000000002',
   'PAG-1002',
   'dddddddd-0001-0000-0000-000000000002',
   'confirmed',
   'Pago total sistema monitoreo – VTA-1002',
   47223.41, 'transferencia', '2026-01-15',
   'SPEI-TXN-2026-002',
   (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
   '2026-01-15 10:30:00-06')

ON CONFLICT DO NOTHING;

-- ── PAYMENT APPLICATIONS ─────────────────────────────────────

INSERT INTO payment_applications (id, payment_id, sale_note_id, amount, created_at)
VALUES
  ('dddddddd-0011-0000-0000-000000000001',
   'dddddddd-0010-0000-0000-000000000001',
   'dddddddd-0008-0000-0000-000000000002',
   6890.40,
   '2025-12-20 15:05:00-06'),

  ('dddddddd-0011-0000-0000-000000000002',
   'dddddddd-0010-0000-0000-000000000002',
   'dddddddd-0008-0000-0000-000000000003',
   47223.41,
   '2026-01-15 10:35:00-06')

ON CONFLICT DO NOTHING;

-- ── SALE ANTICIPOS ───────────────────────────────────────────
-- PAG-1002 was registered as anticipo for VTA-1002 before the note was issued

INSERT INTO sale_anticipos (id, number, sale_id, payment_id, concept, created_at)
VALUES
  ('dddddddd-0012-0000-0000-000000000001',
   'ANT-1001',
   'dddddddd-0007-0000-0000-000000000002',
   'dddddddd-0010-0000-0000-000000000002',
   'Anticipo total – sistema monitoreo 4 unidades',
   '2026-01-15 10:30:00-06')

ON CONFLICT DO NOTHING;

-- ── PAYMENT SCHEDULE ITEMS ───────────────────────────────────
-- Convenio de pago para VTA-1001 (3 exhibiciones)
-- Total: 6890.40 + 12000.00 + 11829.78 = 30720.18 ✓

INSERT INTO payment_schedule_items (id, sale_id, due_date, amount, label, sequence, state)
VALUES
  ('dddddddd-0013-0000-0000-000000000001',
   'dddddddd-0007-0000-0000-000000000001',
   '2026-01-15', 6890.40, 'Anticipo (50% servicios)', 1, 'paid'),

  ('dddddddd-0013-0000-0000-000000000002',
   'dddddddd-0007-0000-0000-000000000001',
   '2026-03-01', 12000.00, 'Segunda exhibición', 2, 'pending'),

  ('dddddddd-0013-0000-0000-000000000003',
   'dddddddd-0007-0000-0000-000000000001',
   '2026-04-30', 11829.78, 'Liquidación', 3, 'pending')

ON CONFLICT DO NOTHING;

COMMIT;
