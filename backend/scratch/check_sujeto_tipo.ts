import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .rpc('count_sujeto_tipo'); // Actually, let's just fetch all pages or check if any 'Aval' exists.
  
  const { data: avalData, error: avalError } = await supabase
    .from('cobranza_interacciones')
    .select('sujeto_tipo')
    .eq('sujeto_tipo', 'Aval');
  
  console.log("Total Avales en interacciones:", avalData ? avalData.length : 0);
  
  if (error) {
    console.error(error);
    return;
  }
  
  const counts = data.reduce((acc, curr) => {
    const type = curr.sujeto_tipo || 'NULL';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log("Valores de sujeto_tipo:", counts);
}
main();
