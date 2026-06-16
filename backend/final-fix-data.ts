import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function fixEverything() {
  console.log('--- Iniciando Reparación Final de Datos ---');
  
  const emails = [
    'natalie.torres@vesta-track.cloud',
    'sergio.elizondo@vesta-track.cloud',
    'ricardo.almaraz@vesta-track.cloud'
  ];

  // 1. Asegurar que tengan rol 'admin' (Ya verificado, pero por si acaso)
  console.log('Verificando roles...');
  const { error: roleError } = await supabase
    .from('usuarios_gestor')
    .update({ rol: 'admin' })
    .in('email', emails);
  
  if (roleError) console.error('Error actualizando roles:', roleError.message);

  // 2. Activar sus rentas una por una para evitar problemas de constraint
  console.log('Activando rentas mensuales...');
  for (const email of emails) {
    // Primero intentamos update
    const { data: updated, error: updateError } = await supabase
      .from('rentas_mensuales')
      .update({
        status: 'activo',
        monto: 0,
        fecha_ultimo_pago: new Date().toISOString().split('T')[0],
        proximo_vencimiento: '2099-12-31'
      })
      .eq('cliente_email', email)
      .select();

    if (updateError) {
      console.error(`Error actualizando renta de ${email}:`, updateError.message);
    } else if (updated && updated.length > 0) {
      console.log(`¡Renta de ${email} actualizada a ACTIVO!`);
    } else {
      // Si no hay nada para actualizar, insertamos
      console.log(`No se encontró registro para ${email}, insertando nuevo...`);
      const { error: insertError } = await supabase
        .from('rentas_mensuales')
        .insert({
          cliente_email: email,
          status: 'activo',
          monto: 0,
          fecha_ultimo_pago: new Date().toISOString().split('T')[0],
          proximo_vencimiento: '2099-12-31'
        });
      if (insertError) {
        console.error(`Error insertando renta de ${email}:`, insertError.message);
      } else {
        console.log(`¡Renta de ${email} creada y ACTIVADA!`);
      }
    }
  }

  console.log('--- Reparación Finalizada ---');
}

fixEverything();
