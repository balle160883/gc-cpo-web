import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function checkUser() {
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .select('*')
    .eq('email', 'natalie.torres@vesta-track.cloud');
  
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkUser();
