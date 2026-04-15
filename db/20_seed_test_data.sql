-- ============================================================
-- Lumi Test Data Seed — ×5 cycles
-- Generated: 2026-04-15
-- Args: --count 5
-- ============================================================
-- IDs use prefix eeeeeeee- to identify test rows.
-- Safe to re-run: all INSERTs use ON CONFLICT DO NOTHING.
-- Amounts verified: tax=subtotal×0.16, balance=total−paid.
-- ============================================================

BEGIN;

-- ── CONTACTS (5 companies + 5 persons) ───────────────────────

INSERT INTO contacts (id, type, name, email, phone, tax_id)
VALUES
  ('eeeeeeee-0001-0000-0000-000000000001','company','Fletes y Transportes Reyes S.A. de C.V.',     'ops@ftreyes.com.mx',         '+52 81 3300 1100','FTR850620JH1'),
  ('eeeeeeee-0001-0000-0000-000000000002','company','Vigilancia Industrial del Bajío S.A. de C.V.','info@vibseguridad.mx',       '+52 477 710 2200','VIB920315AB2'),
  ('eeeeeeee-0001-0000-0000-000000000003','company','Autobuses del Noreste S.A. de C.V.',           'flotilla@autonoreste.mx',    '+52 81 8888 4400','ANE780901CD3'),
  ('eeeeeeee-0001-0000-0000-000000000004','company','Seguridad Integral Coahuila S.A.',             'contacto@siccoahuila.mx',   '+52 844 410 5500','SIC010708EF4'),
  ('eeeeeeee-0001-0000-0000-000000000005','company','Distribuidora Mexicana del Centro S.A. de C.V.','ventas@distmexcentro.mx',  '+52 442 215 6600','DMC930412GH5')
ON CONFLICT DO NOTHING;

INSERT INTO contacts (id, type, name, first_name, email, phone, job_title)
VALUES
  ('eeeeeeee-0001-0000-0000-000000000006','person','Vázquez Núñez Roberto Alejandro','Roberto Alejandro','rvazquez@ftreyes.com.mx',     '+52 81 3300 1199','Gerente de Flotilla'),
  ('eeeeeeee-0001-0000-0000-000000000007','person','Soto Herrera Alejandra Beatriz', 'Alejandra Beatriz','asoto@vibseguridad.mx',        '+52 477 710 2299','Directora de Operaciones'),
  ('eeeeeeee-0001-0000-0000-000000000008','person','Cruz Domínguez Miguel Ángel',    'Miguel Ángel',     'macruz@autonoreste.mx',        '+52 81 8888 4499','Jefe de Mantenimiento'),
  ('eeeeeeee-0001-0000-0000-000000000009','person','Morales Rivas Patricia Lorena',  'Patricia Lorena',  'pmorales@siccoahuila.mx',      '+52 844 410 5599','Coordinadora de Seguridad'),
  ('eeeeeeee-0001-0000-0000-000000000010','person','Jiménez Flores Carlos Eduardo',  'Carlos Eduardo',   'cejimenez@distmexcentro.mx',   '+52 442 215 6699','Encargado de Compras')
ON CONFLICT DO NOTHING;

-- ── CONTACT COMPANY LINKS ─────────────────────────────────────

INSERT INTO contact_company_links (contact_id, company_id, role, is_primary)
VALUES
  ('eeeeeeee-0001-0000-0000-000000000006','eeeeeeee-0001-0000-0000-000000000001','Gerente de Flotilla',         true),
  ('eeeeeeee-0001-0000-0000-000000000007','eeeeeeee-0001-0000-0000-000000000002','Directora de Operaciones',    true),
  ('eeeeeeee-0001-0000-0000-000000000008','eeeeeeee-0001-0000-0000-000000000003','Jefe de Mantenimiento',       true),
  ('eeeeeeee-0001-0000-0000-000000000009','eeeeeeee-0001-0000-0000-000000000004','Coordinadora de Seguridad',   true),
  ('eeeeeeee-0001-0000-0000-000000000010','eeeeeeee-0001-0000-0000-000000000005','Encargado de Compras',        true)
ON CONFLICT (contact_id, company_id) DO NOTHING;

-- ── RUTAS (1 per company) ─────────────────────────────────────

