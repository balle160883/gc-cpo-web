
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Consultando restricciones de clave foránea...');
  
  // Consulta SQL para obtener detalles de la FK
  const sql = `
    SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='cobranza_interacciones';
  `;

  // Intentamos ejecutar via RPC si existe 'exec_sql' (común en setups dev)
  // Si no, recurriremos al usuario.
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.log('RPC exec_sql no disponible. Fallback a inserción completa...');
    // Probamos insertar con ID que sabemos que fallará pero con campos not-null llenos
    const { error: insError } = await (supabase as any)
      .from('cobranza_interacciones')
      .insert([{ 
        socio_id: '999999', 
        resultado: 'test', 
        tipo_contacto: 'visita',
        fecha_gestion: new Date().toISOString()
      }]);
    
    if (insError) {
      console.log('Error COMPLETO:', JSON.stringify(insError, null, 2));
    }
  } else {
    console.log('Detalles de FK:', data);
  }
}

run();
