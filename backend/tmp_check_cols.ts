import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('asignacion_gestores')
        .select('*')
        .not('"DOMICILIO D.A.1"', 'is', null)
        .limit(1);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('Ejemplo de registro:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No hay datos en la tabla.');
    }
}

checkColumns();
