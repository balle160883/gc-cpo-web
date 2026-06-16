import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data: user } = await supabase
    .from('usuarios_gestor')
    .select('*')
    .eq('gestor_id', '015bb26f-ed15-43a9-927b-3c2b2fb090d6')
    .single();
  
  console.log("Gestor found:", user);

  if (user) {
    // Buscar asignaciones de este gestor hoy o recientemente
    const { data: assignments } = await supabase
      .from('asignacion_avales')
      .select('*')
      .eq('gestor_asignado', user.gestor);
    
    console.log("Assignments for this gestor:", assignments);
  }
}

main();
