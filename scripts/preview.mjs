import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = 4173;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const path = req.url === '/' ? '/index.html' : req.url;
  const filename = join(root, path);

  if (!existsSync(filename)) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  const ext = extname(filename);
  const data = readFileSync(filename);
  res.setHeader('content-type', mime[ext] ?? 'application/octet-stream');
  res.end(data);
});

server.listen(port, () => {
  console.log(`Preview server running on http://localhost:${port}`);
});
