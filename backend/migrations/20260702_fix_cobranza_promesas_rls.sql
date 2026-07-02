-- Migración para corregir las políticas RLS (Row Level Security) en la tabla cobranza_promesas.
-- Permite a los gestores insertar promesas de pago desde la aplicación móvil.

ALTER TABLE public.cobranza_promesas ENABLE ROW LEVEL SECURITY;

-- 1. Permitir inserciones (Insert) desde la app móvil (anon / authenticated)
DROP POLICY IF EXISTS "Permitir inserciones anonimas" ON public.cobranza_promesas;
CREATE POLICY "Permitir inserciones anonimas" ON public.cobranza_promesas
    FOR INSERT 
    WITH CHECK (true);

-- 2. Permitir lecturas (Select) para que el backend y gestores puedan ver las promesas
DROP POLICY IF EXISTS "Permitir consultas anonimas" ON public.cobranza_promesas;
CREATE POLICY "Permitir consultas anonimas" ON public.cobranza_promesas
    FOR SELECT 
    USING (true);

-- 3. Permitir actualizaciones (Update) para cambiar estados
DROP POLICY IF EXISTS "Permitir actualizaciones anonimas" ON public.cobranza_promesas;
CREATE POLICY "Permitir actualizaciones anonimas" ON public.cobranza_promesas
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);
