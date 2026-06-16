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

async function run() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  console.log(`inicioMes local: ${inicioMes.toString()}`);
  console.log(`inicioMes ISO: ${inicioMes.toISOString()}`);

  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('id, num_cuenta, sujeto_tipo, fecha_gestion, tipo_contacto, gestor_id')
    .eq('gestor_id', user.id)
    .eq('tipo_contacto', 'visita')
    .gte('fecha_gestion', inicioMes.toISOString());

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total interacciones devueltas por la consulta: ${data?.length}`);
  
  // Buscar si las cuentas de interés están aquí
  const targets = ['63-272218', '63-272211', '33-240900'];
  const matches = data?.filter(i => targets.includes(i.num_cuenta));
  console.log('Interacciones que coinciden con las cuentas objetivo en el resultado:');
  console.log(matches);
}

run();