INSERT INTO rutas (id, name, cliente_id)
VALUES
  ('eeeeeeee-0002-0000-0000-000000000001','Ruta Sur CDMX-PUE',          'eeeeeeee-0001-0000-0000-000000000001'),
  ('eeeeeeee-0002-0000-0000-000000000002','Ruta Industrial Celaya-León', 'eeeeeeee-0001-0000-0000-000000000002'),
  ('eeeeeeee-0002-0000-0000-000000000003','Ruta NE Monterrey-Tampico',   'eeeeeeee-0001-0000-0000-000000000003'),
  ('eeeeeeee-0002-0000-0000-000000000004','Ruta Saltillo-Torreón',       'eeeeeeee-0001-0000-0000-000000000004'),
  ('eeeeeeee-0002-0000-0000-000000000005','Ruta Centro CDMX-QRO',        'eeeeeeee-0001-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ── UNIDADES (2 per ruta = 10 total) ─────────────────────────

INSERT INTO unidades (id, name, ruta_id, empresa_id, dueno_id, dashcam, pantalla, impresora, reversa, reconocimiento_facial, fecha_instalacion)
VALUES
  ('eeeeeeee-0003-0000-0000-000000000001','FTR-201','eeeeeeee-0002-0000-0000-000000000001','eeeeeeee-0001-0000-0000-000000000001','eeeeeeee-0001-0000-0000-000000000001','dashcam',  true, false,true, false,'2025-10-15'),
  ('eeeeeeee-0003-0000-0000-000000000002','FTR-202','eeeeeeee-0002-0000-0000-000000000001','eeeeeeee-0001-0000-0000-000000000001','eeeeeeee-0001-0000-0000-000000000001','dashcam',  true, false,true, false,'2025-10-15'),
  ('eeeeeeee-0003-0000-0000-000000000003','VIB-101','eeeeeeee-0002-0000-0000-000000000002','eeeeeeee-0001-0000-0000-000000000002','eeeeeeee-0001-0000-0000-000000000002','streamax', true, true, true, false,'2025-11-05'),
  ('eeeeeeee-0003-0000-0000-000000000004','VIB-102','eeeeeeee-0002-0000-0000-000000000002','eeeeeeee-0001-0000-0000-000000000002','eeeeeeee-0001-0000-0000-000000000002','streamax', true, true, true, false,'2025-11-05'),
  ('eeeeeeee-0003-0000-0000-000000000005','ANE-301','eeeeeeee-0002-0000-0000-000000000003','eeeeeeee-0001-0000-0000-000000000003','eeeeeeee-0001-0000-0000-000000000003','dashcam',  true, false,true, false,'2025-12-01'),
  ('eeeeeeee-0003-0000-0000-000000000006','ANE-302','eeeeeeee-0002-0000-0000-000000000003','eeeeeeee-0001-0000-0000-000000000003','eeeeeeee-0001-0000-0000-000000000003', NULL,       false,false,false,false,'2025-12-01'),
  ('eeeeeeee-0003-0000-0000-000000000007','SIC-401','eeeeeeee-0002-0000-0000-000000000004','eeeeeeee-0001-0000-0000-000000000004','eeeeeeee-0001-0000-0000-000000000004','dashcam',  true, false,false,false,'2026-01-10'),
  ('eeeeeeee-0003-0000-0000-000000000008','SIC-402','eeeeeeee-0002-0000-0000-000000000004','eeeeeeee-0001-0000-0000-000000000004','eeeeeeee-0001-0000-0000-000000000004','streamax', true, false,false,false,'2026-01-10'),
  ('eeeeeeee-0003-0000-0000-000000000009','DMC-501','eeeeeeee-0002-0000-0000-000000000005','eeeeeeee-0001-0000-0000-000000000005','eeeeeeee-0001-0000-0000-000000000005','dashcam',  false,false,true, false,'2026-02-20'),
  ('eeeeeeee-0003-0000-0000-000000000010','DMC-502','eeeeeeee-0002-0000-0000-000000000005','eeeeeeee-0001-0000-0000-000000000005','eeeeeeee-0001-0000-0000-000000000005', NULL,       false,false,false,false,'2026-02-20')
ON CONFLICT DO NOTHING;

-- ── PROJECTS ─────────────────────────────────────────────────

INSERT INTO projects (id, name, customer_id, date, status, description, user_id, ruta_id)
VALUES
  ('eeeeeeee-0004-0000-0000-000000000001',
   'Sistema Videovigilancia Fletes Reyes',
   'eeeeeeee-0001-0000-0000-000000000001','2025-10-01','active',
   'Instalación DVR-DASH para 5 unidades ruta CDMX-PUE',
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   'eeeeeeee-0002-0000-0000-000000000001'),

  ('eeeeeeee-0004-0000-0000-000000000002',
   'Monitoreo Flota Vigilancia Industrial Bajío',
   'eeeeeeee-0001-0000-0000-000000000002','2025-11-01','active',
   'Grabadores M1N + hospedaje plataforma para 6 unidades',
   (SELECT id FROM users WHERE username='sales2' LIMIT 1),
   'eeeeeeee-0002-0000-0000-000000000002'),

  ('eeeeeeee-0004-0000-0000-000000000003',
   'Ampliación Sistema Autobuses del Noreste',
   'eeeeeeee-0001-0000-0000-000000000003','2025-12-01','active',
   'DVR 360° con almacenamiento 512GB para 8 unidades',
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   'eeeeeeee-0002-0000-0000-000000000003'),

  ('eeeeeeee-0004-0000-0000-000000000004',
   'Plan Datos Anual Seguridad Integral Coahuila',
   'eeeeeeee-0001-0000-0000-000000000004','2026-01-05','active',
   'Plan de datos 5GB + instalación + póliza para 4 unidades',
   (SELECT id FROM users WHERE username='sales2' LIMIT 1),
   'eeeeeeee-0002-0000-0000-000000000004'),

  ('eeeeeeee-0004-0000-0000-000000000005',
   'Renovación Flota Distribuidora Mexicana Centro',
   'eeeeeeee-0001-0000-0000-000000000005','2026-02-15','active',
   'DVR-DASH + plan datos 10GB para 3 unidades',
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   'eeeeeeee-0002-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ── QUOTES ───────────────────────────────────────────────────
-- COT-2001: 5 u, Fletes Reyes       — untaxed=44138.20  tax=7062.11  total=51200.31
-- COT-2002: 6 u, Vigilancia Bajío   — untaxed=61064.76  tax=9770.36  total=70835.12
-- COT-2003: 8 u, Autobuses Noreste  — untaxed=123515.52 tax=19762.48 total=143278.00
-- COT-2004: 4 u, Seg Coahuila       — untaxed=23420.72  tax=3747.32  total=27168.04
-- COT-2005: 3 u, Dist Mexicana      — untaxed=39217.68  tax=6274.82  total=45492.50

INSERT INTO quotes (
  id, number, state, customer_id, payment_term_id, user_id,
  quotation_date, expiration_date, fx_mxn_per_usd_snapshot,
  description, unit_count,
  amount_untaxed, amount_tax, amount_total,
  margin_amount, margin_percent, version, project_id
)
VALUES
  ('eeeeeeee-0005-0000-0000-000000000001',
   'COT-2001','confirmed',
   'eeeeeeee-0001-0000-0000-000000000001',
   (SELECT id FROM payment_terms WHERE name='50% anticipo / 50% entrega' LIMIT 1),
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   '2025-11-10 09:00:00-06','2025-12-10',20.000000,
   'Sistema videovigilancia DVR-DASH para 5 unidades',5,
   44138.20,7062.11,51200.31,18000.20,40.78,1,
   'eeeeeeee-0004-0000-0000-000000000001'),

  ('eeeeeeee-0005-0000-0000-000000000002',
   'COT-2002','confirmed',
   'eeeeeeee-0001-0000-0000-000000000002',
   (SELECT id FROM payment_terms WHERE name='30 días' LIMIT 1),
   (SELECT id FROM users WHERE username='sales2' LIMIT 1),
   '2025-11-20 10:00:00-06','2025-12-20',20.000000,
   'Grabadores M1N + hospedaje + servicios para 6 unidades',6,
   61064.76,9770.36,70835.12,23839.56,39.04,1,
   'eeeeeeee-0004-0000-0000-000000000002'),

  ('eeeeeeee-0005-0000-0000-000000000003',
   'COT-2003','confirmed',
   'eeeeeeee-0001-0000-0000-000000000003',
   (SELECT id FROM payment_terms WHERE name='50% anticipo / 50% entrega' LIMIT 1),
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   '2025-12-15 11:00:00-06','2026-01-15',20.000000,
   'DVR 360° + SD 512GB + instalación + póliza para 8 unidades',8,
   123515.52,19762.48,143278.00,51765.12,41.91,1,
   'eeeeeeee-0004-0000-0000-000000000003'),

  ('eeeeeeee-0005-0000-0000-000000000004',
   'COT-2004','confirmed',
   'eeeeeeee-0001-0000-0000-000000000004',
   (SELECT id FROM payment_terms WHERE name='Inmediato' LIMIT 1),
   (SELECT id FROM users WHERE username='sales2' LIMIT 1),
   '2026-01-05 08:30:00-06','2026-02-05',20.000000,
   'Plan anual 5GB + instalación + póliza DASH IA para 4 unidades',4,
   23420.72,3747.32,27168.04,12827.60,54.77,1,
   'eeeeeeee-0004-0000-0000-000000000004'),

  ('eeeeeeee-0005-0000-0000-000000000005',
   'COT-2005','confirmed',
   'eeeeeeee-0001-0000-0000-000000000005',
   (SELECT id FROM payment_terms WHERE name='30 días' LIMIT 1),
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   '2026-02-20 14:00:00-06','2026-03-20',20.000000,
   'DVR-DASH + SD 256GB + plan 10GB + servicios para 3 unidades',3,
   39217.68,6274.82,45492.50,11899.08,30.34,1,
   'eeeeeeee-0004-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ── QUOTE LINES ──────────────────────────────────────────────
-- Pricing: USD → price = cost × factor × 20
--          MXN → price = cost × factor + fixed
-- tax = subtotal × 0.16

-- COT-2001 (DVR-DASH setup, 5 units)
INSERT INTO quote_lines (
  id, quote_id, sequence, display_type, product_id, name, qty,
  currency_snapshot, cost_base_snapshot, utility_fixed_snapshot,
  utility_factor_snapshot, fx_snapshot,
  unit_price_mxn_suggested, unit_price_mxn_effective,
  subtotal, tax_amount, total, margin_amount, discount_approval_status
) VALUES
  -- DVR-DASH×5: 242.55×1.3×20=6306.30 → sub=31531.50 tax=5045.04
  ('eeeeeeee-0006-0000-0000-000000000001',
   'eeeeeeee-0005-0000-0000-000000000001',1,'product',
   (SELECT id FROM products WHERE sku='DVR-DASH' LIMIT 1),
   'DVR DASHCAM',5,'USD',242.5500,0,1.300000,20.000000,
   6306.30,6306.30,31531.50,5045.04,36576.54,7276.50,'approved'),

  -- SD-128GB-WD×5: 12.36×1.3×20=321.36 → sub=1606.80 tax=257.09
  ('eeeeeeee-0006-0000-0000-000000000002',
   'eeeeeeee-0005-0000-0000-000000000001',2,'product',
   (SELECT id FROM products WHERE sku='SD-128GB-WD' LIMIT 1),
   'SD128GBWD',5,'USD',12.3600,0,1.300000,20.000000,
   321.36,321.36,1606.80,257.09,1863.89,370.80,'approved'),

  -- CBL-IP-5M×5: 6.47×1.7×20=219.98 → sub=1099.90 tax=175.98
  ('eeeeeeee-0006-0000-0000-000000000003',
   'eeeeeeee-0005-0000-0000-000000000001',3,'product',
   (SELECT id FROM products WHERE sku='CBL-IP-5M' LIMIT 1),
   'CABLE IP 5MTS',5,'USD',6.4700,0,1.700000,20.000000,
   219.98,219.98,1099.90,175.98,1275.88,452.90,'approved'),

  -- INST-DASH×5: MXN fixed=790 → sub=3950.00 tax=632.00
  ('eeeeeeee-0006-0000-0000-000000000004',
   'eeeeeeee-0005-0000-0000-000000000001',4,'product',
   (SELECT id FROM products WHERE sku='INST-DASH' LIMIT 1),
   'INSTALACION DASH',5,'MXN',0,790.0000,1.000000,1.000000,
   790.00,790.00,3950.00,632.00,4582.00,3950.00,'approved'),

  -- POL-DASH×5: MXN fixed=1190 → sub=5950.00 tax=952.00
  ('eeeeeeee-0006-0000-0000-000000000005',
   'eeeeeeee-0005-0000-0000-000000000001',5,'product',
   (SELECT id FROM products WHERE sku='POL-DASH' LIMIT 1),
   'POLIZA DASHCAM',5,'MXN',0,1190.0000,1.000000,1.000000,
   1190.00,1190.00,5950.00,952.00,6902.00,5950.00,'approved')
ON CONFLICT DO NOTHING;

-- COT-2002 (M1N setup, 6 units)
INSERT INTO quote_lines (
  id, quote_id, sequence, display_type, product_id, name, qty,
  currency_snapshot, cost_base_snapshot, utility_fixed_snapshot,
  utility_factor_snapshot, fx_snapshot,
  unit_price_mxn_suggested, unit_price_mxn_effective,
  subtotal, tax_amount, total, margin_amount, discount_approval_status
) VALUES
  -- MDVRCH5×6: 240×1.3×20=6240 → sub=37440.00 tax=5990.40
  ('eeeeeeee-0006-0000-0000-000000000006',
   'eeeeeeee-0005-0000-0000-000000000002',1,'product',
   (SELECT id FROM products WHERE sku='MDVRCH5' LIMIT 1),
   'DVR M1N (5Ch)',6,'USD',240.0000,0,1.300000,20.000000,
   6240.00,6240.00,37440.00,5990.40,43430.40,8640.00,'approved'),

  -- SD-256GB-WD×6: 37.21×1.3×20=967.46 → sub=5804.76 tax=928.76
  ('eeeeeeee-0006-0000-0000-000000000007',
   'eeeeeeee-0005-0000-0000-000000000002',2,'product',
   (SELECT id FROM products WHERE sku='SD-256GB-WD' LIMIT 1),
   'SD256GBWD',6,'USD',37.2100,0,1.300000,20.000000,
   967.46,967.46,5804.76,928.76,6733.52,1339.56,'approved'),

  -- INST-M1N×6: MXN fixed=990 → sub=5940.00 tax=950.40
  ('eeeeeeee-0006-0000-0000-000000000008',
   'eeeeeeee-0005-0000-0000-000000000002',3,'product',
   (SELECT id FROM products WHERE sku='INST-M1N' LIMIT 1),
   'INSTALACION M1N',6,'MXN',0,990.0000,1.000000,1.000000,
   990.00,990.00,5940.00,950.40,6890.40,5940.00,'approved'),

  -- HOSP-SMART×6: MXN cost=660×3=1980 → sub=11880.00 tax=1900.80
  ('eeeeeeee-0006-0000-0000-000000000009',
   'eeeeeeee-0005-0000-0000-000000000002',4,'product',
   (SELECT id FROM products WHERE sku='HOSP-SMART' LIMIT 1),
   'HOSPEDAJE SMART',6,'MXN',660.0000,0,3.000000,1.000000,
   1980.00,1980.00,11880.00,1900.80,13780.80,7920.00,'approved')
ON CONFLICT DO NOTHING;

-- COT-2003 (DVR 360° X3 setup, 8 units)
INSERT INTO quote_lines (
  id, quote_id, sequence, display_type, product_id, name, qty,
  currency_snapshot, cost_base_snapshot, utility_fixed_snapshot,
  utility_factor_snapshot, fx_snapshot,
  unit_price_mxn_suggested, unit_price_mxn_effective,
  subtotal, tax_amount, total, margin_amount, discount_approval_status
) VALUES
  -- DVR-360-4CH×8: 319.44×1.3×20=8305.44 → sub=66443.52 tax=10630.96
  ('eeeeeeee-0006-0000-0000-000000000010',
   'eeeeeeee-0005-0000-0000-000000000003',1,'product',
   (SELECT id FROM products WHERE sku='DVR-360-4CH' LIMIT 1),
   'DVR 360° (4Ch)',8,'USD',319.4400,0,1.300000,20.000000,
   8305.44,8305.44,66443.52,10630.96,77074.48,15333.12,'approved'),

  -- SD-512GB-WD×8: 129×1.3×20=3354 → sub=26832.00 tax=4293.12
  ('eeeeeeee-0006-0000-0000-000000000011',
   'eeeeeeee-0005-0000-0000-000000000003',2,'product',
   (SELECT id FROM products WHERE sku='SD-512GB-WD' LIMIT 1),
   'SD512GBWD',8,'USD',129.0000,0,1.300000,20.000000,
   3354.00,3354.00,26832.00,4293.12,31125.12,6192.00,'approved'),

  -- INST-X3×8: MXN fixed=1490 → sub=11920.00 tax=1907.20
  ('eeeeeeee-0006-0000-0000-000000000012',
   'eeeeeeee-0005-0000-0000-000000000003',3,'product',
   (SELECT id FROM products WHERE sku='INST-X3' LIMIT 1),
   'INSTALACION X3',8,'MXN',0,1490.0000,1.000000,1.000000,
   1490.00,1490.00,11920.00,1907.20,13827.20,11920.00,'approved'),

  -- POL-X3-T1×8: MXN fixed=2290 → sub=18320.00 tax=2931.20
  ('eeeeeeee-0006-0000-0000-000000000013',
   'eeeeeeee-0005-0000-0000-000000000003',4,'product',
   (SELECT id FROM products WHERE sku='POL-X3-T1' LIMIT 1),
   'POLIZA X3 T1',8,'MXN',0,2290.0000,1.000000,1.000000,
   2290.00,2290.00,18320.00,2931.20,21251.20,18320.00,'approved')
ON CONFLICT DO NOTHING;

-- COT-2004 (plan datos + instalación, 4 units)
INSERT INTO quote_lines (
  id, quote_id, sequence, display_type, product_id, name, qty,
  currency_snapshot, cost_base_snapshot, utility_fixed_snapshot,
  utility_factor_snapshot, fx_snapshot,
  unit_price_mxn_suggested, unit_price_mxn_effective,
  subtotal, tax_amount, total, margin_amount, discount_approval_status
) VALUES
  -- PLAN-AN-5GB×4: MXN cost=2648.28×1.35=3575.18 → sub=14300.72 tax=2288.12
  ('eeeeeeee-0006-0000-0000-000000000014',
   'eeeeeeee-0005-0000-0000-000000000004',1,'product',
   (SELECT id FROM products WHERE sku='PLAN-AN-5GB' LIMIT 1),
   'PLAN ANUAL 5GB',4,'MXN',2648.2800,0,1.350000,1.000000,
   3575.18,3575.18,14300.72,2288.12,16588.84,3707.60,'approved'),

  -- INST-DASH×4: MXN fixed=790 → sub=3160.00 tax=505.60
  ('eeeeeeee-0006-0000-0000-000000000015',
   'eeeeeeee-0005-0000-0000-000000000004',2,'product',
   (SELECT id FROM products WHERE sku='INST-DASH' LIMIT 1),
   'INSTALACION DASH',4,'MXN',0,790.0000,1.000000,1.000000,
   790.00,790.00,3160.00,505.60,3665.60,3160.00,'approved'),

  -- POL-DASHIA-T1×4: MXN fixed=1490 → sub=5960.00 tax=953.60
  ('eeeeeeee-0006-0000-0000-000000000016',
   'eeeeeeee-0005-0000-0000-000000000004',3,'product',
   (SELECT id FROM products WHERE sku='POL-DASHIA-T1' LIMIT 1),
   'POLIZA DASH IA T1',4,'MXN',0,1490.0000,1.000000,1.000000,
   1490.00,1490.00,5960.00,953.60,6913.60,5960.00,'approved')
ON CONFLICT DO NOTHING;

-- COT-2005 (mixed setup, 3 units)
INSERT INTO quote_lines (
  id, quote_id, sequence, display_type, product_id, name, qty,
  currency_snapshot, cost_base_snapshot, utility_fixed_snapshot,
  utility_factor_snapshot, fx_snapshot,
  unit_price_mxn_suggested, unit_price_mxn_effective,
  subtotal, tax_amount, total, margin_amount, discount_approval_status
) VALUES
  -- DVR-DASH×3: → sub=18918.90 tax=3027.02
  ('eeeeeeee-0006-0000-0000-000000000017',
   'eeeeeeee-0005-0000-0000-000000000005',1,'product',
   (SELECT id FROM products WHERE sku='DVR-DASH' LIMIT 1),
   'DVR DASHCAM',3,'USD',242.5500,0,1.300000,20.000000,
   6306.30,6306.30,18918.90,3027.02,21945.92,4365.90,'approved'),

  -- SD-256GB-WD×3: → sub=2902.38 tax=464.38
  ('eeeeeeee-0006-0000-0000-000000000018',
   'eeeeeeee-0005-0000-0000-000000000005',2,'product',
   (SELECT id FROM products WHERE sku='SD-256GB-WD' LIMIT 1),
   'SD256GBWD',3,'USD',37.2100,0,1.300000,20.000000,
   967.46,967.46,2902.38,464.38,3366.76,669.78,'approved'),

  -- BTN-PANICO×3: 8.15×3×20=489.00 → sub=1467.00 tax=234.72
  ('eeeeeeee-0006-0000-0000-000000000019',
   'eeeeeeee-0005-0000-0000-000000000005',3,'product',
   (SELECT id FROM products WHERE sku='BTN-PANICO' LIMIT 1),
   'BOTON DE PANICO',3,'USD',8.1500,0,3.000000,20.000000,
   489.00,489.00,1467.00,234.72,1701.72,978.00,'approved'),

  -- INST-DASH×3: → sub=2370.00 tax=379.20
  ('eeeeeeee-0006-0000-0000-000000000020',
   'eeeeeeee-0005-0000-0000-000000000005',4,'product',
   (SELECT id FROM products WHERE sku='INST-DASH' LIMIT 1),
   'INSTALACION DASH',3,'MXN',0,790.0000,1.000000,1.000000,
   790.00,790.00,2370.00,379.20,2749.20,2370.00,'approved'),

  -- PLAN-AN-10GB×3: MXN cost=3348×1.35=4519.80 → sub=13559.40 tax=2169.50
  ('eeeeeeee-0006-0000-0000-000000000021',
   'eeeeeeee-0005-0000-0000-000000000005',5,'product',
   (SELECT id FROM products WHERE sku='PLAN-AN-10GB' LIMIT 1),
   'PLAN ANUAL 10GB',3,'MXN',3348.0000,0,1.350000,1.000000,
   4519.80,4519.80,13559.40,2169.50,15728.90,3515.40,'approved')
ON CONFLICT DO NOTHING;

-- ── SALES ────────────────────────────────────────────────────
-- VTA-2001: active   paid=20000.00  balance=31200.31
-- VTA-2002: paid     paid=70835.12  balance=0
-- VTA-2003: active   paid=50000.00  balance=93278.00
-- VTA-2004: finished paid=27168.04  balance=0
-- VTA-2005: active   paid=0         balance=45492.50

INSERT INTO sales (
  id, number, quote_id, customer_id, project_id, user_id,
  state, unit_count,
  amount_untaxed, amount_tax, amount_total, amount_paid, amount_balance,
  created_at
) VALUES
  ('eeeeeeee-0007-0000-0000-000000000001','VTA-2001',
   'eeeeeeee-0005-0000-0000-000000000001',
   'eeeeeeee-0001-0000-0000-000000000001',
   'eeeeeeee-0004-0000-0000-000000000001',
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   'active',5,44138.20,7062.11,51200.31,20000.00,31200.31,
   '2025-11-15 16:00:00-06'),

  ('eeeeeeee-0007-0000-0000-000000000002','VTA-2002',
   'eeeeeeee-0005-0000-0000-000000000002',
   'eeeeeeee-0001-0000-0000-000000000002',
   'eeeeeeee-0004-0000-0000-000000000002',
   (SELECT id FROM users WHERE username='sales2' LIMIT 1),
   'paid',6,61064.76,9770.36,70835.12,70835.12,0.00,
   '2025-11-25 10:00:00-06'),

  ('eeeeeeee-0007-0000-0000-000000000003','VTA-2003',
   'eeeeeeee-0005-0000-0000-000000000003',
   'eeeeeeee-0001-0000-0000-000000000003',
   'eeeeeeee-0004-0000-0000-000000000003',
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   'active',8,123515.52,19762.48,143278.00,50000.00,93278.00,
   '2025-12-20 09:00:00-06'),

  ('eeeeeeee-0007-0000-0000-000000000004','VTA-2004',
   'eeeeeeee-0005-0000-0000-000000000004',
   'eeeeeeee-0001-0000-0000-000000000004',
   'eeeeeeee-0004-0000-0000-000000000004',
   (SELECT id FROM users WHERE username='sales2' LIMIT 1),
   'finished',4,23420.72,3747.32,27168.04,27168.04,0.00,
   '2026-01-08 11:00:00-06'),

  ('eeeeeeee-0007-0000-0000-000000000005','VTA-2005',
   'eeeeeeee-0005-0000-0000-000000000005',
   'eeeeeeee-0001-0000-0000-000000000005',
   'eeeeeeee-0004-0000-0000-000000000005',
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   'active',3,39217.68,6274.82,45492.50,0.00,45492.50,
   '2026-02-25 14:00:00-06')
ON CONFLICT DO NOTHING;

-- ── SALE NOTES ───────────────────────────────────────────────
-- NV-2001: confirmed  total=51200.31  paid=20000.00  bal=31200.31
-- NV-2002: paid       total=70835.12  paid=70835.12  bal=0
-- NV-2003: confirmed  total=143278.00 paid=50000.00  bal=93278.00
-- NV-2004: paid       total=27168.04  paid=27168.04  bal=0
-- NV-2005: draft      total=45492.50  paid=0         bal=45492.50

INSERT INTO sale_notes (
  id, number, sale_id, state, concept,
  amount_untaxed, amount_tax, amount_total, amount_paid, amount_balance,
  unit_id, created_at
) VALUES
  ('eeeeeeee-0008-0000-0000-000000000001','NV-2001',
   'eeeeeeee-0007-0000-0000-000000000001',
   'confirmed','Equipo y servicios – 5 unidades DVR-DASH',
   44138.20,7062.11,51200.31,20000.00,31200.31,
   'eeeeeeee-0003-0000-0000-000000000001','2025-11-18 10:00:00-06'),

  ('eeeeeeee-0008-0000-0000-000000000002','NV-2002',
   'eeeeeeee-0007-0000-0000-000000000002',
   'paid','Sistema M1N completo – 6 unidades',
   61064.76,9770.36,70835.12,70835.12,0.00,
   'eeeeeeee-0003-0000-0000-000000000003','2025-11-28 09:00:00-06'),

  ('eeeeeeee-0008-0000-0000-000000000003','NV-2003',
   'eeeeeeee-0007-0000-0000-000000000003',
   'confirmed','DVR 360° + almacenamiento + servicios – 8 unidades',
   123515.52,19762.48,143278.00,50000.00,93278.00,
   'eeeeeeee-0003-0000-0000-000000000005','2025-12-22 11:00:00-06'),

  ('eeeeeeee-0008-0000-0000-000000000004','NV-2004',
   'eeeeeeee-0007-0000-0000-000000000004',
   'paid','Plan datos anual + instalación – 4 unidades',
   23420.72,3747.32,27168.04,27168.04,0.00,
   'eeeeeeee-0003-0000-0000-000000000007','2026-01-10 08:00:00-06'),

  ('eeeeeeee-0008-0000-0000-000000000005','NV-2005',
   'eeeeeeee-0007-0000-0000-000000000005',
   'draft','DVR-DASH + plan 10GB – 3 unidades',
   39217.68,6274.82,45492.50,0.00,45492.50,
   'eeeeeeee-0003-0000-0000-000000000009','2026-02-26 15:00:00-06')
ON CONFLICT DO NOTHING;

-- ── SALE NOTE LINES ──────────────────────────────────────────

-- NV-2001 (mirrors COT-2001 product lines)
INSERT INTO sale_note_lines (id,sale_note_id,sequence,display_type,product_id,name,qty,unit_price_mxn,subtotal,tax_amount,total,quote_line_id)
VALUES
  ('eeeeeeee-0009-0000-0000-000000000001','eeeeeeee-0008-0000-0000-000000000001',1,'product',(SELECT id FROM products WHERE sku='DVR-DASH'    LIMIT 1),'DVR DASHCAM',    5,6306.30,31531.50,5045.04,36576.54,'eeeeeeee-0006-0000-0000-000000000001'),
  ('eeeeeeee-0009-0000-0000-000000000002','eeeeeeee-0008-0000-0000-000000000001',2,'product',(SELECT id FROM products WHERE sku='SD-128GB-WD'  LIMIT 1),'SD128GBWD',      5, 321.36, 1606.80, 257.09, 1863.89,'eeeeeeee-0006-0000-0000-000000000002'),
  ('eeeeeeee-0009-0000-0000-000000000003','eeeeeeee-0008-0000-0000-000000000001',3,'product',(SELECT id FROM products WHERE sku='CBL-IP-5M'    LIMIT 1),'CABLE IP 5MTS',  5, 219.98, 1099.90, 175.98, 1275.88,'eeeeeeee-0006-0000-0000-000000000003'),
  ('eeeeeeee-0009-0000-0000-000000000004','eeeeeeee-0008-0000-0000-000000000001',4,'product',(SELECT id FROM products WHERE sku='INST-DASH'    LIMIT 1),'INSTALACION DASH',5, 790.00, 3950.00, 632.00, 4582.00,'eeeeeeee-0006-0000-0000-000000000004'),
  ('eeeeeeee-0009-0000-0000-000000000005','eeeeeeee-0008-0000-0000-000000000001',5,'product',(SELECT id FROM products WHERE sku='POL-DASH'     LIMIT 1),'POLIZA DASHCAM',  5,1190.00, 5950.00, 952.00, 6902.00,'eeeeeeee-0006-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- NV-2002 (mirrors COT-2002)
INSERT INTO sale_note_lines (id,sale_note_id,sequence,display_type,product_id,name,qty,unit_price_mxn,subtotal,tax_amount,total,quote_line_id)
VALUES
  ('eeeeeeee-0009-0000-0000-000000000006','eeeeeeee-0008-0000-0000-000000000002',1,'product',(SELECT id FROM products WHERE sku='MDVRCH5'      LIMIT 1),'DVR M1N (5Ch)',  6,6240.00,37440.00,5990.40,43430.40,'eeeeeeee-0006-0000-0000-000000000006'),
  ('eeeeeeee-0009-0000-0000-000000000007','eeeeeeee-0008-0000-0000-000000000002',2,'product',(SELECT id FROM products WHERE sku='SD-256GB-WD'  LIMIT 1),'SD256GBWD',      6, 967.46, 5804.76, 928.76, 6733.52,'eeeeeeee-0006-0000-0000-000000000007'),
  ('eeeeeeee-0009-0000-0000-000000000008','eeeeeeee-0008-0000-0000-000000000002',3,'product',(SELECT id FROM products WHERE sku='INST-M1N'     LIMIT 1),'INSTALACION M1N',6, 990.00, 5940.00, 950.40, 6890.40,'eeeeeeee-0006-0000-0000-000000000008'),
  ('eeeeeeee-0009-0000-0000-000000000009','eeeeeeee-0008-0000-0000-000000000002',4,'product',(SELECT id FROM products WHERE sku='HOSP-SMART'   LIMIT 1),'HOSPEDAJE SMART',6,1980.00,11880.00,1900.80,13780.80,'eeeeeeee-0006-0000-0000-000000000009')
ON CONFLICT DO NOTHING;

-- NV-2003 (mirrors COT-2003)
INSERT INTO sale_note_lines (id,sale_note_id,sequence,display_type,product_id,name,qty,unit_price_mxn,subtotal,tax_amount,total,quote_line_id)
VALUES
  ('eeeeeeee-0009-0000-0000-000000000010','eeeeeeee-0008-0000-0000-000000000003',1,'product',(SELECT id FROM products WHERE sku='DVR-360-4CH'  LIMIT 1),'DVR 360° (4Ch)', 8,8305.44,66443.52,10630.96,77074.48,'eeeeeeee-0006-0000-0000-000000000010'),
  ('eeeeeeee-0009-0000-0000-000000000011','eeeeeeee-0008-0000-0000-000000000003',2,'product',(SELECT id FROM products WHERE sku='SD-512GB-WD'  LIMIT 1),'SD512GBWD',      8,3354.00,26832.00, 4293.12,31125.12,'eeeeeeee-0006-0000-0000-000000000011'),
  ('eeeeeeee-0009-0000-0000-000000000012','eeeeeeee-0008-0000-0000-000000000003',3,'product',(SELECT id FROM products WHERE sku='INST-X3'      LIMIT 1),'INSTALACION X3',  8,1490.00,11920.00, 1907.20,13827.20,'eeeeeeee-0006-0000-0000-000000000012'),
  ('eeeeeeee-0009-0000-0000-000000000013','eeeeeeee-0008-0000-0000-000000000003',4,'product',(SELECT id FROM products WHERE sku='POL-X3-T1'    LIMIT 1),'POLIZA X3 T1',   8,2290.00,18320.00, 2931.20,21251.20,'eeeeeeee-0006-0000-0000-000000000013')
ON CONFLICT DO NOTHING;

-- NV-2004 (mirrors COT-2004)
INSERT INTO sale_note_lines (id,sale_note_id,sequence,display_type,product_id,name,qty,unit_price_mxn,subtotal,tax_amount,total,quote_line_id)
VALUES
  ('eeeeeeee-0009-0000-0000-000000000014','eeeeeeee-0008-0000-0000-000000000004',1,'product',(SELECT id FROM products WHERE sku='PLAN-AN-5GB'  LIMIT 1),'PLAN ANUAL 5GB',  4,3575.18,14300.72,2288.12,16588.84,'eeeeeeee-0006-0000-0000-000000000014'),
  ('eeeeeeee-0009-0000-0000-000000000015','eeeeeeee-0008-0000-0000-000000000004',2,'product',(SELECT id FROM products WHERE sku='INST-DASH'    LIMIT 1),'INSTALACION DASH',4, 790.00, 3160.00, 505.60, 3665.60,'eeeeeeee-0006-0000-0000-000000000015'),
  ('eeeeeeee-0009-0000-0000-000000000016','eeeeeeee-0008-0000-0000-000000000004',3,'product',(SELECT id FROM products WHERE sku='POL-DASHIA-T1' LIMIT 1),'POLIZA DASH IA T1',4,1490.00,5960.00,953.60,6913.60,'eeeeeeee-0006-0000-0000-000000000016')
ON CONFLICT DO NOTHING;

-- NV-2005 (mirrors COT-2005)
INSERT INTO sale_note_lines (id,sale_note_id,sequence,display_type,product_id,name,qty,unit_price_mxn,subtotal,tax_amount,total,quote_line_id)
VALUES
  ('eeeeeeee-0009-0000-0000-000000000017','eeeeeeee-0008-0000-0000-000000000005',1,'product',(SELECT id FROM products WHERE sku='DVR-DASH'     LIMIT 1),'DVR DASHCAM',     3,6306.30,18918.90,3027.02,21945.92,'eeeeeeee-0006-0000-0000-000000000017'),
  ('eeeeeeee-0009-0000-0000-000000000018','eeeeeeee-0008-0000-0000-000000000005',2,'product',(SELECT id FROM products WHERE sku='SD-256GB-WD'  LIMIT 1),'SD256GBWD',       3, 967.46, 2902.38, 464.38, 3366.76,'eeeeeeee-0006-0000-0000-000000000018'),
  ('eeeeeeee-0009-0000-0000-000000000019','eeeeeeee-0008-0000-0000-000000000005',3,'product',(SELECT id FROM products WHERE sku='BTN-PANICO'   LIMIT 1),'BOTON DE PANICO', 3, 489.00, 1467.00, 234.72, 1701.72,'eeeeeeee-0006-0000-0000-000000000019'),
  ('eeeeeeee-0009-0000-0000-000000000020','eeeeeeee-0008-0000-0000-000000000005',4,'product',(SELECT id FROM products WHERE sku='INST-DASH'    LIMIT 1),'INSTALACION DASH',3, 790.00, 2370.00, 379.20, 2749.20,'eeeeeeee-0006-0000-0000-000000000020'),
  ('eeeeeeee-0009-0000-0000-000000000021','eeeeeeee-0008-0000-0000-000000000005',5,'product',(SELECT id FROM products WHERE sku='PLAN-AN-10GB' LIMIT 1),'PLAN ANUAL 10GB', 3,4519.80,13559.40,2169.50,15728.90,'eeeeeeee-0006-0000-0000-000000000021')
ON CONFLICT DO NOTHING;

-- ── CUSTOMER PAYMENTS ────────────────────────────────────────
-- PAG-2001: 20000.00  transferencia  Fletes Reyes    → applied to NV-2001
-- PAG-2002: 70835.12  transferencia  Vigilancia Bajío → applied to NV-2002
-- PAG-2003: 50000.00  deposito       Autobuses NE    → applied to NV-2003
-- PAG-2004: 27168.04  efectivo       Seg Coahuila    → applied to NV-2004
-- PAG-2005: 10000.00  tarjeta        Dist Mexicana   → draft (not applied)

INSERT INTO customer_payments (
  id, number, customer_id, state, concept,
  amount, payment_method, payment_date, reference, registered_by, created_at
) VALUES
  ('eeeeeeee-0010-0000-0000-000000000001','PAG-2001',
   'eeeeeeee-0001-0000-0000-000000000001',
   'confirmed','Anticipo 50% – VTA-2001',
   20000.00,'transferencia','2026-02-15','SPEI-FTR-2026-001',
   (SELECT id FROM users WHERE username='admin' LIMIT 1),
   '2026-02-15 11:00:00-06'),

  ('eeeeeeee-0010-0000-0000-000000000002','PAG-2002',
   'eeeeeeee-0001-0000-0000-000000000002',
   'confirmed','Pago total – VTA-2002',
   70835.12,'transferencia','2026-01-30','SPEI-VIB-2026-002',
   (SELECT id FROM users WHERE username='admin' LIMIT 1),
   '2026-01-30 10:00:00-06'),

  ('eeeeeeee-0010-0000-0000-000000000003','PAG-2003',
   'eeeeeeee-0001-0000-0000-000000000003',
   'confirmed','Anticipo VTA-2003',
   50000.00,'deposito','2026-02-28','DEP-ANE-2026-003',
   (SELECT id FROM users WHERE username='admin' LIMIT 1),
   '2026-02-28 09:30:00-06'),

  ('eeeeeeee-0010-0000-0000-000000000004','PAG-2004',
   'eeeeeeee-0001-0000-0000-000000000004',
   'confirmed','Liquidación total – VTA-2004',
   27168.04,'efectivo','2026-03-10',NULL,
   (SELECT id FROM users WHERE username='admin' LIMIT 1),
   '2026-03-10 12:00:00-06'),

  ('eeeeeeee-0010-0000-0000-000000000005','PAG-2005',
   'eeeeeeee-0001-0000-0000-000000000005',
   'draft','Anticipo parcial – VTA-2005',
   10000.00,'tarjeta','2026-04-01',NULL,
   (SELECT id FROM users WHERE username='sales1' LIMIT 1),
   '2026-04-01 16:00:00-06')
ON CONFLICT DO NOTHING;

-- ── PAYMENT APPLICATIONS ─────────────────────────────────────
-- PAG-2005 is draft → no application

INSERT INTO payment_applications (id, payment_id, sale_note_id, amount, created_at)
VALUES
  ('eeeeeeee-0011-0000-0000-000000000001',
   'eeeeeeee-0010-0000-0000-000000000001',
   'eeeeeeee-0008-0000-0000-000000000001',
   20000.00,'2026-02-15 11:05:00-06'),

  ('eeeeeeee-0011-0000-0000-000000000002',
   'eeeeeeee-0010-0000-0000-000000000002',
   'eeeeeeee-0008-0000-0000-000000000002',
   70835.12,'2026-01-30 10:05:00-06'),

  ('eeeeeeee-0011-0000-0000-000000000003',
   'eeeeeeee-0010-0000-0000-000000000003',
   'eeeeeeee-0008-0000-0000-000000000003',
   50000.00,'2026-02-28 09:35:00-06'),

  ('eeeeeeee-0011-0000-0000-000000000004',
   'eeeeeeee-0010-0000-0000-000000000004',
   'eeeeeeee-0008-0000-0000-000000000004',
   27168.04,'2026-03-10 12:05:00-06')
ON CONFLICT DO NOTHING;

-- ── PAYMENT SCHEDULE ITEMS (3 per sale = 15 total) ───────────
-- Totals: VTA-2001=51200.31  VTA-2002=70835.12  VTA-2003=143278.00
--         VTA-2004=27168.04  VTA-2005=45492.50

INSERT INTO payment_schedule_items (id, sale_id, due_date, amount, label, sequence, state)
VALUES
  -- VTA-2001: 20000(paid) + 15600.15 + 15600.16 = 51200.31
  ('eeeeeeee-0013-0000-0000-000000000001','eeeeeeee-0007-0000-0000-000000000001','2026-01-15',20000.00,'Anticipo',1,'paid'),
  ('eeeeeeee-0013-0000-0000-000000000002','eeeeeeee-0007-0000-0000-000000000001','2026-03-15',15600.15,'Segunda exhibición',2,'pending'),
  ('eeeeeeee-0013-0000-0000-000000000003','eeeeeeee-0007-0000-0000-000000000001','2026-05-15',15600.16,'Liquidación',3,'pending'),

  -- VTA-2002: 25000(paid) + 25000(paid) + 20835.12(paid) = 70835.12
  ('eeeeeeee-0013-0000-0000-000000000004','eeeeeeee-0007-0000-0000-000000000002','2025-12-15',25000.00,'Primera exhibición',1,'paid'),
  ('eeeeeeee-0013-0000-0000-000000000005','eeeeeeee-0007-0000-0000-000000000002','2026-01-15',25000.00,'Segunda exhibición',2,'paid'),
  ('eeeeeeee-0013-0000-0000-000000000006','eeeeeeee-0007-0000-0000-000000000002','2026-01-30',20835.12,'Liquidación',3,'paid'),

  -- VTA-2003: 50000(paid) + 50000(pending) + 43278.00(pending) = 143278.00
  ('eeeeeeee-0013-0000-0000-000000000007','eeeeeeee-0007-0000-0000-000000000003','2026-01-30',50000.00,'Anticipo 35%',1,'paid'),
  ('eeeeeeee-0013-0000-0000-000000000008','eeeeeeee-0007-0000-0000-000000000003','2026-03-31',50000.00,'Segunda exhibición',2,'pending'),
  ('eeeeeeee-0013-0000-0000-000000000009','eeeeeeee-0007-0000-0000-000000000003','2026-05-31',43278.00,'Liquidación',3,'pending'),

  -- VTA-2004: 9056.01(paid) + 9056.01(paid) + 9056.02(paid) = 27168.04
  ('eeeeeeee-0013-0000-0000-000000000010','eeeeeeee-0007-0000-0000-000000000004','2025-12-01', 9056.01,'Primera parte',1,'paid'),
  ('eeeeeeee-0013-0000-0000-000000000011','eeeeeeee-0007-0000-0000-000000000004','2026-01-01', 9056.01,'Segunda parte',2,'paid'),
  ('eeeeeeee-0013-0000-0000-000000000012','eeeeeeee-0007-0000-0000-000000000004','2026-02-01', 9056.02,'Liquidación',3,'paid'),

  -- VTA-2005: 15164.17(pending) + 15164.17(pending) + 15164.16(pending) = 45492.50
  ('eeeeeeee-0013-0000-0000-000000000013','eeeeeeee-0007-0000-0000-000000000005','2026-03-01',15164.17,'Primera exhibición',1,'pending'),
  ('eeeeeeee-0013-0000-0000-000000000014','eeeeeeee-0007-0000-0000-000000000005','2026-04-01',15164.17,'Segunda exhibición',2,'pending'),
  ('eeeeeeee-0013-0000-0000-000000000015','eeeeeeee-0007-0000-0000-000000000005','2026-05-01',15164.16,'Liquidación',3,'pending')
ON CONFLICT DO NOTHING;

COMMIT;
