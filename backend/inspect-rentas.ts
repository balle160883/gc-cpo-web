import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function inspectRentasTable() {
  const { data, error } = await supabase.from('rentas_mensuales').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
    // Intentar ver si la tabla existe siquiera
    const { data: tables } = await supabase.rpc('get_tables'); // Si existe este RPC
    console.log('Tablas detectadas?', tables);
  } else {
    if (data && data.length > 0) {
        console.log('Columnas encontradas:', Object.keys(data[0]));
    } else {
        console.log('La tabla existe pero está vacía.');
        // Probamos insertar una fila mínima para ver qué pasa
        const { error: insError } = await supabase.from('rentas_mensuales').insert({ cliente_email: 'test@test.com' });
        console.log('Error al insertar test:', insError?.message);
    }
  }
}

inspectRentasTable();
