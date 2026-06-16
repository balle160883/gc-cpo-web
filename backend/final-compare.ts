import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const excelFilePath = path.join(__dirname, '..', 'ASIGNACION SINEFI AVALES ABRIL 2026.xlsx');

function clean(str: string): string {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

async function run() {
  console.log('Obteniendo gestores de BD...');
  const { data: dbGestoresData, error } = await supabase.from('usuarios_gestor').select('gestor, email');
  if (error) return console.error('Error:', error.message);
  console.log(`Gestores en BD: ${dbGestoresData.length}`);

  console.log('Leyendo Excel...');
  const workbook = XLSX.readFile(excelFilePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet) as any[];
  console.log(`Filas en Excel: ${data.length}`);

  if (data.length === 0) return console.error('Archivo Excel vacío.');

  const cols = Object.keys(data[0]);
  console.log('Columnas encontradas:', cols.join(', '));
  const gestorCol = cols.find(c => c.toUpperCase().includes('GESTOR') || c.toUpperCase().includes('USUARIO'));
  
  if (!gestorCol) {
      console.error('No se pudo identificar la columna del gestor.');
      return;
  }
  console.log(`Columna detectada: "${gestorCol}"`);

  const excelGestoresRaw = [...new Set(data.map(row => String(row[gestorCol] || '').trim()))].filter(Boolean);
  console.log(`Gestores únicos en Excel: ${excelGestoresRaw.length}`);

  let output = "# Resultados del Match de Gestores\n\n";
  output += `Fecha de análisis: ${new Date().toLocaleString()}\n\n`;
  
  const found: string[] = [];
  const notFound: string[] = [];

  for (const excelName of excelGestoresRaw) {
    const cleanExcel = clean(excelName);
    const excelWords = cleanExcel.split(/\s+/).filter(w => w.length > 2);

    const match = dbGestoresData.find(dbg => {
        const cleanDb = clean(dbg.gestor);
        const dbWords = cleanDb.split(/\s+/).filter(w => w.length > 2);
        
        // Verificar si todas las palabras del Excel están en la BD o viceversa
        const allExcelInDb = excelWords.every(w => dbWords.includes(w));
        const allDbInExcel = dbWords.every(w => excelWords.includes(w));
        
        return allExcelInDb || allDbInExcel;
    });

    if (match) {
        found.push(`- **EXCEL:** \`${excelName}\`  \n  **BD:** \`${match.gestor}\` (${match.email})`);
    } else {
        notFound.push(`- \`${excelName}\``);
    }
  }

  output += "## ✅ Coincidencias Encontradas (" + found.length + ")\n\n";
  output += found.join("\n") + "\n\n";
  
  output += "## ❌ Sin Coincidencia (Deben ser creados) (" + notFound.length + ")\n\n";
  output += notFound.join("\n") + "\n";

  fs.writeFileSync('final_match.md', output);
  console.log('Archivo final_match.md generado exitosamente.');
}

run();
