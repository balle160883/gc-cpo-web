
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const searchName = 'GOMEZ OLMEDO ANTONIO';
  console.log(`--- Buscando "${searchName}" ---`);
  
  // 1. Verificar asignacion_gestores
  const { data: assignments, error: assignError } = await supabase
    .from('asignacion_gestores')
    .select('gestor, NoSOCIO, NoCUENTA')
    .ilike('gestor', `%${searchName}%`);

  if (!assignError) {
    console.log(`En [asignacion_gestores]: Encontrados ${assignments.length} registros.`);
    if (assignments.length > 0) {
      console.log('Ejemplo:', assignments[0]);
    }
  }

  // 2. Verificar perfiles (comunmente donde están los usuarios del sistema)
  // Primero veamos qué columnas tiene perfiles para no fallar
  const { data: profileSample } = await supabase.from('perfiles').select('*').limit(1);
  if (profileSample && profileSample.length > 0) {
    const cols = Object.keys(profileSample[0]);
    console.log('Columnas en [perfiles]:', cols);
    
    for (const col of cols) {
      const { data: res } = await supabase.from('perfiles').select('*').ilike(col, `%${searchName}%`);
      if (res && res.length > 0) {
        console.log(`¡ENCONTRADO en [perfiles].[${col}]!`);
        console.log(res);
      }
    }
  } else {
    console.log('La tabla [perfiles] está vacía o no existe.');
  }

  // 3. Verificar si hay una tabla "gestores"
  const { data: gestoresSample } = await supabase.from('gestores').select('*').limit(1);
  if (gestoresSample) {
    console.log('Tabla [gestores] detectada.');
    const cols = Object.keys(gestoresSample[0] || {});
    for (const col of cols) {
        const { data: res } = await supabase.from('gestores').select('*').ilike(col, `%${searchName}%`);
        if (res && res.length > 0) {
            console.log(`¡ENCONTRADO en [gestores].[${col}]!`);
            console.log(res);
        }
    }
  }
}

run();
