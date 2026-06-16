-- Migración: Añadir coordenadas independientes para Avales
ALTER TABLE asignacion_gestores 
ADD COLUMN "LATITUD_A1" NUMERIC,
ADD COLUMN "LONGITUD_A1" NUMERIC,
ADD COLUMN "LATITUD_A2" NUMERIC,
ADD COLUMN "LONGITUD_A2" NUMERIC;

COMMENT ON COLUMN asignacion_gestores."LATITUD_A1" IS 'Latitud de geocodificación para el Aval 1';
COMMENT ON COLUMN asignacion_gestores."LONGITUD_A1" IS 'Longitud de geocodificación para el Aval 1';
COMMENT ON COLUMN asignacion_gestores."LATITUD_A2" IS 'Latitud de geocodificación para el Aval 2';
COMMENT ON COLUMN asignacion_gestores."LONGITUD_A2" IS 'Longitud de geocodificación para el Aval 2';
