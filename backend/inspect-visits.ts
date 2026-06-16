import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log("Searching for interactions of socio_id 3-143346...");

  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .eq('socio_id', '3-143346');

  if (error) {
    console.error("Error querying by socio_id:", error.message);
  } else {
    console.log(`Found ${data?.length || 0} interactions.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
