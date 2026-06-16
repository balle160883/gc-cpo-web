
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function investigate() {
  const cuenta = "7-222680";
  console.log(`--- Investigando cuenta: ${cuenta} ---`);

  // 1. Buscar en asignacion_avales
  const { data: avales } = await supabase
    .from('asignacion_avales')
    .select('*')
    .eq('num_cuenta', cuenta);
  
  console.log("En asignacion_avales:", avales);

  // 2. Buscar en asignacion_gestores
  const { data: gestores } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .eq('NoCUENTA', cuenta);
  
  console.log("En asignacion_gestores:", gestores);

  // 3. Buscar en cobranza_interacciones (tal vez viene de otro lado?)
  const { data: interacciones } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .eq('num_cuenta', cuenta)
    .limit(5);
  
  console.log("En cobranza_interacciones (recientes):", interacciones);
}

investigate();
