import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function inspectTable(tableName: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.error(`Error inspecting ${tableName}:`, error.message);
    return;
  }

  console.log(`\n--- Tabla: ${tableName} ---`);
  if (data && data.length > 0) {
    console.log('Columnas:', Object.keys(data[0]).join(', '));
  } else {
    console.log('Tabla vacía o sin acceso.');
  }
}

async function run() {
  const tables = [
    'cobranza_interacciones',
    'cobranza_promesas',
    'asignacion_gestores',
    'prestamos_datos',
    'pagos_recuperados',
    'socios_datos'
  ];

  for (const table of tables) {
    await inspectTable(table);
  }
}

run();
