import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('id, socio_id, sujeto_tipo, descripcion, resultado, fecha_gestion')
    .order('fecha_gestion', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log("Últimas 10 interacciones:", data);
}
main();
