const https = require('https');

const data = JSON.stringify({
  email: 'superadmin@vesta-track.cloud',
  password_hash: 'admin2026',
  rol: 'superadmin',
  gestor: 'SUPERADMIN'
});

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5OCwiZXhwIjoyMDg4NzQ5NTk4fQ.NhK0bVSyLcWAP8EXU35agSs8';

const options = {
  hostname: 'xygarchwyrflpzywcpid.supabase.co',
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

const req = https.request(options, (res) => {
  console.log('Status code:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
    process.exit(res.statusCode === 201 ? 0 : 1);
  });
});

req.on('error', (e) => {
  console.error(e);
  process.exit(1);
});

req.write(data);
req.end();
