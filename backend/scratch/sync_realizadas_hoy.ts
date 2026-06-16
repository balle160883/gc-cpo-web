
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncRealizadas() {
  console.log('Iniciando sincronización de visitas realizadas hoy...');

  // 1. Obtener todas las interacciones de hoy
  const hoy = new Date().toISOString().split('T')[0];
  
  const { data: interacciones, error: intError } = await supabase
    .from('cobranza_interacciones')
    .select('num_cuenta, fecha_gestion')
    .gte('fecha_gestion', hoy);

  if (intError) {
    console.error('Error al obtener interacciones:', intError);
    return;
  }

  if (!interacciones || interacciones.length === 0) {
    console.log('No se encontraron interacciones registradas hoy.');
    return;
  }

  const cuentasVisitadas = [...new Set(interacciones.map(i => i.num_cuenta))];
  console.log(`Se encontraron ${cuentasVisitadas.length} cuentas gestionadas hoy:`, cuentasVisitadas);

  // 2. Actualizar el estatus en asignacion_gestores para que aparezcan en "Realizadas"
  for (const numCuenta of cuentasVisitadas) {
    if (!numCuenta) continue;

    const { error: updateError } = await supabase
      .from('asignacion_gestores')
      .update({ 'SITUACIÓN DEL CRÉDITO': 'VISITADO' })
      .eq('NoCUENTA', numCuenta)
      .neq('SITUACIÓN DEL CRÉDITO', 'LIQUIDADO'); // No tocar liquidados

    if (updateError) {
      console.error(`Error al actualizar cuenta ${numCuenta}:`, updateError);
    } else {
      console.log(`Cuenta ${numCuenta} marcada como VISITADO.`);
    }
  }

  console.log('Sincronización completada.');
}

syncRealizadas();
