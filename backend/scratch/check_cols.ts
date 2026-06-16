import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: gData } = await supabase.from('asignacion_gestores').select('*').limit(1);
  console.log('Gestores keys:', gData ? Object.keys(gData[0]) : 'no data');
  
  const { data: aData } = await supabase.from('asignacion_avales').select('*').limit(1);
  console.log('Avales keys:', aData ? Object.keys(aData[0]) : 'no data');
}

run();
