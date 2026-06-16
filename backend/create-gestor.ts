
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  const newUser = {
    email: 'gomez.olmedo.antonio@empresa.com',
    password_hash: 'antonio123', // Usando texto plano como en los ejemplos existentes para simplicidad/compatibilidad actual
    gestor: 'GOMEZ OLMEDO ANTONIO',
    rol: 'gestor'
  };

  console.log('--- Creando Gestor ---');
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .insert([newUser])
    .select();

  if (error) {
    console.error('Error al crear gestor:', error.message);
  } else {
    console.log('¡Gestor creado exitosamente!');
    console.log(data);
  }
}

run();
