const fs = require('fs');
const path = require('path');

const sourceRoot = path.resolve(__dirname, '..');
const targetRoot = path.resolve(process.argv[2] || sourceRoot);
const productSlug = 'led-strip-remote-controller';

function ensureReplace(content, marker, replacement, label) {
  if (!content.includes(marker)) {
    throw new Error(`Could not find ${label} marker`);
  }
  return content.replace(marker, replacement);
}

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

copyDirectory(
  path.join(sourceRoot, productSlug),
  path.join(targetRoot, productSlug)
);

const indexPath = path.join(targetRoot, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');

if (!index.includes("fp('accessories',null)")) {
  const customCategory =
    '    <a href="#products" class="ccard" onclick="fp(\'custom\',null)"><div class="cem">&#9999;</div><div class="cnm">Custom / Any Shop</div><div class="cct">Made to Order</div></a>';
  const accessoryCategory =
    '    <a href="#products" class="ccard" onclick="fp(\'accessories\',null)"><div class="cem">&#128268;</div><div class="cnm">LED Accessories</div><div class="cct">1 Product</div></a>\n';
  index = ensureReplace(
    index,
    customCategory,
    accessoryCategory + customCategory,
    'custom category'
  );
}

if (!index.includes("fp('accessories',this)")) {
  const customFilter =
    '    <button class="fb" onclick="fp(\'custom\',this)">Custom</button>';
  const accessoryFilter =
    '    <button class="fb" onclick="fp(\'accessories\',this)">LED Accessories</button>\n';
  index = ensureReplace(
    index,
    customFilter,
    accessoryFilter + customFilter,
    'custom filter'
  );
}

if (!index.includes('id="prod-led-strip-controller"')) {
  const productCard = `
    <!-- MINI RF LED STRIP CONTROLLER -->
    <div class="pc show" data-cat="accessories" id="prod-led-strip-controller">
      <div class="pgallery" id="controllergallery">
        <img src="/led-strip-remote-controller/main.jpg" alt="Mini RF remote controller for single color LED strips" class="active">
        <img src="/led-strip-remote-controller/controller.jpg" alt="RF LED controller DC connectors">
        <img src="/led-strip-remote-controller/installation.jpg" alt="RF LED strip controller installation">
        <img src="/led-strip-remote-controller/applications.jpg" alt="RF remote controller LED strip applications">
        <img src="/led-strip-remote-controller/overview.jpg" alt="RF LED controller remote functions">
        <div class="bdg bnew" style="position:absolute;top:10px;left:10px;">New</div>
      </div>
      <div class="gallery-thumbs">
        <img src="/led-strip-remote-controller/main.jpg" class="gthumb active" onclick="switchImg('controller',0)" alt="Controller and remote">
        <img src="/led-strip-remote-controller/controller.jpg" class="gthumb" onclick="switchImg('controller',1)" alt="Controller connectors">
        <img src="/led-strip-remote-controller/installation.jpg" class="gthumb" onclick="switchImg('controller',2)" alt="Installation">
        <img src="/led-strip-remote-controller/applications.jpg" class="gthumb" onclick="switchImg('controller',3)" alt="Applications">
        <img src="/led-strip-remote-controller/overview.jpg" class="gthumb" onclick="switchImg('controller',4)" alt="Overview">
      </div>
      <div class="pb">
        <div class="pct">LED Accessories</div>
        <a href="/led-strip-remote-controller/" style="text-decoration:none;"><div class="pnm" style="color:#111;">Mini RF Remote Controller for Single Color LED Strips</div></a>
        <div class="pds">Wireless RF dimmer and controller for compatible single-color 12V DC LED strips. Brightness presets, mode and speed controls, with simple inline DC plug connection. Controller and remote included; strip and adapter are not included.</div>
        <div class="psps">
          <span class="stg">RF Wireless</span>
          <span class="stg">12V DC</span>
          <span class="stg">Up to 12A</span>
          <span class="stg">5050 / 3528 / 2835</span>
          <span class="stg">Single Color</span>
        </div>
      </div>
      <div style="padding:.5rem 1.1rem 0;">
        <a href="/led-strip-remote-controller/" style="display:block;text-align:center;font-size:.72rem;font-weight:700;color:#777;letter-spacing:1px;padding:.4rem;border:1px solid #e8e8e8;border-radius:3px;">View Full Details &rarr;</a>
      </div>
      <div class="pf">
        <div class="ppr" id="controllerprice">&#8377;339</div>
        <div class="pbts">
          <button class="batc" id="controlleratc" onclick="addToCart({id:'led-strip-rf-controller',name:'Mini RF Remote Controller for Single Color LED Strips',price:339,qty:1})">&#43; Add to Cart</button>
          <a href="https://wa.me/919392878946?text=Hi%2C%20I%20want%20the%20mini%20RF%20LED%20strip%20remote%20controller" class="bwa" target="_blank">&#128242;</a>
        </div>
      </div>
    </div>

`;
  index = ensureReplace(
    index,
    '    <!-- P9 CUSTOM -->',
    productCard + '    <!-- P9 CUSTOM -->',
    'custom product'
  );
}

if (!index.includes('<li><a href="/led-strip-remote-controller">LED Strip Controller</a></li>')) {
  const footerMarker =
    '        <li><a href="/love-neon-led-sign">Love Neon Sign</a></li>';
  const footerLink =
    '\n        <li><a href="/led-strip-remote-controller">LED Strip Controller</a></li>';
  if (index.includes(footerMarker)) {
    index = index.replace(footerMarker, footerMarker + footerLink);
  }
}

fs.writeFileSync(indexPath, index, 'utf8');

const sitemapPath = path.join(targetRoot, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
if (!sitemap.includes('/led-strip-remote-controller')) {
  const sitemapEntry = `  <url>
    <loc>https://signsandarts.in/led-strip-remote-controller/</loc>
    <lastmod>2026-06-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.65</priority>
  </url>
`;
  sitemap = ensureReplace(
    sitemap,
    '</urlset>',
    sitemapEntry + '</urlset>',
    'sitemap closing'
  );
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
}

console.log(`Deployed ${productSlug} to ${targetRoot}`);
