
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('asignacion_gestores').select('NoCUENTA, LATITUD, LONGITUD').limit(5);
  if (error) {
    console.error(error);
    return;
  }
  console.log('Sample data from asignacion_gestores:', data);
}

check();
