import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error, count } = await supabase
    .from('cobranza_interacciones')
    .select('id', { count: 'exact' });
  
  console.log("Total interacciones:", count);
}
main();
