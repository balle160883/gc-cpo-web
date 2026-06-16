import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .ilike('descripcion', '1- cuenta al corriente%')
    .limit(5);
  
  if (data) {
    console.log("Interacciones found:", data);
  } else {
    console.log(error);
  }
}

main();
