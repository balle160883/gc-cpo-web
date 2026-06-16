// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const accounts = ['63-272218', '63-272211', '33-240900'];
const socioIds = ['63-001388', '33-000775'];

async function run() {
  console.log('=== BUSCANDO HISTORIAL COMPLETO DE INTERACCIONES SIN LÍMITES ===');

  // Buscar por número de cuenta exacto o por ID de socio
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('*, usuarios_gestor(gestor)')
    .or(`num_cuenta.in.(${accounts.map(a => `"${a}"`).join(',')}),socio_id.in.(${socioIds.map(s => `"${s}"`).join(',')})`);

  if (error) {
    console.error('Error fetching interactions:', error);
    return;
  }

  console.log(`Se encontraron ${data?.length} interacciones históricas para estas cuentas/socios:`);
  for (const i of data || []) {
    console.log(`- ID: ${i.id}`);
    console.log(`  Cuenta: ${i.num_cuenta}`);
    console.log(`  Socio: ${i.socio_id}`);
    console.log(`  Gestor: ${i.usuarios_gestor?.gestor || i.gestor_id}`);
    console.log(`  Fecha Gestión: ${i.fecha_gestion}`);
    console.log(`  Tipo Contacto: ${i.tipo_contacto}`);
    console.log(`  Resultado: ${i.resultado}`);
    console.log(`  Descripción: ${i.descripcion}`);
    console.log('-------------------------------');
  }
}

run();
