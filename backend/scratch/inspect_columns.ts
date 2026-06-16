import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function inspect() {
  const { data: pData } = await supabase.from('cobranza_promesas').select('*').limit(1);
  console.log('Columnas de cobranza_promesas:', Object.keys(pData?.[0] || {}));

  const { data: iData } = await supabase.from('cobranza_interacciones').select('*').limit(1);
  console.log('Columnas de cobranza_interacciones:', Object.keys(iData?.[0] || {}));
}

inspect();
