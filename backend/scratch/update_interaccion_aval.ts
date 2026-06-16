import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .update({ sujeto_tipo: 'Aval' })
    .eq('id', 'c516507f-d3ca-40d6-91f7-d9e47db96ff5')
    .select();
  
  if (data) {
    console.log("Updated interaction to Aval:", data);
  } else {
    console.log("Error", error);
  }
}
main();
