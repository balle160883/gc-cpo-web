import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .limit(5)
    .order('fecha_gestion', { ascending: false });
  
  if (data) {
    console.log(data);
  } else {
    console.log(error);
  }
}

main();
