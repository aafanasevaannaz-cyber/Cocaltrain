import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}
mkdirSync(dist, { recursive: true });

if (existsSync(join(root, 'public'))) {
  cpSync(join(root, 'public'), dist, { recursive: true });
}

const index = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cocaltrain</title>
    <style>
      body { font-family: Inter, system-ui, sans-serif; margin: 0; background: #fff8f1; color: #7c2d12; }
      .wrap { max-width: 720px; margin: 64px auto; padding: 24px; background: #fff; border-radius: 18px; box-shadow: 0 10px 30px rgba(180,83,9,.15); }
      code { background: #ffedd5; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Cocaltrain</h1>
      <p>Сборка подготовлена в offline-режиме без внешних npm-пакетов.</p>
      <p>Исходники приложения находятся в <code>src/</code>, статические данные в <code>public/</code>.</p>
    </main>
  </body>
</html>`;

writeFileSync(join(dist, 'index.html'), index);

const files = readdirSync(dist);
console.log(`Build complete. dist files: ${files.join(', ')}`);
