
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Consultando tabla ubicaciones_gestores...');
  const { data, error } = await supabase
    .from('ubicaciones_gestores')
    .select('*, usuarios_gestor(email, gestor)')
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Datos encontrados:', data);
  }
}

run();
