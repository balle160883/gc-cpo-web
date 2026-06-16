// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const nestorId = '015bb26f-ed15-43a9-927b-3c2b2fb090d6';
const accounts = ['63-272218', '63-272211', '33-240900'];

async function run() {
  console.log('=== INSPECCIONANDO ESTADO DE VISITAS PARA LAS CUENTAS ===');

  // 1. Obtener datos de asignacion_gestores
  const { data: assignments, error: errAsig } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .in('NoCUENTA', accounts);

  if (errAsig) {
    console.error('Error fetching assignments:', errAsig);
    return;
  }

  console.log('\n--- DATOS EN asignacion_gestores: ---');
  for (const a of assignments || []) {
    console.log(`Cuenta: ${a.NoCUENTA}`);
    console.log(`- Socio: ${a.NoSOCIO}`);
    console.log(`- Nombre: ${a.NOMBRE}`);
    console.log(`- Gestor Asignado: ${a['GESTOR ASIGNADO']}`);
    console.log(`- Situación del Crédito: ${a['SITUACIÓN DEL CRÉDITO']}`);
    console.log(`- Días Mora: ${a['DIAS MORA']}`);
    console.log(`- Capital Moroso: ${a['CAPITAL MOROSO']}`);
    console.log(`- Saldo Al Día: ${a['SALDO AL DIA']}`);
    console.log(`- Saldo Total: ${a['SALDO TOTAL']}`);
  }

  // 2. Obtener avales para estas cuentas en asignacion_avales
  const { data: avales, error: errAvales } = await supabase
    .from('asignacion_avales')
    .select('*')
    .in('num_cuenta', accounts);

  console.log('\n--- DATOS EN asignacion_avales: ---');
  if (errAvales) {
    console.warn('Error fetching avales:', errAvales);
  } else {
    for (const av of avales || []) {
      console.log(`Cuenta: ${av.num_cuenta}`);
      console.log(`- Aval: ${av.nombre_aval}`);
      console.log(`- Tipo Aval: ${av.tipo_aval}`);
      console.log(`- Gestor Asignado: ${av.gestor_asignado}`);
    }
  }

  // 3. Buscar interacciones en el mes actual (Junio 2026)
  const inicioMes = new Date('2026-06-01T00:00:00.000Z');
  console.log(`\n--- BUSCANDO VISITAS REGISTRADAS DESDE EL ${inicioMes.toISOString()}: ---`);
  
  const { data: interacciones, error: errInt } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .eq('gestor_id', nestorId)
    .eq('tipo_contacto', 'visita')
    .gte('fecha_gestion', inicioMes.toISOString());

  if (errInt) {
    console.error('Error fetching interacciones:', errInt);
    return;
  }

  console.log(`Total visitas registradas por Nestor en el mes: ${interacciones?.length}`);
  
  // Buscar visitas de estas cuentas o socios
  // Nota: socio_id en cobranza_interacciones puede tener prefijo de sucursal o no.
  // Vamos a cruzar con NoSOCIO de los assignments.
  const socioIds = assignments.map(a => String(a.NoSOCIO));
  const socioIdsNorm = socioIds.map(id => id.split('-').pop() || id);

  for (const acc of accounts) {
    const asig = assignments.find(a => a.NoCUENTA === acc);
    const sId = asig ? String(asig.NoSOCIO) : '';
    const sIdNorm = sId.split('-').pop() || sId;

    console.log(`\nBúsqueda de visitas para cuenta ${acc} (Socio ${sId}):`);
    
    // Buscar interacciones para este socio/cuenta
    const matchingInts = interacciones?.filter(i => {
      const iSocio = String(i.socio_id || '');
      const iSocioNorm = iSocio.split('-').pop() || iSocio;
      
      // Match por número de cuenta (si se guardó) o por socio_id
      const matchAcc = i.num_cuenta === acc;
      const matchSocio = iSocio === sId || iSocioNorm === sIdNorm;
      
      return matchAcc || matchSocio;
    });

    if (matchingInts && matchingInts.length > 0) {
      console.log(`  Se encontraron ${matchingInts.length} visitas:`);
      for (const m of matchingInts) {
        console.log(`  - ID: ${m.id}`);
        console.log(`    Fecha: ${m.fecha_gestion}`);
        console.log(`    Sujeto Tipo: ${m.sujeto_tipo}`);
        console.log(`    Resultado: ${m.resultado}`);
        console.log(`    Descripción: ${m.descripcion}`);
      }
    } else {
      console.log(`  No se encontró NINGUNA visita registrada en junio de 2026 para este socio/cuenta.`);
    }
  }
}

run();
