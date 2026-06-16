import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .eq('sujeto_tipo', 'Aval')
    .limit(5);
  console.log("Supabase Aval count:", data?.length);
  console.log("Supabase Aval:", data?.map((d: any) => ({id: d.id, fecha: d.fecha_gestion})));
}
main();
