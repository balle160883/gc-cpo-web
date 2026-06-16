import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('asignacion_avales')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log("No data", error);
  }
}
main();
