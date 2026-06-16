// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ids = [
  '1c05ba3c-0bf9-44fb-9ce3-db2c6a7094ea',
  '0f7b4d7f-4564-4987-95ec-2b7e38bea332',
  'c07f2eb2-bf5d-46eb-a685-5e66cbaf4083'
];

async function run() {
  const { data } = await supabase
    .from('cobranza_interacciones')
    .select('id, gestor_id, num_cuenta, socio_id')
    .in('id', ids);

  console.log('--- GESTOR ID EN INTERACCIONES ---');
  console.log(data);

  // Ver Nestor en usuarios_gestor
  const { data: users } = await supabase
    .from('usuarios_gestor')
    .select('*')
    .ilike('gestor', '%nestor%');
  console.log('\n--- NESTOR EN usuarios_gestor ---');
  console.log(users);
}

run();
