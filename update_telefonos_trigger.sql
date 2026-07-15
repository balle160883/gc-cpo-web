-- Función que concatena el teléfono del socio con los de sus avales
CREATE OR REPLACE FUNCTION concat_avales_telefonos()
RETURNS TRIGGER AS $$
DECLARE
  socio_tel TEXT;
  aval1_tel TEXT;
  aval2_tel TEXT;
  new_tel TEXT;
BEGIN
  -- 1. Extraer el teléfono original del socio (lo que esté antes de '|')
  IF NEW."TELEFONOS" IS NOT NULL THEN
    socio_tel := TRIM(SPLIT_PART(NEW."TELEFONOS", '|', 1));
  ELSE
    socio_tel := '';
  END IF;

  -- 2. Limpiar teléfonos de avales
  aval1_tel := COALESCE(TRIM(NEW."TELÉFONOS D.A.1"), '');
  IF aval1_tel = 'NULL' OR aval1_tel = 'null' OR aval1_tel = '0' THEN
    aval1_tel := '';
  END IF;

  aval2_tel := COALESCE(TRIM(NEW."TELÉFONOS D.A.2"), '');
  IF aval2_tel = 'NULL' OR aval2_tel = 'null' OR aval2_tel = '0' THEN
    aval2_tel := '';
  END If;

  -- 3. Construir la cadena final concatenada
  new_tel := socio_tel;

  IF aval1_tel <> '' AND aval1_tel <> socio_tel THEN
    new_tel := new_tel || ' | A1: ' || aval1_tel;
  END IF;

  IF aval2_tel <> '' AND aval2_tel <> socio_tel AND aval2_tel <> aval1_tel THEN
    new_tel := new_tel || ' | A2: ' || aval2_tel;
  END IF;

  -- 4. Asignar el nuevo valor a la columna TELEFONOS
  NEW."TELEFONOS" := new_tel;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función antes de insertar o actualizar filas en asignacion_gestores
DROP TRIGGER IF EXISTS trigger_concat_avales_telefonos ON public.asignacion_gestores;
CREATE TRIGGER trigger_concat_avales_telefonos
BEFORE INSERT OR UPDATE OF "TELEFONOS", "TELÉFONOS D.A.1", "TELÉFONOS D.A.2"
ON public.asignacion_gestores
FOR EACH ROW
EXECUTE FUNCTION concat_avales_telefonos();
