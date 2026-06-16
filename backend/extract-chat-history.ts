import * as fs from 'fs';
import * as path from 'path';

const brainDir = 'C:\\Users\\Desarrollo\\.gemini\\antigravity-ide\\brain';

async function run() {
  if (!fs.existsSync(brainDir)) {
    console.log("Brain directory does not exist.");
    return;
  }

  const folders = fs.readdirSync(brainDir);
  console.log(`Scanning commands in ${folders.length} folders...`);

  for (const folder of folders) {
    const fullPath = path.join(brainDir, folder);
    const stat = fs.statSync(fullPath);
    if (!stat.isDirectory()) continue;

    const transcriptPath = path.join(fullPath, '.system_generated', 'logs', 'transcript.jsonl');
    if (!fs.existsSync(transcriptPath)) continue;

    try {
      const content = fs.readFileSync(transcriptPath, 'utf8');
      
      if (content.includes('run_command')) {
        const lines = content.split('\n');
        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const obj = JSON.parse(line);
            if (obj.tool_calls) {
              obj.tool_calls.forEach((tc: any) => {
                if (tc.name === 'run_command') {
                  const cmd = tc.args?.CommandLine || '';
                  if (cmd.includes('ssh') || cmd.includes('deploy') || cmd.includes('tar') || cmd.includes('aws') || cmd.includes('pem') || cmd.includes('git push')) {
                    console.log(`\n[Conv: ${folder}] [Step ${obj.step_index}] Cwd: ${tc.args.Cwd}`);
                    console.log(`Command: ${cmd}`);
                  }
                }
              });
            }
          } catch(e) {}
        });
      }
    } catch (e: any) {
      // ignore
    }
  }
}

run();
