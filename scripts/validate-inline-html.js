const fs = require('fs');
const vm = require('vm');

const files = process.argv.slice(2);
if (!files.length) throw new Error('Pass one or more HTML files');

let scripts = 0;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(match[1]) || /application\/ld\+json/i.test(match[1])) continue;
    new vm.Script(match[2], {filename: file});
    scripts += 1;
  }
}

console.log(`Validated ${scripts} inline scripts across ${files.length} HTML files.`);
