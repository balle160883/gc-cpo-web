const https = require('https');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzM1OTcsImV4cCI6MjA4ODc0OTU5N30.DSUUQtGNYmTZgh-vhQb8aTkmxwScTYIZ58Zaa9yjqts';
const hostname = 'xygarchwyrflpzywcpid.supabase.co';

const newUser = {
  email: 'cobranza.zona.norte@vesta-track.cloud',
  password_hash: 'CobranzaNorteVesta2026!',
  rol: 'admin',
  gestor: 'COBRANZA ZONA NORTE'
};

async function createUser(user) {
  const data = JSON.stringify(user);
  
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
          console.log('✓ Usuario creado exitosamente!');
          console.log('Respuesta:', body);
          resolve(body);
        } else {
          console.error('✗ Error al crear el usuario:', res.statusCode);
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

createUser(newUser);
