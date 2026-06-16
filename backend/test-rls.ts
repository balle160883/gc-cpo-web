
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Verificando inserción en ubicaciones_gestores...');
  // Intentamos una inserción de prueba (esto puede fallar si RLS está activo y no somos el usuario)
  const { data, error } = await supabase
    .from('ubicaciones_gestores')
    .insert({
      gestor_id: '00000000-0000-0000-0000-000000000000', // Un ID inexistente para probar
      latitud: 0,
      longitud: 0,
      timestamp: new Date().toISOString()
    });

  if (error) {
    console.log('Resultado de inserción:', error.message);
    if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
       console.log('CONFIRMADO: RLS está bloqueando las inserciones.');
    }
  } else {
    console.log('La inserción funcionó (o falló por FK, pero no por RLS).');
    // Si falla por FK "insert or update on table ... violates foreign key constraint", 
    // significa que RLS NO bloqueó la operación (porque llegó a verificar la FK).
  }
}

run();
