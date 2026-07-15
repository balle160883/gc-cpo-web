CREATE OR REPLACE FUNCTION concat_avales_telefonos()
RETURNS TRIGGER AS $$
DECLARE
  socio_tel TEXT;
  aval1_tel TEXT;
  aval2_tel TEXT;
  new_tel TEXT;
  has_aval1 BOOLEAN;
  has_aval2 BOOLEAN;
  clean_tel TEXT;
BEGIN
  -- 1. Extraer el teléfono original del socio
  IF NEW."TELEFONOS" IS NOT NULL THEN
    clean_tel := TRIM(NEW."TELEFONOS");
    IF clean_tel ILIKE 'Socio:%' THEN
      socio_tel := TRIM(SPLIT_PART(SUBSTRING(clean_tel FROM 7), '|', 1));
    ELSE
      socio_tel := TRIM(SPLIT_PART(clean_tel, '|', 1));
    END IF;
    IF socio_tel = 'S/N' OR socio_tel = 's/n' THEN
      socio_tel := '';
    END IF;
  ELSE
    socio_tel := '';
  END IF;

  -- 2. Limpiar teléfonos de avales
  aval1_tel := COALESCE(TRIM(NEW."TELÉFONOS D.A.1"), '');
  IF aval1_tel = 'NULL' OR aval1_tel = 'null' OR aval1_tel = '0' OR aval1_tel = 'S/N' OR aval1_tel = 's/n' THEN
    aval1_tel := '';
  END IF;

  aval2_tel := COALESCE(TRIM(NEW."TELÉFONOS D.A.2"), '');
  IF aval2_tel = 'NULL' OR aval2_tel = 'null' OR aval2_tel = '0' OR aval2_tel = 'S/N' OR aval2_tel = 's/n' THEN
    aval2_tel := '';
  END IF;

  -- 3. Verificar si existen avales
  has_aval1 := (NEW."AVAL 1" IS NOT NULL AND NEW."AVAL 1" <> '') OR (NEW."NOMBRE D.A.1" IS NOT NULL AND NEW."NOMBRE D.A.1" <> '');
  has_aval2 := (NEW."AVAL 2" IS NOT NULL AND NEW."AVAL 2" <> '') OR (NEW."NOMBRE D.A.2" IS NOT NULL AND NEW."NOMBRE D.A.2" <> '');

  -- 4. Construir la cadena final concatenada
  new_tel := 'Socio: ' || COALESCE(NULLIF(socio_tel, ''), 'S/N');

  IF has_aval1 THEN
    new_tel := new_tel || ' | A1: ' || COALESCE(NULLIF(aval1_tel, ''), 'S/N');
  END IF;

  IF has_aval2 THEN
    new_tel := new_tel || ' | A2: ' || COALESCE(NULLIF(aval2_tel, ''), 'S/N');
  END IF;

  -- 5. Asignar el nuevo valor a la columna TELEFONOS
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
