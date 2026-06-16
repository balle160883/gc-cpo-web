import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('id, sujeto_tipo, descripcion')
    .or('descripcion.ilike.1-%,descripcion.ilike.2-%');
  
  if (data) {
    const wrong = data.filter(d => d.sujeto_tipo !== 'Aval');
    console.log("Records with 1- or 2- prefix:", data.length);
    console.log("Records correctly marked as Aval:", data.length - wrong.length);
    console.log("Records incorrectly marked:", wrong.length);
    if (wrong.length > 0) {
      console.log("Samples of remaining errors:", wrong.slice(0, 5));
    }
  } else {
    console.log(error);
  }
}

main();
