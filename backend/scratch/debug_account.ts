
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { data, error } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .eq('NoCUENTA', '25-261352');
  
  if (data && data[0]) {
    console.log(data[0]);
  } else {
    console.log('No data or error:', error);
  }
}

run();
