const { execFileSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'update_daco_data.py');

try {
  const output = execFileSync('python3', [scriptPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  process.stdout.write(output);
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout.toString());
  if (error.stderr) process.stderr.write(error.stderr.toString());
  process.exit(error.status || 1);
}
