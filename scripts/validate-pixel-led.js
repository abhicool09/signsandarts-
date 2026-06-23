const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const catalogRoot = path.join(root, 'pixel-led');
const products = JSON.parse(fs.readFileSync(path.join(catalogRoot, 'products.json'), 'utf8'));
const htmlFiles = [
  path.join(catalogRoot, 'index.html'),
  ...products.map(product => path.join(catalogRoot, product.slug, 'index.html'))
];

let inlineScriptCount = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const scriptPattern = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const attributes = match[1];
    if (/\bsrc\s*=/i.test(attributes) || /application\/ld\+json/i.test(attributes)) continue;
    new vm.Script(match[2], {filename: file});
    inlineScriptCount += 1;
  }
}

const fiveVoltMatches = products.filter(product => /\b5V\b|5V MULTI/i.test(JSON.stringify(product)));
if (fiveVoltMatches.length) {
  throw new Error(`Found ${fiveVoltMatches.length} excluded 5V products`);
}

const allowedPrices = new Set([165, 185, 205, 215, 235, 245, 255]);
const unexpectedPrices = products.filter(product => !allowedPrices.has(product.price));
if (unexpectedPrices.length) {
  throw new Error(`Unexpected prices: ${unexpectedPrices.map(product => product.price).join(', ')}`);
}

console.log(
  `Validated ${htmlFiles.length} pages, ${inlineScriptCount} inline scripts, ` +
  `${products.length} 12V products, and zero 5V products.`
);
