import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5NywiZXhwIjoyMDg4NzQ5NTk3fQ.NhK0bVSyLcWAP8EXU35agSs89DCq2LBhRTXv2_P-Y0A';
const supabase = createClient(process.env.SUPABASE_URL!, SERVICE_ROLE_KEY);

async function run() {
  const gestoresToCreate = [
    {
      email: 'nunez.marentes.juan.jorge@empresa.com',
      password_hash: 'juan123',
      gestor: 'NUÑEZ MARENTES JUAN JORGE',
      rol: 'gestor'
    },
    {
      email: 'jauregui.diaz.maria.luisa@empresa.com',
      password_hash: 'maria123',
      gestor: 'JAUREGUI DIAZ MARIA LUISA',
      rol: 'gestor'
    }
  ];

  console.log('--- Creando Gestores Faltantes ---');
  for (const g of gestoresToCreate) {
    console.log(`Intentando crear: ${g.gestor}...`);
    const { data, error } = await supabase
      .from('usuarios_gestor')
      .insert([g])
      .select();

    if (error) {
      console.error(`Error al crear ${g.gestor}:`, JSON.stringify(error, null, 2));
    } else {
      console.log(`¡Éxito! ${g.gestor} creado.`);
    }
  }
}

run();
