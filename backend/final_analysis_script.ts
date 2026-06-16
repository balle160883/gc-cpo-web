
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log('--- ANÁLISIS FINAL DE SUPABASE ---');

  // 1. Verificar columnas en socios_datos
  const { data: socioSample } = await supabase.from('socios_datos').select('*').limit(1);
  if (socioSample && socioSample[0]) {
    console.log('Columnas disponibles en [socios_datos]:', Object.keys(socioSample[0]));
    const geoCols = Object.keys(socioSample[0]).filter(c => /lat|lon|coord/i.test(c));
    console.log('Columnas de geolocalización en [socios_datos]:', geoCols);
  }

  // 2. Analizar por qué LATITUD es null en asignacion_gestores
  const { data: nullLat } = await supabase
    .from('asignacion_gestores')
    .select('NOMBRE, DOMICILIO, LATITUD, "DOMICILIO D.A.1", LATITUD_A1')
    .is('LATITUD', null)
    .limit(10);

  console.log('\nEjemplos de registros con LATITUD null:');
  nullLat?.forEach(r => {
    console.log(`- Socio: ${r.NOMBRE}`);
    console.log(`  Dom: "${r.DOMICILIO}"`);
    console.log(`  Aval 1 Dom: "${r['DOMICILIO D.A.1']}"`);
    console.log(`  Aval 1 Lat: ${r.LATITUD_A1}`);
  });

  // 3. Verificar si hay algún registro que SÍ tenga latitud para entender el formato
  const { data: hasLat } = await supabase
    .from('asignacion_gestores')
    .select('NOMBRE, DOMICILIO, LATITUD')
    .not('LATITUD', 'is', null)
    .limit(3);

  console.log('\nEjemplos de registros que SÍ tienen LATITUD:');
  hasLat?.forEach(r => {
    console.log(`- Socio: ${r.NOMBRE}`);
    console.log(`  Dom: "${r.DOMICILIO}"`);
    console.log(`  Lat: ${r.LATITUD}`);
  });
}

run();
