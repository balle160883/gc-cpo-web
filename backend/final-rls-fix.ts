
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!, 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5NywiZXhwIjoyMDg4NzQ5NTk3fQ.NhK0bVSyLcWAP8EXU35agSs89DCq2LBhRTXv2_P-Y0A' // service_role key provided by user
);

async function run() {
  console.log('Intentando corregir políticas de RLS para ubicaciones_gestores...');
  
  // Como no podemos correr SQL arbitrario directamente vía RPC sin tener la función 'exec_sql' creada,
  // la mejor forma es habilitar el acceso total (GRANT) si es posible,
  // pero Supabase RLS se maneja mejor con CREATE POLICY.
  
  // Si no tenemos RPC para SQL, informaremos al usuario.
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      ALTER TABLE ubicaciones_gestores ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public access" ON ubicaciones_gestores;
      CREATE POLICY "Public access" ON ubicaciones_gestores FOR ALL USING (true) WITH CHECK (true);
      GRANT ALL ON TABLE ubicaciones_gestores TO anon;
      GRANT ALL ON TABLE ubicaciones_gestores TO authenticated;
      GRANT ALL ON TABLE ubicaciones_gestores TO service_role;
    `
  });

  if (error) {
    console.log('Fallo al ejecutar RPC (normal si no está habilitado).');
    console.log('Error:', error.message);
    
    // Plan B: Intentar insertar con el service_role para demostrar que funciona
    console.log('Verificando inserción con service_role...');
    const { error: insError } = await supabase.from('ubicaciones_gestores').insert({
      gestor_id: '38baaf2c-bc54-4b16-a3b2-749c7b647c6d', // David Aguayo
      latitud: 19.4326,
      longitud: -99.1332,
      timestamp: new Date().toISOString()
    });
    
    if (insError) {
      console.log('Incluso con service_role falló. Revisar permisos de tabla.');
    } else {
      console.log('✅ Inserción con service_role exitosa.');
    }
  } else {
    console.log('✅ Políticas de RLS actualizadas con éxito!');
  }
}

run();
