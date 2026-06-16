import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCoords() {
  console.log('--- Verificando Coordenadas ---');

  // Check asignacion_gestores
  const { data: gestores, count: totalGestores } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA', { count: 'exact', head: true });

  const { count: nullGestores } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA', { count: 'exact', head: true })
    .is('LATITUD', null);

  console.log(`Asignacion Gestores:`);
  console.log(`  Total: ${totalGestores}`);
  console.log(`  Null Latitud: ${nullGestores}`);

  // Check asignacion_avales
  const { data: avales, count: totalAvales } = await supabase
    .from('asignacion_avales')
    .select('id', { count: 'exact', head: true });

  const { count: nullAvales } = await supabase
    .from('asignacion_avales')
    .select('id', { count: 'exact', head: true })
    .is('latitud', null);

  console.log(`Asignacion Avales:`);
  console.log(`  Total: ${totalAvales}`);
  console.log(`  Null Latitud: ${nullAvales}`);
}

checkCoords();
