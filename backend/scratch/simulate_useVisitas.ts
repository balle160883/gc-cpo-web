// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const user = {
  id: '015bb26f-ed15-43a9-927b-3c2b2fb090d6',
  gestor: 'RODRIGUEZ MARTINEZ NESTOR DANIEL'
};

async function simulate() {
  console.log('=== SIMULANDO LOGICA DE useVisitas.ts PARA NESTOR (CON OPTIMIZACIÓN) ===');

  // 1. Obtener Socios
  const { data: sociosData } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .eq('GESTOR ASIGNADO', user.gestor)
    .neq('SITUACIÓN DEL CRÉDITO', 'LIQUIDADO');

  // 2. Obtener Avales
  const { data: avalesData } = await supabase
    .from('asignacion_avales')
    .select('*')
    .eq('gestor_asignado', user.gestor);

  // 3. Obtener interacciones del mes actual usando la nueva optimización
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const activeCuentas = [
    ...(sociosData?.map((item: any) => item.NoCUENTA).filter(Boolean) || []),
    ...(avalesData?.map((item: any) => item.num_cuenta).filter(Boolean) || [])
  ];
  const uniqueActiveCuentas = [...new Set(activeCuentas)];

  let interaccionesMes: any[] = [];
  if (uniqueActiveCuentas.length > 0) {
    const { data: dataInt } = await supabase
      .from('cobranza_interacciones')
      .select('num_cuenta, sujeto_tipo')
      .eq('gestor_id', user.id)
      .eq('tipo_contacto', 'visita')
      .gte('fecha_gestion', inicioMes.toISOString())
      .in('num_cuenta', uniqueActiveCuentas);
      
    interaccionesMes = dataInt || [];
  }

  const sociosVisitados = new Set(
    interaccionesMes?.filter(i => i.sujeto_tipo === 'Socio').map(i => i.num_cuenta).filter(Boolean) || []
  );
  const avalesVisitados = new Set(
    interaccionesMes?.filter(i => i.sujeto_tipo === 'Aval').map(i => i.num_cuenta).filter(Boolean) || []
  );

  console.log(`\nSocios visitados en el mes (con optimización):`);
  console.log(Array.from(sociosVisitados));
  
  console.log(`\nAvales visitados en el mes (con optimización):`);
  console.log(Array.from(avalesVisitados));

  const targetAccounts = ['63-272218', '63-272211', '33-240900'];
  const results = [];

  // Procesar Socios
  sociosData?.forEach((item: any) => {
    if (!targetAccounts.includes(item.NoCUENTA)) return;
    const diasMora = Number(item['DIAS MORA']) || 0;
    const situacion = item['SITUACIÓN DEL CRÉDITO'];
    
    if (diasMora <= 0) return;

    const hasSocioInteraction = sociosVisitados.has(item.NoCUENTA);
    const hasAnyInteraction = sociosVisitados.has(item.NoCUENTA) || avalesVisitados.has(item.NoCUENTA);
    const isRealizada = hasSocioInteraction || (situacion === 'VISITADO' && !hasAnyInteraction);

    results.push({
      tipo_registro: 'Socio',
      cuenta: item.NoCUENTA,
      nombre: item.NOMBRE,
      socioId: item.NoSOCIO,
      diasMora: diasMora,
      situacion: situacion,
      isRealizada: isRealizada
    });
  });

  // Procesar Avales
  avalesData?.forEach((item: any) => {
    if (!targetAccounts.includes(item.num_cuenta)) return;
    const creditMatch = sociosData?.find((s: any) => s.NoCUENTA === item.num_cuenta);
    const diasMora = Number(creditMatch?.['DIAS MORA']) || 0;
    const situacion = creditMatch?.['SITUACIÓN DEL CRÉDITO'] || 'VIGENTE';
    
    if (!creditMatch || diasMora <= 0) return;

    const hasAvalInteraction = avalesVisitados.has(item.num_cuenta);
    const hasAnyInteraction = sociosVisitados.has(item.num_cuenta) || avalesVisitados.has(item.num_cuenta);
    const isRealizada = hasAvalInteraction || (situacion === 'VISITADO' && !hasAnyInteraction);

    results.push({
      tipo_registro: 'Aval',
      cuenta: item.num_cuenta,
      nombre: item.nombre_aval,
      socioId: creditMatch.NoSOCIO,
      diasMora: diasMora,
      situacion: situacion,
      isRealizada: isRealizada
    });
  });

  console.log('\n--- NUEVOS RESULTADOS DE LA SIMULACIÓN CON LA OPTIMIZACIÓN ---');
  for (const r of results) {
    console.log(`Registro: [${r.tipo_registro}] - Cuenta: ${r.cuenta} - Nombre: ${r.nombre}`);
    console.log(`  - Días Mora: ${r.diasMora}`);
    console.log(`  - Situación: ${r.situacion}`);
    console.log(`  - ¿Marcar como Realizada (Completada)?: ${r.isRealizada ? 'SÍ (desaparece de pendientes)' : 'NO (se queda en pendientes)'}`);
    console.log('----------------------------------------------------');
  }
}

simulate();
