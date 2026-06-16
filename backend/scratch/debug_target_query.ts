// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const user = {
  id: '015bb26f-ed15-43a9-927b-3c2b2fb090d6',
  gestor: 'RODRIGUEZ MARTINEZ NESTOR DANIEL'
};

const targets = ['63-272218', '63-272211', '33-240900'];

async function run() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  console.log('Querying directly for targets with filters:');
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .eq('gestor_id', user.id)
    .eq('tipo_contacto', 'visita')
    .gte('fecha_gestion', inicioMes.toISOString())
    .in('num_cuenta', targets);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Results found: ${data?.length}`);
    console.log(data);
  }
}

run();
