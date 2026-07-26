#!/usr/bin/env node

import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT || 4174);
const headersFile = readFileSync(join(process.cwd(), 'public/_headers'), 'utf8');
const csp = headersFile.match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1];

if (!csp) {
  throw new Error('Content-Security-Policy was not found in public/_headers.');
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  const relativePath = normalize(pathname)
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/^\//, '');
  let filePath = join(root, relativePath || 'index.html');

  try {
    if (!statSync(filePath).isFile()) {
      filePath = join(root, 'index.html');
    }
  } catch {
    filePath = join(root, 'index.html');
  }

  response.writeHead(200, {
    'Content-Security-Policy': csp,
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Production CSP fixture listening on http://127.0.0.1:${port}\n`);
});
