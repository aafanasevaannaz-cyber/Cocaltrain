import { createServer } from 'node:http';
import { readFileSync, existsSync, watch } from 'node:fs';
import { join, extname } from 'node:path';

const root = process.cwd();
const port = 5173;
const clients = new Set();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.ts': 'application/javascript; charset=utf-8',
  '.tsx': 'application/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  if (req.url === '/__events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    res.write('event: hello\ndata: connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const path = req.url === '/' ? '/index.html' : req.url;
  const filename = join(root, path);

  if (!existsSync(filename)) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  const ext = extname(filename);
  let data = readFileSync(filename);
  if (path === '/index.html') {
    const reloadScript = `
<script>
  const source = new EventSource('/__events');
  source.addEventListener('reload', () => window.location.reload());
</script>
`;
    data = Buffer.from(String(data).replace('</body>', `${reloadScript}</body>`), 'utf-8');
  }
  res.setHeader('content-type', mime[ext] ?? 'application/octet-stream');
  res.setHeader('cache-control', 'no-store');
  res.end(data);
});

const notifyReload = () => {
  for (const client of clients) {
    client.write('event: reload\ndata: changed\n\n');
  }
};

watch(join(root, 'src'), { recursive: true }, notifyReload);
if (existsSync(join(root, 'public'))) {
  watch(join(root, 'public'), { recursive: true }, notifyReload);
}
if (existsSync(join(root, 'index.html'))) {
  watch(join(root, 'index.html'), notifyReload);
}

server.listen(port, () => {
  console.log(`Dev server running on http://localhost:${port} (auto reload enabled)`);
});
