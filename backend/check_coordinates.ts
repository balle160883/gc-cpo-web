import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const SERVICE_ROLE_KEY = process.env.SUPABASE_KEY || '';
const supabase = createClient(process.env.SUPABASE_URL!, SERVICE_ROLE_KEY);

async function run() {
  // 1. Check partners (socios)
  const { data: totalPartners, error: err1 } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA', { count: 'exact', head: true });

  const { data: geocodedPartners, error: err2 } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA', { count: 'exact', head: true })
    .not('LATITUD', 'is', null);

  // 2. Check guarantors (avales)
  const { data: totalGuarantors, error: err3 } = await supabase
    .from('asignacion_avales')
    .select('id', { count: 'exact', head: true });

  const { data: geocodedGuarantors, error: err4 } = await supabase
    .from('asignacion_avales')
    .select('id', { count: 'exact', head: true })
    .not('latitud', 'is', null);

  console.log('--- PARTNERS (SOCIOS) STATUS ---');
  console.log('Total Partners in Database:', totalPartners ? (totalPartners as any).length || 0 : 'N/A');
  console.log('Geocoded Partners (with coords):', geocodedPartners ? (geocodedPartners as any).length || 0 : 'N/A');
  
  // Wait, select count exact works by getting count header or using .select('*', { count: 'exact' }) and returning count property.
  // Let's print out what is returned by the count.
  // Actually, Supabase returns the count under the 'count' key if we specify head: true or select '*'
  console.log('Raw results:');
  console.log('err1:', err1, 'count1:', totalPartners);
}

// Better count helper using postgres REST API
async function runCorrected() {
  const { count: totalPartners } = await supabase
    .from('asignacion_gestores')
    .select('*', { count: 'exact', head: true });

  const { count: geocodedPartners } = await supabase
    .from('asignacion_gestores')
    .select('*', { count: 'exact', head: true })
    .not('LATITUD', 'is', null);

  const { count: totalGuarantors } = await supabase
    .from('asignacion_avales')
    .select('*', { count: 'exact', head: true });

  const { count: geocodedGuarantors } = await supabase
    .from('asignacion_avales')
    .select('*', { count: 'exact', head: true })
    .not('latitud', 'is', null);

  console.log('--- COORD STATUS ---');
  console.log(`Socios (Partners): Total = ${totalPartners}, Geocoded = ${geocodedPartners}, Pending = ${totalPartners! - geocodedPartners!}`);
  console.log(`Avales (Guarantors): Total = ${totalGuarantors}, Geocoded = ${geocodedGuarantors}, Pending = ${totalGuarantors! - geocodedGuarantors!}`);
}

runCorrected();
