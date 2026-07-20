const fs = require('fs');

const home = fs.readFileSync('index.html', 'utf8');
const pharmacy = fs.readFileSync('pharmacy-plus-led-sign/index.html', 'utf8');
const product = fs.readFileSync('medical-pharmacy-led-sign-board/index.html', 'utf8');

function walkHtml(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.claude' || entry.name === 'node_modules') continue;
    const fullPath = `${directory}/${entry.name}`;
    if (entry.isDirectory()) walkHtml(fullPath, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

const customerHtml = walkHtml('.')
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');

const checks = [
  [
    'existing Pharmacy Plus homepage price is restored',
    home.includes("selectVariant('pharmacy','18&quot;&#xD7;18&quot;',2689,this)") &&
      home.includes('id="pharmacyprice">&#8377;2,689')
  ],
  [
    'existing Pharmacy Plus product price is restored',
    pharmacy.includes("price: 2689") &&
      pharmacy.includes('id="pdPrice">&#8377;2,689')
  ],
  [
    'new homepage variants use the requested prices',
    home.includes("selectVariant('medph','18&quot;&#xD7;18&quot;',2789,this)") &&
      home.includes("selectVariant('medph','24&quot;&#xD7;24&quot;',5489,this)")
  ],
  [
    'new product page variants use the requested prices',
    product.includes("price: 2789") &&
      product.includes("selectVar('24&quot;&#xD7;24&quot;', 5489, this)")
  ],
  [
    'new product has a separate checkout identity',
    product.includes("id:'medical-pharmacy-led'") &&
      product.includes('Medical & Pharmacy LED Sign Board')
  ],
  [
    'customer-facing pages contain no Amazon marketplace references',
    !/(amazon\.in|Amazon Store|\bASIN\b|Marketplace Reference|B0BQ3PR7HM)/i.test(
      customerHtml
    )
  ]
];

let failed = false;
for (const [name, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
  failed ||= !passed;
}

if (failed) process.exit(1);
