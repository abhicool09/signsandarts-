const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const productDirectories = [
  '12v-5a-60w-led-adapter',
  'bar-led-sign-board',
  'clinic-led-sign-board',
  'clinic-medical-led-sign-board',
  'dental-led-sign-board',
  'green-clinic-led-sign-board',
  'led-dimmer-controller',
  'led-strip-remote-controller',
  'love-neon-led-sign',
  'medical-pharmacy-led-sign-board',
  'medical-plus-led-sign-board',
  'medical-red-led-sign-board',
  'optical-plus-led-sign-board',
  'opticals-led-sign-board',
  'pan-shop-led-sign-board',
  'pharmacy-plus-led-sign',
  'rgb-pixel-led-controller',
  'xerox-store-led-sign-board'
];

const pageDirectories = [...productDirectories, 'pixel-led'];
const pixelRoot = path.join(root, 'pixel-led');

for (const entry of fs.readdirSync(pixelRoot, { withFileTypes: true })) {
  if (entry.isDirectory() && fs.existsSync(path.join(pixelRoot, entry.name, 'index.html'))) {
    pageDirectories.push(path.posix.join('pixel-led', entry.name));
  }
}

let changed = 0;

for (const directory of pageDirectories) {
  const file = path.join(root, ...directory.split('/'), 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const baseHref = `/${directory}/`;
  const baseTag = `<base href="${baseHref}">`;

  if (html.includes(baseTag)) continue;

  if (/<base\s+href=/i.test(html)) {
    throw new Error(`Unexpected base URL already present in ${file}`);
  }

  const newline = html.includes('\r\n') ? '\r\n' : '\n';
  html = html.replace('<head>', `<head>${newline}  ${baseTag}`);
  fs.writeFileSync(file, html, 'utf8');
  changed += 1;
}

console.log(`Ensured product base URLs across ${pageDirectories.length} pages; changed ${changed}.`);
