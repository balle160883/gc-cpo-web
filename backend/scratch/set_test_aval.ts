import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .update({ sujeto_tipo: 'Aval' })
    .eq('id', '1edff025-cad0-46f9-9e27-af9ba03267a2') // Updating a specific recent interaction
    .select();
  
  if (error) {
    console.error("Error updating:", error);
    return;
  }
  
  console.log("Updated record to Aval:", data);
}
main();
