
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  console.log('Insertando ubicación de prueba para el administrador...');
  
  // Primero buscamos el ID del administrador
  const { data: user } = await supabase
    .from('usuarios_gestor')
    .select('id')
    .eq('email', 'ing.ballesteros16@gmail.com')
    .single();

  if (!user) {
    console.log('No se encontró el usuario administrador.');
    return;
  }

  const { data, error } = await supabase
    .from('ubicaciones_gestores')
    .insert({
      gestor_id: user.id,
      latitud: 19.4326, // Ciudad de México
      longitud: -99.1332,
      timestamp: new Date().toISOString()
    });

  if (error) {
    console.error('Error insertando ubicación:', error.message);
  } else {
    console.log('✅ Ubicación de prueba insertada con éxito para CDMX.');
  }
}

run();
