import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function check() {
  const { data, error } = await supabase.from('cobranza_promesas').select('*').limit(1);
  if (error) {
    console.error('Error fetching from cobranza_promesas:', error.message);
  } else {
    console.log('Columnas de cobranza_promesas:', Object.keys(data?.[0] || {}));
  }
}

check();
