import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as XLSX from 'xlsx';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const excelFilePath = path.join(__dirname, '..', 'ASIGNACION SINEFI AVALES ABRIL 2026.xlsx');

function clean(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

async function run() {
  // 1. Obtener gestores de Supabase
  const { data: dbGestoresData, error } = await supabase
    .from('usuarios_gestor')
    .select('gestor, email');

  if (error) {
    console.error('Error al obtener gestores de la BD:', error.message);
    return;
  }

  console.log('--- GESTORES EN BASE DE DATOS ---');
  dbGestoresData.forEach(g => console.log(`DB: "${g.gestor}" (${g.email})`));

  // 2. Leer gestores del Excel
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

  const excelGestoresRaw = [...new Set(data.map(row => String(row[gestorCol] || '').trim()))].filter(Boolean);

  console.log('\n--- RESULTADOS DE MATCH ---');
  
  const results = excelGestoresRaw.map(excelName => {
      const cleanExcel = clean(excelName);
      const match = dbGestoresData.find(dbg => clean(dbg.gestor) === cleanExcel);
      return {
          original: excelName,
          found: !!match,
          dbName: match ? match.gestor : null
      };
  });

  console.log('\n✅ ENCONTRADOS:');
  results.filter(r => r.found).forEach(r => {
      console.log(`- EXCEL: "${r.original}" -> BD: "${r.dbName}"`);
  });

  console.log('\n❌ NO ENCONTRADOS:');
  results.filter(r => !r.found).forEach(r => {
      console.log(`- "${r.original}"`);
  });
}

run();
