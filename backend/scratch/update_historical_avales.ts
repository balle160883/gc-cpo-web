import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  console.log("Iniciando busqueda de historial de Avales...");

  // Buscamos gestiones antiguas donde el gestor haya puesto la palabra "aval" en los comentarios, 
  // pero que aún estén etiquetadas como Socio o vacías
  const { data: interacciones, error } = await supabase
    .from('cobranza_interacciones')
    .select('id, descripcion, sujeto_tipo')
    .or('sujeto_tipo.is.null,sujeto_tipo.eq.Socio')
    .ilike('descripcion', '%aval%');

  if (error) {
    console.error("Error al buscar interacciones:", error);
    return;
  }

  if (!interacciones || interacciones.length === 0) {
    console.log("No se encontraron gestiones históricas que mencionen 'aval' en los comentarios.");
    return;
  }

  console.log(`Se encontraron ${interacciones.length} gestiones en el pasado que mencionan a un aval. Procediendo a actualizarlas...`);

  let actualizadas = 0;
  for (const item of interacciones) {
    // Para ver qué estamos actualizando
    console.log(`- Actualizando ID: ${item.id} | Comentario: "${item.descripcion}"`);

    const { error: updateError } = await supabase
      .from('cobranza_interacciones')
      .update({ sujeto_tipo: 'Aval' })
      .eq('id', item.id);
      
    if (updateError) {
      console.error(`Error actualizando gestión ${item.id}:`, updateError.message);
    } else {
      actualizadas++;
    }
  }

  console.log(`\n¡Terminado! Se actualizaron ${actualizadas} gestiones a tipo Aval de manera exitosa.`);
}

main().catch(console.error);
