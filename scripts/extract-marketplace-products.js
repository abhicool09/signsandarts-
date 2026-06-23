const fs = require('fs');
const path = require('path');

const amazonPath = path.join(process.env.TEMP, 'amazon-B0DT4KTQ6K.html');
const flipkartPath = path.join(process.env.TEMP, 'flipkart-adapter.html');

function decode(value) {
  return String(value || '')
    .replace(/\\u002F/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003D/g, '=')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matches(source, expression, limit = 20) {
  const values = [];
  for (const match of source.matchAll(expression)) {
    const value = decode(match[1]);
    if (value && !values.includes(value)) values.push(value);
    if (values.length >= limit) break;
  }
  return values;
}

const amazon = fs.readFileSync(amazonPath, 'utf8');
const flipkart = fs.readFileSync(flipkartPath, 'utf8');

const output = {
  amazon: {
    titles: [
      ...matches(amazon, /<title>([\s\S]*?)<\/title>/gi, 2),
      ...matches(amazon, /id="productTitle"[^>]*>([\s\S]*?)<\/span>/gi, 2)
    ],
    prices: [
      ...matches(amazon, /"priceAmount":\s*([0-9.]+)/gi),
      ...matches(amazon, /a-price-whole">([^<]+)/gi)
    ],
    images: [
      ...matches(amazon, /"hiRes":"([^"]+)"/gi, 20),
      ...matches(amazon, /"large":"([^"]+)"/gi, 20)
    ],
    bullets: matches(amazon, /<span class="a-list-item">([\s\S]*?)<\/span>/gi, 30)
  },
  flipkart: {
    titles: [
      ...matches(flipkart, /<title>([\s\S]*?)<\/title>/gi, 2),
      ...matches(flipkart, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/gi, 2)
    ],
    prices: [
      ...matches(flipkart, /₹\s*([0-9,]+)/gi, 20),
      ...matches(flipkart, /"sellingPrice"[\s\S]{0,200}?"value":\s*([0-9]+)/gi, 20)
    ],
    images: [
      ...matches(flipkart, /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/gi, 10),
      ...matches(flipkart, /"url":"(https:[^"]+\.(?:jpeg|jpg|webp)[^"]*)"/gi, 30)
    ]
  }
};

console.log(JSON.stringify(output, null, 2));
