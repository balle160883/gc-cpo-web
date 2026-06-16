
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

async function geocode(address: string) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=mx`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`  Mapbox API Error: ${response.status} ${response.statusText}`);
        return null;
    }
    const data: any = await response.json();
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const context = feature.context || [];
      const place = context.find((c: any) => c.id.startsWith('place'));
      const region = context.find((c: any) => c.id.startsWith('region'));
      return {
        lat: feature.center[1],
        long: feature.center[0],
        municipio: place ? place.text : 'No encontrado',
        estado: region ? region.text : 'No encontrado'
      };
    }
  } catch (e: any) {
    console.error(`  Fetch Exception: ${e.message}`);
    return null;
  }
  return null;
}

async function run() {
  const { data, error } = await supabase
    .from('asignacion_gestores')
    .select('NoCUENTA, DOMICILIO, MUNICIPIO, ESTADO, "DOMICILIO D.A.1"')
    .not('"DOMICILIO D.A.1"', 'is', null)
    .limit(5);

  if (error) {
    console.error("Error en query:", error);
  } else {
    console.log("--- DEBUG AUDITORÍA DE AVALES ---");
    for (const x of data) {
        console.log(`\nCuenta ${x.NoCUENTA}:`);
        console.log(`  SOCIO BASE: ${x.MUNICIPIO}, ${x.ESTADO}`);
        
        const avalAddress = x['DOMICILIO D.A.1'];
        if (!avalAddress || avalAddress.length < 3) {
            console.log(`  AVAL 1 DIRECCIÓN: [Inválida]`);
            continue;
        }

        const fullQuery = `${avalAddress}, ${x.MUNICIPIO}, ${x.ESTADO}, Mexico`;
        console.log(`  QUERY: ${fullQuery}`);
        const avalGeo = await geocode(fullQuery);
        
        if (avalGeo) {
            console.log(`  AVAL 1 MUNICIPIO DETECTADO: ${avalGeo.municipio}`);
            console.log(`  AVAL 1 ESTADO DETECTADO: ${avalGeo.estado}`);
        } else {
            console.log(`  AVAL 1: Falló geocodificación.`);
        }
    }
  }
}

run();
