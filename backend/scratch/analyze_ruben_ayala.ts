
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeRubenAyala() {
  console.log('--- Analizando datos de Ruben Ayala ---');

  // 1. Buscar al gestor Ruben Ayala
  const { data: gestores, error: gestorError } = await supabase
    .from('usuarios_gestor')
    .select('id, gestor, email')
    .ilike('gestor', '%Ruben%');

  if (gestorError || !gestores || gestores.length === 0) {
    console.error('No se encontró a ningún gestor con el nombre Ruben:', gestorError);
    return;
  }

  console.log('Gestores encontrados con "Ruben":', gestores.map(g => g.gestor));
  
  // Intentar encontrar el más parecido a Ruben Ayala
  const ruben = gestores.find(g => g.gestor.toLowerCase().includes('ayala')) || gestores[0];
  console.log(`Gestor encontrado: ${ruben.gestor} (ID: ${ruben.id})`);

  // 2. Buscar interacciones (visitas) de este gestor
  const { data: interacciones, error: intError } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .eq('gestor_id', ruben.id);

  if (intError) {
    console.error('Error al buscar interacciones:', intError);
  } else {
    console.log(`\nTotal de interacciones registradas por Ruben: ${interacciones.length}`);
    const visits = interacciones.filter(i => i.tipo_contacto === 'visita');
    const avalVisits = interacciones.filter(i => i.sujeto_tipo === 'Aval');
    console.log(`Visitas: ${visits.length}`);
    console.log(`Interacciones con Avales (según sujeto_tipo): ${avalVisits.length}`);
  }

  // 3. Buscar ASIGNACIONES de Ruben Ayala
  console.log('\n--- Analizando ASIGNACIONES de Ruben Ayala ---');
  const { data: asignaciones, error: asigError } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .eq('GESTOR ASIGNADO', ruben.gestor);

  if (asigError) {
    console.error('Error al buscar asignaciones:', asigError);
  } else {
    console.log(`Total de asignaciones para ${ruben.gestor}: ${asignaciones.length}`);
    
    // Filtramos las que parecen ser avales (tienen nombre en NOMBRE D.A.1 o 2)
    const asigAvales = asignaciones.filter(a => a['NOMBRE D.A.1'] || a['NOMBRE D.A.2']);
    console.log(`Asignaciones que incluyen Avales: ${asigAvales.length}`);

    // Revisar ubicaciones fuera de Tlaquepaque
    const fueraDeTlaquepaque = asignaciones.filter(a => {
      const municipio = (a.MUNICIPIO || '').toLowerCase();
      // Verificamos si NO contiene Tlaquepaque y tiene información
      return municipio !== '' && !municipio.includes('tlaquepaque');
    });

    const avalesFuera = fueraDeTlaquepaque.filter(a => a['NOMBRE D.A.1'] || a['NOMBRE D.A.2']);

    console.log(`Asignaciones totales fuera de Tlaquepaque: ${fueraDeTlaquepaque.length}`);
    console.log(`Asignaciones de AVALES fuera de Tlaquepaque: ${avalesFuera.length}`);
    
    if (fueraDeTlaquepaque.length > 0) {
      console.log('\nListado de asignaciones fuera de Tlaquepaque:');
      fueraDeTlaquepaque.forEach((a, index) => {
        const esAval = (a['NOMBRE D.A.1'] || a['NOMBRE D.A.2']) ? 'Aval' : 'Socio';
        console.log(`${index + 1}. [${esAval}] ${a.NOMBRE} - Municipio: ${a.MUNICIPIO} - Cuenta: ${a.NoCUENTA}`);
        if (a['NOMBRE D.A.1']) console.log(`   Aval 1: ${a['NOMBRE D.A.1']}`);
        if (a['NOMBRE D.A.2']) console.log(`   Aval 2: ${a['NOMBRE D.A.2']}`);
      });
    }
  }
}

analyzeRubenAyala();
