import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data: assignments } = await supabase
    .from('asignacion_avales')
    .select('*')
    .eq('gestor_asignado', 'RODRIGUEZ MARTINEZ NESTOR DANIEL');
  
  console.log(assignments);
}

main();
