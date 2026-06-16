
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function investigate() {
  const cuenta = "0-091400";
  console.log(`--- Investigando cuenta: ${cuenta} ---`);

  // 1. Buscar en asignacion_avales
  const { data: avales } = await supabase
    .from('asignacion_avales')
    .select('*')
    .eq('num_cuenta', cuenta);
  
  console.log("En asignacion_avales:", avales?.map(a => ({
      nombre: a.nombre_aval,
      gestor: a.gestor_asignado
  })));

  // 2. Buscar en asignacion_gestores
  const { data: gestores } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .eq('NoCUENTA', cuenta);
  
  console.log("En asignacion_gestores:", gestores?.map(g => ({
      NoCUENTA: g.NoCUENTA,
      NOMBRE: g.NOMBRE,
      GESTOR_ASIGNADO: g['GESTOR ASIGNADO'],
      SITUACION: g['SITUACIÓN DEL CRÉDITO'],
      DIAS_MORA: g['DIAS MORA'],
      SALDO_AL_DIA: g['SALDO AL DIA']
  })));
}

investigate();
