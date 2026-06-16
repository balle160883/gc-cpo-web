
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Buscando tablas y columnas...');
  
  const tables = ['socios', 'cuentas', 'usuarios', 'gestores', 'usuarios_gestor', 'asignacion_gestores'];
  
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (!error) {
      console.log(`✅ Tabla encontrada: ${t}`);
      console.log(`Columnas en ${t}:`, Object.keys(data[0] || {}));
    } else {
      console.log(`❌ Tabla no encontrada o sin acceso: ${t}`);
    }
  }

  // También intentamos ver qué campos tiene cobranza_interacciones si insertamos algo que falle pero que nos diga las columnas
  // (Este truco a veces funciona con PostgREST en el error de respuesta)
}

run();
