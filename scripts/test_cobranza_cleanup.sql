-- =============================================================
--  LIMPIEZA — Elimina todos los datos de prueba de cobranza
-- =============================================================
--
--  Ejecutar:
--    docker exec -i cotizador_db psql -U admin -d cotizador \
--      < scripts/test_cobranza_cleanup.sql
-- =============================================================

DO $$
DECLARE
  v_test_sale_ids uuid[] := ARRAY[
    'aaaaaaaa-1111-0000-0000-000000000001'::uuid,
    'aaaaaaaa-1111-0000-0000-000000000002'::uuid,
    'aaaaaaaa-1111-0000-0000-000000000003'::uuid
  ];
  v_test_note_ids uuid[] := ARRAY[
    'bbbbbbbb-1111-0000-0000-000000000001'::uuid,
    'bbbbbbbb-1111-0000-0000-000000000002'::uuid,
    'bbbbbbbb-1111-0000-0000-000000000003'::uuid,
    'bbbbbbbb-2222-0000-0000-000000000001'::uuid,
    'bbbbbbbb-3333-0000-0000-000000000001'::uuid,
    'bbbbbbbb-3333-0000-0000-000000000002'::uuid
  ];
  v_count int;
BEGIN
  -- 1. Payment applications de estas notas
  DELETE FROM payment_applications
  WHERE sale_note_id = ANY(v_test_note_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  Eliminadas % aplicaciones de pago', v_count;

  -- 2. Payments de estas ventas
  DELETE FROM payments
  WHERE sale_id = ANY(v_test_sale_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  Eliminados % pagos', v_count;

  -- 3. Schedule items
  DELETE FROM payment_schedule_items
  WHERE sale_id = ANY(v_test_sale_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  Eliminados % items de convenio', v_count;

  -- 4. Note lines
  DELETE FROM sale_note_lines
  WHERE sale_note_id = ANY(v_test_note_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  Eliminadas % líneas de nota', v_count;

  -- 5. Notes
  DELETE FROM sale_notes
  WHERE id = ANY(v_test_note_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  Eliminadas % notas', v_count;

  -- 6. Sales
  DELETE FROM sales
  WHERE id = ANY(v_test_sale_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  Eliminadas % ventas de prueba', v_count;

  RAISE NOTICE '  ✓  Limpieza completa';
END $$;
