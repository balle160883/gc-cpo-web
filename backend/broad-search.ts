
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('--- Búsqueda Parcial en usuarios_gestor ---');
  
  // Buscamos solo "GOMEZ" o "OLMEDO" para ver qué hay
  const { data: results, error } = await supabase
    .from('usuarios_gestor')
    .select('*')
    .or('gestor.ilike.%GOMEZ%,gestor.ilike.%OLMEDO%');

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`Resultados encontrados: ${results.length}`);
    console.log(results);
  }
}

run();
