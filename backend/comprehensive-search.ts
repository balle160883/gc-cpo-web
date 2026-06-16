
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log('--- Listando tablas y columnas relevantes ---');
  
  // Lista de posibles tablas
  const tables = ['perfiles', 'asignacion_gestores', 'usuarios', 'gestores', 'users'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`Tabla [${table}] no accesible o no existe.`);
    } else {
      console.log(`Tabla [${table}] detectada. Columnas:`, Object.keys(data[0] || {}));
      
      // Si es perfiles o asignacion_gestores, buscamos específicamente
      if (table === 'perfiles' || table === 'asignacion_gestores' || table === 'users') {
          const searchName = 'GOMEZ OLMEDO ANTONIO';
          // Buscamos en todas las columnas de texto (probando algunas probables)
          const columns = Object.keys(data[0] || {});
          for (const col of columns) {
              const { data: results, error: searchError } = await supabase
                .from(table)
                .select('*')
                .ilike(col, `%${searchName}%`);
              
              if (!searchError && results.length > 0) {
                  console.log(`¡ENCONTRADO en [${table}].[${col}]!`);
                  console.log(results);
              }
          }
      }
    }
  }
}

run();
