const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(root, '..', '..', 'products');
const webpQuality = 82;

function loadSharp() {
  const candidates = [
    process.env.SHARP_MODULE_PATH,
    path.resolve(root, '..', 'tmp', 'sharp-webp', 'node_modules', 'sharp'),
    'sharp',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      // Try the next candidate.
    }
  }

  throw new Error('Sharp is required to generate WebP product images. Install it or set SHARP_MODULE_PATH.');
}

const products = [
  {
    source: 'ent',
    slug: 'ent-led-sign-board',
    id: 'ent-led',
    name: 'ENT LED Sign Board',
    label: 'ENT',
    category: 'ENT Clinic',
    audience: 'ENT clinics, doctor offices and specialty consultation rooms',
    description: 'Buy ENT LED Sign Board in red and white, available in 18x18 inch and 24x24 inch sizes. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
    files: {
      main: 'ChatGPT Image Jul 3, 2026, 09_34_10 AM (5).png',
      size: 'ChatGPT Image Jul 3, 2026, 09_34_10 AM (4).png',
      features: 'ChatGPT Image Jul 3, 2026, 09_34_10 AM (1).png',
      overview: 'ChatGPT Image Jul 3, 2026, 09_34_10 AM (2).png',
    },
  },
  {
    source: 'emergency',
    slug: 'emergency-led-sign-board',
    id: 'emergency-led',
    name: 'Emergency LED Sign Board',
    label: 'Emergency',
    category: 'Hospital Signage',
    audience: 'hospitals, emergency entrances, clinics and 24-hour medical facilities',
    description: 'Buy Emergency LED Sign Board in red and white, available in 18x18 inch and 24x24 inch sizes. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
    files: {
      main: 'ChatGPT Image Jul 3, 2026, 09_37_26 AM (3).png',
      size: 'ChatGPT Image Jul 3, 2026, 09_37_26 AM (4).png',
      features: 'ChatGPT Image Jul 3, 2026, 09_37_26 AM (1).png',
      front: 'ChatGPT Image Jul 3, 2026, 09_37_26 AM (5).png',
      overview: 'ChatGPT Image Jul 3, 2026, 09_37_26 AM (2).png',
    },
  },
  {
    source: 'orthopedic',
    slug: 'orthopedic-led-sign-board',
    id: 'orthopedic-led',
    name: 'Orthopedic LED Sign Board',
    label: 'Orthopedic',
    category: 'Orthopedic Clinic',
    audience: 'orthopedic clinics, bone specialists, hospitals and doctor offices',
    description: 'Buy Orthopedic LED Sign Board in red and white, available in 18x18 inch and 24x24 inch sizes. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
    files: {
      main: 'ChatGPT Image Jul 3, 2026, 09_37_59 AM (3).png',
      size: 'ChatGPT Image Jul 3, 2026, 09_37_59 AM (4).png',
      features: 'ChatGPT Image Jul 3, 2026, 09_37_59 AM (1).png',
      front: 'ChatGPT Image Jul 3, 2026, 09_37_59 AM (5).png',
      overview: 'ChatGPT Image Jul 3, 2026, 09_37_59 AM (2).png',
    },
  },
  {
    source: 'doctor',
    slug: 'doctor-led-sign-board',
    id: 'doctor-led',
    name: 'Doctor LED Sign Board',
    label: 'Doctor',
    category: 'Doctor Clinic',
    audience: 'doctor clinics, consultation rooms, family clinics and medical offices',
    description: 'Buy Doctor LED Sign Board in red and white, available in 18x18 inch and 24x24 inch sizes. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
    files: {
      main: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (8).png',
      size: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (9).png',
      features: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (6).png',
      front: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (10).png',
      overview: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (7).png',
    },
  },
  {
    source: 'hospital',
    slug: 'hospital-led-sign-board',
    id: 'hospital-led',
    name: 'Hospital LED Sign Board',
    label: 'Hospital',
    category: 'Hospital Signage',
    audience: 'hospitals, clinics, nursing homes and medical entrances',
    description: 'Buy Hospital LED Sign Board in red and white, available in 18x18 inch and 24x24 inch sizes. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
    files: {
      main: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (3).png',
      size: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (4).png',
      features: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (1).png',
      front: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (5).png',
      overview: 'ChatGPT Image Jul 3, 2026, 09_33_24 AM (2).png',
    },
  },
  {
    source: 'homeo',
    slug: 'homeo-led-sign-board',
    id: 'homeo-led',
    name: 'Homeo LED Sign Board',
    label: 'Homeo',
    category: 'Homeopathy Clinic',
    audience: 'homeopathy clinics, homeo doctors and alternative medicine clinics',
    description: 'Buy Homeo LED Sign Board in red and white, available in 18x18 inch and 24x24 inch sizes. Double-sided pixel LED board with iron frame, weatherproof build and plug-and-play installation.',
    files: {
      main: 'ChatGPT Image Jul 3, 2026, 09_34_10 AM (8).png',
      size: 'ChatGPT Image Jul 3, 2026, 09_34_10 AM (9).png',
      features: 'ChatGPT Image Jul 3, 2026, 09_34_10 AM (6).png',
      front: 'ChatGPT Image Jul 3, 2026, 09_34_10 AM (10).png',
      overview: 'ChatGPT Image Jul 3, 2026, 09_34_10 AM (7).png',
    },
  },
];

