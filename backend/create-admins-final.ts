import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const admins = [
  {
    email: 'sergio.elizondo@vesta-track.cloud',
    password_hash: 'SergioVesta2026!',
    rol: 'admin',
    gestor: 'SERGIO ELIZONDO'
  },
  {
    email: 'ricardo.almaraz@vesta-track.cloud',
    password_hash: 'RicardoVesta2026!',
    rol: 'admin',
    gestor: 'RICARDO ALMARAZ'
  },
  {
    email: 'natalie.torres@vesta-track.cloud',
    password_hash: 'NatalieVesta2026!',
    rol: 'admin',
    gestor: 'NATALIE TORRES'
  }
];

async function run() {
  console.log('--- Creando Administradores ---');
  
  for (const admin of admins) {
    const { data, error } = await supabase
      .from('usuarios_gestor')
      .upsert([admin], { onConflict: 'email' })
      .select();

    if (error) {
      console.error(`Error al crear ${admin.email}:`, error.message);
    } else {
      console.log(`✓ Administrador creado/actualizado: ${admin.email}`);
      console.log(data);
    }
  }
}

run();
