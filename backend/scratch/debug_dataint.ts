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
  const sociosRes = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA')
    .eq('GESTOR ASIGNADO', user.gestor)
    .neq('SITUACIÓN DEL CRÉDITO', 'LIQUIDADO');

  const avalesRes = await supabase
    .from('asignacion_avales')
    .select('num_cuenta')
    .eq('gestor_asignado', user.gestor);

  const activeCuentas = [
    ...(sociosRes.data?.map(item => item.NoCUENTA).filter(Boolean) || []),
    ...(avalesRes.data?.map(item => item.num_cuenta).filter(Boolean) || [])
  ];
  const uniqueActiveCuentas = [...new Set(activeCuentas)];

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { data: dataInt, error } = await supabase
    .from('cobranza_interacciones')
    .select('num_cuenta, sujeto_tipo, fecha_gestion')
    .eq('gestor_id', user.id)
    .eq('tipo_contacto', 'visita')
    .gte('fecha_gestion', inicioMes.toISOString())
    .in('num_cuenta', uniqueActiveCuentas);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`dataInt returned count: ${dataInt?.length}`);
  
  const targets = ['63-272218', '63-272211', '33-240900'];
  const matches = dataInt?.filter(i => targets.includes(i.num_cuenta));
  console.log('Matches in dataInt:', matches);
}

run();
