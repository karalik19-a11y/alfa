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
  let requested;
  try {
    requested = decodeURIComponent((urlPath || '/').split('?')[0]);
  } catch {
    return null;
  }
  const cleanPath = requested === '/' ? '/index.html' : requested;
  const absolutePath = normalize(join(root, cleanPath));
  return absolutePath.startsWith(root) ? absolutePath : null;
}

async function sendFile(response, filePath, headOnly = false) {
  const fileInfo = await stat(filePath);
  if (!fileInfo.isFile()) throw new Error('Not a file');
  const extension = extname(filePath).toLowerCase();
  const isHtml = extension === '.html';
  response.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': isHtml
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
  if (headOnly) {
    response.end();
    return;
  }
  response.end(await readFile(filePath));
}

const server = createServer(async (request, response) => {
  const method = request.method || 'GET';

  if (method !== 'GET' && method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }

  if ((request.url || '').split('?')[0] === '/healthz') {
    response.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end('ok');
    return;
  }

  const filePath = safePath(request.url);

  try {
    if (!filePath) throw new Error('Invalid path');
    await sendFile(response, filePath, method === 'HEAD');
  } catch {
    try {
      await sendFile(response, join(root, 'index.html'), method === 'HEAD');
    } catch {
      if (!response.headersSent) response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not Found');
    }
  }
});

server.on('clientError', (_error, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Alfa Tasks is running on port ${port}`);
});
