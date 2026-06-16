import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log("Checking foreign keys referencing cobranza_interacciones...");

  const query = `
    SELECT
        tc.table_name AS referencing_table,
        kcu.column_name AS referencing_column,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='cobranza_interacciones';
  `;

  // We can run raw SQL via supabaserpc or fetch it if there is a function,
  // or we can just try to query cobranza_promesas directly to see if it has interaccion_id.
  // Let's first test if we can query cobranza_promesas columns.
  const { data: promData, error: promError } = await supabase
    .from('cobranza_promesas')
    .select('*')
    .limit(1);

  if (promError) {
    console.error("Error checking cobranza_promesas schema:", promError.message);
  } else {
    console.log("cobranza_promesas sample row:", promData);
  }
}

run();
