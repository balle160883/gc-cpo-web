
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { count, error } = await supabase.from('asignacion_gestores').select('*', { count: 'exact', head: true }).not('LATITUD', 'is', null);
  if (error) {
    console.error(error);
    return;
  }
  console.log('Total visits with LATITUD:', count);

  const { count: total, error: errorTotal } = await supabase.from('asignacion_gestores').select('*', { count: 'exact', head: true });
  console.log('Total visits in table:', total);
}

check();
