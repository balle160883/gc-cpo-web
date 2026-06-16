
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAccountDetails() {
  const accountNo = '25-261352';
  console.log(`--- Buscando detalles de la cuenta ${accountNo} ---`);

  const { data, error } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .eq('NoCUENTA', accountNo);

  if (error) {
    console.error('Error al buscar la cuenta:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No se encontró la cuenta especificada.');
    return;
  }

  const account = data[0];
  console.log('\n--- DATOS DE LA CUENTA ---');
  console.log(`Socio: ${account.NOMBRE}`);
  console.log(`No. Socio: ${account.NoSOCIO}`);
  console.log(`Cuenta: ${account.NoCUENTA}`);
  console.log(`Gestor Asignado: ${account['GESTOR ASIGNADO']}`);
  
  console.log('\n--- DOMICILIO SOCIO ---');
  console.log(`Calle: ${account.CALLE || 'N/A'}`);
  console.log(`Colonia: ${account.COLONIA || 'N/A'}`);
  console.log(`Municipio: ${account.MUNICIPIO || 'N/A'}`);
  console.log(`Coordenadas: ${account.LATITUD}, ${account.LONGITUD}`);

  if (account['NOMBRE D.A.1'] || account['DOMI D.A.1']) {
    console.log('\n--- DOMICILIO AVAL 1 ---');
    console.log(`Nombre: ${account['NOMBRE D.A.1']}`);
    console.log(`Domicilio: ${account['DOMI D.A.1'] || 'N/A'}`);
  }

  if (account['NOMBRE D.A.2'] || account['DOMI D.A.2']) {
    console.log('\n--- DOMICILIO AVAL 2 ---');
    console.log(`Nombre: ${account['NOMBRE D.A.2']}`);
    console.log(`Domicilio: ${account['DOMI D.A.2'] || 'N/A'}`);
  }
}

getAccountDetails();
