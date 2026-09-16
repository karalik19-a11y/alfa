import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT) || 10000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function safePath(urlPath) {
  const requested = decodeURIComponent(urlPath.split('?')[0]);
  const cleanPath = requested === '/' ? '/index.html' : requested;
  const absolutePath = normalize(join(root, cleanPath));
  return absolutePath.startsWith(root) ? absolutePath : null;
}

async function sendFile(response, filePath) {
  const file = await readFile(filePath);
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
    'Cache-Control': 'no-store, max-age=0',
  });
  response.end(file);
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }

  if (request.url?.split('?')[0] === '/healthz') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('ok');
    return;
  }

  const filePath = safePath(request.url || '/');

  try {
    if (!filePath) throw new Error('Invalid path');
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) throw new Error('Not a file');
    if (request.method === 'HEAD') {
      response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
      response.end();
      return;
    }
    await sendFile(response, filePath);
  } catch {
    // Keep the small app deployable as a single-page app when a direct route is opened.
    try {
      if (request.method === 'HEAD') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end();
      } else {
        await sendFile(response, join(root, 'index.html'));
      }
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not Found');
    }
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Alfa Tasks is running on port ${port}`);
});
