
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Cargar variables de entorno desde el backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: SUPABASE_URL o SUPABASE_KEY no definidos en el .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupAvales() {
  console.log("--- Iniciando limpieza de Avales sin deuda activa ---");

  try {
    // 1. Obtener todos los créditos activos (no liquidados)
    const { data: creditosActivos, error: errorCreditos } = await supabase
      .from('asignacion_gestores')
      .select('NoCUENTA')
      .neq('SITUACIÓN DEL CRÉDITO', 'LIQUIDADO');

    if (errorCreditos) throw errorCreditos;
    
    const cuentasActivas = new Set(creditosActivos.map(c => c.NoCUENTA));
    console.log(`Créditos activos encontrados: ${cuentasActivas.size}`);

    // 2. Obtener todos los avales asignados
    const { data: avales, error: errorAvales } = await supabase
      .from('asignacion_avales')
      .select('id, num_cuenta, nombre_aval');

    if (errorAvales) throw errorAvales;
    console.log(`Avales en tabla de asignación: ${avales.length}`);

    // 3. Identificar avales huérfanos (cuyo crédito ya no está activo)
    const avalesABorrar = avales.filter(a => !cuentasActivas.has(a.num_cuenta));
    
    console.log(`Avales detectados sin deuda activa: ${avalesABorrar.length}`);

    if (avalesABorrar.length === 0) {
      console.log("No hay avales que limpiar.");
      return;
    }

    // 4. Proceder con el borrado en bloques (para evitar límites de Supabase)
    const idsABorrar = avalesABorrar.map(a => a.id);
    const BATCH_SIZE = 100;
    let totalBorrados = 0;

    for (let i = 0; i < idsABorrar.length; i += BATCH_SIZE) {
      const batch = idsABorrar.slice(i, i + BATCH_SIZE);
      const { error: deleteError } = await supabase
        .from('asignacion_avales')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`Error al borrar bloque ${i}:`, deleteError);
      } else {
        totalBorrados += batch.length;
        console.log(`Progreso: ${totalBorrados}/${idsABorrar.length} borrados...`);
      }
    }

    console.log(`--- Limpieza completada. Se borraron ${totalBorrados} registros de avales. ---`);

  } catch (error) {
    console.error("Error fatal durante la limpieza:", error);
  }
}

cleanupAvales();
