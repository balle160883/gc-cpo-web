
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function cleanupDeep() {
  console.log("--- Iniciando Limpieza Profunda de Avales (Inconsistencias y Ceros) ---");

  // 1. Obtener todos los avales
  const { data: avales } = await supabase
    .from('asignacion_avales')
    .select('id, num_cuenta, gestor_asignado');

  // 2. Obtener todas las asignaciones de gestores (créditos) activos con mora
  const { data: creditos } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA, "GESTOR ASIGNADO", "DIAS MORA"')
    .neq('SITUACIÓN DEL CRÉDITO', 'LIQUIDADO');

  const creditMap = new Map(creditos?.map(c => [c.NoCUENTA, { gestor: c['GESTOR ASIGNADO'], mora: c['DIAS MORA'] }]));

  const toDelete: string[] = [];

  avales?.forEach(a => {
    const info = creditMap.get(a.num_cuenta);
    
    // CRITERIOS DE BORRADO:
    // a) No existe el crédito activo
    // b) El gestor no coincide (evita los ceros en el app)
    // c) La mora es 0
    if (!info || info.gestor !== a.gestor_asignado || info.mora <= 0) {
        toDelete.push(a.id);
    }
  });

  console.log(`Total identificados para borrar: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("No hay nada que limpiar.");
    return;
  }

  // Borrar en bloques
  const BATCH_SIZE = 100;
  let totalBorrados = 0;

  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batch = toDelete.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('asignacion_avales')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`Error en batch ${i}:`, error);
    } else {
      totalBorrados += batch.length;
      console.log(`Progreso: ${totalBorrados}/${toDelete.length} borrados...`);
    }
  }

  console.log(`--- LIMPIEZA FINALIZADA: ${totalBorrados} registros eliminados. ---`);
}

cleanupDeep();
