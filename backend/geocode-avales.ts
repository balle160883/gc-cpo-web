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
  console.log('--- Iniciando Geocodificación de Avales ---');
  
  let hasMore = true;
  let totalProcessed = 0;

  while (hasMore) {
    const { data: avales, error } = await supabase
      .from('asignacion_avales')
      .select('id, domicilio_aval, colonia_aval, municipio_aval, estado_aval')
      .is('latitud', null)
      .limit(100);

    if (error) {
      console.error('Error obteniendo avales:', error.message);
      break;
    }

    if (!avales || avales.length === 0) {
      hasMore = false;
      console.log('No hay más avales pendientes.');
      break;
    }

    console.log(`Procesando lote de ${avales.length}... (Total: ${totalProcessed})`);

    for (const aval of avales) {
      const cleanAddress = aval.domicilio_aval?.replace(/#/g, '').replace(/N\. INT\..*/i, '').trim();
      const colony = aval.colonia_aval || '';
      const mpo = aval.municipio_aval || '';
      const state = aval.estado_aval || 'JALISCO';
      
      if (!cleanAddress) continue;

      const fullSearch = `${cleanAddress}, ${colony}, ${mpo}, ${state}, Mexico`;
      const coords = await geocode(fullSearch);
      
      if (coords) {
        await supabase.from('asignacion_avales').update({
          latitud: coords.lat,
          longitud: coords.lng
        }).eq('id', aval.id);
        totalProcessed++;
      }
      await new Promise(resolve => setTimeout(resolve, 80)); 
    }
  }

  console.log(`¡Proceso finalizado! Total geocodificados: ${totalProcessed}`);
}

run();
