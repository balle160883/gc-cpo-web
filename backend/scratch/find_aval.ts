import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .order('fecha_gestion', { ascending: false })
    .limit(500);
  
  if (data) {
    const avalR = data.filter(r => r.sujeto_tipo === 'Aval');
    console.log("Found Aval in recent 500:", avalR.length);
  }
}
main();
