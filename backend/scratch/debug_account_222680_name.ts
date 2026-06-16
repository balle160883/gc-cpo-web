
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function investigate() {
  const nombre = "OSUNA BECERRA VERONICA LIZET";
  console.log(`--- Buscando por nombre: ${nombre} ---`);

  // 1. Buscar en asignacion_avales
  const { data: avales } = await supabase
    .from('asignacion_avales')
    .select('*')
    .ilike('nombre_aval', `%${nombre}%`);
  
  console.log("En asignacion_avales:", avales);

  // 2. Buscar en asignacion_gestores (como titular o aval)
  const { data: gestores } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .or(`NOMBRE.ilike.%${nombre}%,"NOMBRE D.A.1".ilike.%${nombre}%,"NOMBRE D.A.2".ilike.%${nombre}%`);
  
  console.log("En asignacion_gestores:", gestores?.map(g => ({
      NoCUENTA: g.NoCUENTA,
      NOMBRE: g.NOMBRE,
      A1: g['NOMBRE D.A.1'],
      A2: g['NOMBRE D.A.2'],
      MORA: g['DIAS MORA'],
      GESTOR: g['GESTOR ASIGNADO']
  })));
}

investigate();
