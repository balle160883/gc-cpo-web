
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

// Clave service_role encontrada en final-rls-fix.ts
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5NywiZXhwIjoyMDg4NzQ5NTk3fQ.NhK0bVSyLcWAP8EXU35agSs89DCq2LBhRTXv2_P-Y0A';

const supabase = createClient(process.env.SUPABASE_URL!, SERVICE_ROLE_KEY);

async function run() {
  const logFile = 'creation-final.log';
  const newUser = {
    email: 'gomez.olmedo.antonio@empresa.com',
    password_hash: 'antonio123',
    gestor: 'GOMEZ OLMEDO ANTONIO',
    rol: 'gestor'
  };

  console.log('--- Creando Gestor con Service Role ---');
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .insert([newUser])
    .select();

  if (error) {
    fs.writeFileSync(logFile, `ERROR: ${JSON.stringify(error, null, 2)}\n`);
    console.error('Error detectado. Ver creation-final.log');
  } else {
    fs.writeFileSync(logFile, `SUCCESS: ${JSON.stringify(data, null, 2)}\n`);
    console.log('¡Éxito! Gestor creado.');
  }
}

run();
