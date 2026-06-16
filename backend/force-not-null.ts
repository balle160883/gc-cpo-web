
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Intentando inserción vacía...');
  const { error } = await supabase.from('cobranza_interacciones').insert([{}]);
  if (error) {
    console.log('Error de inserción vacía:', error.message);
    // Muchas veces el mensaje de error de Postgres lista los campos requeridos
  }
}

run();
