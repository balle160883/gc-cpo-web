
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  const searchName = 'GOMEZ OLMEDO ANTONIO';
  const logFile = 'final-search-results.log';
  fs.writeFileSync(logFile, `--- Resultados Finales para "${searchName}" ---\n`);

  // 1. Buscar en asignacion_gestores usando "GESTOR ASIGNADO"
  const { data: assignments, error: assignError } = await supabase
    .from('asignacion_gestores')
    .select('"GESTOR ASIGNADO", NoSOCIO, NoCUENTA')
    .ilike('GESTOR ASIGNADO', `%${searchName}%`);

  if (assignError) {
    fs.appendFileSync(logFile, `Error en asignacion_gestores: ${assignError.message}\n`);
  } else {
    fs.appendFileSync(logFile, `[asignacion_gestores]: Encontrados ${assignments.length} registros.\n`);
    if (assignments.length > 0) {
        fs.appendFileSync(logFile, `Ejemplo de asignación: ${JSON.stringify(assignments[0])}\n`);
    }
  }

  // 2. Buscar en usuarios_gestor (verificando columnas primero)
  const { data: userSample } = await supabase.from('usuarios_gestor').select('*').limit(1);
  if (userSample && userSample[0]) {
    const cols = Object.keys(userSample[0]);
    fs.appendFileSync(logFile, `Columnas en [usuarios_gestor]: ${cols.join(', ')}\n`);
    // Buscamos en todas las columnas de texto
    for (const col of cols) {
        const { data: res } = await supabase.from('usuarios_gestor').select('*').ilike(col, `%${searchName}%`);
        if (res && res.length > 0) {
            fs.appendFileSync(logFile, `¡ENCONTRADO en [usuarios_gestor].[${col}]!\n`);
            fs.appendFileSync(logFile, `Datos: ${JSON.stringify(res, null, 2)}\n`);
        }
    }
  } else {
    fs.appendFileSync(logFile, `La tabla [usuarios_gestor] está vacía o no es accesible.\n`);
  }

  console.log('Finalizado. Ver final-search-results.log');
}

run();
