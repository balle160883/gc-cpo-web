
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Intentando habilitar acceso público/autenticado a ubicaciones_gestores...');
  
  // Como no podemos correr SQL arbitrario fácilmente via RPC si no está configurado,
  // vamos a intentar insertar una fila y ver si falla, o simplemente dar el aviso.
  // Pero la mejor forma es configurar la política en Supabase.
  
  // Intentaremos usar una función de Supabase si existe para correr SQL (esto depende del proyecto)
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql: `
      ALTER TABLE ubicaciones_gestores DISABLE ROW LEVEL SECURITY;
      GRANT ALL ON TABLE ubicaciones_gestores TO authenticated;
      GRANT ALL ON TABLE ubicaciones_gestores TO anon;
      GRANT ALL ON TABLE ubicaciones_gestores TO service_role;
    `
  });

  if (error) {
    console.log('No se pudo deshabilitar RLS vía RPC (normal si no existe la función).');
    console.log('Error:', error.message);
  } else {
    console.log('✅ RLS deshabilitado con éxito para ubicaciones_gestores.');
  }
}

run();
