import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5NywiZXhwIjoyMDg4NzQ5NTk3fQ.NhK0bVSyLcWAP8EXU35agSs89DCq2LBhRTXv2_P-Y0A';
const supabase = createClient(process.env.SUPABASE_URL!, SERVICE_ROLE_KEY);

async function run() {
  console.log('--- Creando Tabla de Asignación de Avales ---');
  
  // Como no hay SQL directo vía Supabase JS, sugerimos el SQL o intentamos por RPC si existe
  // En este caso, usaremos el SQL para que el usuario o nosotros por consola lo apliquemos
  const sql = `
  CREATE TABLE IF NOT EXISTS public.asignacion_avales (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      num_cuenta TEXT NOT NULL,
      nombre_aval TEXT,
      domicilio_aval TEXT,
      gestor_asignado TEXT,
      tipo_aval TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
  );

  -- Habilitar RLS
  ALTER TABLE public.asignacion_avales ENABLE ROW LEVEL SECURITY;

  -- Políticas básicas (Permitir lectura para gestores)
  CREATE POLICY "Gestores can read their own aval assignments" 
  ON public.asignacion_avales
  FOR SELECT
  USING (true); -- Por ahora simplificado para acceso total en lectura
  `;

  console.log('SQL Sugerido (Ejecútalo en el SQL Editor de Supabase):');
  console.log(sql);
}

run();
