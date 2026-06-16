-- Add foreign key relationship for real-time synchronization
ALTER TABLE public.asignacion_avales
ADD CONSTRAINT fk_avales_cuenta
FOREIGN KEY (num_cuenta) 
REFERENCES public.asignacion_gestores(NoCUENTA)
ON DELETE CASCADE;
