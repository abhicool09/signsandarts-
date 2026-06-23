const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(process.argv[2] || '');
const outputRoot = path.resolve(process.argv[3] || path.join(__dirname, '..', 'pixel-led'));

if (!fs.existsSync(inputPath)) {
  throw new Error(`Product JSON not found: ${inputPath}`);
}

const sourceProducts = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(sourceProducts) || sourceProducts.length !== 28) {
  throw new Error(`Expected 28 products in the 12V collection, received ${sourceProducts.length}`);
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&#8243;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(value) {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/warm white|ww/g, 'warm-white')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function titleCase(value) {
  return value
    .toLowerCase()
    .replace(/\b(?:smd|xpl|impex|dc|led|mm)\b/g, match => match.toUpperCase())
    .replace(/\b\w/g, letter => letter.toUpperCase())
    .replace(/\b12v\b/gi, '12V');
}

function extract(text, expression, fallback) {
  const match = text.match(expression);
  return match ? match[1].trim() : fallback;
}

function productGroup(name) {
  if (/\b3\s*(?:inch|")/i.test(name)) return '3-inch';
  if (/\b7\s*(?:inch|")/i.test(name)) return '7-inch';
  return '5-inch';
}

function cleanName(sourceName) {
  let name = decodeHtml(sourceName)
    .replace(/\bWW\b/gi, 'Warm White')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
  name = titleCase(name);
  return name
    .replace(/\bPixel-XPL\b/gi, 'Pixel - XPL')
    .replace(/\bPixel-IMPEX\+\b/gi, 'Pixel - IMPEX+')
    .replace(/\bSmd\b/g, 'SMD');
}

const products = sourceProducts.map((source, index) => {
  const sourceText = stripHtml(`${source.short_description || ''} ${source.description || ''}`);
  const name = cleanName(source.name);
  const group = productGroup(name);
  const spacing = extract(sourceText, /GAP BETWEEN LED\s*:\s*([0-9.]+\s*INCH)/i, group.replace('-', ' '));
  const length = extract(sourceText, /LENGTH\s*:\s*([0-9.]+\s*METRE)/i, group === '3-inch' ? '3.81 metre' : group === '7-inch' ? '9 metre' : '6.35 metre');
  const ledCount = Number(extract(sourceText, /NUMBER OF LED\s*:\s*([0-9]+)/i, '50'));
  const power = extract(sourceText, /POWER\s*:\s*([0-9]+\s*WATS?)/i, group === '7-inch' ? '10 watts' : '12 watts').replace(/WATS?/i, 'watts');
  const bulbSize = /\b10MM\b/i.test(name) ? '10 mm' : '9 mm';
  const colorMatch = name.match(/^(Pink White|Warm White|Pink|Blue|Yellow|Green|White|Red)\b/i);
  const color = colorMatch ? titleCase(colorMatch[1]) : 'Assorted';
  const series = /\bXPL\b/i.test(name) ? 'XPL' : /\bIMPEX\+\b/i.test(name) ? 'IMPEX+' : 'Standard';
  const sourcePrice = Number(source.prices.price) / Math.pow(10, Number(source.prices.currency_minor_unit || 2));
  const price = sourcePrice + 70;
  const slug = `${slugify(name)}-${source.id}`;
  const imageUrl = source.images && source.images[0] ? source.images[0].src : '';

  return {
    id: `pixel-${source.id}`,
    sourceId: source.id,
    name,
    slug,
    price,
    group,
    spacing: titleCase(spacing),
    length: titleCase(length),
    ledCount,
    power: titleCase(power),
    bulbSize,
    color,
    series,
    imageUrl,
    image: `/pixel-led/images/${slug}.jpg`,
    order: index
  };
});

products.sort((a, b) => {
  const groupOrder = {'3-inch': 0, '5-inch': 1, '7-inch': 2};
  return groupOrder[a.group] - groupOrder[b.group] || a.color.localeCompare(b.color) || a.name.localeCompare(b.name);
});

fs.rmSync(outputRoot, {recursive: true, force: true});
fs.mkdirSync(path.join(outputRoot, 'images'), {recursive: true});

function pageHead({title, description, canonical, schema = ''}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-PNNB88PBN3"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-PNNB88PBN3');</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/pixel-led/styles.css">
  ${schema}
</head>`;
}

function header(breadcrumb) {
  return `<body>
  <div class="topbar"><span>Pan India Delivery</span><span>12V Single Colour Pixel LEDs</span><a href="tel:+919392878946">+91 93928 78946</a></div>
  <header>
    <a href="/" class="logo"><strong>Signs <i>&amp;</i> Arts</strong><small>LED SIGN BOARDS - INDIA</small></a>
    <nav><a href="/#products">Sign Boards</a><a href="/pixel-led/">Pixel LEDs</a><a href="/#contact">Contact</a></nav>
    <a class="whatsapp" href="https://wa.me/919392878946" target="_blank">WhatsApp</a>
  </header>
  <div class="breadcrumb">${breadcrumb}</div>`;
}

function checkoutModal() {
  return `<div class="modal-bg" id="checkoutModal" aria-hidden="true">
    <div class="modal-box">
      <button class="modal-x" type="button" onclick="closePixelCheckout()" aria-label="Close">&times;</button>
      <h2>Complete Your Order</h2>
      <div class="order-summary" id="orderSummary"></div>
      <div class="payment-toggle">
        <button class="pay-mode active" id="btnOnline" type="button" onclick="setPixelPayMode('online')">Pay Online</button>
        <button class="pay-mode cod" id="btnCOD" type="button" onclick="setPixelPayMode('cod')">Cash on Delivery</button>
      </div>
      <div class="cod-info" id="codInfo">Pay <strong id="codAdvanceText">&#8377;200 advance</strong> now. A <strong>&#8377;50 COD charge</strong> is added; the balance is paid on delivery.</div>
      <div class="form-row"><label>Full Name *<input id="custName" autocomplete="name"></label><label>Phone Number *<input id="custPhone" inputmode="numeric" maxlength="10"></label></div>
      <label>Email Address *<input id="custEmail" type="email" autocomplete="email"></label>
      <label>Delivery Address *<input id="custAddr" autocomplete="street-address"></label>
      <div class="form-row"><label>City *<input id="custCity"></label><label>State *<input id="custState"></label></div>
      <label>PIN Code *<input id="custPin" inputmode="numeric" maxlength="6"></label>
      <button class="pay-button" id="payBtn" type="button" onclick="placePixelOrder()">Pay Securely with Cashfree</button>
    </div>
  </div>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <script src="/pixel-led/catalog.js"></script>`;
}

function footer() {
  return `<footer><div><strong>Signs &amp; Arts</strong><br>LED sign boards and 12V pixel lighting supplies.</div><div><a href="/refund.html">Return Policy</a> &nbsp; <a href="/terms.html">Terms</a> &nbsp; <a href="https://wa.me/919392878946">WhatsApp</a></div></footer>`;
}

const productsJson = JSON.stringify(products.map(({imageUrl, order, ...product}) => product));

const categorySchema = `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '12V Pixel LEDs for Sign Boards',
  description: 'Shop 12V single-colour pixel LED strings for sign boards and decorative lighting.',
  url: 'https://signsandarts.in/pixel-led/'
})}</script>`;

const categoryCards = products.map(product => `
      <article class="product-card" data-group="${product.group}" data-color="${product.color.toLowerCase()}">
        <a class="card-image" href="/pixel-led/${product.slug}/"><img src="${product.image}" alt="${escapeHtml(product.color)} ${escapeHtml(product.spacing)} 12V pixel LED string" loading="lazy"></a>
        <div class="card-body">
          <div class="eyebrow">${escapeHtml(product.spacing)} spacing &middot; ${escapeHtml(product.color)}</div>
          <h2><a href="/pixel-led/${product.slug}/">${escapeHtml(product.name)}</a></h2>
          <p>50-LED string, ${escapeHtml(product.length)}, ${escapeHtml(product.bulbSize)} pixels, 12V DC.</p>
          <div class="card-meta"><span>${escapeHtml(product.series)}</span><span>${escapeHtml(product.power)}</span></div>
          <div class="card-buy"><strong>&#8377;${product.price.toLocaleString('en-IN')}</strong><button type="button" onclick="buyPixelProduct('${product.id}')">Buy Now</button></div>
        </div>
      </article>`).join('');

const categoryHtml = `${pageHead({
  title: '12V Pixel LEDs for Sign Boards | 3, 5 & 7 Inch | Signs and Arts',
  description: 'Buy 12V single-colour pixel LED strings for sign boards in India. Choose 3-inch, 5-inch and 7-inch spacing in red, green, blue, white, yellow, pink and warm white.',
  canonical: 'https://signsandarts.in/pixel-led/',
  schema: categorySchema
})}
${header('<a href="/">Home</a><span>/</span>Pixel LEDs')}
<main>
  <section class="collection-hero">
    <div>
      <div class="eyebrow">12V SIGNAGE COMPONENTS</div>
      <h1>Pixel LEDs for Sign Boards</h1>
      <p>Single-colour 12V DC pixel strings for channel letters, shop boards and decorative lighting. Compare spacing, colour and series before ordering.</p>
    </div>
    <div class="collection-facts"><strong>28</strong><span>12V products</span><strong>50</strong><span>LEDs per string</span></div>
  </section>
  <section class="catalog-section">
    <div class="catalog-toolbar">
      <div><strong>12V Single Colour Range</strong><span id="productCount">28 products</span></div>
      <div class="filter-row">
        <button class="filter active" data-filter="all">All</button>
        <button class="filter" data-filter="3-inch">3 Inch</button>
        <button class="filter" data-filter="5-inch">5 Inch</button>
        <button class="filter" data-filter="7-inch">7 Inch</button>
      </div>
    </div>
    <div class="product-grid" id="pixelGrid">${categoryCards}
    </div>
  </section>
  <section class="buying-note">
    <h2>Before You Order</h2>
    <p>These are low-voltage 12V DC LED strings. Use a correctly rated compatible power supply and confirm polarity before installation. The product listings state no warranty.</p>
  </section>
</main>
${footer()}
${checkoutModal()}
<script>window.PIXEL_PRODUCTS=${productsJson};initPixelCatalog();</script>
</body>
</html>`;

fs.writeFileSync(path.join(outputRoot, 'index.html'), categoryHtml, 'utf8');

const styles = `:root{--black:#111;--gold:#c9a84c;--green:#188441;--orange:#e67e22;--line:#e6e6e6;--muted:#707070;--soft:#f7f7f7;--radius:6px}*{box-sizing:border-box}html,body{max-width:100%;overflow-x:hidden}body{margin:0;font-family:'DM Sans',sans-serif;color:var(--black);line-height:1.55}a{color:inherit;text-decoration:none}.topbar{background:#080808;color:#ddd;padding:.45rem 5%;font-size:.74rem;display:flex;gap:1.5rem}.topbar a{color:#fff;margin-left:auto;font-weight:700}header{height:76px;padding:0 5%;display:flex;align-items:center;gap:2rem;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff;z-index:20}.logo{display:flex;flex-direction:column;line-height:1.05;min-width:0}.logo strong{font:700 1.65rem 'Playfair Display',serif}.logo i{color:#b48c2a;font-style:normal}.logo small{font-size:.56rem;letter-spacing:3px;color:#999;margin-top:5px}nav{display:flex;gap:1.3rem;margin-left:auto;font-size:.84rem;font-weight:600}.whatsapp{background:#25d366;color:#fff;padding:.55rem .9rem;border-radius:4px;font-size:.8rem;font-weight:700}.breadcrumb{padding:.7rem 5%;font-size:.76rem;color:#777;border-bottom:1px solid var(--line);background:#fafafa}.breadcrumb span{margin:0 .5rem;color:#bbb}.collection-hero{padding:3.4rem 5%;background:#111;color:#fff;display:flex;justify-content:space-between;align-items:end;gap:3rem}.collection-hero>div{min-width:0;max-width:100%}.collection-hero h1{font:700 clamp(2rem,4vw,3.5rem) 'Playfair Display',serif;margin:.35rem 0 .75rem;letter-spacing:0;overflow-wrap:anywhere}.collection-hero p{max-width:650px;color:#ccc;margin:0}.eyebrow{font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:#aa8124;font-weight:700}.collection-facts{display:grid;grid-template-columns:auto auto;gap:.1rem .7rem;align-items:baseline;min-width:200px}.collection-facts strong{font:700 2rem 'Playfair Display',serif;color:var(--gold)}.collection-facts span{font-size:.75rem;color:#bbb}.catalog-section{padding:2.5rem 5%;max-width:1500px;margin:auto}.catalog-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.4rem}.catalog-toolbar>div:first-child{display:flex;flex-direction:column}.catalog-toolbar span{font-size:.75rem;color:var(--muted)}.filter-row{display:flex;gap:.4rem;flex-wrap:wrap}.filter{border:1px solid #d8d8d8;background:#fff;padding:.52rem .8rem;border-radius:4px;font:600 .76rem 'DM Sans',sans-serif;cursor:pointer}.filter.active,.filter:hover{background:#111;color:#fff;border-color:#111}.product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}.product-card{border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:#fff;display:flex;flex-direction:column}.product-card[hidden]{display:none}.card-image{aspect-ratio:1.15;background:var(--soft);display:block;overflow:hidden}.card-image img{width:100%;height:100%;object-fit:contain;padding:.7rem;transition:transform .2s}.card-image:hover img{transform:scale(1.035)}.card-body{padding:1rem;display:flex;flex-direction:column;flex:1}.card-body h2{font:700 1rem/1.35 'Playfair Display',serif;margin:.35rem 0 .55rem;min-height:2.7em}.card-body p{font-size:.78rem;color:var(--muted);margin:0 0 .7rem}.card-meta{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:auto}.card-meta span{font-size:.65rem;padding:.23rem .42rem;background:#f4f4f4;border:1px solid #e4e4e4}.card-buy{display:flex;align-items:center;justify-content:space-between;gap:.7rem;border-top:1px solid var(--line);margin-top:.85rem;padding-top:.85rem}.card-buy strong{font-size:1.22rem}.card-buy button,.buy-primary{border:0;background:#111;color:#fff;border-radius:4px;padding:.62rem .82rem;font:700 .75rem 'DM Sans',sans-serif;cursor:pointer}.card-buy button:hover,.buy-primary:hover{background:var(--gold)}.buying-note{margin:0 5% 3rem;padding:1.25rem 1.4rem;border-left:3px solid var(--gold);background:#fafafa}.buying-note h2{font:700 1.2rem 'Playfair Display',serif;margin:0 0 .25rem}.buying-note p{font-size:.82rem;color:#555;margin:0}.product-layout{max-width:1180px;margin:auto;padding:2.5rem 5%;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:3rem}.product-image{aspect-ratio:1;border:1px solid var(--line);border-radius:8px;background:#fafafa;display:flex;align-items:center;justify-content:center;overflow:hidden}.product-image img{width:100%;height:100%;object-fit:contain;padding:1.1rem}.badges{display:flex;gap:.45rem;flex-wrap:wrap}.badge{font-size:.65rem;letter-spacing:1px;text-transform:uppercase;font-weight:800;padding:.28rem .58rem;background:#111;color:#fff}.badge.gold{background:var(--gold)}.product-info h1{font:700 2rem/1.25 'Playfair Display',serif;margin:.8rem 0;overflow-wrap:anywhere}.lead{color:#555;font-size:.9rem}.price-panel{background:#fafafa;border:1px solid var(--line);padding:1.1rem 1.2rem;border-radius:8px;margin:1.2rem 0}.price-panel small{display:block;color:#777;text-transform:uppercase;letter-spacing:2px;font-size:.65rem}.price-panel strong{font-size:2.15rem}.spec-list{list-style:none;padding:0;margin:1rem 0}.spec-list li{padding:.55rem 0;border-bottom:1px solid #eee;font-size:.85rem;display:flex;gap:.6rem}.spec-list li:before{content:'✓';color:var(--green);font-weight:800}.quantity-buy{display:grid;grid-template-columns:110px 1fr;gap:.7rem;margin-top:1.25rem}.quantity{display:flex;border:1px solid #ccc;border-radius:4px;overflow:hidden}.quantity button{width:34px;border:0;background:#f3f3f3;font-size:1.1rem;cursor:pointer}.quantity input{width:42px;border:0;text-align:center;font:700 .85rem 'DM Sans',sans-serif}.product-note{max-width:1180px;margin:0 auto 3rem;padding:1.25rem 5%;border-top:8px solid #f5f5f5}.product-note h2{font:700 1.25rem 'Playfair Display',serif}.spec-table{width:100%;border-collapse:collapse;font-size:.84rem}.spec-table td{padding:.65rem;border-bottom:1px solid #eee}.spec-table td:first-child{font-weight:700;width:35%}footer{background:#080808;color:#aaa;padding:2rem 5%;display:flex;justify-content:space-between;gap:2rem;font-size:.78rem}footer strong,footer a{color:#fff}.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:100;align-items:center;justify-content:center;padding:1rem}.modal-bg.open{display:flex}.modal-box{width:min(520px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:8px;padding:1.3rem;position:relative}.modal-box h2{font:700 1.35rem 'Playfair Display',serif;margin:.1rem 0 1rem}.modal-x{position:absolute;right:.8rem;top:.6rem;border:0;background:transparent;font-size:1.5rem;cursor:pointer}.order-summary{background:#f7f7f7;padding:.8rem;border-radius:4px;margin-bottom:.8rem}.summary-row{display:flex;justify-content:space-between;gap:1rem;padding:.35rem 0;font-size:.8rem;border-bottom:1px solid #e7e7e7}.summary-row.total{font-weight:800;border:0;font-size:.9rem}.payment-toggle{display:flex;gap:.5rem;margin:.8rem 0}.pay-mode{flex:1;padding:.65rem;border:1px solid #ddd;background:#fff;border-radius:4px;font-weight:700}.pay-mode.active{background:#111;color:#fff}.pay-mode.cod.active{background:var(--orange);border-color:var(--orange)}.cod-info{display:none;background:#fff5e6;color:#704600;padding:.65rem;border:1px solid #f0d49a;border-radius:4px;font-size:.76rem;margin-bottom:.8rem}.cod-info.show{display:block}.modal-box label{display:block;font-size:.74rem;font-weight:700;margin-bottom:.65rem}.modal-box input{display:block;width:100%;padding:.65rem;border:1px solid #ccc;border-radius:4px;margin-top:.22rem;font:inherit}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}.pay-button{width:100%;border:0;background:#111;color:#fff;padding:.85rem;border-radius:4px;font-weight:800;cursor:pointer}.pay-button:disabled{opacity:.6}@media(max-width:980px){.product-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.topbar{gap:.5rem;padding:.45rem 5%;flex-wrap:wrap;justify-content:space-between}.topbar a{margin-left:0}.topbar span:nth-child(2){display:none}header{height:auto;min-height:70px;padding:.65rem 5%;gap:.6rem;flex-wrap:nowrap}.logo strong{font-size:1.4rem}.logo small{font-size:.5rem;letter-spacing:2px}.whatsapp{margin-left:auto;flex:0 0 auto;padding:.5rem .65rem}.collection-hero{padding:2.4rem 5%;display:block}.collection-facts{margin-top:1.3rem;min-width:0}.catalog-toolbar{align-items:flex-start;flex-direction:column}.product-grid{grid-template-columns:1fr;gap:.8rem}.card-image{aspect-ratio:1.45}.card-body{padding:.9rem}.card-body h2{font-size:1rem;min-height:0}.card-buy{align-items:center;flex-direction:row}.card-buy button{width:auto}.product-layout{grid-template-columns:1fr;gap:1.4rem;padding:1.4rem 5%}.product-info h1{font-size:1.55rem}.form-row{grid-template-columns:1fr}.quantity-buy{grid-template-columns:100px 1fr}footer{flex-direction:column}.collection-hero h1{font-size:2rem;line-height:1.15}}`;

const finalizedStyles = styles.replace(
  'flex-wrap:nowrap}.logo strong',
  'flex-wrap:nowrap}nav{display:none}.logo strong'
);
fs.writeFileSync(path.join(outputRoot, 'styles.css'), finalizedStyles, 'utf8');

const catalogScript = `var pixelPayMode='online',pixelOrder=null,COD_CHARGE=50,LOW_PRICE_SHIPPING=125;
function formatPixelPrice(value){return Number(value).toLocaleString('en-IN')}
function getPixelProduct(id){return (window.PIXEL_PRODUCTS||[]).find(function(item){return item.id===id})}
function initPixelCatalog(){
  document.querySelectorAll('.filter').forEach(function(button){
    button.addEventListener('click',function(){
      var filter=button.dataset.filter,count=0;
      document.querySelectorAll('.product-card').forEach(function(card){
        var show=filter==='all'||card.dataset.group===filter;
        card.hidden=!show;if(show)count++;
      });
      document.querySelectorAll('.filter').forEach(function(item){item.classList.toggle('active',item===button)});
      var countEl=document.getElementById('productCount');if(countEl)countEl.textContent=count+' products';
    });
  });
}
function buyPixelProduct(id){var product=getPixelProduct(id);if(product)openPixelCheckout(product,1)}
function changeProductQty(delta){
  var input=document.getElementById('productQty');if(!input)return;
  input.value=Math.max(1,Math.min(99,Number(input.value||1)+delta));
}
function buyCurrentPixelProduct(){
  var qty=Math.max(1,Math.min(99,Number(document.getElementById('productQty').value||1)));
  openPixelCheckout(window.PIXEL_PRODUCT,qty);
}
function openPixelCheckout(product,qty){
  pixelOrder={product:product,qty:qty||1};pixelPayMode='online';
  setPixelPayMode('online');
  document.getElementById('checkoutModal').classList.add('open');
  document.getElementById('checkoutModal').setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closePixelCheckout(){
  document.getElementById('checkoutModal').classList.remove('open');
  document.getElementById('checkoutModal').setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
function pixelTotals(){
  var subtotal=pixelOrder.product.price*pixelOrder.qty;
  var shipping=subtotal<300?LOW_PRICE_SHIPPING:0;
  var onlineTotal=subtotal+shipping;
  var codTotal=onlineTotal+COD_CHARGE;
  var advance=Math.min(200,codTotal);
  return {subtotal:subtotal,shipping:shipping,onlineTotal:onlineTotal,codTotal:codTotal,advance:advance,remaining:Math.max(codTotal-advance,0)};
}
function renderPixelSummary(){
  if(!pixelOrder)return;
  var totals=pixelTotals(),summary=document.getElementById('orderSummary');
  var rows='<div class="summary-row"><span>'+pixelOrder.product.name+' x'+pixelOrder.qty+'</span><span>&#8377;'+formatPixelPrice(totals.subtotal)+'</span></div>';
  if(totals.shipping){
    rows+='<div class="summary-row"><span>Shipping charge</span><span>&#8377;'+formatPixelPrice(totals.shipping)+'</span></div>';
  }
  if(pixelPayMode==='cod'){
    rows+='<div class="summary-row"><span>COD handling charge</span><span>&#8377;'+COD_CHARGE+'</span></div>';
    rows+='<div class="summary-row"><span>Advance payable now</span><span>&#8377;'+formatPixelPrice(totals.advance)+'</span></div>';
    rows+='<div class="summary-row"><span>Balance on delivery</span><span>&#8377;'+formatPixelPrice(totals.remaining)+'</span></div>';
    rows+='<div class="summary-row total"><span>Total order value</span><span>&#8377;'+formatPixelPrice(totals.codTotal)+'</span></div>';
  }else{
    rows+='<div class="summary-row total"><span>Total payable</span><span>&#8377;'+formatPixelPrice(totals.onlineTotal)+'</span></div>';
  }
  summary.innerHTML=rows;
  document.getElementById('codAdvanceText').innerHTML='&#8377;'+formatPixelPrice(totals.advance)+' advance';
  document.getElementById('payBtn').innerHTML=pixelPayMode==='cod'?'Pay &#8377;'+formatPixelPrice(totals.advance)+' Advance & Place COD Order':'Pay &#8377;'+formatPixelPrice(totals.onlineTotal)+' Securely';
}
function setPixelPayMode(mode){
  pixelPayMode=mode;
  document.getElementById('btnOnline').classList.toggle('active',mode==='online');
  document.getElementById('btnCOD').classList.toggle('active',mode==='cod');
  document.getElementById('codInfo').classList.toggle('show',mode==='cod');
  document.getElementById('payBtn').style.background=mode==='cod'?'#e67e22':'#111';
  renderPixelSummary();
}
async function placePixelOrder(){
  if(!pixelOrder)return;
  var fields={name:'custName',phone:'custPhone',email:'custEmail',address:'custAddr',city:'custCity',state:'custState',pincode:'custPin'};
  var data={};Object.keys(fields).forEach(function(key){data[key]=document.getElementById(fields[key]).value.trim()});
  if(Object.keys(data).some(function(key){return !data[key]})){alert('Please fill all fields.');return}
  if(!/^\\d{10}$/.test(data.phone)){alert('Enter a valid 10-digit phone number.');return}
  if(!/^\\S+@\\S+\\.\\S+$/.test(data.email)){alert('Enter a valid email address.');return}
  if(!/^\\d{6}$/.test(data.pincode)){alert('Enter a valid 6-digit PIN code.');return}
  var totals=pixelTotals(),isCOD=pixelPayMode==='cod';
  var payAmount=isCOD?totals.advance:totals.onlineTotal;
  var orderTotal=isCOD?totals.codTotal:totals.onlineTotal;
  var orderId='SA-PX-'+Date.now();
  var orderData={name:data.name,phone:data.phone,email:data.email,address:data.address,city:data.city,state:data.state,pincode:data.pincode,items:[{id:pixelOrder.product.id,name:pixelOrder.product.name,price:pixelOrder.product.price,qty:pixelOrder.qty}],total:orderTotal,productTotal:totals.subtotal,shippingCharge:totals.shipping,isCOD:isCOD,codAdvance:isCOD?totals.advance:0,codCharge:isCOD?COD_CHARGE:0};
  var button=document.getElementById('payBtn');button.disabled=true;button.textContent='Creating order...';
  try{
    var response=await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:payAmount,orderId:orderId,customerName:data.name,customerEmail:data.email,customerPhone:data.phone,isCOD:isCOD})});
    var paymentOrder=await response.json();
    if(!paymentOrder.payment_session_id)throw new Error(paymentOrder.error||'Could not create order');
    var cashfree=Cashfree({mode:'production'});
    cashfree.checkout({paymentSessionId:paymentOrder.payment_session_id,redirectTarget:'_modal'}).then(async function(result){
      if(result.error){alert('Payment failed. Please try again or order through WhatsApp.');button.disabled=false;renderPixelSummary();return}
      var verifyResponse=await fetch('/api/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:orderId,orderData:orderData})});
      var verification=await verifyResponse.json();
      if(verification.success){window.location.href='/thank-you.html?order_id='+encodeURIComponent(orderId)+'&product='+encodeURIComponent(pixelOrder.product.name)+'&amount='+orderData.total+(isCOD?'&cod=1':'')}
      else alert('Payment received. Please WhatsApp us with Order ID: '+orderId);
    });
  }catch(error){alert('Could not start payment. Please order through WhatsApp.');button.disabled=false;renderPixelSummary()}
}
document.addEventListener('click',function(event){if(event.target&&event.target.id==='checkoutModal')closePixelCheckout()});`;

fs.writeFileSync(path.join(outputRoot, 'catalog.js'), catalogScript, 'utf8');
fs.writeFileSync(path.join(outputRoot, 'products.json'), JSON.stringify(products.map(({imageUrl, order, ...product}) => product), null, 2), 'utf8');

for (const product of products) {
  const productDir = path.join(outputRoot, product.slug);
  fs.mkdirSync(productDir, {recursive: true});
  const description = `${product.color} ${product.spacing} 12V pixel LED string with ${product.ledCount} LEDs, ${product.length} length and ${product.bulbSize} pixels for sign boards and decorative lighting.`;
  const schema = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    sku: product.id,
    brand: {'@type': 'Brand', name: 'Signs and Arts'},
    image: [`https://signsandarts.in${product.image}`],
    offers: {
      '@type': 'Offer',
      price: String(product.price),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `https://signsandarts.in/pixel-led/${product.slug}/`
    }
  })}</script>`;
  const page = `${pageHead({
    title: `${product.name} | Buy 12V Pixel LEDs India`,
    description,
    canonical: `https://signsandarts.in/pixel-led/${product.slug}/`,
    schema
  })}
${header(`<a href="/">Home</a><span>/</span><a href="/pixel-led/">Pixel LEDs</a><span>/</span>${escapeHtml(product.name)}`)}
<main>
  <section class="product-layout">
    <div class="product-image"><a href="${product.image}" target="_blank"><img src="${product.image}" alt="${escapeHtml(description)}"></a></div>
    <div class="product-info">
      <div class="badges"><span class="badge">12V Pixel LED</span><span class="badge gold">${escapeHtml(product.series)} Series</span></div>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="lead">${escapeHtml(description)} Suitable for low-voltage sign-board fabrication and decorative LED work.</p>
      <div class="price-panel"><small>Price per 50-LED string</small><strong>&#8377;${product.price.toLocaleString('en-IN')}</strong></div>
      <ul class="spec-list">
        <li>${product.ledCount} single-colour LED pixels per string</li>
        <li>${escapeHtml(product.spacing)} gap and approximately ${escapeHtml(product.length)} string length</li>
        <li>${escapeHtml(product.bulbSize)} pixel size; ${escapeHtml(product.power)} stated power</li>
        <li>12V DC working voltage</li>
        <li>Colour: ${escapeHtml(product.color)}</li>
        <li>No warranty, as stated for this component range</li>
      </ul>
      <div class="quantity-buy">
        <div class="quantity"><button type="button" onclick="changeProductQty(-1)">&#8722;</button><input id="productQty" value="1" inputmode="numeric"><button type="button" onclick="changeProductQty(1)">&#43;</button></div>
        <button class="buy-primary" type="button" onclick="buyCurrentPixelProduct()">Buy Now</button>
      </div>
    </div>
  </section>
  <section class="product-note">
    <h2>Product Specifications</h2>
    <table class="spec-table">
      <tr><td>Working Voltage</td><td>12V DC</td></tr>
      <tr><td>LED Count</td><td>${product.ledCount} pixels per string</td></tr>
      <tr><td>Pixel Spacing</td><td>${escapeHtml(product.spacing)}</td></tr>
      <tr><td>Approximate Length</td><td>${escapeHtml(product.length)}</td></tr>
      <tr><td>Pixel Diameter</td><td>${escapeHtml(product.bulbSize)}</td></tr>
      <tr><td>Colour</td><td>${escapeHtml(product.color)}</td></tr>
      <tr><td>Series</td><td>${escapeHtml(product.series)}</td></tr>
      <tr><td>Warranty</td><td>No warranty</td></tr>
    </table>
  </section>
</main>
${footer()}
${checkoutModal()}
<script>window.PIXEL_PRODUCT=${JSON.stringify((({imageUrl, order, ...rest}) => rest)(product))};window.PIXEL_PRODUCTS=[window.PIXEL_PRODUCT];</script>
</body>
</html>`;
  fs.writeFileSync(path.join(productDir, 'index.html'), page, 'utf8');
}

async function downloadImages() {
  for (const product of products) {
    if (!product.imageUrl) continue;
    const destination = path.join(outputRoot, 'images', `${product.slug}.jpg`);
    const response = await fetch(product.imageUrl, {headers: {'user-agent': 'Mozilla/5.0'}});
    if (!response.ok) throw new Error(`Image download failed (${response.status}): ${product.imageUrl}`);
    fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
    console.log(`Downloaded ${path.basename(destination)}`);
  }
}

downloadImages().then(() => {
  console.log(`Generated ${products.length} 12V Pixel LED products in ${outputRoot}`);
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
