import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function checkData() {
  console.log('--- Verificando Datos ---');
  
  const tables = ['usuarios_gestor', 'asignacion_gestores', 'socios_datos', 'prestamos_datos'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error en ${table}:`, error.message);
    } else {
      console.log(`Tabla ${table}: ${count} filas.`);
    }
  }
}

checkData();
