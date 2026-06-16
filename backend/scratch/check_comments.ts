import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('id, tipo_gestion, observaciones, contacto, resultado, notas')
    .limit(50)
    .order('fecha_gestion', { ascending: false });
  
  if (data) {
    console.log(data);
  } else {
    console.log(error);
  }
}

main();
