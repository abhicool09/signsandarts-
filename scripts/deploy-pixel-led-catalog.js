const fs = require('fs');
const path = require('path');

const sourceRoot = path.resolve(__dirname, '..');
const targetRoot = path.resolve(process.argv[2] || sourceRoot);
const sourceCatalog = path.join(sourceRoot, 'pixel-led');
const targetCatalog = path.join(targetRoot, 'pixel-led');
const products = JSON.parse(fs.readFileSync(path.join(sourceCatalog, 'products.json'), 'utf8'));

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, {recursive: true});
  for (const entry of fs.readdirSync(source, {withFileTypes: true})) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(sourcePath, destinationPath);
    else fs.copyFileSync(sourcePath, destinationPath);
  }
}

function insertOnce(content, uniqueText, marker, addition, label) {
  if (content.includes(uniqueText)) return content;
  if (!content.includes(marker)) throw new Error(`Could not find ${label} marker`);
  return content.replace(marker, addition + marker);
}

copyDirectory(sourceCatalog, targetCatalog);

const indexPath = path.join(targetRoot, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');

index = insertOnce(
  index,
  'class="cnm">Pixel LEDs</div>',
  '    <a href="#products" class="ccard" onclick="fp(\'custom\',null)">',
  '    <a href="/pixel-led/" class="ccard"><div class="cem">&#128161;</div><div class="cnm">Pixel LEDs</div><div class="cct">28 Products</div></a>\n',
  'custom category'
);

index = insertOnce(
  index,
  '>Pixel LEDs</button>',
  '    <button class="fb" onclick="fp(\'custom\',this)">Custom</button>',
  '    <button class="fb" onclick="window.location.href=\'/pixel-led/\'">Pixel LEDs</button>\n',
  'custom filter'
);

const representative = products.find(product => product.group === '3-inch' && product.color === 'Red') || products[0];
const collectionCard = `
    <!-- 12V PIXEL LED COLLECTION -->
    <div class="pc show" data-cat="pixel-led" id="prod-pixel-led-collection">
      <a href="/pixel-led/" class="pgallery" style="display:block;">
        <img src="${representative.image}" alt="12V single colour pixel LEDs for sign boards" class="active">
        <div class="bdg bnew" style="position:absolute;top:10px;left:10px;">28 Products</div>
      </a>
      <div class="pb">
        <div class="pct">Pixel LEDs</div>
        <a href="/pixel-led/"><div class="pnm" style="color:#111;">12V Single Colour Pixel LED Strings</div></a>
        <div class="pds">50-LED strings for sign-board fabrication and decorative lighting. Choose 3, 5 or 7-inch spacing in red, green, blue, white, yellow, pink and warm white.</div>
        <div class="psps"><span class="stg">12V DC</span><span class="stg">50 LEDs</span><span class="stg">3 / 5 / 7 Inch</span><span class="stg">7 Colours</span></div>
      </div>
      <div class="pf">
        <div class="ppr">From &#8377;165</div>
        <div class="pbts"><a href="/pixel-led/" class="batc" style="display:flex;align-items:center;justify-content:center;">View 28 Products</a></div>
      </div>
    </div>

`;

index = insertOnce(
  index,
  'id="prod-pixel-led-collection"',
  '    <!-- P9 CUSTOM -->',
  collectionCard,
  'custom product'
);

if (!index.includes('<li><a href="/pixel-led/">Pixel LEDs</a></li>')) {
  const footerMarker = '<li><a href="/led-strip-remote-controller">LED Strip Controller</a></li>';
  if (index.includes(footerMarker)) {
    index = index.replace(footerMarker, `${footerMarker}\n        <li><a href="/pixel-led/">Pixel LEDs</a></li>`);
  }
}

fs.writeFileSync(indexPath, index, 'utf8');

const sitemapPath = path.join(targetRoot, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
const entries = [
  {url: 'https://signsandarts.in/pixel-led/', priority: '0.75'},
  ...products.map(product => ({
    url: `https://signsandarts.in/pixel-led/${product.slug}/`,
    priority: '0.60'
  }))
];
let sitemapAddition = '';
for (const entry of entries) {
  if (sitemap.includes(`<loc>${entry.url}</loc>`)) continue;
  sitemapAddition += `  <url>
    <loc>${entry.url}</loc>
    <lastmod>2026-06-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${entry.priority}</priority>
  </url>
`;
}
if (sitemapAddition) {
  sitemap = sitemap.replace('</urlset>', `${sitemapAddition}</urlset>`);
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
}

console.log(`Deployed Pixel LED category and ${products.length} products to ${targetRoot}`);
