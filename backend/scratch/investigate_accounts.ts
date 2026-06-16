// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- 1. BUSCANDO AL GESTOR NESTOR ---');
  const { data: users, error: errUsers } = await supabase
    .from('usuarios_gestor')
    .select('*');

  if (errUsers) {
    console.error('Error fetching users:', errUsers);
  }

  const nestorUser = users?.find(u => 
    u.gestor?.toLowerCase().includes('nestor') || 
    u.email?.toLowerCase().includes('nestor')
  );

  if (nestorUser) {
    console.log('Nestor encontrado:', nestorUser);
  } else {
    console.log('Nestor no fue encontrado en usuarios_gestor. Listado completo de usuarios:');
    console.log(users?.map(u => ({ id: u.id, gestor: u.gestor, email: u.email })));
  }

  const accounts = ['63-272218', '63-272211', '33-240900'];
  // También busquemos sin prefijos de sucursal
  const cleanAccounts = accounts.map(a => a.split('-').pop() || a);
  console.log('\n--- 2. BUSCANDO CUENTAS EN asignacion_gestores ---');
  
  const { data: assignments, error: errAsig } = await supabase
    .from('asignacion_gestores')
    .select('*')
    .or(`NoCUENTA.in.(${accounts.map(a => `"${a}"`).join(',')}),NoCUENTA.in.(${cleanAccounts.map(a => `"${a}"`).join(',')})`);

  if (errAsig) {
    console.error('Error fetching assignments:', errAsig);
  } else {
    console.log(`Se encontraron ${assignments?.length} asignaciones en la base de datos:`);
    for (const asig of assignments || []) {
      console.log(`- Cuenta: ${asig.NoCUENTA}, Socio: ${asig.NoSOCIO}, Nombre: ${asig.NOMBRE}, Gestor Asignado: ${asig['GESTOR ASIGNADO']}, Situación: ${asig['SITUACIÓN DEL CRÉDITO']}`);
    }
  }

  console.log('\n--- 3. BUSCANDO EN cobranza_promesas (PENDIENTES) ---');
  // Buscaremos promesas con estado 'pendiente'
  const { data: promises, error: errPromises } = await supabase
    .from('cobranza_promesas')
    .select('*, prestamos_datos(num_cuenta, socio_id)')
    .eq('estado', 'pendiente');

  if (errPromises) {
    console.error('Error fetching promises:', errPromises);
  } else {
    // Filtrar promesas que correspondan a las cuentas o socios de interés
    const matchedPromises = promises?.filter(p => {
      const pCuenta = p.prestamos_datos?.num_cuenta;
      const pSocio = String(p.prestamos_datos?.socio_id || '');
      return accounts.includes(pCuenta) || cleanAccounts.includes(pCuenta) || 
             assignments?.some(a => String(a.NoSOCIO) === pSocio || String(a.NoCUENTA) === pCuenta);
    });

    console.log(`Se encontraron ${matchedPromises?.length} promesas de pago pendientes relacionadas con estas cuentas:`);
    for (const p of matchedPromises || []) {
      console.log(`- Promesa ID: ${p.id}, Préstamo ID: ${p.prestamo_id}, Cuenta: ${p.prestamos_datos?.num_cuenta}, Monto Prometido: ${p.monto_prometido}, Fecha Promesa: ${p.fecha_promesa}, Gestor ID: ${p.gestor_id}, Estado: ${p.estado}`);
    }
  }

  console.log('\n--- 4. BUSCANDO EN cobranza_interacciones (RESULTADO=promesa_pago) ---');
  // Buscaremos interacciones cuyo resultado sea 'promesa_pago'
  const { data: interactions, error: errInteractions } = await supabase
    .from('cobranza_interacciones')
    .select('*')
    .eq('resultado', 'promesa_pago');

  if (errInteractions) {
    console.error('Error fetching interactions:', errInteractions);
  } else {
    const matchedInteractions = interactions?.filter(i => {
      const iSocio = String(i.socio_id || '');
      const iIdNorm = iSocio.includes('-') ? iSocio.split('-').pop() : iSocio;
      return assignments?.some(a => {
        const aSocioNorm = String(a.NoSOCIO).split('-').pop();
        return String(a.NoSOCIO) === iSocio || aSocioNorm === iIdNorm;
      });
    });

    console.log(`Se encontraron ${matchedInteractions?.length} interacciones con resultado 'promesa_pago' relacionadas:`);
    for (const i of matchedInteractions || []) {
      console.log(`- Interacción ID: ${i.id}, Socio ID: ${i.socio_id}, Gestor ID: ${i.gestor_id}, Fecha Gestión: ${i.fecha_gestion}, Descripción: ${i.descripcion}, Resultado: ${i.resultado}`);
    }
  }
}

run();
