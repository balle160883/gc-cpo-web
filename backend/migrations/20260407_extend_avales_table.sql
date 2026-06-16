-- Ampliar la tabla de avales para incluir información detallada de ubicación
ALTER TABLE public.asignacion_avales
ADD COLUMN IF NOT EXISTS colonia_aval TEXT,
ADD COLUMN IF NOT EXISTS municipio_aval TEXT,
ADD COLUMN IF NOT EXISTS cp_aval TEXT,
ADD COLUMN IF NOT EXISTS cruces_aval TEXT,
ADD COLUMN IF NOT EXISTS estado_aval TEXT DEFAULT 'JALISCO';

-- Nota: Ya tenemos latitud y longitud agregadas anteriormente.
