const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(process.argv[2] || '.');
const baseUrl = process.argv[3] || 'http://127.0.0.1:4193';
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile = path.join(process.env.TEMP || root, 'signsandarts-edge-audit');
const broken = /[\u00c2\u00c3\u00e2\u00f0\u00ef\ufffd]/;

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (entry.name.toLowerCase().endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function routeFor(file) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -10)}`;
  return `/${relative}`;
}

let failures = 0;
let checked = 0;
for (const file of walk(root)) {
  const relative = path.relative(root, file);
  if (/^google[0-9a-f]+\.html$/i.test(relative)) continue;

  const source = fs.readFileSync(file, 'utf8');
  if (!/<meta\s+charset=["']?utf-8/i.test(source)) {
    console.log(`FAIL ${relative}: missing UTF-8 charset`);
    failures += 1;
    continue;
  }

  const url = `${baseUrl}${routeFor(file)}`;
  const result = spawnSync(
    edge,
    [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      `--user-data-dir=${profile}`,
      '--dump-dom',
      url
    ],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 30000 }
  );

  const dom = result.stdout || '';
  if (!dom.includes('<html')) {
    console.log(`FAIL ${relative}: page did not render`);
    failures += 1;
    continue;
  }

  const visibleMarkup = dom
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');

  if (broken.test(visibleMarkup)) {
    console.log(`FAIL ${relative}: rendered DOM contains broken characters`);
    failures += 1;
    continue;
  }

  checked += 1;
  console.log(`PASS ${relative}`);
}

console.log(`RENDERED_PAGES=${checked}`);
console.log(`RENDER_FAILURES=${failures}`);
process.exitCode = failures ? 1 : 0;
