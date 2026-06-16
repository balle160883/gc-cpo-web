
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function checkExact() {
  const cuenta = "7-222680";
  console.log(`--- Analizando EXACTAMENTE cuenta: ${cuenta} ---`);

  const { data } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .eq('NoCUENTA', cuenta);
  
  console.log(`Se encontraron ${data?.length} registros para esta cuenta.`);
  data?.forEach((g, i) => {
      console.log(`Registro ${i+1}:`);
      console.log(`  Titular: ${g.NOMBRE}`);
      console.log(`  Gestor: [${g['GESTOR ASIGNADO']}]`);
      console.log(`  Días Mora: [${g['DIAS MORA']}] (Tipo: ${typeof g['DIAS MORA']})`);
      console.log(`  Situación: [${g['SITUACIÓN DEL CRÉDITO']}]`);
  });

  const { data: aval } = await supabase
    .from('asignacion_avales')
    .select('*')
    .eq('num_cuenta', cuenta);
  
  console.log(`\nAval en DB:`);
  aval?.forEach((a, i) => {
    console.log(`  Aval: ${a.nombre_aval}`);
    console.log(`  Gestor: [${a.gestor_asignado}]`);
  });
}

checkExact();
