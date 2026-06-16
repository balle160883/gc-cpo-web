
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const logFile = 'db-investigation.log';
  fs.writeFileSync(logFile, '--- Inicio de Investigación ---\n');

  // 1. Obtener lista de tablas
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { 'apikey': supabaseKey }
  });
  if (response.ok) {
    const spec: any = await response.json();
    const tables = Object.keys(spec.definitions || {});
    fs.appendFileSync(logFile, `Tablas detectadas: ${tables.join(', ')}\n\n`);
  }

  // 2. Buscar en asignacion_gestores (el usuario dice que está ahí)
  const searchName = 'GOMEZ OLMEDO ANTONIO';
  const { data: assignments, error: assignError } = await supabase
    .from('asignacion_gestores')
    .select('gestor, NoSOCIO, NoCUENTA')
    .ilike('gestor', `%${searchName}%`);

  if (assignError) {
    fs.appendFileSync(logFile, `Error en asignacion_gestores: ${assignError.message}\n`);
  } else {
    fs.appendFileSync(logFile, `En [asignacion_gestores]: Encontrados ${assignments.length} registros.\n`);
    if (assignments.length > 0) {
      fs.appendFileSync(logFile, `Ejemplo: ${JSON.stringify(assignments[0])}\n\n`);
    }
  }

  // 3. Buscar en la tabla de perfiles/usuarios
  const { data: profiles, error: profileError } = await supabase
    .from('perfiles')
    .select('*')
    .or(`nombre.ilike.%${searchName}%,nombre_completo.ilike.%${searchName}%`); // Probando columnas comunes
  
  if (profileError) {
      // Si falla, intentamos una búsqueda más genérica
      fs.appendFileSync(logFile, `Error en perfiles con filtros específicos. Probando búsqueda manual de columnas...\n`);
      const { data: sample } = await supabase.from('perfiles').select('*').limit(1);
      if (sample && sample[0]) {
          const cols = Object.keys(sample[0]);
          fs.appendFileSync(logFile, `Columnas en perfiles: ${cols.join(', ')}\n`);
          for (const col of cols) {
              const { data } = await supabase.from('perfiles').select('*').ilike(col, `%${searchName}%`);
              if (data && data.length > 0) {
                  fs.appendFileSync(logFile, `¡ENCONTRADO en [perfiles].[${col}]!\n`);
                  fs.appendFileSync(logFile, JSON.stringify(data, null, 2) + '\n');
              }
          }
      }
  } else if (profiles && profiles.length > 0) {
      fs.appendFileSync(logFile, `¡ENCONTRADO en [perfiles]!\n`);
      fs.appendFileSync(logFile, JSON.stringify(profiles, null, 2) + '\n');
  } else {
      fs.appendFileSync(logFile, `No se encontró "${searchName}" en la tabla [perfiles].\n`);
  }

  console.log(`Investigación completada. Resultados en ${logFile}`);
}

run();
