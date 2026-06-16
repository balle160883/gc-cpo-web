-- Add latitude and longitude columns for geolocation
ALTER TABLE public.asignacion_avales
ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION;

-- Add index for performance in spatial queries (optional but good)
CREATE INDEX IF NOT EXISTS idx_avales_lat_long ON public.asignacion_avales(latitud, longitud);
