
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    return;
  }

  console.log('Consultando metadatos de PostgREST...');
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { 'apikey': supabaseKey }
  });

  if (response.ok) {
    const spec: any = await response.json();
    console.log('Tablas detectadas:', Object.keys(spec.definitions || {}));
    
    // Si queremos inspeccionar tablas específicas:
    const tablesToInspect = ['perfiles', 'asignacion_gestores', 'usuarios', 'gestores'];
    tablesToInspect.forEach(table => {
      if (spec.definitions[table]) {
        console.log(`--- Esquema de ${table} ---`);
        console.log(Object.keys(spec.definitions[table].properties));
      }
    });
    
    if (spec.definitions && spec.definitions.asignacion_gestores) {
       console.log('--- Esquema de asignacion_gestores ---');
       console.log(JSON.stringify(spec.definitions.asignacion_gestores.properties, null, 2));
    }
  } else {
    console.error('Error al consultar metadatos:', response.statusText);
  }
}

run();
