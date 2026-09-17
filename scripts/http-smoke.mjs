// HTTP-смоук: поднимает настоящий server.js и проверяет, что сайт отдаётся корректно.
// Запуск: npm run test:http
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.TEST_PORT) || 4173;
const BASE = `http://127.0.0.1:${PORT}`;

const results = [];
const check = (name, cond, extra = '') => results.push({ name, ok: !!cond, extra });

const server = spawn(process.execPath, [join(ROOT, 'server.js')], {
  env: { ...process.env, PORT: String(PORT) },
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', (d) => { logs += d; });
server.stderr.on('data', (d) => { logs += d; });

async function waitUp(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/healthz`);
      if (res.ok) return true;
    } catch { /* ещё не поднялся */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function get(path, method = 'GET') {
  const res = await fetch(BASE + path, { method });
  const body = method === 'HEAD' ? '' : await res.text();
  return { status: res.status, type: res.headers.get('content-type') || '', cache: res.headers.get('cache-control') || '', body };
}

try {
  check('сервер поднялся', await waitUp(), logs.trim().slice(0, 200));

  const home = await get('/');
  check('GET / -> 200', home.status === 200, `status=${home.status}`);
  check('GET / отдаёт HTML', home.type.startsWith('text/html'), home.type);
  check('GET / содержит точку монтирования #app', home.body.includes('id="app"'));
  check('HTML не кэшируется', /no-(cache|store)/.test(home.cache), home.cache);

  const app = await get('/app.js?v=20260917-11');
  check('GET /app.js -> 200', app.status === 200, `status=${app.status}`);
  check('app.js отдаётся как JavaScript', app.type.includes('javascript'), app.type);
  check('app.js кэшируется надолго', /max-age=31536000/.test(app.cache), app.cache);
  check('app.js содержит код приложения', app.body.includes('renderGate') && app.body.length > 5000, `len=${app.body.length}`);

  const css = await get('/styles.css');
  check('GET /styles.css -> 200', css.status === 200 && css.type.startsWith('text/css'), `${css.status} ${css.type}`);

  const fix = await get('/profile-fix.js');
  check('GET /profile-fix.js -> 200', fix.status === 200, `status=${fix.status}`);

  const health = await get('/healthz');
  check('GET /healthz -> ok', health.status === 200 && health.body.trim() === 'ok', health.body);

  const deep = await get('/any/deep/link');
  check('неизвестный путь отдаёт index.html (SPA-fallback)', deep.status === 200 && deep.body.includes('id="app"'), `status=${deep.status}`);

  const traversal = await get('/../../../etc/passwd');
  check('выход за корень сайта заблокирован', traversal.status === 200 && !traversal.body.includes('root:'), `status=${traversal.status}`);

  const head = await get('/', 'HEAD');
  check('HEAD / -> 200', head.status === 200, `status=${head.status}`);

  const post = await fetch(BASE + '/', { method: 'POST' });
  check('POST / -> 405', post.status === 405, `status=${post.status}`);
} catch (e) {
  check('http-смоук прошёл без исключений', false, e.message);
} finally {
  server.kill('SIGTERM');
}

console.log('\n=== HTTP РЕЗУЛЬТАТЫ ===');
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'OK  ' : 'FAIL'}  ${r.name}${r.extra ? `  [${r.extra}]` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} пройдено, ${failed} провалено`);
process.exit(failed ? 1 : 0);
