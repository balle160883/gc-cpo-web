const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xygarchwyrflpzywcpid.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5NywiZXhwIjoyMDg4NzQ5NTk3fQ.NhK0bVSyLcWAP8EXU35agSs89DCq2LBhRTXv2_P-Y0A";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  console.log("Buscando socios con SALCEDO GONZALEZ...");
  
  const { data: socios } = await supabase.from('socios_datos').select('*').ilike('nombre_completo', '%SALCEDO%GONZALEZ%').limit(5);
    
  if (socios && socios.length > 0) {
      for (const s of socios) {
          console.log(`Socio: ${s.nombre_completo} | ID: ${s.socio_id} | Code: ${s.friendly_code}`);
          const { data: ints } = await supabase.from('cobranza_interacciones').select('*').eq('socio_id', s.socio_id).order('fecha_gestion', {ascending: false}).limit(3);
          if (ints) await analyze(ints, supabase);
      }
  } else {
      console.log("No se encontró al socio en la base de datos.");
      // Buscar en interacciones directamente por descripcion
      const { data: intsDesc } = await supabase.from('cobranza_interacciones').select('*').ilike('descripcion', '%al corriente%').limit(5);
      if (intsDesc) await analyze(intsDesc, supabase);
  }
}

async function analyze(ints, supabase) {
    for (const i of ints) {
        console.log(`\n--- Interacción ID: ${i.id} ---`);
        console.log(`Fecha: ${i.fecha_gestion}`);
        console.log(`Socio ID: ${i.socio_id}`);
        console.log(`Prestamo ID: ${i.prestamo_id}`);
        console.log(`Resultado: ${i.resultado}`);
        console.log(`Desc: ${i.descripcion}`);
        
        const { data: asig } = await supabase.from('asignacion_gestores').select('*').eq('NoSOCIO', i.socio_id).limit(1);
        console.log(`¿Está en asignacion_gestores?: ${asig && asig.length > 0 ? 'SÍ' : 'NO'}`);
        
        const { data: prestSocio } = await supabase.from('prestamos_datos').select('*').eq('socio_id', i.socio_id).limit(1);
        console.log(`¿Tiene algún préstamo en prestamos_datos (por socio_id)?: ${prestSocio && prestSocio.length > 0 ? 'SÍ (' + prestSocio[0].num_cuenta + ')' : 'NO'}`);
    }
}

main();
