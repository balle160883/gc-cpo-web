import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as XLSX from 'xlsx';

dotenv.config({ path: path.join(__dirname, '.env') });

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5NywiZXhwIjoyMDg4NzQ5NTk3fQ.NhK0bVSyLcWAP8EXU35agSs89DCq2LBhRTXv2_P-Y0A';
const supabase = createClient(process.env.SUPABASE_URL!, SERVICE_ROLE_KEY);

const excelFilePath = path.join(__dirname, '..', 'ASIGNACION SINEFI AVALES ABRIL 2026.xlsx');

function clean(str: string): string {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

async function run() {
  // 1. Obtener gestores de BD para mapeo
  const { data: dbGestoresData } = await supabase.from('usuarios_gestor').select('gestor');
  if (!dbGestoresData) return;

  // 1.5. Obtener cuentas válidas para evitar errores de FK
  const { data: validAccountsData } = await supabase.from('asignacion_gestores').select('"NoCUENTA"');
  const validAccounts = new Set(validAccountsData?.map(d => String(d.NoCUENTA)) || []);

  // 2. Leer Excel
  const workbook = XLSX.readFile(excelFilePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet) as any[];
  
  console.log(`--- Procesando los ${data.length} registros totales del Excel ---`);

  const cols = Object.keys(data[0]);
  const gestorCol = cols.find(c => c.toUpperCase().includes('GESTOR') || c.toUpperCase().includes('USUARIO'))!;
  const cuentaCol = "NoCUENTA";
  const avalCol = "NOMBRE AVAL";
  const domicilioCol = "DOMICILIO";

  console.log('Limpiando tabla asignacion_avales para re-importación...');
  await supabase.from('asignacion_avales').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const assignments: any[] = [];
  const unmatchedGestores = new Set<string>();

  for (const row of data) {
    const excelName = String(row[gestorCol] || '').trim();
    const cleanExcel = clean(excelName);
    
    // Mapeo inteligente (igual que antes)
    const match = dbGestoresData.find(dbg => {
        const cleanDb = clean(dbg.gestor);
        const excelWords = cleanExcel.split(/\s+/).filter(w => w.length > 2);
        const dbWords = cleanDb.split(/\s+/).filter(w => w.length > 2);
        const allExcelInDb = excelWords.every(w => dbWords.includes(w));
        const allDbInExcel = dbWords.every(w => excelWords.includes(w));
        return allExcelInDb || allDbInExcel;
    });

    if (match) {
        assignments.push({
            num_cuenta: String(row[cuentaCol]),
            nombre_aval: String(row[avalCol]),
            domicilio_aval: String(row[domicilioCol]),
            colonia_aval: String(row['COLONIA'] || ''),
            municipio_aval: String(row['MUNICIPIO'] || ''),
            cp_aval: String(row['CP'] || ''),
            cruces_aval: String(row['CRUCES'] || ''),
            estado_aval: String(row['ESTADO'] || 'JALISCO'),
            gestor_asignado: match.gestor,
            tipo_aval: 'Aval 1'
        });
    } else {
        if (excelName) unmatchedGestores.add(excelName);
    }
  }

  if (unmatchedGestores.size > 0) {
    console.log('Gestores no encontrados en BD:', Array.from(unmatchedGestores));
  }

  console.log(`Insertando ${assignments.length} registros enriquecidos...`);
  
  // Dividir en lotes para evitar errores
  const batchSize = 100;
  for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      const { error } = await supabase.from('asignacion_avales').insert(batch);
      if (error) {
          console.error(`Error en lote ${i}:`, error.message);
      }
  }

  console.log('¡Importación completada!');
}

run();
