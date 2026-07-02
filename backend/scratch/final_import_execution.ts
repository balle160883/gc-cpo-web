import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as XLSX from 'xlsx';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5NywiZXhwIjoyMDg4NzQ5NTk3fQ.NhK0bVSyLcWAP8EXU35agSs89DCq2LBhRTXv2_P-Y0A';
const supabase = createClient(process.env.SUPABASE_URL!, SERVICE_ROLE_KEY);

const excelFilePath = path.join(__dirname, '..', '..', 'AVALES VERTICALES 06 DE MAYO 2026.xlsx');

const clean = (str: string): string => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
};

async function run() {
  const { data: dbGestoresData } = await supabase.from('usuarios_gestor').select('gestor');
  
  const workbook = XLSX.readFile(excelFilePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet) as any[];
  
  console.log(`Procesando ${data.length} registros...`);

  const cols = Object.keys(data[0]);
  const gestorCol = cols.find(c => c.toUpperCase().includes('GESTOR') || c.toUpperCase().includes('USUARIO'))!;
  const cuentaCol = "NoCUENTA";
  const avalCol = "NOMBRE AVAL";
  const domicilioCol = "DOMICILIO";

  console.log('Limpiando tabla asignacion_avales...');
  await supabase.from('asignacion_avales').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const assignments: any[] = [];
  const unmatched = new Set<string>();
  const cuentaCount = new Map<string, number>();

  for (const row of data) {
    const excelName = String(row[gestorCol] || '').trim();
    const cleanExcel = clean(excelName);
    
    const match = dbGestoresData?.find(dbg => {
        const cleanDb = clean(dbg.gestor);
        const excelWords = cleanExcel.split(/\s+/).filter(w => w.length > 2);
        const dbWords = cleanDb.split(/\s+/).filter(w => w.length > 2);
        return excelWords.every(w => dbWords.includes(w)) || dbWords.every(w => excelWords.includes(w));
    });

    if (match) {
        const numCuenta = String(row[cuentaCol] || '');
        const count = cuentaCount.get(numCuenta) || 0;
        cuentaCount.set(numCuenta, count + 1);
        const tipoAval = count === 0 ? 'Aval 1' : 'Aval 2';

        assignments.push({
            num_cuenta: numCuenta,
            nombre_aval: String(row[avalCol] || ''),
            domicilio_aval: String(row[domicilioCol] || ''),
            colonia_aval: String(row['COLONIA'] || ''),
            municipio_aval: String(row['MUNICIPIO'] || ''),
            cp_aval: String(row['CP'] || ''),
            cruces_aval: String(row['CRUCES'] || ''),
            estado_aval: String(row['ESTADO'] || 'JALISCO'),
            gestor_asignado: match.gestor,
            tipo_aval: tipoAval
        });
    } else {
        if (excelName) unmatched.add(excelName);
    }
  }

  console.log(`Insertando ${assignments.length} registros en la base de datos...`);
  const batchSize = 100;
  for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      const { error } = await supabase.from('asignacion_avales').insert(batch);
      if (error) console.error(`Error en lote ${i}:`, error.message);
  }

  console.log('¡Importación completada con éxito!');
  if (unmatched.size > 0) {
      console.log('Gestores no encontrados:', Array.from(unmatched));
  }
}

run();
