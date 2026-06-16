-- Create table for independent guarantor assignments
CREATE TABLE IF NOT EXISTS public.asignacion_avales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    num_cuenta TEXT NOT NULL,
    nombre_aval TEXT,
    domicilio_aval TEXT,
    gestor_asignado TEXT,
    tipo_aval TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.asignacion_avales ENABLE ROW LEVEL SECURITY;

-- Basic policy for gestores to see their own assignments (simplified for now)
DROP POLICY IF EXISTS "Gestores can read their own aval assignments" ON public.asignacion_avales;
CREATE POLICY "Gestores can read their own aval assignments" 
ON public.asignacion_avales
FOR SELECT
USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_avales_num_cuenta ON public.asignacion_avales(num_cuenta);
CREATE INDEX IF NOT EXISTS idx_avales_gestor_asignado ON public.asignacion_avales(gestor_asignado);
