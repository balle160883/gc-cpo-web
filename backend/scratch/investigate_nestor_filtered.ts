// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const nestorId = '015bb26f-ed15-43a9-927b-3c2b2fb090d6';
const targetSocioIds = ['63-001388', '33-000775', '63-001388', '001388', '1388', '000775', '775'];
const targetAccounts = ['63-272218', '63-272211', '33-240900', '272218', '272211', '240900'];

async function run() {
  console.log('=== INVESTIGACIÓN FILTRADA PARA NESTOR ===');

  // 1. Interacciones de Nestor
  console.log('--- Buscando en cobranza_interacciones para Nestor ---');
  const { data: interacciones, error: errInt } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .eq('gestor_id', nestorId);

  if (errInt) {
    console.error('Error fetching interactions:', errInt);
    return;
  }

  const matchedInts = interacciones?.filter(i => {
    const sId = String(i.socio_id || '').trim();
    const sIdNorm = sId.includes('-') ? sId.split('-').pop() : sId;
    
    const acc = String(i.num_cuenta || '').trim();
    const accNorm = acc.includes('-') ? acc.split('-').pop() : acc;

    const matchesSocio = targetSocioIds.some(t => sId === t || sIdNorm === t || sIdNorm.replace(/^0+/, '') === t.replace(/^0+/, ''));
    const matchesAcc = targetAccounts.some(a => acc === a || accNorm === a || accNorm.replace(/^0+/, '') === a.replace(/^0+/, ''));

    return matchesSocio || matchesAcc;
  });

  console.log(`Se encontraron ${matchedInts?.length} interacciones de Nestor relacionadas:`);
  for (const i of matchedInts || []) {
    console.log(JSON.stringify(i, null, 2));
  }

  // 2. Promesas de Nestor
  console.log('\n--- Buscando en cobranza_promesas para Nestor ---');
  const { data: promesas, error: errProm } = await supabase
    .from('cobranza_promesas')
    .select('*, prestamos_datos(*)')
    .eq('gestor_id', nestorId);

  if (errProm) {
    console.error('Error fetching promises:', errProm);
    return;
  }

  const matchedPromesas = promesas?.filter(p => {
    const sId = String(p.prestamos_datos?.socio_id || '').trim();
    const sIdNorm = sId.includes('-') ? sId.split('-').pop() : sId;

    const acc = String(p.prestamos_datos?.num_cuenta || '').trim();
    const accNorm = acc.includes('-') ? acc.split('-').pop() : acc;

    const matchesSocio = targetSocioIds.some(t => sId === t || sIdNorm === t || sIdNorm.replace(/^0+/, '') === t.replace(/^0+/, ''));
    const matchesAcc = targetAccounts.some(a => acc === a || accNorm === a || accNorm.replace(/^0+/, '') === a.replace(/^0+/, ''));

    return matchesSocio || matchesAcc;
  });

  console.log(`Se encontraron ${matchedPromesas?.length} promesas de Nestor relacionadas:`);
  for (const p of matchedPromesas || []) {
    console.log(JSON.stringify(p, null, 2));
  }

  // 3. Buscar cualquier interacción general (de cualquier gestor) para estos socios
  console.log('\n--- Buscando interacciones de CUALQUIER gestor para estos socios/cuentas ---');
  const { data: allInteracciones } = await supabase
    .from('cobranza_interacciones')
    .select('*, usuarios_gestor(gestor)');

  const matchedAllInts = allInteracciones?.filter(i => {
    const sId = String(i.socio_id || '').trim();
    const sIdNorm = sId.includes('-') ? sId.split('-').pop() : sId;
    
    const acc = String(i.num_cuenta || '').trim();
    const accNorm = acc.includes('-') ? acc.split('-').pop() : acc;

    const matchesSocio = targetSocioIds.some(t => sId === t || sIdNorm === t || sIdNorm.replace(/^0+/, '') === t.replace(/^0+/, ''));
    const matchesAcc = targetAccounts.some(a => acc === a || accNorm === a || accNorm.replace(/^0+/, '') === a.replace(/^0+/, ''));

    return matchesSocio || matchesAcc;
  });

  console.log(`Se encontraron ${matchedAllInts?.length} interacciones en total para estos socios:`);
  for (const i of matchedAllInts || []) {
    console.log(`- ID: ${i.id}, Socio: ${i.socio_id}, Gestor: ${i.usuarios_gestor?.gestor || i.gestor_id}, Resultado: ${i.resultado}, Fecha: ${i.fecha_gestion}, Desc: ${i.descripcion}`);
  }
}

run();
