import * as fs from 'fs';
import * as path from 'path';

const schemaPath = path.join(__dirname, '..', 'supabase_schema.json');

async function run() {
  if (!fs.existsSync(schemaPath)) {
    console.log("No supabase_schema.json found.");
    return;
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const paths = Object.keys(schema.paths || {});
  
  console.log("Exposed endpoints in Supabase REST API:");
  paths.forEach(p => {
    console.log(`- ${p}`);
  });
}

run();
