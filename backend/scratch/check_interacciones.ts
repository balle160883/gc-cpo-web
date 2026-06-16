import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('id, sujeto_tipo, resultado, fecha_gestion')
    .order('fecha_gestion', { ascending: false })
    .limit(20);
  
  if (data) {
    console.log("Total recent interactions:", data.length);
    console.log("With Aval:", data.filter(d => d.sujeto_tipo === 'Aval').length);
    console.log("With Socio:", data.filter(d => d.sujeto_tipo === 'Socio').length);
    console.log("With None:", data.filter(d => !d.sujeto_tipo).length);
    console.log("Samples:", data.slice(0, 5));
  } else {
    console.log("No data", error);
  }
}
main();
