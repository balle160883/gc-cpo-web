import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function checkAndFixRentas() {
  console.log('--- Verificando Rentas Mensuales ---');
  
  // 1. Ver qué hay en la tabla
  const { data: rentas, error } = await supabase.from('rentas_mensuales').select('*');
  
  if (error) {
    console.error('Error al leer rentas:', error.message);
    return;
  }
  
  console.log('Registros actuales:', JSON.stringify(rentas, null, 2));
  
  // 2. Usuarios que necesitan acceso
  const emails = [
    'natalie.torres@vesta-track.cloud',
    'sergio.elizondo@vesta-track.cloud',
    'ricardo.almaraz@vesta-track.cloud',
    'sergio.elizondo@vesta-track.cloud'
  ];
  
  for (const email of emails) {
    const existing = rentas?.find(r => r.cliente_email === email);
    
    if (!existing || existing.status !== 'activo') {
      console.log(`Activando renta para ${email}...`);
      const { error: upsertError } = await supabase
        .from('rentas_mensuales')
        .upsert({
          cliente_email: email,
          status: 'activo',
          monto: 0,
          fecha_ultimo_pago: new Date().toISOString().split('T')[0],
          proximo_vencimiento: '2099-12-31'
        });
      
      if (upsertError) {
        console.error(`Error al activar ${email}:`, upsertError.message);
      } else {
        console.log(`¡${email} activado!`);
      }
    } else {
      console.log(`${email} ya está activo.`);
    }
  }
}

checkAndFixRentas();
