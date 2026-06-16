
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function searchGestor() {
  console.log('--- Buscando GOMEZ OLMEDO ANTONIO ---');
  
  const searchName = 'GOMEZ OLMEDO ANTONIO';

  // 1. Buscar en perfiles o usuarios si existen por nombre
  const { data: profiles, error: profileError } = await supabase
    .from('perfiles')
    .select('*')
    .ilike('nombre_completo', `%${searchName}%`);

  if (profileError) {
    console.error('Error al buscar en perfiles:', profileError.message);
  } else {
    console.log('Resultados en perfiles:', profiles);
  }

  // 2. Buscar en usuarios por metadata (si es posible a través de perfiles o users si existe la tabla)
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1); // Solo para ver si la tabla existe

  if (userError) {
    console.log('La tabla "users" no es accesible directamente o no existe en el esquema public.');
  }

  // 3. Buscar en asignacion_gestores
  const { data: assignments, error: assignError } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .ilike('gestor', `%${searchName}%`);

  if (assignError) {
    console.error('Error al buscar en asignacion_gestores:', assignError.message);
  } else {
    console.log('Asignaciones encontradas en asignacion_gestores:', assignments.length);
    if (assignments.length > 0) {
        console.log('Ejemplo de asignación:', assignments[0]);
    }
  }

  // 4. Intentar buscar en cobranza_interacciones si se guarda el nombre
  const { data: interactions, error: interactError } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .ilike('gestor', `%${searchName}%`)
    .limit(5);

  if (!interactError) {
    console.log('Interacciones encontradas:', interactions.length);
  }
}

searchGestor();
