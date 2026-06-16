const https = require('https');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzM1OTcsImV4cCI6MjA4ODc0OTU5N30.DSUUQtGNYmTZgh-vhQb8aTkmxwScTYIZ58Zaa9yjqts';

const options = {
  hostname: 'xygarchwyrflpzywcpid.supabase.co',
  port: 443,
  path: '/rest/v1/usuarios_gestor?email=eq.superadmin@vesta-track.cloud',
  method: 'GET',
  headers: {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey
  }
};

const req = https.request(options, (res) => {
  console.log('Status code:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(e);
  process.exit(1);
});

req.end();
