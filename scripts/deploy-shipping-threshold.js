const fs = require('fs');
const path = require('path');

const targetRoot = path.resolve(process.argv[2] || path.join(__dirname, '..'));

function update(relativePath, replacements) {
  const filePath = path.join(targetRoot, relativePath);
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [from, to, label] of replacements) {
    if (content.includes(to)) continue;
    if (!content.includes(from)) throw new Error(`Could not find ${label} in ${relativePath}`);
    content = content.replace(from, to);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

update('index.html', [[
  "    return cart.some(function(item) { return Number(item.price) < 500; }) ? LOW_PRICE_SHIPPING : 0;",
  "    const total = getTotal();\n    return total > 0 && total < 300 ? LOW_PRICE_SHIPPING : 0;",
  'homepage shipping threshold'
]]);

update('pixel-led/catalog.js', [[
  "  var shipping=pixelOrder.product.price<500?LOW_PRICE_SHIPPING:0;",
  "  var shipping=subtotal<300?LOW_PRICE_SHIPPING:0;",
  'pixel shipping threshold'
]]);

update('led-strip-remote-controller/index.html', [[
  "    var SHIPPING_CHARGE = PRODUCT_PRICE < 500 ? 125 : 0;",
  "    var SHIPPING_CHARGE = PRODUCT_PRICE < 300 ? 125 : 0;",
  'controller shipping threshold'
]]);

update('love-neon-led-sign/index.html', [[
  "  var SHIPPING_CHARGE = PRODUCT_PRICE < 500 ? 125 : 0;",
  "  var SHIPPING_CHARGE = PRODUCT_PRICE < 300 ? 125 : 0;",
  'love shipping threshold'
]]);

console.log(`Applied below-₹300 shipping threshold to ${targetRoot}`);
