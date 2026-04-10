-- 004_remove_initial_notes.sql — Remove auto-created initial notes with no payments applied

DELETE FROM sale_notes
WHERE concept LIKE 'Nota inicial%'
  AND id NOT IN (
    SELECT DISTINCT sale_note_id FROM payment_applications
  );
