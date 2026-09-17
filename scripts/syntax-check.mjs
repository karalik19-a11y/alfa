#!/usr/bin/env node
// Проверка синтаксиса всех JS-файлов проекта. Именно этот шаг ловит
// «незакрытый шаблонный литерал» и подобные ошибки, из-за которых страница
// открывается пустой. Запуск: npm run check:syntax
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.cache']);

function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (entry.endsWith('.js') || entry.endsWith('.mjs')) out.push(full);
  }
  return out;
}

const files = collect(ROOT).sort();
let failed = 0;
console.log(`Проверяю синтаксис ${files.length} файлов…`);
for (const file of files) {
  const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  const ok = res.status === 0;
  if (!ok) {
    failed++;
    console.log(`FAIL  ${relative(ROOT, file)}`);
    console.log((res.stderr || '').split('\n').slice(0, 6).join('\n'));
  } else {
    console.log(`OK    ${relative(ROOT, file)}`);
  }
}
console.log(failed ? `\n${failed} файл(ов) с ошибками синтаксиса` : '\nСинтаксис в порядке');
process.exit(failed ? 1 : 0);
