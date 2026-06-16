import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data: gestores } = await supabase
    .from('usuarios_gestor')
    .select('*')
    .ilike('gestor', '%NESTOR DANIEL%');
  
  console.log(gestores);
}

main();
