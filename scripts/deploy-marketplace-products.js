const fs = require('fs');
const path = require('path');

const sourceRoot = path.resolve(__dirname, '..');
const targetRoot = path.resolve(process.argv[2] || sourceRoot);
const productSlugs = ['pan-shop-led-sign-board', '12v-5a-60w-led-adapter'];

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, {recursive: true});
  for (const entry of fs.readdirSync(source, {withFileTypes: true})) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to);
    else fs.copyFileSync(from, to);
  }
}

function insertOnce(content, unique, marker, addition, label) {
  if (content.includes(unique)) return content;
  if (!content.includes(marker)) throw new Error(`Could not find ${label}`);
  return content.replace(marker, addition + marker);
}

for (const slug of productSlugs) {
  copyDirectory(path.join(sourceRoot, slug), path.join(targetRoot, slug));
}

const indexPath = path.join(targetRoot, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');

index = index.replace(
  '<div class="cnm">LED Accessories</div><div class="cct">1 Product</div>',
  '<div class="cnm">LED Accessories</div><div class="cct">2 Products</div>'
);

index = insertOnce(
  index,
  'class="cnm">Retail / Pan Shop</div>',
  '    <a href="#products" class="ccard" onclick="fp(\'custom\',null)">',
  '    <a href="#products" class="ccard" onclick="fp(\'retail\',null)"><div class="cem">&#127978;</div><div class="cnm">Retail / Pan Shop</div><div class="cct">1 Product</div></a>\n',
  'custom category card'
);

index = insertOnce(
  index,
  "fp('retail',this)",
  '    <button class="fb" onclick="fp(\'custom\',this)">Custom</button>',
  '    <button class="fb" onclick="fp(\'retail\',this)">Retail / Pan Shop</button>\n',
  'custom filter button'
);

const productCards = `
    <!-- PAN SHOP LED SIGN BOARD -->
    <div class="pc show" data-cat="retail" id="prod-pan-shop-led">
      <div class="pgallery" id="panshopgallery">
        <img src="/pan-shop-led-sign-board/image-1.jpg" alt="PAN shop LED sign board 18x12 red and white" class="active">
        <img src="/pan-shop-led-sign-board/image-2.jpg" alt="PAN shop sign green lighting view">
        <img src="/pan-shop-led-sign-board/image-3.jpg" alt="Double sided PAN shop LED board">
        <div class="bdg bnew" style="position:absolute;top:10px;left:10px;">New</div>
      </div>
      <div class="gallery-thumbs">
        <img src="/pan-shop-led-sign-board/image-1.jpg" class="gthumb active" onclick="switchImg('panshop',0)" alt="Red PAN sign">
        <img src="/pan-shop-led-sign-board/image-2.jpg" class="gthumb" onclick="switchImg('panshop',1)" alt="Green PAN sign">
        <img src="/pan-shop-led-sign-board/image-3.jpg" class="gthumb" onclick="switchImg('panshop',2)" alt="Product view">
      </div>
      <div class="pb">
        <div class="pct">Retail / Pan Shop</div>
        <a href="/pan-shop-led-sign-board/"><div class="pnm" style="color:#111;">PAN Shop LED Sign Board &mdash; Red &amp; White, Double Sided</div></a>
        <div class="pds">18&quot;x12&quot; LED storefront board with bright PAN SHOP text, directional arrows and double-sided road visibility. Outdoor-focused casing with simple wall-mount or hanging installation.</div>
        <div class="psps"><span class="stg">18&quot;x12&quot;</span><span class="stg">Double Sided</span><span class="stg">Red &amp; White LED</span><span class="stg">Wall Mount</span></div>
      </div>
      <div style="padding:.5rem 1.1rem 0;"><a href="/pan-shop-led-sign-board/" style="display:block;text-align:center;font-size:.72rem;font-weight:700;color:#777;letter-spacing:1px;padding:.4rem;border:1px solid #e8e8e8;border-radius:3px;">View Full Details &rarr;</a></div>
      <div class="pf"><div class="ppr">&#8377;2,475</div><div class="pbts"><button class="batc" onclick="addToCart({id:'pan-shop-led-sign-18x12',name:'PAN Shop LED Sign Board 18x12 Double Sided',price:2475,qty:1})">&#43; Add to Cart</button><a href="https://wa.me/919392878946?text=Hi%2C%20I%20want%20the%20PAN%20Shop%20LED%20Sign%20Board" class="bwa" target="_blank">&#128242;</a></div></div>
    </div>

    <!-- HILIGHT 12V 5A POWER ADAPTER -->
    <div class="pc show" data-cat="accessories" id="prod-12v-5a-adapter">
      <div class="pgallery" id="adaptergallery">
        <img src="/12v-5a-60w-led-adapter/image-1.jpg" alt="Hilight 12V 5A 60W LED power adapter" class="active">
        <img src="/12v-5a-60w-led-adapter/image-2.jpg" alt="12V adapter applications">
        <img src="/12v-5a-60w-led-adapter/image-3.jpg" alt="Hilight adapter connector and specifications">
        <div class="bdg bnew" style="position:absolute;top:10px;left:10px;">New</div>
      </div>
      <div class="gallery-thumbs">
        <img src="/12v-5a-60w-led-adapter/image-1.jpg" class="gthumb active" onclick="switchImg('adapter',0)" alt="Adapter">
        <img src="/12v-5a-60w-led-adapter/image-2.jpg" class="gthumb" onclick="switchImg('adapter',1)" alt="Applications">
        <img src="/12v-5a-60w-led-adapter/image-3.jpg" class="gthumb" onclick="switchImg('adapter',2)" alt="Features">
      </div>
      <div class="pb">
        <div class="pct">LED Accessories</div>
        <a href="/12v-5a-60w-led-adapter/"><div class="pnm" style="color:#111;">Hilight 12V 5A 60W Power Adapter for LED Strips &amp; Signs</div></a>
        <div class="pds">Indoor SMPS power adapter for compatible LED strips, modules, neon signs and CCTV. Stable 12V DC output, 2.1x5.5 mm centre-positive connector and listed safety protection.</div>
        <div class="psps"><span class="stg">12V DC</span><span class="stg">5A / 60W</span><span class="stg">2.1x5.5 mm</span><span class="stg">1 Year Warranty</span></div>
      </div>
      <div style="padding:.5rem 1.1rem 0;"><a href="/12v-5a-60w-led-adapter/" style="display:block;text-align:center;font-size:.72rem;font-weight:700;color:#777;letter-spacing:1px;padding:.4rem;border:1px solid #e8e8e8;border-radius:3px;">View Full Details &rarr;</a></div>
      <div class="pf"><div class="ppr">&#8377;371</div><div class="pbts"><button class="batc" onclick="addToCart({id:'hilight-12v-5a-adapter',name:'Hilight 12V 5A 60W LED Power Adapter',price:371,qty:1})">&#43; Add to Cart</button><a href="https://wa.me/919392878946?text=Hi%2C%20I%20want%20the%20Hilight%2012V%205A%20LED%20adapter" class="bwa" target="_blank">&#128242;</a></div></div>
    </div>

`;

index = insertOnce(
  index,
  'id="prod-pan-shop-led"',
  '    <!-- P9 CUSTOM -->',
  productCards,
  'custom product card'
);

if (!index.includes('<li><a href="/pan-shop-led-sign-board/">PAN Shop LED Sign</a></li>')) {
  const footerMarker = '<li><a href="/pixel-led/">Pixel LEDs</a></li>';
  if (index.includes(footerMarker)) {
    index = index.replace(
      footerMarker,
      `${footerMarker}
        <li><a href="/pan-shop-led-sign-board/">PAN Shop LED Sign</a></li>
        <li><a href="/12v-5a-60w-led-adapter/">12V 5A LED Adapter</a></li>`
    );
  }
}

fs.writeFileSync(indexPath, index, 'utf8');

const sitemapPath = path.join(targetRoot, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
const entries = [
  ['https://signsandarts.in/pan-shop-led-sign-board/', '0.70'],
  ['https://signsandarts.in/12v-5a-60w-led-adapter/', '0.65']
];
let addition = '';
for (const [url, priority] of entries) {
  if (sitemap.includes(`<loc>${url}</loc>`)) continue;
  addition += `  <url>
    <loc>${url}</loc>
    <lastmod>2026-06-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>
`;
}
if (addition) {
  sitemap = sitemap.replace('</urlset>', `${addition}</urlset>`);
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
}

console.log(`Deployed ${productSlugs.length} marketplace products to ${targetRoot}`);
