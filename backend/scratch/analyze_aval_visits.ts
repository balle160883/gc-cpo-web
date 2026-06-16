
// @ts-nocheck
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

async function analyzeAvalVisits() {
  console.log('--- Analizando visitas a Avales ---');

  // 1. Contar interacciones totales por tipo de sujeto
  const { data: counts, error: countError } = await supabase
    .from('cobranza_interacciones')
    .select('sujeto_tipo, tipo_contacto')
    
  if (countError) {
    console.error('Error al contar interacciones:', countError);
    return;
  }

  const visitsToAvales = counts.filter(c => c.sujeto_tipo === 'Aval' && c.tipo_contacto === 'visita');
  const totalInteractionsToAvales = counts.filter(c => c.sujeto_tipo === 'Aval');
  const visitsToSocios = counts.filter(c => c.sujeto_tipo === 'Socio' && c.tipo_contacto === 'visita');

  console.log(`Total de interacciones con Avales: ${totalInteractionsToAvales.length}`);
  console.log(`Visitas presenciales a Avales: ${visitsToAvales.length}`);
  console.log(`Visitas presenciales a Socios: ${visitsToSocios.length}`);

  // 2. Obtener detalles de las visitas a avales
  if (visitsToAvales.length > 0) {
    const { data: details, error: detailError } = await supabase
      .from('cobranza_interacciones')
      .select('fecha_gestion, resultado, descripcion, gestor_id, usuarios_gestor(gestor)')
      .eq('sujeto_tipo', 'Aval')
      .eq('tipo_contacto', 'visita')
      .order('fecha_gestion', { ascending: false });

    if (detailError) {
      console.error('Error al obtener detalles:', detailError);
    } else {
      console.log('\nDetalle de las visitas a Avales:');
      details.forEach((v, index) => {
        console.log(`${index + 1}. Fecha: ${v.fecha_gestion} - Gestor: ${v.usuarios_gestor?.gestor || v.gestor_id}`);
        console.log(`   Resultado: ${v.resultado}`);
        console.log(`   Descripción: ${v.descripcion || 'Sin descripción'}`);
        console.log('-------------------');
      });
    }
  } else {
    console.log('No se encontraron visitas registradas específicamente a avales.');
  }
}

analyzeAvalVisits();
