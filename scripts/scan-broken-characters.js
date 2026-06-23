const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const extensions = new Set(['.html', '.js', '.json', '.xml', '.css']);
const suspicious = /[\u00c2\u00c3\u00e2\u00f0\u00ef\ufffd]/;

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

let findings = 0;
for (const file of walk(root)) {
  const bytes = fs.readFileSync(file);
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    findings += 1;
    console.log(`${path.relative(root, file)}: invalid UTF-8 encoding`);
    continue;
  }

  const text = bytes.toString('utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!suspicious.test(line)) return;
    findings += 1;
    console.log(`${path.relative(root, file)}:${index + 1}:${JSON.stringify(line)}`);
  });

  if (path.extname(file).toLowerCase() === '.html') {
    for (const match of text.matchAll(/<link\s+rel=["']canonical["'][^>]*>/gi)) {
      if (/href=["']https:\/\/signsandarts\.in\/[^"']*["']/.test(match[0])) continue;
      findings += 1;
      console.log(`${path.relative(root, file)}: malformed canonical tag ${JSON.stringify(match[0])}`);
    }
  }
}

console.log(`BROKEN_CHARACTER_LINES=${findings}`);
process.exitCode = findings ? 1 : 0;
