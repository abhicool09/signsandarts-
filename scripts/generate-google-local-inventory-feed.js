const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const productFeedPath = path.join(root, 'google-merchant-feed.csv');
const outputPath = path.join(root, 'google-local-inventory-feed.tsv');

const STORE_CODE = process.env.GOOGLE_LOCAL_STORE_CODE || 'REPLACE_WITH_STORE_CODE';
const QUANTITY = Number(process.env.GOOGLE_LOCAL_INVENTORY_QUANTITY || 10000);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some(cell => cell !== '')) rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value || row.length) {
    row.push(value);
    if (row.some(cell => cell !== '')) rows.push(row);
  }

  return rows;
}

function cleanTsv(value) {
  return String(value == null ? '' : value).replace(/[\t\r\n]+/g, ' ').trim();
}

const rows = parseCsv(fs.readFileSync(productFeedPath, 'utf8'));
const headers = rows.shift();
const idIndex = headers.indexOf('id');
const availabilityIndex = headers.indexOf('availability');
const priceIndex = headers.indexOf('price');

if (idIndex === -1 || availabilityIndex === -1 || priceIndex === -1) {
  throw new Error('google-merchant-feed.csv is missing id, availability, or price columns.');
}

const outputRows = [
  ['id', 'store_code', 'availability', 'price', 'quantity'],
  ...rows.map(row => [
    row[idIndex],
    STORE_CODE,
    row[availabilityIndex],
    row[priceIndex],
    String(QUANTITY),
  ]),
];

const tsv = `${outputRows.map(row => row.map(cleanTsv).join('\t')).join('\n')}\n`;
fs.writeFileSync(outputPath, tsv, 'utf8');

console.log(`Generated ${rows.length} local inventory rows in ${path.relative(root, outputPath)}`);
console.log(`Store code: ${STORE_CODE}`);
console.log(`Quantity: ${QUANTITY}`);
