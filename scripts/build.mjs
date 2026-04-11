import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}
mkdirSync(dist, { recursive: true });

if (existsSync(join(root, 'public'))) {
  cpSync(join(root, 'public'), join(dist, 'public'), { recursive: true });
}
if (existsSync(join(root, 'index.html'))) {
  cpSync(join(root, 'index.html'), join(dist, 'index.html'));
}
if (existsSync(join(root, 'src'))) {
  cpSync(join(root, 'src'), join(dist, 'src'), { recursive: true });
}

const files = readdirSync(dist);
console.log(`Build complete. dist files: ${files.join(', ')}`);
