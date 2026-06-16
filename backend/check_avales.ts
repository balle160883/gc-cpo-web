import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function checkGuarantors() {
  const { data, error } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columnas disponibles:', Object.keys(data[0]));
    console.log('Muestra de datos:', {
      'NoCUENTA': data[0]['NoCUENTA'],
      'AVAL 1': data[0]['AVAL 1'],
      'NOMBRE D.A.1': data[0]['NOMBRE D.A.1'],
      'AVAL 2': data[0]['AVAL 2'],
      'NOMBRE D.A.2': data[0]['NOMBRE D.A.2']
    });
  }
}

checkGuarantors();