const variants = [
  { size: '18"x18"', price: 2889 },
  { size: '24"x24"', price: 5489 },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(value) {
  return Number(value).toLocaleString('en-IN');
}

function page(product, imageNames) {
  const images = imageNames.map(([key, file]) => ({
    key,
    file,
    label: key.charAt(0).toUpperCase() + key.slice(1),
  }));
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: 'Signs and Arts' },
    sku: `sa-${product.slug}-18x18`,
    image: images.map(image => `https://signsandarts.in/${product.slug}/${image.file}`),
    category: product.category,
    offers: variants.map(variant => ({
      '@type': 'Offer',
      price: String(variant.price),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `https://signsandarts.in/${product.slug}/`,
      itemCondition: 'https://schema.org/NewCondition',
      sku: `sa-${product.slug}-${variant.size.replace(/"/g, '').replace('x', 'x')}`,
    })),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <title>${escapeHtml(product.name)} 18x18 and 24x24 | Signs and Arts</title>
  <meta name="description" content="${escapeHtml(product.description)}">
  <link rel="canonical" href="https://signsandarts.in/${product.slug}/">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Signs and Arts">
  <meta property="og:title" content="${escapeHtml(product.name)} | Signs and Arts">
  <meta property="og:description" content="${escapeHtml(product.description)}">
  <meta property="og:url" content="https://signsandarts.in/${product.slug}/">
  <meta property="og:image" content="https://signsandarts.in/${product.slug}/main.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(product.name)} | Signs and Arts">
  <meta name="twitter:description" content="${escapeHtml(product.description)}">
  <meta name="twitter:image" content="https://signsandarts.in/${product.slug}/main.webp">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-PNNB88PBN3"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-PNNB88PBN3');gtag('config','AW-18110972532');</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    :root{--black:#111;--gold:#c9a84c;--green:#188441;--orange:#e67e22;--line:#e6e6e6;--soft:#f7f7f7;--muted:#707070}
    *{box-sizing:border-box}body{margin:0;font-family:'DM Sans',sans-serif;color:var(--black);line-height:1.55;background:#fff}a{color:inherit;text-decoration:none}
    .topbar{background:#080808;color:#ddd;padding:.45rem 5%;font-size:.74rem;display:flex;gap:1.5rem;justify-content:space-between;flex-wrap:wrap}.topbar a{color:#fff;font-weight:700}
    header{min-height:76px;padding:.8rem 5%;display:flex;align-items:center;gap:2rem;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff;z-index:20}.logo{display:flex;flex-direction:column;line-height:1.05;min-width:0}.logo strong{font:700 1.65rem 'Playfair Display',serif}.logo i{color:#b48c2a;font-style:normal}.logo small{font-size:.56rem;letter-spacing:3px;color:#999;margin-top:5px}nav{display:flex;gap:1.3rem;margin-left:auto;font-size:.84rem;font-weight:600}.whatsapp{background:#25d366;color:#fff;padding:.55rem .9rem;border-radius:4px;font-size:.8rem;font-weight:700}
    .breadcrumb{padding:.7rem 5%;font-size:.76rem;color:#777;border-bottom:1px solid var(--line);background:#fafafa}.breadcrumb a{font-weight:700;color:#111}.breadcrumb span{margin:0 .5rem;color:#bbb}
    .product{max-width:1180px;margin:auto;padding:2.4rem 5%;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:3rem}.gallery-main{aspect-ratio:1;border:1px solid var(--line);border-radius:8px;background:#fafafa;position:relative;overflow:hidden}.gallery-main img{width:100%;height:100%;object-fit:contain;padding:1rem;display:none}.gallery-main img.active{display:block}.zoom-window{display:none;position:absolute;right:12px;top:12px;width:45%;height:45%;background:#fff no-repeat;border:2px solid #111;border-radius:6px;box-shadow:0 12px 35px rgba(0,0,0,.22);pointer-events:none}.thumbs{display:flex;gap:.45rem;margin-top:.65rem;overflow:auto}.thumb{width:66px;height:66px;object-fit:contain;background:#f5f5f5;border:2px solid transparent;padding:3px;cursor:pointer;flex:0 0 auto}.thumb.active{border-color:#111}.badges{display:flex;gap:.45rem;flex-wrap:wrap}.badge{background:#111;color:#fff;padding:.3rem .65rem;font-size:.65rem;font-weight:800;letter-spacing:1px;text-transform:uppercase}.badge.gold{background:var(--gold)}
    h1{font:700 2rem/1.25 'Playfair Display',serif;margin:.8rem 0;overflow-wrap:anywhere}.lead{color:#555;font-size:.94rem}.price-box{background:#fafafa;border:1px solid var(--line);border-radius:8px;padding:1.1rem 1.2rem;margin:1.2rem 0}.price-box small{display:block;color:#777;letter-spacing:2px;text-transform:uppercase;font-size:.65rem}.price-box strong{font-size:2.15rem}.variant-label{font-size:.68rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#777;margin-bottom:.5rem}.variant-btns{display:flex;gap:.5rem;flex-wrap:wrap}.vbtn{padding:.55rem 1rem;border:1.5px solid #ddd;border-radius:3px;background:#fff;font:700 .82rem 'DM Sans',sans-serif;cursor:pointer;color:#555}.vbtn.active,.vbtn:hover{background:#111;color:#fff;border-color:#111}.features{list-style:none;padding:0;margin:1rem 0}.features li{padding:.55rem 0;border-bottom:1px solid #eee;font-size:.85rem;display:flex;gap:.55rem}.features li:before{content:'+';color:var(--green);font-weight:800}.buy{display:flex;gap:.65rem;margin-top:1.2rem}.buy button{flex:1;border:0;background:#111;color:#fff;padding:.9rem;border-radius:4px;font-weight:800;cursor:pointer}.buy a{display:flex;align-items:center;justify-content:center;background:#25d366;color:#fff;padding:.75rem .9rem;border-radius:4px;font-weight:800;font-size:.78rem}
    .details{max-width:1180px;margin:0 auto 3rem;padding:1.5rem 5%;border-top:8px solid #f5f5f5}.details h2{font:700 1.3rem 'Playfair Display',serif}.specs{width:100%;border-collapse:collapse;font-size:.84rem}.specs td{padding:.65rem;border-bottom:1px solid #eee}.specs td:first-child{font-weight:700;width:34%}footer{background:#080808;color:#aaa;padding:2rem 5%;display:flex;justify-content:space-between;gap:2rem;font-size:.78rem}footer strong,footer a{color:#fff}
    .modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:100;align-items:center;justify-content:center;padding:1rem}.modal-bg.open{display:flex}.modal{width:min(520px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:8px;padding:1.3rem;position:relative}.modal h2{font:700 1.35rem 'Playfair Display',serif;margin:0 0 1rem}.close{position:absolute;right:.8rem;top:.5rem;border:0;background:none;font-size:1.5rem}.summary{background:#f7f7f7;padding:.8rem;margin-bottom:.8rem}.row{display:flex;justify-content:space-between;gap:1rem;padding:.35rem 0;border-bottom:1px solid #e7e7e7;font-size:.8rem}.row.total{font-weight:800;border:0}.toggle{display:flex;gap:.5rem;margin:.8rem 0}.toggle button{flex:1;padding:.65rem;border:1px solid #ddd;background:#fff;border-radius:4px;font-weight:700}.toggle button.active{background:#111;color:#fff}.toggle button.cod.active{background:var(--orange);border-color:var(--orange)}.cod-note{display:none;background:#fff5e6;color:#704600;border:1px solid #f0d49a;padding:.65rem;font-size:.76rem}.cod-note.show{display:block}.modal label{display:block;font-size:.74rem;font-weight:700;margin:.6rem 0}.modal input{width:100%;padding:.65rem;border:1px solid #ccc;border-radius:4px;margin-top:.2rem;font:inherit}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:.65rem}.pay{width:100%;border:0;background:#111;color:#fff;padding:.85rem;border-radius:4px;font-weight:800;margin-top:.8rem}.pay:disabled{opacity:.6}
    @media(max-width:760px){nav{display:none}header{gap:.6rem}.logo strong{font-size:1.4rem}.whatsapp{margin-left:auto}.product{grid-template-columns:1fr;gap:1.4rem;padding:1.4rem 5%}h1{font-size:1.55rem}.form-row{grid-template-columns:1fr}.buy{flex-direction:column}footer{flex-direction:column}.zoom-window{display:none!important}}
  </style>
</head>
<body>
  <div class="topbar"><span>Pan India Delivery</span><span>${escapeHtml(product.category)}</span><a href="tel:+919392878946">+91 93928 78946</a></div>
  <header><a href="/" class="logo"><strong>Signs <i>&amp;</i> Arts</strong><small>LED SIGN BOARDS - INDIA</small></a><nav><a href="/#products">Products</a><a href="/track/">Track Order</a><a href="/#contact">Contact</a></nav><a class="whatsapp" href="https://wa.me/919392878946" target="_blank">WhatsApp</a></header>
  <div class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/#products">Medical LED Boards</a><span>/</span>${escapeHtml(product.name)}</div>
  <main>
    <section class="product">
      <div>
        <div class="gallery-main">${images.map((image, index) => `<img src="${image.file}" alt="${escapeHtml(product.name)} ${image.label}" class="${index === 0 ? 'active' : ''}">`).join('')}<div class="zoom-window"></div></div>
        <div class="thumbs">${images.map((image, index) => `<img src="${image.file}" class="thumb ${index === 0 ? 'active' : ''}" onclick="switchImage(${index})" alt="View ${image.label}">`).join('')}</div>
      </div>
      <div>
        <div class="badges"><span class="badge">New Medical Board</span><span class="badge gold">Ready to Order</span></div>
        <h1>${escapeHtml(product.name)} - Red &amp; White Double Sided</h1>
        <p class="lead">${escapeHtml(product.description)}</p>
        <div class="price-box"><small>Price</small><strong id="price">&#8377;${money(variants[0].price)}</strong></div>
        <div class="variant-label">Select Size</div>
        <div class="variant-btns">
          ${variants.map((variant, index) => `<button class="vbtn ${index === 0 ? 'active' : ''}" onclick="selectVariant(${index},this)">${escapeHtml(variant.size)} - &#8377;${money(variant.price)}</button>`).join('')}
        </div>
        <ul class="features">
          <li>Bright red plus-style board with white ${escapeHtml(product.label.toUpperCase())} lettering</li>
          <li>Double-sided display for roadside visibility</li>
          <li>Iron frame construction with weatherproof, rainproof finish</li>
          <li>Pixel LED brightness with plug-and-play power</li>
          <li>Hook mounting with nut and bolt hardware</li>
        </ul>
        <div class="buy"><button id="buyBtn" onclick="openCheckout()">Buy Now - &#8377;${money(variants[0].price)}</button><a href="https://wa.me/919392878946?text=${encodeURIComponent(`Hi, I want to order ${product.name}`)}" target="_blank">WhatsApp Order</a></div>
      </div>
    </section>
    <section class="details">
      <h2>Product Specifications</h2>
      <table class="specs">
        <tr><td>Product Type</td><td>${escapeHtml(product.name)}</td></tr>
        <tr><td>Available Sizes</td><td>18 inch x 18 inch and 24 inch x 24 inch</td></tr>
        <tr><td>Display</td><td>Double sided</td></tr>
        <tr><td>LED Colours</td><td>Red and white</td></tr>
        <tr><td>Frame</td><td>Iron frame, weatherproof and rainproof</td></tr>
        <tr><td>Installation</td><td>Hook mounting, plug-and-play power</td></tr>
        <tr><td>Recommended Use</td><td>${escapeHtml(product.audience)}</td></tr>
      </table>
    </section>
  </main>
  <footer><div><strong>Signs &amp; Arts</strong><br>Ready-made medical, clinic and pharmacy LED sign boards.</div><div><a href="/refund.html">Return Policy</a> &nbsp; <a href="/terms.html">Terms</a> &nbsp; <a href="https://wa.me/919392878946">WhatsApp</a></div></footer>
  <div class="modal-bg" id="checkout"><div class="modal"><button class="close" onclick="closeCheckout()">&times;</button><h2>Complete Your Order</h2><div class="summary" id="summary"></div><div class="toggle"><button id="online" class="active" onclick="setMode('online')">Pay Online</button><button id="cod" class="cod" onclick="setMode('cod')">Cash on Delivery</button></div><div class="cod-note" id="codNote">Pay <strong>&#8377;200 advance</strong> now. A <strong>&#8377;50 COD charge</strong> is added; the balance is paid on delivery.</div><div class="form-row"><label>Full Name *<input id="name"></label><label>Phone Number *<input id="phone" maxlength="10" inputmode="numeric"></label></div><label>Email Address *<input id="email" type="email"></label><label>Delivery Address *<input id="address"></label><div class="form-row"><label>City *<input id="city"></label><label>State *<input id="state"></label></div><label>PIN Code *<input id="pin" maxlength="6" inputmode="numeric"></label><button class="pay" id="pay" onclick="placeOrder()">Pay Securely</button></div></div>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <script>
  var PRODUCT=${JSON.stringify({ id: product.id, name: product.name })};
  var VARIANTS=${JSON.stringify(variants)};
  var current=VARIANTS[0],mode='online',COD_CHARGE=50;
  function money(value){return Number(value).toLocaleString('en-IN')}
  function switchImage(index){document.querySelectorAll('.gallery-main img').forEach(function(img,i){img.classList.toggle('active',i===index)});document.querySelectorAll('.thumb').forEach(function(img,i){img.classList.toggle('active',i===index)})}
  function selectVariant(index,btn){current=VARIANTS[index];document.getElementById('price').innerHTML='&#8377;'+money(current.price);document.getElementById('buyBtn').innerHTML='Buy Now - &#8377;'+money(current.price);document.querySelectorAll('.vbtn').forEach(function(button){button.classList.remove('active')});btn.classList.add('active')}
  function totals(){var cod=current.price+COD_CHARGE,advance=Math.min(200,cod);return{online:current.price,cod:cod,advance:advance,remaining:cod-advance}}
  function render(){var t=totals(),html='<div class="row"><span>'+PRODUCT.name+' '+current.size+' x1</span><span>&#8377;'+money(current.price)+'</span></div>';if(mode==='cod')html+='<div class="row"><span>COD Handling Charge</span><span>&#8377;'+COD_CHARGE+'</span></div><div class="row"><span>Advance payable now</span><span>&#8377;'+t.advance+'</span></div><div class="row"><span>Balance on delivery</span><span>&#8377;'+money(t.remaining)+'</span></div><div class="row total"><span>Total Order Value</span><span>&#8377;'+money(t.cod)+'</span></div>';else html+='<div class="row total"><span>Total Payable</span><span>&#8377;'+money(t.online)+'</span></div>';document.getElementById('summary').innerHTML=html;document.getElementById('pay').innerHTML=mode==='cod'?'Pay &#8377;'+t.advance+' Advance & Place COD Order':'Pay &#8377;'+money(t.online)+' Securely'}
  function setMode(value){mode=value;document.getElementById('online').classList.toggle('active',value==='online');document.getElementById('cod').classList.toggle('active',value==='cod');document.getElementById('codNote').classList.toggle('show',value==='cod');document.getElementById('pay').style.background=value==='cod'?'#e67e22':'#111';render()}
  function openCheckout(){mode='online';setMode('online');document.getElementById('checkout').classList.add('open');document.body.style.overflow='hidden'}
  function closeCheckout(){document.getElementById('checkout').classList.remove('open');document.body.style.overflow=''}
  async function placeOrder(){var fields=['name','phone','email','address','city','state','pin'],data={};fields.forEach(function(id){data[id]=document.getElementById(id).value.trim()});if(fields.some(function(id){return !data[id]})){alert('Please fill all fields.');return}if(!/^\\d{10}$/.test(data.phone)){alert('Enter a valid 10-digit phone number.');return}if(!/^\\S+@\\S+\\.\\S+$/.test(data.email)){alert('Enter a valid email address.');return}if(!/^\\d{6}$/.test(data.pin)){alert('Enter a valid 6-digit PIN code.');return}var t=totals(),isCOD=mode==='cod',orderTotal=isCOD?t.cod:t.online,orderId='',orderData={name:data.name,phone:data.phone,email:data.email,address:data.address,city:data.city,state:data.state,pincode:data.pin,items:[{id:PRODUCT.id,name:PRODUCT.name+' '+current.size,price:current.price,qty:1}],total:orderTotal,productTotal:current.price,isCOD:isCOD,codAdvance:isCOD?t.advance:0,codCharge:isCOD?COD_CHARGE:0},button=document.getElementById('pay');button.disabled=true;button.textContent='Creating order...';try{var response=await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderData:orderData})}),payment=await response.json();orderId=payment.order_id;Object.assign(orderData,payment.order_data||{});if(!payment.payment_session_id)throw new Error(payment.error||'Could not create order');Cashfree({mode:'production'}).checkout({paymentSessionId:payment.payment_session_id,redirectTarget:'_modal'}).then(async function(result){if(result.error){alert('Payment failed. Please try again.');button.disabled=false;render();return}var verified=await fetch('/api/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:orderId})}).then(function(r){return r.json()});if(verified.success)location.href='/thank-you.html?order_id='+encodeURIComponent(orderId)+'&product='+encodeURIComponent(PRODUCT.name+' '+current.size)+'&amount='+orderData.total+(isCOD?'&cod=1':'');else alert('Payment received. Please WhatsApp us with Order ID: '+orderId)})}catch(error){alert('Could not start payment. Please order through WhatsApp.');button.disabled=false;render()}}
  (function(){var wrap=document.querySelector('.gallery-main'),zoom=wrap.querySelector('.zoom-window');wrap.addEventListener('mousemove',function(event){if(matchMedia('(max-width:760px)').matches)return;var img=wrap.querySelector('img.active'),rect=wrap.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*100,y=(event.clientY-rect.top)/rect.height*100;zoom.style.display='block';zoom.style.backgroundImage='url("'+img.src+'")';zoom.style.backgroundSize='220% 220%';zoom.style.backgroundPosition=x+'% '+y+'%'});wrap.addEventListener('mouseleave',function(){zoom.style.display='none'})})();
  </script>
</body>
</html>`;
}

async function build() {
  const sharp = loadSharp();

  for (const product of products) {
    const destination = path.join(root, product.slug);
    fs.mkdirSync(destination, { recursive: true });
    for (const oldPng of fs.readdirSync(destination).filter(file => file.endsWith('.png'))) {
      fs.rmSync(path.join(destination, oldPng));
    }

    const imageNames = Object.entries(product.files).map(([key, sourceName]) => [key, `${key}.webp`, sourceName]);
    for (const [key, fileName, sourceName] of imageNames) {
      const sourcePath = path.join(sourceRoot, product.source, sourceName);
      if (!fs.existsSync(sourcePath)) throw new Error(`Missing image for ${product.slug}: ${sourcePath}`);
      await sharp(sourcePath)
        .webp({ quality: webpQuality })
        .toFile(path.join(destination, fileName));
    }
    fs.writeFileSync(
      path.join(destination, 'index.html'),
      page(product, imageNames.map(([key, fileName]) => [key, fileName])),
      'utf8'
    );
  }

  console.log(`Generated ${products.length} specialty plus product pages.`);
}

build().catch(error => {
  console.error(error);
  process.exit(1);
});
