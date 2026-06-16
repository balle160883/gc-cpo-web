import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  console.log("Iniciando corrección de datos históricos en Supabase...");

  // 1. Corregir registros que empiezan con 1- o 2- a 'Aval'
  const { data: avales, error: errorAval } = await supabase
    .from('cobranza_interacciones')
    .update({ sujeto_tipo: 'Aval' })
    .or('descripcion.ilike.1-%,descripcion.ilike.2-%')
    .neq('sujeto_tipo', 'Aval')
    .select('id, descripcion');

  if (errorAval) {
    console.error("Error al actualizar Avales:", errorAval);
  } else {
    console.log(`Se actualizaron ${avales?.length || 0} registros a tipo 'Aval'.`);
    avales?.forEach(a => console.log(`  - [Aval] ID: ${a.id} | Desc: ${a.descripcion.substring(0, 50)}...`));
  }

  // 2. Corregir registros que empiezan con 0- a 'Socio'
  const { data: socios, error: errorSocio } = await supabase
    .from('cobranza_interacciones')
    .update({ sujeto_tipo: 'Socio' })
    .ilike('descripcion', '0-%')
    .neq('sujeto_tipo', 'Socio')
    .select('id, descripcion');

  if (errorSocio) {
    console.error("Error al actualizar Socios:", errorSocio);
  } else {
    console.log(`Se actualizaron ${socios?.length || 0} registros a tipo 'Socio'.`);
    socios?.forEach(s => console.log(`  - [Socio] ID: ${s.id} | Desc: ${s.descripcion.substring(0, 50)}...`));
  }

  console.log("\nProceso de corrección finalizado.");
}

main().catch(console.error);
