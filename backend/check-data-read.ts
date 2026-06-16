import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function checkData() {
  console.log('--- Intentando Leer Datos Reales ---');
  
  const tables = ['usuarios_gestor', 'asignacion_gestores', 'socios_datos', 'prestamos_datos'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error en ${table}:`, error.message);
    } else {
      console.log(`Tabla ${table}: ${data?.length || 0} filas leídas.`);
      if (data && data.length > 0) {
        console.log(`Ejemplo de datos en ${table}:`, Object.keys(data[0]));
      }
    }
  }
}

checkData();
