
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function run() {
  const { data, error } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA, DOMICILIO, \"DOMICILIO D.A.1\", \"DOMICILIO D.A.2\"')
    .limit(50);

  if (error) {
    console.error(error);
  } else {
    data.forEach(x => {
        console.log(`Cuenta ${x.NoCUENTA}:`);
        console.log(`  Socio: ${x.DOMICILIO}`);
        if (x['DOMICILIO D.A.1']) console.log(`  Aval 1: ${x['DOMICILIO D.A.1']}`);
        if (x['DOMICILIO D.A.2']) console.log(`  Aval 2: ${x['DOMICILIO D.A.2']}`);
    });
  }
}

run();
