const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xygarchwyrflpzywcpid.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5NywiZXhwIjoyMDg4NzQ5NTk3fQ.NhK0bVSyLcWAP8EXU35agSs89DCq2LBhRTXv2_P-Y0A";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const socioId = "00034324";
  const socioIdNorm = "34324";

  console.log(`Verificando asignacion_gestores para Socio: ${socioId} / ${socioIdNorm}`);
  
  const { data: asig } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .or(`NoSOCIO.eq.${socioId},NoSOCIO.eq.${socioIdNorm}`)
    .limit(5);

  if (asig && asig.length > 0) {
      console.log("Registros encontrados en asignacion_gestores:");
      asig.forEach(a => {
          console.log(`- NoSOCIO: [${a.NoSOCIO}] (Tipo: ${typeof a.NoSOCIO})`);
          console.log(`  NoCUENTA: [${a.NoCUENTA}]`);
          console.log(`  NOMBRE: [${a.NOMBRE}]`);
          console.log(`  SITUACION: [${a['SITUACIÓN DEL CRÉDITO']}]`);
      });
  } else {
      console.log("No se encontró NADA en asignacion_gestores con esos IDs.");
      
      // Buscar por nombre
      const { data: asigName } = await supabase.from('asignacion_gestores').select('*').ilike('NOMBRE', '%SALCEDO%').limit(1);
      if (asigName && asigName[0]) {
          console.log("Encontrado por nombre en asignacion_gestores:");
          console.log(`- NoSOCIO real: [${asigName[0].NoSOCIO}]`);
          console.log(`- NoCUENTA real: [${asigName[0].NoCUENTA}]`);
      }
  }
}

main();
