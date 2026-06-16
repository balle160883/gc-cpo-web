
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  const searchName = 'GOMEZ OLMEDO ANTONIO';
  const logFile = 'existence-check.log';
  fs.writeFileSync(logFile, `--- Chequeo de ${searchName} ---\n`);

  // 1. Buscar en usuarios_gestor
  fs.appendFileSync(logFile, `Buscando en [usuarios_gestor]...\n`);
  const { data: users, error: userError } = await supabase
    .from('usuarios_gestor')
    .select('*')
    .ilike('nombre', `%${searchName}%`);
  
  if (userError) {
    fs.appendFileSync(logFile, `Error en usuarios_gestor: ${userError.message}\n`);
  } else {
    fs.appendFileSync(logFile, `Encontrados ${users.length} en [usuarios_gestor].\n`);
    if (users.length > 0) {
      fs.appendFileSync(logFile, `Datos: ${JSON.stringify(users, null, 2)}\n`);
    }
  }

  // 2. Buscar en asignacion_gestores (la columna parece ser GESTOR en mayúsculas o algo así)
  fs.appendFileSync(logFile, `Buscando en [asignacion_gestores]...\n`);
  // Obtenemos primero las columnas para estar seguros
  const { data: sample } = await supabase.from('asignacion_gestores').select('*').limit(1);
  if (sample && sample[0]) {
    const cols = Object.keys(sample[0]);
    const gestorCol = cols.find(c => c.toUpperCase() === 'GESTOR' || c.toUpperCase() === 'USUARIO_GESTOR');
    if (gestorCol) {
        fs.appendFileSync(logFile, `Columna de gestor identificada: ${gestorCol}\n`);
        const { data: assignments, error: assignError } = await supabase
          .from('asignacion_gestores')
          .select(`${gestorCol}, NoSOCIO, NoCUENTA`)
          .ilike(gestorCol, `%${searchName}%`);
        
        if (assignError) {
          fs.appendFileSync(logFile, `Error en asignacion_gestores: ${assignError.message}\n`);
        } else {
          fs.appendFileSync(logFile, `Encontrados ${assignments.length} registros en asignacion_gestores.\n`);
          if (assignments.length > 0) {
            fs.appendFileSync(logFile, `Ejemplo: ${JSON.stringify(assignments[0])}\n`);
          }
        }
    } else {
        fs.appendFileSync(logFile, `No se encontró columna de gestor. Columnas: ${cols.join(', ')}\n`);
    }
  }

  console.log('Resultados en existence-check.log');
}

run();
