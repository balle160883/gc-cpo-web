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

async function run() {
  const inicioMes = new Date('2026-06-01T00:00:00.000Z');

  // Obtener el conteo exacto de interacciones de Nestor en este mes
  const { count, error } = await supabase
    .from('cobranza_interacciones')
    .select('*', { count: 'exact', head: true })
    .eq('gestor_id', user.id)
    .eq('tipo_contacto', 'visita')
    .gte('fecha_gestion', inicioMes.toISOString());

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`=== ESTADÍSTICAS DE NESTOR ===`);
  console.log(`Total de visitas en Junio 2026: ${count}`);
}

run();
