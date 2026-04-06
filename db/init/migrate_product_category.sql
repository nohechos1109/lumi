-- Agregar columna category a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text;

-- Actualizar categorías basadas en el nombre del producto (mapeo del CSV catalogo1.csv)
UPDATE products SET category = 'Servicios' WHERE name ILIKE 'SERVICIO%' OR name ILIKE 'INSTALACION%';
UPDATE products SET category = 'Polizas' WHERE name ILIKE 'POLIZA%';
UPDATE products SET category = 'Suscripciones' WHERE name ILIKE 'HOSPEDAJE%';
UPDATE products SET category = 'Grabadores' WHERE name ILIKE 'DVR%' OR name ILIKE 'GRABADOR%';
UPDATE products SET category = 'Almacenamiento' WHERE name ILIKE 'SD%' OR name ILIKE 'DISCO%';
UPDATE products SET category = 'Camaras' WHERE name ILIKE 'CAM %' OR name ILIKE 'CAM_%';
UPDATE products SET category = 'Cableado aviacion' WHERE name ILIKE 'CABLE %MTS' OR name ILIKE 'CABLE IP %MTS';
UPDATE products SET category = 'Cableado especializado CP4' WHERE name ILIKE 'CABLE%CP4%' OR name ILIKE 'MODULO DE ALARMA%';
UPDATE products SET category = 'Cableado especializado' WHERE category IS NULL AND (name ILIKE 'CABLE%');
UPDATE products SET category = 'Pantallas' WHERE name ILIKE 'PANTALLA%';
UPDATE products SET category = 'Boletera' WHERE name ILIKE 'BOLETERA%' OR name ILIKE 'IMPRESORA%' OR name ILIKE 'SOPORTE%';
UPDATE products SET category = 'Accesorios' WHERE category IS NULL AND (
  name ILIKE 'GABINETE%' OR name ILIKE 'PORTA%' OR name ILIKE 'CABEZAL%' OR
  name ILIKE 'REGULADOR%' OR name ILIKE 'EASY%' OR name ILIKE 'ANTENA%' OR
  name ILIKE 'DATAHUB%' OR name ILIKE 'BOTON DE PANICO%' OR name ILIKE 'DISPLAY%' OR
  name ILIKE 'BRAKET%' OR name ILIKE 'DIADEMA%' OR name ILIKE 'CHAPA%' OR
  name ILIKE 'CONVERTIDOR%' OR name ILIKE 'LECTOR%'
);
UPDATE products SET category = 'Actuadores' WHERE name ILIKE 'BOTON NEGRO%' OR name ILIKE 'BOTON ROJO%' OR
  name ILIKE 'TAPON%' OR name ILIKE 'SWITCH %' OR name ILIKE 'CLIP SUJETADOR%' OR
  name ILIKE 'PASTILLA%' OR name ILIKE 'KIT %';
UPDATE products SET category = 'Planes de datos' WHERE name ILIKE 'SIM%' OR name ILIKE 'PLAN ANUAL%';
UPDATE products SET category = 'Alarma inalambrica' WHERE category IS NULL AND (
  name ILIKE 'PANEL%' OR name ILIKE 'CONTACTO%' OR name ILIKE 'DETECT%' OR
  name ILIKE 'SIRENA%' OR name ILIKE 'RELAY%' OR name ILIKE 'CONTROL%' OR
  name ILIKE 'TROMPETA%' OR name ILIKE 'ESTROBO%' OR name ILIKE 'BATERIA%' OR
  name ILIKE 'PANICO%' OR name ILIKE 'PIRCAM%' OR name ILIKE 'TECLADO%'
);

-- Los que no matcheen quedan como 'Varios'
UPDATE products SET category = 'Varios' WHERE category IS NULL;
