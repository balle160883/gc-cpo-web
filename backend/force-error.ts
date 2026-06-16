
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Buscando llaves foráneas...');
  
  // En Supabase, a veces podemos usar RPC para SQL crudo o hay tablas de sistema expuestas
  // Si no, intentaremos un insert erróneo para que Postgres nos diga qué tabla es
  const { error } = await supabase
    .from('cobranza_interacciones')
    .insert([{ socio_id: '99999999' }]);

  if (error) {
    console.log('Error de inserción (para análisis):', error.message);
    console.log('Detalle del error:', (error as any).details);
    console.log('Hint:', (error as any).hint);
  }
}

run();
