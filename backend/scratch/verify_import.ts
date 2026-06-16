import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function check() {
  const { count: totalAvales, error: err1 } = await supabase.from('asignacion_avales').select('*', { count: 'exact', head: true });
  console.log('Total avales en BD:', totalAvales);

  const { data: gestores, error: err2 } = await supabase.from('usuarios_gestor').select('gestor').limit(10);
  console.log('Ejemplos de gestores en BD:', gestores?.map(g => g.gestor));

  // Verificar si hay algún registro con el gestor del excel
  const { count: matchCount } = await supabase.from('usuarios_gestor').select('*', { count: 'exact', head: true }).ilike('gestor', '%SALVADOR SALINAS%');
  console.log('¿Existe SALVADOR SALINAS en la BD?:', matchCount && matchCount > 0 ? 'SÍ' : 'NO');
}

check();
