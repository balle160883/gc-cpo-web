import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- RECOMPROBANDO ESTADO DE LA CUENTA 8-085968 ---');
  const { data: row, error } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA, NOMBRE, "GESTOR ASIGNADO", "SITUACIÓN DEL CRÉDITO"')
    .eq('NoCUENTA', '8-085968')
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Fila encontrada:', row);
  }
}

run();
