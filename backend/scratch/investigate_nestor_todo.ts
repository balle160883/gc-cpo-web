// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const nestorId = '015bb26f-ed15-43a9-927b-3c2b2fb090d6';
const nestorName = 'RODRIGUEZ MARTINEZ NESTOR DANIEL';

async function run() {
  console.log(`=== INVESTIGANDO TODO PARA NESTOR ===`);
  
  // 1. Asignaciones activas en asignacion_gestores
  const { data: asignaciones, error: errAsig } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .eq('GESTOR ASIGNADO', nestorName);

  if (errAsig) {
    console.error('Error fetching assignments:', errAsig);
  } else {
    console.log(`\n--- Asignaciones activas de Nestor (${asignaciones?.length}): ---`);
    for (const a of asignaciones || []) {
      console.log(`- Cuenta: ${a.NoCUENTA}, Socio: ${a.NoSOCIO}, Nombre: ${a.NOMBRE}, Situación: ${a['SITUACIÓN DEL CRÉDITO']}`);
    }
  }

  // 2. Interacciones registradas por Nestor
  const { data: interacciones, error: errInt } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .eq('gestor_id', nestorId);

  if (errInt) {
    console.error('Error fetching interactions:', errInt);
  } else {
    console.log(`\n--- Interacciones registradas por Nestor (${interacciones?.length}): ---`);
    for (const i of interacciones || []) {
      console.log(`- ID: ${i.id}, Socio ID: ${i.socio_id}, Fecha: ${i.fecha_gestion}, Resultado: ${i.resultado}, Descripcion: ${i.descripcion}`);
    }
  }

  // 3. Promesas registradas por Nestor
  const { data: promesas, error: errProm } = await supabase
    .from('cobranza_promesas')
    .select('*, prestamos_datos(*)')
    .eq('gestor_id', nestorId);

  if (errProm) {
    console.error('Error fetching promises:', errProm);
  } else {
    console.log(`\n--- Promesas registradas por Nestor (${promesas?.length}): ---`);
    for (const p of promesas || []) {
      console.log(`- ID: ${p.id}, Préstamo ID: ${p.prestamo_id}, Cuenta: ${p.prestamos_datos?.num_cuenta}, Monto: ${p.monto_prometido}, Estado: ${p.estado}, Fecha: ${p.fecha_promesa}`);
    }
  }

  // 4. Buscar promesas pendientes del endpoint para Nestor
  // Vamos a simular lo que hace `getPromesasPendientes` en crm.service.ts
  console.log(`\n--- Simulando getPromesasPendientes de Nestor ---`);
  // a) Promesas formales
  const { data: formalPromises } = await supabase
    .from('cobranza_promesas')
    .select('*, prestamos_datos(num_cuenta, socio_id)')
    .eq('estado', 'pendiente');

  // b) Interacciones informales (resultado = promesa_pago)
  const { data: informalInteractions } = await supabase
    .from('cobranza_interacciones')
    .select('id, socio_id, fecha_gestion, descripcion, gestor_id, sujeto_tipo, prestamo_id')
    .eq('resultado', 'promesa_pago')
    .eq('gestor_id', nestorId);

  console.log(`\nPromesas formales en BD estado=pendiente: ${formalPromises?.length}`);
  console.log(`Interacciones informales de Nestor estado=promesa_pago: ${informalInteractions?.length}`);
  for (const i of informalInteractions || []) {
    console.log(`- ID: ${i.id}, Socio ID: ${i.socio_id}, Fecha: ${i.fecha_gestion}, Desc: ${i.descripcion}`);
  }
}

run();
