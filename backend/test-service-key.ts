import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5NywiZXhwIjoyMDg4NzQ5NTk3fQ.NhK0bVSyLcWAP8EXU35agSs89DCq2LBhRTXv2_P-Y0A';

const supabase = createClient(process.env.SUPABASE_URL!, SERVICE_ROLE_KEY);

async function testServiceKey() {
  console.log('--- Probando Service Role Key ---');
  
  const tables = ['usuarios_gestor', 'asignacion_gestores', 'socios_datos', 'prestamos_datos'];
  
  for (const table of tables) {
    const { data, count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: false })
      .limit(1);
    
    if (error) {
       console.error(`Error en ${table}:`, error.message);
    } else {
       console.log(`Tabla ${table}: ${count} filas totales.`);
       console.log(`Pudimos leer ${data?.length || 0} filas.`);
    }
  }
}

testServiceKey();
