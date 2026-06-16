import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as XLSX from 'xlsx';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  const { data: dbData } = await supabase.from('asignacion_gestores').select('"NoCUENTA"');
  const valid = new Set(dbData?.map(d => String(d.NoCUENTA)) || []);
  
  const workbook = XLSX.readFile('../ASIGNACION SINEFI AVALES ABRIL 2026.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const excel = XLSX.utils.sheet_to_json(sheet) as any[];
  
  let matches = 0;
  for (const r of excel) {
    if (valid.has(String(r.NoCUENTA))) {
      matches++;
    }
  }
  
  console.log('Total Excel:', excel.length);
  console.log('Cuentas en Excel que EXISten en DB:', matches);
  console.log('Cuentas en Excel que NO EXISten en DB:', excel.length - matches);
}

run();
