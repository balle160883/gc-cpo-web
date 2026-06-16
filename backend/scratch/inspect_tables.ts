import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    return;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { 'apikey': supabaseKey }
  });

  if (response.ok) {
    const spec: any = await response.json();
    const tables = ['cobranza_promesas', 'cobranza_interacciones', 'asignacion_gestores', 'prestamos_datos', 'socios_datos'];
    tables.forEach(table => {
      if (spec.definitions && spec.definitions[table]) {
        console.log(`--- Esquema de ${table} ---`);
        console.log(Object.keys(spec.definitions[table].properties).join(', '));
      } else {
        console.log(`Tabla ${table} no encontrada en los metadatos.`);
      }
    });
  } else {
    console.error('Error:', response.statusText);
  }
}

run();
