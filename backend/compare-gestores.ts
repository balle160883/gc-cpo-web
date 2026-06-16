import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as XLSX from 'xlsx';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const excelFilePath = path.join(__dirname, '..', 'ASIGNACION SINEFI AVALES ABRIL 2026.xlsx');

async function run() {
  // 1. Leer gestores del Excel
  const workbook = XLSX.readFile(excelFilePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet) as any[];
  
  const firstRow = data[0];
  const cols = Object.keys(firstRow);
  const gestorCol = cols.find(c => c.toUpperCase().includes('GESTOR') || c.toUpperCase().includes('USUARIO'));
  
  if (!gestorCol) {
    console.error('No se encontró la columna de gestor en el Excel.');
    return;
  }

  const excelGestores = [...new Set(data.map(row => row[gestorCol]))]
    .filter(Boolean)
    .map(name => String(name).trim().toUpperCase());

  console.log(`Gestores en Excel (${excelGestores.length}):`);
  
  // 2. Obtener gestores de Supabase
  const { data: dbGestoresData, error } = await supabase
    .from('usuarios_gestor')
    .select('gestor');

  if (error) {
    console.error('Error al obtener gestores de la BD:', error.message);
    return;
  }

  const dbGestores = dbGestoresData.map(g => g.gestor.trim().toUpperCase());
  console.log(`Gestores en BD (${dbGestores.length}):`);

  // 3. Comparar
  const found: string[] = [];
  const notFound: string[] = [];

  excelGestores.forEach(gestor => {
    if (dbGestores.includes(gestor)) {
      found.push(gestor);
    } else {
      // Intentar una búsqueda parcial por si hay variaciones
      const partialMatch = dbGestores.find(dbg => dbg.includes(gestor) || gestor.includes(dbg));
      if (partialMatch) {
          found.push(`${gestor} (Match parcial con: ${partialMatch})`);
      } else {
          notFound.push(gestor);
      }
    }
  });

  console.log('\n--- RESULTADOS DEL ANÁLISIS ---');
  console.log('\n✅ GESTORES ENCONTRADOS EN LA BD:');
  found.forEach(g => console.log(`- ${g}`));

  console.log('\n❌ GESTORES QUE NO ESTÁN EN LA BD:');
  notFound.forEach(g => console.log(`- ${g}`));
  
  console.log('\n--- DETALLE DE ASIGNACIONES POR GESTOR ---');
  const counts: Record<string, number> = {};
  data.forEach(row => {
      const g = String(row[gestorCol]).trim().toUpperCase();
      counts[g] = (counts[g] || 0) + 1;
  });

  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
      const status = found.some(f => f.startsWith(name)) ? '✅' : '❌';
      console.log(`${status} ${name}: ${count} asignaciones`);
  });
}

run();
