
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function cleanupFinal() {
  console.log("--- INICIANDO LIMPIEZA FINAL PAGINADA ---");

  // 1. Obtener TODOS los créditos (Paginación de 1000 en 1000)
  let allCreditos: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  let hasMore = true;

  while (hasMore) {
    console.log(`Cargando créditos desde ${from}...`);
    const { data, error } = await supabase
      .from('asignacion_gestores')
      .select('NoCUENTA, "GESTOR ASIGNADO", "DIAS MORA", "SITUACIÓN DEL CRÉDITO"')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (data && data.length > 0) {
      allCreditos = [...allCreditos, ...data];
      if (data.length < PAGE_SIZE) hasMore = false;
      else from += PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  console.log(`Total créditos cargados: ${allCreditos.length}`);

  // 2. Mapear créditos
  const creditMap = new Map();
  allCreditos.forEach(c => {
    const cleanCuenta = String(c.NoCUENTA || '').trim();
    if (!creditMap.has(cleanCuenta)) creditMap.set(cleanCuenta, []);
    creditMap.get(cleanCuenta).push({
      gestor: String(c['GESTOR ASIGNADO'] || '').trim(),
      mora: Number(c['DIAS MORA']) || 0,
      situacion: c['SITUACIÓN DEL CRÉDITO']
    });
  });

  // 3. Obtener TODOS los avales (Paginación también por si acaso)
  let allAvales: any[] = [];
  from = 0;
  hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from('asignacion_avales')
      .select('id, num_cuenta, gestor_asignado, nombre_aval')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (data && data.length > 0) {
      allAvales = [...allAvales, ...data];
      if (data.length < PAGE_SIZE) hasMore = false;
      else from += PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  console.log(`Total avales cargados: ${allAvales.length}`);

  const toDelete: string[] = [];

  allAvales.forEach(a => {
    const cleanCuentaAval = String(a.num_cuenta || '').trim();
    const matches = creditMap.get(cleanCuentaAval) || [];
    
    const gestorAval = String(a.gestor_asignado || '').trim();
    const matchParaEsteGestor = matches.find(m => m.gestor === gestorAval);

    // CRITERIO: Si no hay match de gestor O la mora es 0 O está liquidado -> BORRAR
    if (!matchParaEsteGestor || matchParaEsteGestor.mora <= 0 || matchParaEsteGestor.situacion === 'LIQUIDADO') {
        toDelete.push(a.id);
    }
  });

  console.log(`Total para borrar: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("No se encontraron registros para borrar.");
    return;
  }

  // 4. Borrar
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

cleanupFinal();
