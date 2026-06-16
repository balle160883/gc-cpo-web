
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function inspectSchema() {
  console.log('Inspeccionando tablas...');
  
  // Intentamos obtener una fila de ejemplo para ver las columnas
  const { data: sample, error: sampleError } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('Error al leer cobranza_interacciones:', sampleError);
  } else {
    console.log('Columnas en cobranza_interacciones:', Object.keys(sample[0] || {}));
  }

  // También revisamos una fila de asignacion_gestores para comparar IDs
  const { data: assignment, error: assignError } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .limit(1);

    if (assignError) {
        console.error('Error al leer asignacion_gestores:', assignError);
    } else {
        console.log('Ejemplo de asignacion_gestores:', assignment[0]);
    }
}

inspectSchema();
