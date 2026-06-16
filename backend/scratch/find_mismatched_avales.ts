
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function findMismatches() {
  console.log("--- Buscando Avales con Gestor Desactualizado o Diferente al del Crédito ---");

  // 1. Obtener todos los avales
  const { data: avales } = await supabase
    .from('asignacion_avales')
    .select('id, num_cuenta, gestor_asignado, nombre_aval');

  // 2. Obtener todas las asignaciones de gestores (créditos)
  const { data: creditos } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA, "GESTOR ASIGNADO", "DIAS MORA"');

  const creditMap = new Map(creditos?.map(c => [c.NoCUENTA, { gestor: c['GESTOR ASIGNADO'], mora: c['DIAS MORA'] }]));

  let mismatched = 0;
  let zeros = 0;
  const toDelete: string[] = [];

  avales?.forEach(a => {
    const info = creditMap.get(a.num_cuenta);
    
    if (!info) {
        // No hay crédito activo (ya borramos muchos de estos, pero por si acaso)
        toDelete.push(a.id);
        zeros++;
    } else if (info.gestor !== a.gestor_asignado) {
        // El gestor no coincide
        console.log(`Mismatch en ${a.num_cuenta}: Aval (${a.nombre_aval}) tiene a [${a.gestor_asignado}], pero Crédito tiene a [${info.gestor}]`);
        toDelete.push(a.id);
        mismatched++;
    } else if (info.mora <= 0) {
        // El crédito está al corriente (0 mora)
        toDelete.push(a.id);
        zeros++;
    }
  });

  console.log(`Total analizados: ${avales?.length}`);
  console.log(`Para borrar por inconsistencia de gestor: ${mismatched}`);
  console.log(`Para borrar por saldo en cero o falta de crédito: ${zeros}`);
  
  return toDelete;
}

findMismatches();
