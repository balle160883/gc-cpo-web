import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function checkRoles() {
  const emails = [
    'natalie.torres@vesta-track.cloud',
    'sergio.elizondo@vesta-track.cloud',
    'ricardo.almaraz@vesta-track.cloud',
    'ing.ballesteros16@gmail.com'
  ];
  
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .select('email, rol, gestor')
    .in('email', emails);
  
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkRoles();
