
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function cleanupAbsolute() {
  console.log("--- INICIANDO LIMPIEZA ABSOLUTA DE AVALES ---");

  // 1. Obtener todos los avales
  const { data: avales } = await supabase
    .from('asignacion_avales')
    .select('id, num_cuenta, gestor_asignado, nombre_aval');

  // 2. Obtener TODAS las asignaciones de gestores (sin filtrar por situación para tener el panorama completo)
  const { data: creditos } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA, "GESTOR ASIGNADO", "DIAS MORA", "SITUACIÓN DEL CRÉDITO"');

  // Normalizar los NoCUENTA para el mapeo (quitar espacios)
  const creditMap = new Map();
  creditos?.forEach(c => {
      const cleanCuenta = String(c.NoCUENTA || '').trim();
      // Guardamos un array por si hay duplicados, pero para el filtro nos basta con saber si ALGUNO es válido
      if (!creditMap.has(cleanCuenta)) creditMap.set(cleanCuenta, []);
      creditMap.get(cleanCuenta).push({
          gestor: String(c['GESTOR ASIGNADO'] || '').trim(),
          mora: Number(c['DIAS MORA']) || 0,
          situacion: c['SITUACIÓN DEL CRÉDITO']
      });
  });

  const toDelete: string[] = [];

  avales?.forEach(a => {
    const cleanCuentaAval = String(a.num_cuenta || '').trim();
    const matches = creditMap.get(cleanCuentaAval) || [];
    
    // Un aval debe borrarse si:
    // 1. No existe el crédito en la tabla principal.
    // 2. EXISTE el crédito pero para el GESTOR del aval la mora es 0 (o no es su crédito).
    
    const gestorAval = String(a.gestor_asignado || '').trim();
    const matchParaEsteGestor = matches.find(m => m.gestor === gestorAval);

    if (!matchParaEsteGestor) {
        // El gestor del aval no tiene este crédito asignado -> BORRAR
        console.log(`Borrando ${a.nombre_aval} (${cleanCuentaAval}): No asignado a [${gestorAval}] en créditos.`);
        toDelete.push(a.id);
    } else if (matchParaEsteGestor.mora <= 0) {
        // Tiene el crédito pero la mora es 0 -> BORRAR
        console.log(`Borrando ${a.nombre_aval} (${cleanCuentaAval}): Mora es 0 para [${gestorAval}].`);
        toDelete.push(a.id);
    } else if (matchParaEsteGestor.situacion === 'LIQUIDADO') {
        // Crédito liquidado -> BORRAR
        console.log(`Borrando ${a.nombre_aval} (${cleanCuentaAval}): Crédito LIQUIDADO.`);
        toDelete.push(a.id);
    }
  });

  console.log(`\nTotal para borrar: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("No se encontraron registros para borrar.");
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

  console.log(`--- LIMPIEZA ABSOLUTA FINALIZADA: ${totalBorrados} registros eliminados. ---`);
}

cleanupAbsolute();
