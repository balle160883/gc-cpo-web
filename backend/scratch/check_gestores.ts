import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('usuarios_gestor')
    .select('*')
    .limit(10);
  
  if (data) {
    console.log("Usuarios gestor samples:", data);
  } else {
    console.log(error);
  }
}

main();
