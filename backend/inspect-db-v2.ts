
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Obteniendo información de tablas...');
  
  // Consultamos la tabla de información de PostgreSQL
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'cobranza_interacciones' });
  
  if (error) {
    // Si no hay RPC, intentamos una consulta directa de metadatos via SQL
    console.log('RPC get_table_info no disponible. Probando consulta directa...');
    const { data: cols, error: colError } = await supabase
      .from('cobranza_interacciones')
      .select()
      .limit(0);
    
    // Si falla, al menos intentamos ver qué tablas hay
    const { data: tables, error: tableError } = await supabase
      .from('pg_tables' as any) // Esto probablemente falle en PostgREST
      .select('*');
      
    console.log('Error al obtener columnas:', colError);
  } else {
    console.log('Información de tabla:', data);
  }
  
  // Vamos a intentar insertar un registro "manual" con el ID que tenemos para ver si falla de nuevo
  // Pero antes, busquemos si hay una columna llamada "num_cuenta" en lugar de "socio_id"
}

run();
