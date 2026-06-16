import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('id')
    .gt('fecha_gestion', '2026-04-15T23:59:59.000Z');
  
  console.log("Visits today:", data?.length);
}
main();
