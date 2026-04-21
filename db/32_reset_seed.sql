-- RESET + SEED (keep products intact)
-- UUIDs use only hex chars: 0-9, a-f

TRUNCATE TABLE
  audit_events, notifications, payment_applications, payment_schedule_items,
  sale_note_lines, sale_anticipos, service_materials, service_technicians,
  service_order_technicians, service_requests, services, service_orders,
  service_projects, sale_notes, sales, discount_approvals, quote_lines, quotes,
  plantilla_items, plantillas, files, delete_requests, projects, rutas, unidades,
  customer_payments, payment_terms, contact_company_links, contacts,
  users, global_settings
CASCADE;

-- GLOBAL SETTINGS (single row)
INSERT INTO global_settings (fx_mxn_per_usd, show_margin) VALUES (17.50, true);

-- USERS (password: demo1234)
INSERT INTO users (id, role, username, password_hash) VALUES
  ('aa000001-0000-0000-0000-000000000001', 'admin',   'admin',     '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe'),
  ('aa000001-0000-0000-0000-000000000002', 'sales',   'vendedor1', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe'),
  ('aa000001-0000-0000-0000-000000000003', 'tecnico', 'tecnico1',  '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe');

-- CONTACTS
INSERT INTO contacts (id, type, name, email, phone, tax_id) VALUES
  ('ab000001-0000-0000-0000-000000000001', 'company', 'Empresa Alfa S.A. de C.V.',     'contacto@alfa.com', '8181000001', 'EAL010101AAA'),
  ('ab000001-0000-0000-0000-000000000002', 'company', 'Transportes Beta S.A. de C.V.', 'admin@beta.com',    '8181000002', 'TBE020202BBB'),
  ('ab000001-0000-0000-0000-000000000003', 'company', 'Seguridad Gamma S.A.',          'info@gamma.com',    '8181000003', 'SGA030303CCC');

-- PAYMENT TERMS (lookup: just names)
INSERT INTO payment_terms (id, name) VALUES
  ('ac000001-0000-0000-0000-000000000001', 'Contado'),
  ('ac000001-0000-0000-0000-000000000002', 'Net 30'),
  ('ac000001-0000-0000-0000-000000000003', '50/50');

-- RUTAS
INSERT INTO rutas (id, name, cliente_id) VALUES
  ('cc000001-0000-0000-0000-000000000001', 'Ruta Norte',  'ab000001-0000-0000-0000-000000000001'),
  ('cc000001-0000-0000-0000-000000000002', 'Ruta Centro', 'ab000001-0000-0000-0000-000000000002'),
  ('cc000001-0000-0000-0000-000000000003', 'Ruta Sur',    'ab000001-0000-0000-0000-000000000003');

-- UNIDADES
INSERT INTO unidades (id, name, empresa_id, ruta_id) VALUES
  ('dd000001-0000-0000-0000-000000000001', 'Unidad 001', 'ab000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001'),
  ('dd000001-0000-0000-0000-000000000002', 'Unidad 002', 'ab000001-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000002'),
  ('dd000001-0000-0000-0000-000000000003', 'Unidad 003', 'ab000001-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000003');

-- PROJECTS
INSERT INTO projects (id, name, customer_id, user_id, ruta_id, status) VALUES
  ('ee000001-0000-0000-0000-000000000001', 'Monitoreo Flota Alfa',     'ab000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000001', 'active'),
  ('ee000001-0000-0000-0000-000000000002', 'Rastreo Transportes Beta', 'ab000001-0000-0000-0000-000000000002', 'aa000001-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000002', 'active'),
  ('ee000001-0000-0000-0000-000000000003', 'Seguridad Perimetral',     'ab000001-0000-0000-0000-000000000003', 'aa000001-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000003', 'active');

-- QUOTES
INSERT INTO quotes (id, number, state, user_id, customer_id, project_id, description, quotation_date, fx_mxn_per_usd_snapshot, unit_count, amount_untaxed, amount_tax, amount_total) VALUES
  ('ff000001-0000-0000-0000-000000000001', 'COT-001', 'confirmed', 'aa000001-0000-0000-0000-000000000002', 'ab000001-0000-0000-0000-000000000001', 'ee000001-0000-0000-0000-000000000001', 'Sistema GPS 5 unidades', NOW(), 17.50, 5, 30250.00, 4840.00, 35090.00),
  ('ff000001-0000-0000-0000-000000000002', 'COT-002', 'sent',      'aa000001-0000-0000-0000-000000000002', 'ab000001-0000-0000-0000-000000000002', 'ee000001-0000-0000-0000-000000000002', 'Rastreo 3 camiones',     NOW(), 17.50, 3, 17528.88, 2804.62, 20333.50),
  ('ff000001-0000-0000-0000-000000000003', 'COT-003', 'draft',     'aa000001-0000-0000-0000-000000000002', 'ab000001-0000-0000-0000-000000000003', 'ee000001-0000-0000-0000-000000000003', 'Camaras perimetrales',   NOW(), 17.50, 1,  8500.00, 1360.00,  9860.00);

-- QUOTE LINES
INSERT INTO quote_lines (id, quote_id, sequence, display_type, product_id, name, qty, discount_percent, currency_snapshot, cost_base_snapshot, utility_fixed_snapshot, utility_factor_snapshot, fx_snapshot, unit_price_mxn_suggested, unit_price_mxn_effective, subtotal, tax_amount, total, margin_amount) VALUES
  ('ba000001-0000-0000-0000-000000000001', 'ff000001-0000-0000-0000-000000000001', 10, 'product', '00000000-0009-0000-0000-000000000025', 'DVR M1N (5Ch)',  5, 0, 'USD', 240.00, 0, 1.30, 17.50, 5460.00, 5460.00, 27300.00, 4368.00, 31668.00, 6300.00),
  ('ba000001-0000-0000-0000-000000000002', 'ff000001-0000-0000-0000-000000000001', 20, 'product', '00000000-0009-0000-0000-000000000003', 'SERVICIO SITIO', 5, 0, 'MXN',   0.00, 590, 1.00, 1.00,   590.00,  590.00,  2950.00,  472.00,  3422.00, 2950.00),
  ('ba000001-0000-0000-0000-000000000003', 'ff000001-0000-0000-0000-000000000002', 10, 'product', '00000000-0009-0000-0000-000000000026', 'GRABADOR (6Ch)', 3, 0, 'USD', 304.05, 0, 1.10, 17.50, 5842.96, 5842.96, 17528.88, 2804.62, 20333.50, 1594.26);

-- SALES
INSERT INTO sales (id, number, quote_id, customer_id, user_id, amount_untaxed, amount_tax, amount_total, amount_paid, amount_balance, unit_count) VALUES
  ('bb000001-0000-0000-0000-000000000001', 'VTA-001', 'ff000001-0000-0000-0000-000000000001', 'ab000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000002', 30250.00, 4840.00, 35090.00,     0.00, 35090.00, 5),
  ('bb000001-0000-0000-0000-000000000002', 'VTA-002', NULL,                                   'ab000001-0000-0000-0000-000000000002', 'aa000001-0000-0000-0000-000000000002',  8500.00, 1360.00,  9860.00,  4930.00,  4930.00, 1),
  ('bb000001-0000-0000-0000-000000000003', 'VTA-003', NULL,                                   'ab000001-0000-0000-0000-000000000003', 'aa000001-0000-0000-0000-000000000002',  4200.00,  672.00,  4872.00,  4872.00,     0.00, 1);

-- PLANTILLAS
INSERT INTO plantillas (id, nombre, requerimiento) VALUES
  ('bd000001-0000-0000-0000-000000000001', 'Kit DVR Basico',   'DVR + servicio sitio 1 unidad'),
  ('bd000001-0000-0000-0000-000000000002', 'Kit DVR 6ch',      'Grabador 6ch + servicio sitio'),
  ('bd000001-0000-0000-0000-000000000003', 'Servicio Express',  'Solo servicio sitio');

-- PLANTILLA ITEMS (no id column)
INSERT INTO plantilla_items (plantilla_id, sequence, product_id, qty) VALUES
  ('bd000001-0000-0000-0000-000000000001', 10, '00000000-0009-0000-0000-000000000025', 1),
  ('bd000001-0000-0000-0000-000000000001', 20, '00000000-0009-0000-0000-000000000003', 1),
  ('bd000001-0000-0000-0000-000000000002', 10, '00000000-0009-0000-0000-000000000026', 1);

-- SERVICE PROJECTS
INSERT INTO service_projects (id, number, name, customer_id, sale_id, created_by, status, observaciones) VALUES
  ('be000001-0000-0000-0000-000000000001', 'SVP-001', 'Sistema GPS 5 unidades',    'ab000001-0000-0000-0000-000000000001', 'bb000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'open',        'Auto-generado desde VTA-001'),
  ('be000001-0000-0000-0000-000000000002', 'SVP-002', 'Mantenimiento Preventivo',  'ab000001-0000-0000-0000-000000000002', NULL,                                   'aa000001-0000-0000-0000-000000000001', 'in_progress', NULL),
  ('be000001-0000-0000-0000-000000000003', 'SVP-003', 'Instalacion Camaras Gamma', 'ab000001-0000-0000-0000-000000000003', NULL,                                   'aa000001-0000-0000-0000-000000000001', 'open',        NULL);

-- SERVICE ORDERS
INSERT INTO service_orders (id, number, service_project_id, estatus, motivo_del_servicio, created_by) VALUES
  ('bf000001-0000-0000-0000-000000000001', 'OSV-001', 'be000001-0000-0000-0000-000000000001', 'pendiente', 'SERVICIO SITIO',           'aa000001-0000-0000-0000-000000000001'),
  ('bf000001-0000-0000-0000-000000000002', 'OSV-002', 'be000001-0000-0000-0000-000000000002', 'agendado',  'Revision equipo GPS',     'aa000001-0000-0000-0000-000000000001'),
  ('bf000001-0000-0000-0000-000000000003', 'OSV-003', 'be000001-0000-0000-0000-000000000003', 'en_curso',  'Montaje camaras exterior', 'aa000001-0000-0000-0000-000000000001');

-- SERVICES
INSERT INTO services (id, number, service_order_id, customer_id, estatus, motivo_visita, iniciado_por, unidad_id) VALUES
  ('ca000001-0000-0000-0000-000000000001', 'SRV-001', 'bf000001-0000-0000-0000-000000000001', 'ab000001-0000-0000-0000-000000000001', 'pendiente', 'SERVICIO SITIO',       'aa000001-0000-0000-0000-000000000001', 'dd000001-0000-0000-0000-000000000001'),
  ('ca000001-0000-0000-0000-000000000002', 'SRV-002', 'bf000001-0000-0000-0000-000000000002', 'ab000001-0000-0000-0000-000000000002', 'agendado',  'Revision equipo GPS',  'aa000001-0000-0000-0000-000000000001', 'dd000001-0000-0000-0000-000000000002'),
  ('ca000001-0000-0000-0000-000000000003', 'SRV-003', 'bf000001-0000-0000-0000-000000000003', 'ab000001-0000-0000-0000-000000000003', 'en_curso',  'Montaje camaras domo', 'aa000001-0000-0000-0000-000000000001', 'dd000001-0000-0000-0000-000000000003');

-- SERVICE REQUESTS
INSERT INTO service_requests (id, requested_by, customer_id, motivo, status) VALUES
  ('cb000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000002', 'ab000001-0000-0000-0000-000000000001', 'Falla en DVR unidad 001',         'pending'),
  ('cb000001-0000-0000-0000-000000000002', 'aa000001-0000-0000-0000-000000000002', 'ab000001-0000-0000-0000-000000000002', 'Camara sin senal camion 3',       'approved'),
  ('cb000001-0000-0000-0000-000000000003', 'aa000001-0000-0000-0000-000000000002', 'ab000001-0000-0000-0000-000000000003', 'Solicitud instalacion adicional', 'pending');

-- SERVICE MATERIALS
INSERT INTO service_materials (id, service_id, product_id, quantity, unit_price, created_by) VALUES
  ('cc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', '00000000-0009-0000-0000-000000000025', 1, 5460.00, 'aa000001-0000-0000-0000-000000000003'),
  ('cc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000002', '00000000-0009-0000-0000-000000000026', 1, 5842.96, 'aa000001-0000-0000-0000-000000000003'),
  ('cc000001-0000-0000-0000-000000000003', 'ca000001-0000-0000-0000-000000000003', '00000000-0009-0000-0000-000000000003', 1,  590.00, 'aa000001-0000-0000-0000-000000000003');

-- SALE NOTES
INSERT INTO sale_notes (id, number, sale_id, service_id, state, concept, amount_untaxed, amount_tax, amount_total, amount_balance) VALUES
  ('cd000001-0000-0000-0000-000000000001', 'NTA-001', 'bb000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', 'draft',     'Materiales SRV-001', 5460.00, 873.60, 6333.60, 6333.60),
  ('cd000001-0000-0000-0000-000000000002', 'NTA-002', 'bb000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000002', 'confirmed', 'Materiales SRV-002', 5842.96, 934.87, 6777.83, 6777.83),
  ('cd000001-0000-0000-0000-000000000003', 'NTA-003', 'bb000001-0000-0000-0000-000000000003', 'ca000001-0000-0000-0000-000000000003', 'draft',     'Materiales SRV-003',  590.00,  94.40,  684.40,  684.40);

-- SALE NOTE LINES
INSERT INTO sale_note_lines (id, sale_note_id, sequence, display_type, product_id, name, qty, unit_price_mxn, subtotal, tax_amount, total) VALUES
  ('ce000001-0000-0000-0000-000000000001', 'cd000001-0000-0000-0000-000000000001', 10, 'product', '00000000-0009-0000-0000-000000000025', 'DVR M1N (5Ch)',  1, 5460.00, 5460.00, 873.60, 6333.60),
  ('ce000001-0000-0000-0000-000000000002', 'cd000001-0000-0000-0000-000000000002', 10, 'product', '00000000-0009-0000-0000-000000000026', 'GRABADOR (6Ch)', 1, 5842.96, 5842.96, 934.87, 6777.83),
  ('ce000001-0000-0000-0000-000000000003', 'cd000001-0000-0000-0000-000000000003', 10, 'product', '00000000-0009-0000-0000-000000000003', 'SERVICIO SITIO', 1,  590.00,  590.00,  94.40,  684.40);

-- NOTIFICATIONS
INSERT INTO notifications (id, user_id, type, title, message, entity, entity_id) VALUES
  ('cf000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000002', 'sale_created', 'Venta VTA-001 creada',        'Se genero la venta para COT-001',          'sale',    'bb000001-0000-0000-0000-000000000001'),
  ('cf000001-0000-0000-0000-000000000002', 'aa000001-0000-0000-0000-000000000001', 'sale_created', 'Nueva solicitud de servicio', 'Falla en DVR unidad 001',                  'service', 'ca000001-0000-0000-0000-000000000001'),
  ('cf000001-0000-0000-0000-000000000003', 'aa000001-0000-0000-0000-000000000002', 'sale_created', 'Cotizacion COT-002 enviada',  'Tu cotizacion fue enviada al cliente Beta', 'quote',   'ff000001-0000-0000-0000-000000000002');
