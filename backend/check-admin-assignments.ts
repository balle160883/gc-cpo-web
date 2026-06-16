import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const newAdmins = ['SERGIO ELIZONDO', 'RICARDO ALMARAZ', 'NATALIE TORRES'];

async function checkAssignments() {
  console.log('--- Verificando Asignaciones para Nuevos Admins ---');
  
  for (const name of newAdmins) {
    const { count, error } = await supabase
      .from('asignacion_gestores')
      .select('*', { count: 'exact', head: true })
      .eq('GESTOR ASIGNADO', name);
    
    if (error) {
      console.error(`Error al buscar ${name}:`, error.message);
    } else {
      console.log(`Asignaciones para ${name}: ${count} filas.`);
    }
  }

  // También buscar por No GESTOR ASIGNADO o algo similar si existe
  const { data: sample, error: err } = await supabase.from('asignacion_gestores').select('GESTOR ASIGNADO').limit(5);
  if (!err && sample) {
    console.log('Muestra de gestores reales en la tabla:', sample.map(s => s['GESTOR ASIGNADO']));
  }
}

checkAssignments();
