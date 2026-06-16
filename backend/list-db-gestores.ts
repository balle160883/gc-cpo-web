import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .select('*');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`Total gestores en BD: ${data.length}`);
  data.forEach(g => {
    console.log(`- ID: ${g.id} | GESTOR: "${g.gestor}" | EMAIL: ${g.email}`);
  });
}

run();
