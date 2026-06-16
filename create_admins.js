const https = require('https');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5OCwiZXhwIjoyMDg4NzQ5NTk4fQ.NhK0bVSyLcWAP8EXU35agSs8';
const hostname = 'xygarchwyrflpzywcpid.supabase.co';

const admins = [
  {
    email: 'sergio.elizondo@vesta-track.cloud',
    password_hash: 'SergioVesta2026!',
    rol: 'admin',
    gestor: 'SERGIO ELIZONDO'
  },
  {
    email: 'ricardo.almaraz@vesta-track.cloud',
    password_hash: 'RicardoVesta2026!',
    rol: 'admin',
    gestor: 'RICARDO ALMARAZ'
  },
  {
    email: 'natalie.torres@vesta-track.cloud',
    password_hash: 'NatalieVesta2026!',
    rol: 'admin',
    gestor: 'NATALIE TORRES'
  }
];

async function createAdmin(admin) {
  const data = JSON.stringify(admin);
  
  const options = {
    hostname: hostname,
    port: 443,
    path: '/rest/v1/usuarios_gestor',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`✓ Usuario creado: ${admin.email}`);
          resolve(body);
        } else {
          console.error(`✗ Error al crear ${admin.email}: ${res.statusCode}`);
          console.error('Respuesta:', body);
          reject(body);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Iniciando creación de administradores...');
  for (const admin of admins) {
    try {
      await createAdmin(admin);
    } catch (e) {
      // Continuar con el siguiente si falla (ej. ya existe)
    }
  }
  console.log('Proceso finalizado.');
}

run();
