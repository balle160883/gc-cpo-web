
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const logFile = 'final-check.log';
  fs.writeFileSync(logFile, `--- Investigación de "${'GOMEZ OLMEDO ANTONIO'}" ---\n`);

  const searchName = 'GOMEZ OLMEDO ANTONIO';

  // 1. Buscar en asignacion_gestores
  fs.appendFileSync(logFile, `Buscando en [asignacion_gestores]...\n`);
  const { data: assignments, error: assignError } = await supabase
    .from('asignacion_gestores')
    .select('gestor, NoSOCIO, NoCUENTA')
    .ilike('gestor', `%${searchName}%`);

  if (assignError) {
    fs.appendFileSync(logFile, `Error en asignacion_gestores: ${assignError.message}\n`);
  } else {
    fs.appendFileSync(logFile, `Encontrados ${assignments.length} registros en asignacion_gestores.\n`);
    if (assignments.length > 0) {
      fs.appendFileSync(logFile, `Ejemplo: ${JSON.stringify(assignments[0])}\n`);
    }
  }

  // 2. Buscar en perfiles
  fs.appendFileSync(logFile, `Buscando en [perfiles]...\n`);
  const { data: profiles, error: profileError } = await supabase
    .from('perfiles')
    .select('*');

  if (profileError) {
    fs.appendFileSync(logFile, `Error al leer perfiles: ${profileError.message}\n`);
  } else if (profiles) {
    fs.appendFileSync(logFile, `Total de perfiles: ${profiles.length}\n`);
    const matches = profiles.filter(p => 
      JSON.stringify(p).toLowerCase().includes(searchName.toLowerCase())
    );
    fs.appendFileSync(logFile, `Match en perfiles: ${matches.length}\n`);
    if (matches.length > 0) {
      fs.appendFileSync(logFile, `Resultados: ${JSON.stringify(matches, null, 2)}\n`);
    } else {
        // Mostrar algunos perfiles para ver las columnas
        if (profiles.length > 0) {
            fs.appendFileSync(logFile, `Columnas de perfiles: ${Object.keys(profiles[0]).join(', ')}\n`);
        }
    }
  }

  // 3. Buscar en cobranza_interacciones
  fs.appendFileSync(logFile, `Buscando en [cobranza_interacciones]...\n`);
  const { data: interactions, error: interactError } = await supabase
    .from('cobranza_interacciones')
    .select('gestor')
    .ilike('gestor', `%${searchName}%`)
    .limit(1);

  if (!interactError && interactions.length > 0) {
    fs.appendFileSync(logFile, `¡ENCONTRADO en [cobranza_interacciones]!\n`);
  } else {
    fs.appendFileSync(logFile, `No hay interacciones registradas a este nombre.\n`);
  }

  console.log(`Log escrito en ${logFile}`);
}

run();
