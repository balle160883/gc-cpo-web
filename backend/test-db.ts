
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .select('email, id, gestor')
    .eq('email', 'rodriguez.martinez.nestor.daniel@empresa.com');

  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users found in usuarios_gestor:', data);
  }
}

checkUsers();
