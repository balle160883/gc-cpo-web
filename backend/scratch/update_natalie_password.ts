import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function updatePassword() {
  const email = 'natalie.torres@vesta-track.cloud';
  const newPassword = 'NatalieVesta2026';
  
  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
  console.log(`Updating password for ${email}...`);
  
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .update({ password_hash: hashedPassword })
    .eq('email', email);
  
  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('Password updated successfully (hashed with bcrypt).');
  }
}

updatePassword();
