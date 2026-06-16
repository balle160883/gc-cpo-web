import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('cobranza_interacciones')
    .select('id, socio_id, gestor_id, fecha_gestion, tipo_contacto, resultado, descripcion, sujeto_tipo')
    .limit(100)
    .order('fecha_gestion', { ascending: false });
  
  if (data) {
    const startsWith0 = data.filter(d => d.descripcion?.startsWith('0-'));
    const startsWith1 = data.filter(d => d.descripcion?.startsWith('1-'));
    const startsWith2 = data.filter(d => d.descripcion?.startsWith('2-'));
    const others = data.filter(d => d.descripcion && !d.descripcion.match(/^[0-2]-/));
    
    console.log("Starts with 0-:", startsWith0.length);
    console.log("  Socio:", startsWith0.filter(d=>d.sujeto_tipo==='Socio').length, "Aval:", startsWith0.filter(d=>d.sujeto_tipo==='Aval').length);
    console.log("Starts with 1-:", startsWith1.length);
    console.log("  Socio:", startsWith1.filter(d=>d.sujeto_tipo==='Socio').length, "Aval:", startsWith1.filter(d=>d.sujeto_tipo==='Aval').length);
    console.log("Starts with 2-:", startsWith2.length);
    console.log("  Socio:", startsWith2.filter(d=>d.sujeto_tipo==='Socio').length, "Aval:", startsWith2.filter(d=>d.sujeto_tipo==='Aval').length);
    
    if (startsWith1.length > 0) console.log("Sample 1-:", startsWith1[0].descripcion);
    if (startsWith2.length > 0) console.log("Sample 2-:", startsWith2[0].descripcion);
  } else {
    console.log(error);
  }
}

main();
