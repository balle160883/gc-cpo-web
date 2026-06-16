// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ids = [
  '1c05ba3c-0bf9-44fb-9ce3-db2c6a7094ea',
  '668d6518-1717-49ee-9e8d-e8a66ed8fbdf',
  '0f7b4d7f-4564-4987-95ec-2b7e38bea332',
  '72d1d530-c84e-4841-ab36-aada5d9f3c1e',
  'c07f2eb2-bf5d-46eb-a685-5e66cbaf4083',
  '25a29787-628e-44ec-a1cd-fd2aedb6b6d3'
];

async function run() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('Error fetching interactions:', error);
    return;
  }

  console.log('--- DETALLES DE INTERACCIONES REGISTRADAS HOY ---');
  for (const i of data || []) {
    console.log(`ID: ${i.id}`);
    console.log(`- num_cuenta: ${JSON.stringify(i.num_cuenta)}`);
    console.log(`- socio_id: ${JSON.stringify(i.socio_id)}`);
    console.log(`- sujeto_tipo: ${JSON.stringify(i.sujeto_tipo)}`);
    console.log(`- tipo_contacto: ${JSON.stringify(i.tipo_contacto)}`);
    console.log(`- resultado: ${JSON.stringify(i.resultado)}`);
    console.log(`- descripcion: ${JSON.stringify(i.descripcion)}`);
    console.log('--------------------------------------------');
  }
}

run();
