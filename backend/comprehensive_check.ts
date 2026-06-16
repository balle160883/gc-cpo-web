
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log('--- REVISIÓN DETALLADA DE ASIGNACION_GESTORES ---');

  // 1. Obtener una muestra representativa con nulos
  const { data: assignments, error } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Analizando muestra de ${assignments.length} registros...`);

  for (const asig of assignments) {
    console.log(`\nCuenta: ${asig.NoCUENTA} | Socio: ${asig.NOMBRE} (${asig.NoSOCIO})`);
    console.log(`  Socio Domicilio: "${asig.DOMICILIO}"`);
    console.log(`  Socio Coords: [lat: ${asig.LATITUD}, lng: ${asig.LONGITUD}]`);
    
    console.log(`  Aval 1 Domicilio: "${asig['DOMICILIO D.A.1']}"`);
    console.log(`  Aval 1 Coords: [lat: ${asig.LATITUD_A1}, lng: ${asig.LONGITUD_A1}]`);

    // 2. Verificar si existe el socio en socios_datos y si tiene coordenadas ahí
    const { data: socioData } = await supabase
      .from('socios_datos')
      .select('*')
      .eq('numero_socio', asig.NoSOCIO)
      .single();

    if (socioData) {
      const socioCols = Object.keys(socioData);
      const hasCoordsInSocios = socioCols.includes('latitud') || socioCols.includes('LATITUD');
      console.log(`  [socios_datos] Encontrado. Columnas: ${socioCols.filter(c => c.toLowerCase().includes('lat') || c.toLowerCase().includes('lon')).join(', ') || 'NINGUNA COORDENADA'}`);
      if (socioData.latitud) {
          console.log(`  [socios_datos] TIENE COORDENADAS: ${socioData.latitud}, ${socioData.longitud}`);
      }
    } else {
      console.log(`  [socios_datos] NO ENCONTRADO para el número de socio ${asig.NoSOCIO}`);
    }
  }

  // 3. Resumen de nulos por columna
  const { data: all } = await supabase.from('asignacion_gestores').select('LATITUD, LONGITUD, LATITUD_A1, LATITUD_A2').limit(1000);
  if (all) {
      console.log('\n--- RESUMEN DE 1000 REGISTROS ---');
      console.log('LATITUD (Socio) NULL:', all.filter(x => x.LATITUD === null).length);
      console.log('LATITUD_A1 (Aval 1) NULL:', all.filter(x => x.LATITUD_A1 === null).length);
      console.log('LATITUD_A2 (Aval 2) NULL:', all.filter(x => x.LATITUD_A2 === null).length);
  }
}

run();
