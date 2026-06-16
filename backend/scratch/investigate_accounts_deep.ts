// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const socioIds = ['63-001388', '63-001388', '33-000775'];
  const normalizedSocioIds = ['001388', '1388', '000775', '775'];
  const allSocioSearch = [...socioIds, ...normalizedSocioIds];

  console.log('--- BUSCANDO INTERACCIONES ---');
  const { data: interacciones, error: errInt } = await supabase
    .from('cobranza_interacciones')
    .select('*');

  if (errInt) {
    console.error('Error fetching interactions:', errInt);
    return;
  }

  console.log(`Total interacciones en la BD: ${interacciones?.length}`);
  
  const matches = interacciones?.filter(i => {
    const sId = String(i.socio_id || '').trim();
    const cleanId = sId.includes('-') ? sId.split('-').pop() : sId;
    return allSocioSearch.some(search => 
      sId === search || 
      cleanId === search || 
      search.replace(/^0+/, '') === cleanId?.replace(/^0+/, '')
    );
  });

  console.log(`Interacciones encontradas (${matches?.length}):`);
  for (const m of matches || []) {
    console.log(JSON.stringify(m, null, 2));
  }

  console.log('\n--- BUSCANDO PROMESAS ---');
  const { data: promesas, error: errProm } = await supabase
    .from('cobranza_promesas')
    .select('*, prestamos_datos(*)');

  if (errProm) {
    console.error('Error fetching promises:', errProm);
    return;
  }

  console.log(`Total promesas en la BD: ${promesas?.length}`);

  const pMatches = promesas?.filter(p => {
    const sId = String(p.prestamos_datos?.socio_id || '').trim();
    const cleanId = sId.includes('-') ? sId.split('-').pop() : sId;
    return allSocioSearch.some(search => 
      sId === search || 
      cleanId === search || 
      search.replace(/^0+/, '') === cleanId?.replace(/^0+/, '')
    );
  });

  console.log(`Promesas encontradas (${pMatches?.length}):`);
  for (const pm of pMatches || []) {
    console.log(JSON.stringify(pm, null, 2));
  }
}

run();
