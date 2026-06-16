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
  const { data: sociosData } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .eq('GESTOR ASIGNADO', user.gestor)
    .neq('SITUACIÓN DEL CRÉDITO', 'LIQUIDADO');

  const { data: avalesData } = await supabase
    .from('asignacion_avales')
    .select('*')
    .eq('gestor_asignado', user.gestor);

  const activeCuentas = [
    ...(sociosData?.map((item: any) => item.NoCUENTA).filter(Boolean) || []),
    ...(avalesData?.map((item: any) => item.num_cuenta).filter(Boolean) || [])
  ];
  const uniqueActiveCuentas = [...new Set(activeCuentas)];

  console.log(`Socios data size: ${sociosData?.length}`);
  console.log(`Avales data size: ${avalesData?.length}`);
  console.log(`Unique active accounts size: ${uniqueActiveCuentas.length}`);
  
  targets.forEach(t => {
    const inSocios = sociosData?.some(s => s.NoCUENTA === t);
    const inAvales = avalesData?.some(a => a.num_cuenta === t);
    const inUnique = uniqueActiveCuentas.includes(t);
    console.log(`Cuenta: ${t} - In sociosData: ${inSocios}, In avalesData: ${inAvales}, In uniqueActiveCuentas: ${inUnique}`);
  });
}

run();
