import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const SERVICE_ROLE_KEY = process.env.SUPABASE_KEY || '';
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';
const supabase = createClient(process.env.SUPABASE_URL!, SERVICE_ROLE_KEY);

async function geocode(address: string) {
  try {
    const query = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=mx`;
    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (e) {
    console.error(`Error geocodificando: ${address}`, e);
  }
  return null;
}

async function run() {
  console.log('--- Iniciando Geocodificación de Gestores ---');
  
  let hasMore = true;
  let totalProcessed = 0;

  while (hasMore) {
    const { data: gestores, error } = await supabase
      .from('asignacion_gestores')
      .select('NoCUENTA, DOMICILIO, COLONIA, MUNICIPIO, ESTADO')
      .is('LATITUD', null)
      .limit(100);

    if (error) {
      console.error('Error obteniendo gestores:', error.message);
      break;
    }

    if (!gestores || gestores.length === 0) {
      hasMore = false;
      console.log('No hay más gestores pendientes.');
      break;
    }

    console.log(`Procesando lote de ${gestores.length}... (Total: ${totalProcessed})`);

    for (const gestor of gestores) {
      const cleanAddress = gestor.DOMICILIO?.replace(/#/g, '').replace(/N\. INT\..*/i, '').trim();
      const colony = gestor.COLONIA || '';
      const mpo = gestor.MUNICIPIO || '';
      const state = gestor.ESTADO || 'JALISCO';
      
      if (!cleanAddress) continue;

      const fullSearch = `${cleanAddress}, ${colony}, ${mpo}, ${state}, Mexico`;
      const coords = await geocode(fullSearch);
      
      if (coords) {
        await supabase.from('asignacion_gestores').update({
          LATITUD: coords.lat,
          LONGITUD: coords.lng
        }).eq('NoCUENTA', gestor.NoCUENTA);
        totalProcessed++;
      }
      // Pequeño delay para no saturar la API (50ms)
      await new Promise(resolve => setTimeout(resolve, 50)); 
    }
  }

  console.log(`¡Proceso finalizado! Total geocodificados: ${totalProcessed}`);
}

run();
