import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data: orphaned, error } = await supabase
    .from('cobranza_interacciones')
    .select('id, socio_id, prestamo_id, descripcion, fecha_gestion')
    .or('socio_id.eq.,socio_id.is.null');
  
  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${orphaned.length} orphaned records.`);
  
  let fixedCount = 0;
  for (const item of orphaned) {
    if (item.prestamo_id) {
      // Intentar recuperar socio_id desde prestamos_datos
      const { data: pData } = await supabase
        .from('prestamos_datos')
        .select('socio_id')
        .eq('prestamo_id', item.prestamo_id)
        .single();
      
      if (pData?.socio_id) {
        await supabase.from('cobranza_interacciones').update({ socio_id: pData.socio_id }).eq('id', item.id);
        console.log(`Linked interaction ${item.id} to socio ${pData.socio_id} via prestamo_id.`);
        fixedCount++;
        continue;
      }
    }

    // Si no tiene prestamo_id, intentar buscar por comentario si tiene 1- o 2- 
    // y ver si podemos encontrar el credito en asignacion_avales
    // Pero esto es mas arriesgado si no tenemos num_cuenta.
  }

  console.log(`Successfully fixed ${fixedCount} records.`);
}

main();
