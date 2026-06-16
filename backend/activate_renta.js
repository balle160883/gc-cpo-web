const https = require('https');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3MzU5OCwiZXhwIjoyMDg4NzQ5NTk4fQ.NhK0bVSyLcWAP8EXU35agSs8';
const supabaseUrl = 'xygarchwyrflpzywcpid.supabase.co';

const activeRenta = JSON.stringify({
  cliente_email: 'ing.ballesteros16@gmail.com',
  monto: 1500,
  status: 'activo',
  fecha_ultimo_pago: new Date().toISOString().split('T')[0],
  proximo_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
});

const options = {
  hostname: supabaseUrl,
  port: 443,
  path: '/rest/v1/rentas_mensuales',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Content-Length': activeRenta.length
  }
};

console.log('Intentando activar renta para: ing.ballesteros16@gmail.com...');

const req = https.request(options, (res) => {
  console.log('Status code:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 200 || res.statusCode === 204) {
      console.log('✅ Renta activada con éxito.');
    } else {
      console.log('❌ Error al activar renta:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Error de red:', e);
});

req.write(activeRenta);
req.end();
