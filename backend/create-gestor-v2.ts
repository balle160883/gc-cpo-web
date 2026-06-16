
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  const logFile = 'creation-error.log';
  const newUser = {
    email: 'gomez.olmedo.antonio@empresa.com',
    password_hash: 'antonio123',
    gestor: 'GOMEZ OLMEDO ANTONIO',
    rol: 'gestor'
  };

  console.log('--- Intentando Crear Gestor ---');
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .insert([newUser])
    .select();

  if (error) {
    fs.writeFileSync(logFile, `ERROR: ${JSON.stringify(error, null, 2)}\n`);
    console.error('Error detectado. Ver creation-error.log');
  } else {
    fs.writeFileSync(logFile, `SUCCESS: ${JSON.stringify(data, null, 2)}\n`);
    console.log('¡Éxito! Ver creation-error.log');
  }
}

run();
