import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = 'https://api.vesta-track.cloud'; // Usamos la URL de producción
// O mejor, usamos el puerto local si tenemos acceso
// Pero no tengo acceso al puerto local del servidor de AWS directamente.
// Sin embargo, puedo ejecutar el código EN el servidor de AWS.

async function testAsAdmin(email: string) {
  console.log(`--- Probando acceso para ${email} ---`);
  
  // 1. Obtener el usuario de la DB
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
  const { data: users } = await supabase.from('usuarios_gestor').select('*').eq('email', email);
  if (!users || users.length === 0) {
    console.log('Usuario no encontrado');
    return;
  }
  const user = users[0];
  console.log(`Usuario en DB: role=${user.rol}, gestor=${user.gestor}`);

  // 2. Intentar login para obtener el token real generado por el servidor
  // (Esto requiere que el servidor sea accesible)
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: user.password_hash }) // Usamos el hash como pass si el salt de bcrypt lo permite o si es texto plano
    });
    
    if (!loginRes.ok) {
        console.log(`Login fallido: ${loginRes.status}`);
        return;
    }
    
    const loginData: any = await loginRes.json();
    const token = loginData.access_token;
    console.log(`Token obtenido. Rol en user info: ${loginData.user.rol}`);

    // 3. Llamar a la API de asignaciones
    const asigRes = await fetch(`${API_URL}/portfolio/asignaciones?limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const asigData: any = await asigRes.json();
    console.log(`Respuesta Asignaciones (Status ${asigRes.status}):`, JSON.stringify(asigData).substring(0, 100));
    
    // 4. Llamar a la API de gestores
    const gestRes = await fetch(`${API_URL}/portfolio/gestores`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const gestData: any = await gestRes.json();
    console.log(`Respuesta Gestores (Status ${gestRes.status}):`, JSON.stringify(gestData).substring(0, 100));

  } catch (err) {
    console.error('Error durante la prueba:', err);
  }
}

// Probamos con Natalie
testAsAdmin('natalie.torres@vesta-track.cloud');
