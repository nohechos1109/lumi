-- =============================================================
--  DATOS DE PRUEBA — Sistema de Cobranza
-- =============================================================
--
--  Ejecutar:
--    docker exec -i cotizador_db psql -U admin -d cotizador \
--      < scripts/test_cobranza.sql
--
--  Limpiar:
--    docker exec -i cotizador_db psql -U admin -d cotizador \
--      < scripts/test_cobranza_cleanup.sql
--
--  Login sugerido:   usuario "manager" / contraseña del seed
-- =============================================================

DO $$
DECLARE
  -- ── IDs de datos existentes ──────────────────────────────────
  v_customer_id  uuid := '00000000-0002-0000-0000-000000000001';  -- Constructora Vértice
  v_manager_id   uuid := '00000000-0001-0000-0000-000000000002';  -- manager
  v_quote_ref    uuid := '00000000-0007-0000-0000-000000000001';  -- COT-2026-001 (reusada)

  -- ── IDs fijos para poder eliminarlos fácilmente ──────────────
  -- Ventas
  v_sale_a_id    uuid := 'aaaaaaaa-1111-0000-0000-000000000001';
  v_sale_b_id    uuid := 'aaaaaaaa-1111-0000-0000-000000000002';
  v_sale_c_id    uuid := 'aaaaaaaa-1111-0000-0000-000000000003';

  -- Notas de Venta A (multi-abono)
  v_note_a1_id   uuid := 'bbbbbbbb-1111-0000-0000-000000000001';
  v_note_a2_id   uuid := 'bbbbbbbb-1111-0000-0000-000000000002';
  v_note_a3_id   uuid := 'bbbbbbbb-1111-0000-0000-000000000003';

  -- Notas de Venta B (convenio)
  v_note_b1_id   uuid := 'bbbbbbbb-2222-0000-0000-000000000001';

  -- Notas de Venta C (draft + cross-sale)
  v_note_c1_id   uuid := 'bbbbbbbb-3333-0000-0000-000000000001';
  v_note_c2_id   uuid := 'bbbbbbbb-3333-0000-0000-000000000002';

BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '  Insertando datos de prueba — Sistema de Cobranza';
  RAISE NOTICE '══════════════════════════════════════════════════════';

  -- ============================================================
  -- ESCENARIO A  ·  Multi-abono entre 3 notas (VTA-TEST-A01)
  -- ============================================================
  --  · 3 notas confirmadas: $2,000 + $3,500 + $1,200 = $6,700
  --  · Ruta / Unidad pre-cargadas para probar EditFieldsModal
  --
  --  Pruebas sugeridas:
  --    1. Seleccionar las 3 notas → abono $4,000
  --       Cascada esperada: A01 $2,000 (llena) | A02 $2,000 | A03 $0
  --    2. Abono $6,700 → paga las 3 notas completas
  --    3. Abono $6,800 → ERROR "excede saldo combinado"
  --    4. Editar distribución manualmente → desactiva auto-mode
  --       Clic "Auto-distribuir" → vuelve al modo cascada
  -- ============================================================
  INSERT INTO sales (id, number, quote_id, customer_id, user_id, state,
    amount_untaxed, amount_tax, amount_total, amount_balance)
  VALUES (v_sale_a_id, 'VTA-TEST-A01', v_quote_ref, v_customer_id, v_manager_id,
    'active', 5775.86, 924.14, 6700.00, 6700.00)
  ON CONFLICT (id) DO NOTHING;

  -- A01: $2,000  (más antigua — primera en cascada)
  INSERT INTO sale_notes
    (id, number, sale_id, state, concept,
     amount_untaxed, amount_tax, amount_total, amount_balance,
     ruta, unidad, observaciones, created_at)
  VALUES
    (v_note_a1_id, 'NTA-TEST-A01', v_sale_a_id, 'confirmed', 'Primera entrega',
     1724.14, 275.86, 2000.00, 2000.00,
     'Ruta Norte', 'UN-01', 'Entregar en bodega principal',
     NOW() - INTERVAL '5 days')
  ON CONFLICT (id) DO NOTHING;

  -- A02: $3,500
  INSERT INTO sale_notes
    (id, number, sale_id, state, concept,
     amount_untaxed, amount_tax, amount_total, amount_balance,
     ruta, unidad, created_at)
  VALUES
    (v_note_a2_id, 'NTA-TEST-A02', v_sale_a_id, 'confirmed', 'Segunda entrega',
     3017.24, 482.76, 3500.00, 3500.00,
     'Ruta Sur', 'UN-02',
     NOW() - INTERVAL '3 days')
  ON CONFLICT (id) DO NOTHING;

  -- A03: $1,200  (más reciente — última en cascada)
  INSERT INTO sale_notes
    (id, number, sale_id, state, concept,
     amount_untaxed, amount_tax, amount_total, amount_balance,
     ruta, unidad, created_at)
  VALUES
    (v_note_a3_id, 'NTA-TEST-A03', v_sale_a_id, 'confirmed', 'Tercera entrega',
     1034.48, 165.52, 1200.00, 1200.00,
     'Ruta Centro', 'UN-03',
     NOW() - INTERVAL '1 day')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '  ✓  VTA-TEST-A01  →  3 notas: $2,000 + $3,500 + $1,200 (total $6,700)';


  -- ============================================================
  -- ESCENARIO B  ·  Convenio de pago + auto-marcado (VTA-TEST-B01)
  -- ============================================================
  --  · 1 nota confirmada: $5,000
  --  · Convenio 3 cuotas: $2,000 (anticipo) | $2,000 (30d) | $1,000 (60d)
  --
  --  Pruebas sugeridas:
  --    1. Abono $2,500 → schedule: cuota 1 se marca "paid"
  --       (running $2,000 ≤ $2,500), cuota 2 sigue "pending"
  --       (running $4,000 > $2,500)
  --    2. Segundo abono $2,000 → sale.amount_paid = $4,500
  --       cuota 2 también se marca "paid" (running $4,000 ≤ $4,500)
  --    3. Abono final $500 → nota queda "paid", cuota 3 se marca
  -- ============================================================
  INSERT INTO sales (id, number, quote_id, customer_id, user_id, state,
    amount_untaxed, amount_tax, amount_total, amount_balance)
  VALUES (v_sale_b_id, 'VTA-TEST-B01', v_quote_ref, v_customer_id, v_manager_id,
    'active', 4310.34, 689.66, 5000.00, 5000.00)
  ON CONFLICT (id) DO NOTHING;

  -- B01: $5,000  confirmada
  INSERT INTO sale_notes
    (id, number, sale_id, state, concept,
     amount_untaxed, amount_tax, amount_total, amount_balance,
     observaciones, created_at)
  VALUES
    (v_note_b1_id, 'NTA-TEST-B01', v_sale_b_id, 'confirmed',
     'Entrega única con convenio de pago',
     4310.34, 689.66, 5000.00, 5000.00,
     'Verificar con almacén antes de entregar',
     NOW() - INTERVAL '7 days')
  ON CONFLICT (id) DO NOTHING;

  -- Convenio: 3 cuotas
  INSERT INTO payment_schedule_items (sale_id, due_date, amount, label, sequence, state)
  VALUES
    (v_sale_b_id, CURRENT_DATE,                        2000.00, 'Anticipo (al firmar)',  1, 'pending'),
    (v_sale_b_id, CURRENT_DATE + INTERVAL '30 days',   2000.00, 'Cuota 2 — 30 días',    2, 'pending'),
    (v_sale_b_id, CURRENT_DATE + INTERVAL '60 days',   1000.00, 'Cuota 3 — 60 días',    3, 'pending');

  RAISE NOTICE '  ✓  VTA-TEST-B01  →  nota $5,000 + convenio ($2,000 + $2,000 + $1,000)';


  -- ============================================================
  -- ESCENARIO C  ·  Nota draft + bloqueo cross-sale (VTA-TEST-C01)
  -- ============================================================
  --  · NTA-TEST-C01: estado DRAFT $3,000
  --      Al abonar → el endpoint auto-confirma antes de aplicar
  --  · NTA-TEST-C02: confirmada $4,000
  --      Pertenece a VTA-TEST-C01 ≠ VTA-TEST-A01
  --      → si A01 ya tiene nota(s) seleccionadas, el checkbox
  --        de C02 aparece deshabilitado (cross-sale lock)
  --
  --  Pruebas sugeridas:
  --    1. Clic abono en NTA-TEST-C01 (draft) → pago exitoso →
  --       refrescar /ventas/aaaaaaaa-1111-0000-0000-000000000003
  --       → la nota ahora muestra estado "confirmed" (o "paid")
  --    2. Seleccionar NTA-TEST-A01 → intentar seleccionar
  --       NTA-TEST-C02 → checkbox debe estar deshabilitado
  --    3. Intentar abono $3,100 a NTA-TEST-C01 →
  --       ERROR cliente "excede saldo ($3,000.00)"
  -- ============================================================
  INSERT INTO sales (id, number, quote_id, customer_id, user_id, state,
    amount_untaxed, amount_tax, amount_total, amount_balance)
  VALUES (v_sale_c_id, 'VTA-TEST-C01', v_quote_ref, v_customer_id, v_manager_id,
    'active', 6034.48, 965.52, 7000.00, 7000.00)
  ON CONFLICT (id) DO NOTHING;

  -- C01: DRAFT  $3,000  (se auto-confirma al recibir primer abono)
  INSERT INTO sale_notes
    (id, number, sale_id, state, concept,
     amount_untaxed, amount_tax, amount_total, amount_balance,
     created_at)
  VALUES
    (v_note_c1_id, 'NTA-TEST-C01', v_sale_c_id, 'draft',
     'Borrador — se auto-confirma al abonar',
     2586.21, 413.79, 3000.00, 3000.00,
     NOW() - INTERVAL '2 days')
  ON CONFLICT (id) DO NOTHING;

  -- C02: confirmed  $4,000  (diferente venta → cross-sale lock)
  INSERT INTO sale_notes
    (id, number, sale_id, state, concept,
     amount_untaxed, amount_tax, amount_total, amount_balance,
     created_at)
  VALUES
    (v_note_c2_id, 'NTA-TEST-C02', v_sale_c_id, 'confirmed',
     'Nota de otra venta (prueba bloqueo cross-sale)',
     3448.28, 551.72, 4000.00, 4000.00,
     NOW() - INTERVAL '1 day')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '  ✓  VTA-TEST-C01  →  draft $3,000 + confirmed $4,000';
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '  LISTO. Ve a /cobranza e inicia sesión como "manager"';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';

END $$;


-- ── Verificación rápida ──────────────────────────────────────────────────────
SELECT
  sn.number                                   AS nota,
  s.number                                    AS venta,
  sn.state,
  sn.amount_total::text                       AS total,
  sn.amount_balance::text                     AS saldo,
  COALESCE(sn.ruta, '—')                      AS ruta,
  COALESCE(sn.unidad, '—')                    AS unidad
FROM sale_notes sn
JOIN sales s ON s.id = sn.sale_id
WHERE s.number LIKE 'VTA-TEST-%'
ORDER BY s.number, sn.created_at;
