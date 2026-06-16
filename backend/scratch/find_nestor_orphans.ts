import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data: users } = await supabase
    .from('usuarios_gestor')
    .select('gestor_id, gestor')
    .ilike('gestor', '%NESTOR DANIEL%');
  
  console.log("Gestores matching NESTOR DANIEL:", users);

  if (users && users.length > 0) {
    const gestorId = users[0].gestor_id;
    // Buscar asignaciones de avales para este gestor
    const { data: avales } = await supabase
      .from('asignacion_avales')
      .select('*')
      .eq('gestor_asignado', users[0].gestor);
    
    console.log("Avales assigned to Nestos Daniel:", avales?.length);
    if (avales && avales.length > 0) {
        // Buscar el que mas coincida con la descripcion si hay pistas, 
        // pero mejor vamos a ver las interacciones huerfanas de este gestor hoy.
        const { data: orphansToday } = await supabase
            .from('cobranza_interacciones')
            .select('*')
            .eq('gestor_id', gestorId)
            .or('socio_id.eq.,socio_id.is.null')
            .gte('fecha_gestion', '2026-04-18T00:00:00Z');
        
        console.log("Orphaned interactions today for this gestor:", orphansToday);
    }
  }
}

main();
