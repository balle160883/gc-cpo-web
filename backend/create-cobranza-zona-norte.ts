
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  const newUser = {
    email: 'cobranza.zona.norte@vesta-track.cloud',
    password_hash: 'CobranzaNorteVesta2026!',
    gestor: 'COBRANZA ZONA NORTE',
    rol: 'admin'
  };

  console.log('--- Creando Usuario Cobranza Zona Norte ---');
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .insert([newUser])
    .select();

  if (error) {
    console.error('Error al crear usuario:', error);
  } else {
    console.log('¡Usuario creado exitosamente!');
    console.log('Datos:', data);
  }
}

run();
