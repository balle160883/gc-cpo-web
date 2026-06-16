
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Inspección de asignacion_gestores...');
  const { data, error } = await supabase.from('asignacion_gestores').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Fila completa:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('No hay datos en asignacion_gestores o error:', error);
  }

  console.log('Intentando obtener columnas de cobranza_interacciones...');
  // Intentamos un select que falle con un nombre de columna que no exista para ver si nos da la lista
  const { error: colError } = await supabase.from('cobranza_interacciones').select('columna_que_no_existe');
  if (colError) {
      console.log('Error al pedir columna inexistente (útil para ver esquema):', colError.message);
  }
}

run();
