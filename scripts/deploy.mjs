import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const envFile = join(root, '.env');
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
  }
}

loadEnv();

const missing = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing in .env: ${missing.join(', ')}`);
  console.error('Create a .env file in the project root with:');
  console.error('CLOUDFLARE_API_TOKEN=your_token');
  console.error('CLOUDFLARE_ACCOUNT_ID=your_account_id');
  process.exit(1);
}

const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
if (build.status !== 0) process.exit(build.status || 1);

const deploy = spawnSync('wrangler', ['pages', 'deploy', 'dist', '--project-name', 'neko-nook'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
process.exit(deploy.status || 0);
