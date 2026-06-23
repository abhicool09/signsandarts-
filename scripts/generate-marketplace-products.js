const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assetRoot = path.join(root, 'marketplace-product-assets');

const products = [
  {
    slug: 'pan-shop-led-sign-board',
    id: 'pan-shop-led-sign-18x12',
    name: 'PAN Shop LED Sign Board - Red & White, Double Sided',
    shortName: 'PAN Shop LED Sign Board 18x12',
    title: 'PAN Shop LED Sign Board 18x12 Double Sided | Signs and Arts',
    description: 'Buy an 18x12 inch double-sided PAN shop LED sign board with bright red and white pixel LEDs, directional arrows and wall-mountable outdoor-focused construction.',
    category: 'Retail / Pan Shop',
    price: 2475,
    brand: 'Signs and Arts',
    badge: 'Retail Sign Board',
    sourceFolder: 'pan-shop-led-sign',
    imageCount: 7,
    features: [
      '18 inch x 12 inch compact storefront size',
      'Double-sided display for visibility from both directions',
      'Bright red and white pixel LED lighting',
      'PAN SHOP text with directional arrows',
      'Outdoor-focused protective casing and sturdy frame',
      'Simple hanging and wall-mount installation'
    ],
    specs: [
      ['Product Type', 'PAN shop LED sign board'],
      ['Size', '18 inch x 12 inch'],
      ['Display', 'Double sided'],
      ['LED Colours', 'Red and white'],
      ['Installation', 'Wall mount or hanging'],
      ['Recommended Use', 'Pan shops, retail counters and storefronts']
    ]
  },
  {
    slug: '12v-5a-60w-led-adapter',
    id: 'hilight-12v-5a-adapter',
    name: 'Hilight 12V 5A 60W Power Adapter for LED Strips & Signs',
    shortName: 'Hilight 12V 5A LED Power Adapter',
    title: 'Hilight 12V 5A 60W LED Power Adapter | Signs and Arts',
    description: 'Buy a Hilight 12V 5A 60W indoor power adapter for LED strips, LED modules, neon signs and CCTV, with a 2.1 x 5.5 mm centre-positive DC connector.',
    category: 'LED Accessories',
    price: 371,
    brand: 'Hilight',
    badge: 'LED Power Supply',
    sourceFolder: '12v-5a-adapter',
    imageCount: 4,
    features: [
      'Stable 12V DC, 5A output with 60W rated power',
      '2.1 mm x 5.5 mm centre-positive DC connector',
      'Suitable for LED strips, modules, neon signs and CCTV',
      'Overload, short-circuit and over-voltage protection',
      'High-efficiency SMPS design with low ripple',
      'Indoor-use adapter with one-year listed warranty'
    ],
    specs: [
      ['Brand', 'Hilight'],
      ['Input', '100-300V AC, as printed on the product'],
      ['Output', '12V DC, 5A'],
      ['Rated Power', '60W'],
      ['Connector', '2.1 mm x 5.5 mm, centre positive'],
      ['Sales Package', '1 power adapter'],
      ['Recommended Use', 'LED strips, LED modules, neon signs, CCTV and compatible electronics'],
      ['Warranty', '1 year as stated in the marketplace listing'],
      ['Use', 'Indoor only']
    ]
  }
];

const styles = `:root{--black:#111;--gold:#c9a84c;--green:#188441;--orange:#e67e22;--line:#e6e6e6;--soft:#f7f7f7;--muted:#707070}*{box-sizing:border-box}html,body{max-width:100%;overflow-x:hidden}body{margin:0;font-family:'DM Sans',sans-serif;color:var(--black);line-height:1.55}a{color:inherit;text-decoration:none}.topbar{background:#080808;color:#ddd;padding:.45rem 5%;font-size:.74rem;display:flex;gap:1.5rem}.topbar a{margin-left:auto;color:#fff;font-weight:700}header{height:76px;padding:0 5%;display:flex;align-items:center;gap:2rem;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff;z-index:20}.logo{display:flex;flex-direction:column;line-height:1.05;min-width:0}.logo strong{font:700 1.65rem 'Playfair Display',serif}.logo i{color:#b48c2a;font-style:normal}.logo small{font-size:.56rem;letter-spacing:3px;color:#999;margin-top:5px}nav{display:flex;gap:1.3rem;margin-left:auto;font-size:.84rem;font-weight:600}.whatsapp{background:#25d366;color:#fff;padding:.55rem .9rem;border-radius:4px;font-size:.8rem;font-weight:700}.breadcrumb{padding:.7rem 5%;font-size:.76rem;color:#777;border-bottom:1px solid var(--line);background:#fafafa}.breadcrumb span{margin:0 .5rem;color:#bbb}.product{max-width:1180px;margin:auto;padding:2.4rem 5%;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:3rem}.gallery-main{aspect-ratio:1;border:1px solid var(--line);border-radius:8px;background:#fafafa;position:relative;overflow:hidden}.gallery-main img{width:100%;height:100%;object-fit:contain;padding:1rem;display:none}.gallery-main img.active{display:block}.zoom-window{display:none;position:absolute;right:12px;top:12px;width:45%;height:45%;background:#fff no-repeat;border:2px solid #111;border-radius:6px;box-shadow:0 12px 35px rgba(0,0,0,.22);pointer-events:none}.thumbs{display:flex;gap:.45rem;margin-top:.65rem;overflow:auto}.thumb{width:66px;height:66px;object-fit:contain;background:#f5f5f5;border:2px solid transparent;padding:3px;cursor:pointer;flex:0 0 auto}.thumb.active{border-color:#111}.badges{display:flex;gap:.45rem;flex-wrap:wrap}.badge{background:#111;color:#fff;padding:.3rem .65rem;font-size:.65rem;font-weight:800;letter-spacing:1px;text-transform:uppercase}.badge.gold{background:var(--gold)}h1{font:700 2rem/1.25 'Playfair Display',serif;margin:.8rem 0;overflow-wrap:anywhere}.lead{color:#555;font-size:.9rem}.price-box{background:#fafafa;border:1px solid var(--line);border-radius:8px;padding:1.1rem 1.2rem;margin:1.2rem 0}.price-box small{display:block;color:#777;letter-spacing:2px;text-transform:uppercase;font-size:.65rem}.price-box strong{font-size:2.15rem}.features{list-style:none;padding:0;margin:1rem 0}.features li{padding:.55rem 0;border-bottom:1px solid #eee;font-size:.85rem;display:flex;gap:.55rem}.features li:before{content:'✓';color:var(--green);font-weight:800}.buy{display:flex;gap:.65rem;margin-top:1.2rem}.buy button{flex:1;border:0;background:#111;color:#fff;padding:.9rem;border-radius:4px;font-weight:800;cursor:pointer}.buy a{display:flex;align-items:center;justify-content:center;background:#25d366;color:#fff;padding:.75rem .9rem;border-radius:4px;font-weight:800;font-size:.78rem}.details{max-width:1180px;margin:0 auto 3rem;padding:1.5rem 5%;border-top:8px solid #f5f5f5}.details h2{font:700 1.3rem 'Playfair Display',serif}.specs{width:100%;border-collapse:collapse;font-size:.84rem}.specs td{padding:.65rem;border-bottom:1px solid #eee}.specs td:first-child{font-weight:700;width:34%}footer{background:#080808;color:#aaa;padding:2rem 5%;display:flex;justify-content:space-between;gap:2rem;font-size:.78rem}footer strong,footer a{color:#fff}.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:100;align-items:center;justify-content:center;padding:1rem}.modal-bg.open{display:flex}.modal{width:min(520px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:8px;padding:1.3rem;position:relative}.modal h2{font:700 1.35rem 'Playfair Display',serif;margin:0 0 1rem}.close{position:absolute;right:.8rem;top:.5rem;border:0;background:none;font-size:1.5rem}.summary{background:#f7f7f7;padding:.8rem;margin-bottom:.8rem}.row{display:flex;justify-content:space-between;gap:1rem;padding:.35rem 0;border-bottom:1px solid #e7e7e7;font-size:.8rem}.row.total{font-weight:800;border:0}.toggle{display:flex;gap:.5rem;margin:.8rem 0}.toggle button{flex:1;padding:.65rem;border:1px solid #ddd;background:#fff;border-radius:4px;font-weight:700}.toggle button.active{background:#111;color:#fff}.toggle button.cod.active{background:var(--orange);border-color:var(--orange)}.cod-note{display:none;background:#fff5e6;color:#704600;border:1px solid #f0d49a;padding:.65rem;font-size:.76rem}.cod-note.show{display:block}.modal label{display:block;font-size:.74rem;font-weight:700;margin:.6rem 0}.modal input{width:100%;padding:.65rem;border:1px solid #ccc;border-radius:4px;margin-top:.2rem;font:inherit}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:.65rem}.pay{width:100%;border:0;background:#111;color:#fff;padding:.85rem;border-radius:4px;font-weight:800;margin-top:.8rem}.pay:disabled{opacity:.6}@media(max-width:760px){.topbar span:nth-child(2),nav{display:none}header{height:auto;min-height:70px;padding:.65rem 5%;gap:.6rem}.logo strong{font-size:1.4rem}.whatsapp{margin-left:auto}.product{grid-template-columns:1fr;gap:1.4rem;padding:1.4rem 5%}h1{font-size:1.55rem}.form-row{grid-template-columns:1fr}.buy{flex-direction:column}footer{flex-direction:column}.zoom-window{display:none!important}}`;

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function page(product) {
  const images = Array.from({length: product.imageCount}, (_, index) => `image-${index + 1}.jpg`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.id,
    brand: {'@type': 'Brand', name: product.brand},
    image: images.map(image => `https://signsandarts.in/${product.slug}/${image}`),
    offers: {
      '@type': 'Offer',
      price: String(product.price),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `https://signsandarts.in/${product.slug}/`
    }
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(product.title)}</title>
  <meta name="description" content="${escapeHtml(product.description)}">
  <link rel="canonical" href="https://signsandarts.in/${product.slug}/">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-PNNB88PBN3"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-PNNB88PBN3');</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>${styles}</style>
</head>
<body>
  <div class="topbar"><span>Pan India Delivery</span><span>${escapeHtml(product.category)}</span><a href="tel:+919392878946">+91 93928 78946</a></div>
  <header><a href="/" class="logo"><strong>Signs <i>&amp;</i> Arts</strong><small>LED SIGN BOARDS - INDIA</small></a><nav><a href="/#products">Products</a><a href="/pixel-led/">Pixel LEDs</a><a href="/#contact">Contact</a></nav><a class="whatsapp" href="https://wa.me/919392878946" target="_blank">WhatsApp</a></header>
  <div class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/#products">${escapeHtml(product.category)}</a><span>/</span>${escapeHtml(product.shortName)}</div>
  <main>
    <section class="product">
      <div>
        <div class="gallery-main">${images.map((image, index) => `<a href="${image}" target="_blank"><img src="${image}" alt="${escapeHtml(product.shortName)} image ${index + 1}" class="${index === 0 ? 'active' : ''}"></a>`).join('')}<div class="zoom-window"></div></div>
        <div class="thumbs">${images.map((image, index) => `<img src="${image}" class="thumb ${index === 0 ? 'active' : ''}" onclick="switchImage(${index})" alt="View ${index + 1}">`).join('')}</div>
      </div>
      <div>
        <div class="badges"><span class="badge">${escapeHtml(product.badge)}</span><span class="badge gold">Ready to Order</span></div>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="lead">${escapeHtml(product.description)}</p>
        <div class="price-box"><small>Price</small><strong>&#8377;${product.price.toLocaleString('en-IN')}</strong></div>
        <ul class="features">${product.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>
        <div class="buy"><button onclick="openCheckout()">Buy Now - &#8377;${product.price.toLocaleString('en-IN')}</button><a href="https://wa.me/919392878946?text=${encodeURIComponent(`Hi, I want to order ${product.name}`)}" target="_blank">WhatsApp Order</a></div>
      </div>
    </section>
    <section class="details"><h2>Product Specifications</h2><table class="specs">${product.specs.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('')}</table></section>
  </main>
  <footer><div><strong>Signs &amp; Arts</strong><br>Ready-made sign boards and practical LED accessories.</div><div><a href="/refund.html">Return Policy</a> &nbsp; <a href="/terms.html">Terms</a> &nbsp; <a href="https://wa.me/919392878946">WhatsApp</a></div></footer>
  <div class="modal-bg" id="checkout"><div class="modal"><button class="close" onclick="closeCheckout()">&times;</button><h2>Complete Your Order</h2><div class="summary" id="summary"></div><div class="toggle"><button id="online" class="active" onclick="setMode('online')">Pay Online</button><button id="cod" class="cod" onclick="setMode('cod')">Cash on Delivery</button></div><div class="cod-note" id="codNote">Pay <strong>&#8377;200 advance</strong> now. A <strong>&#8377;50 COD charge</strong> is added; the balance is paid on delivery.</div><div class="form-row"><label>Full Name *<input id="name"></label><label>Phone Number *<input id="phone" maxlength="10" inputmode="numeric"></label></div><label>Email Address *<input id="email" type="email"></label><label>Delivery Address *<input id="address"></label><div class="form-row"><label>City *<input id="city"></label><label>State *<input id="state"></label></div><label>PIN Code *<input id="pin" maxlength="6" inputmode="numeric"></label><button class="pay" id="pay" onclick="placeOrder()">Pay Securely</button></div></div>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <script>
  var PRODUCT=${JSON.stringify({id: product.id, name: product.name, price: product.price})},mode='online',COD_CHARGE=50,SHIPPING=PRODUCT.price<300?125:0;
  function money(value){return Number(value).toLocaleString('en-IN')}
  function switchImage(index){document.querySelectorAll('.gallery-main img').forEach(function(img,i){img.classList.toggle('active',i===index)});document.querySelectorAll('.thumb').forEach(function(img,i){img.classList.toggle('active',i===index)})}
  function totals(){var online=PRODUCT.price+SHIPPING,cod=online+COD_CHARGE,advance=Math.min(200,cod);return{online:online,cod:cod,advance:advance,remaining:cod-advance}}
  function render(){var t=totals(),html='<div class="row"><span>'+PRODUCT.name+' x1</span><span>&#8377;'+money(PRODUCT.price)+'</span></div>'+(SHIPPING?'<div class="row"><span>Shipping Charge</span><span>&#8377;'+SHIPPING+'</span></div>':'');if(mode==='cod')html+='<div class="row"><span>COD Handling Charge</span><span>&#8377;'+COD_CHARGE+'</span></div><div class="row"><span>Advance payable now</span><span>&#8377;'+t.advance+'</span></div><div class="row"><span>Balance on delivery</span><span>&#8377;'+money(t.remaining)+'</span></div><div class="row total"><span>Total Order Value</span><span>&#8377;'+money(t.cod)+'</span></div>';else html+='<div class="row total"><span>Total Payable</span><span>&#8377;'+money(t.online)+'</span></div>';document.getElementById('summary').innerHTML=html;document.getElementById('pay').innerHTML=mode==='cod'?'Pay &#8377;'+t.advance+' Advance & Place COD Order':'Pay &#8377;'+money(t.online)+' Securely'}
  function setMode(value){mode=value;document.getElementById('online').classList.toggle('active',value==='online');document.getElementById('cod').classList.toggle('active',value==='cod');document.getElementById('codNote').classList.toggle('show',value==='cod');document.getElementById('pay').style.background=value==='cod'?'#e67e22':'#111';render()}
  function openCheckout(){mode='online';setMode('online');document.getElementById('checkout').classList.add('open');document.body.style.overflow='hidden'}
  function closeCheckout(){document.getElementById('checkout').classList.remove('open');document.body.style.overflow=''}
  async function placeOrder(){var fields=['name','phone','email','address','city','state','pin'],data={};fields.forEach(function(id){data[id]=document.getElementById(id).value.trim()});if(fields.some(function(id){return !data[id]})){alert('Please fill all fields.');return}if(!/^\\d{10}$/.test(data.phone)){alert('Enter a valid 10-digit phone number.');return}if(!/^\\S+@\\S+\\.\\S+$/.test(data.email)){alert('Enter a valid email address.');return}if(!/^\\d{6}$/.test(data.pin)){alert('Enter a valid 6-digit PIN code.');return}var t=totals(),isCOD=mode==='cod',payAmount=isCOD?t.advance:t.online,orderTotal=isCOD?t.cod:t.online,orderId='SA-'+Date.now(),orderData={name:data.name,phone:data.phone,email:data.email,address:data.address,city:data.city,state:data.state,pincode:data.pin,items:[{id:PRODUCT.id,name:PRODUCT.name,price:PRODUCT.price,qty:1}],total:orderTotal,productTotal:PRODUCT.price,shippingCharge:SHIPPING,isCOD:isCOD,codAdvance:isCOD?t.advance:0,codCharge:isCOD?COD_CHARGE:0},button=document.getElementById('pay');button.disabled=true;button.textContent='Creating order...';try{var response=await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:payAmount,orderId:orderId,customerName:data.name,customerEmail:data.email,customerPhone:data.phone,isCOD:isCOD})}),payment=await response.json();if(!payment.payment_session_id)throw new Error(payment.error||'Could not create order');Cashfree({mode:'production'}).checkout({paymentSessionId:payment.payment_session_id,redirectTarget:'_modal'}).then(async function(result){if(result.error){alert('Payment failed. Please try again.');button.disabled=false;render();return}var verified=await fetch('/api/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:orderId,orderData:orderData})}).then(function(r){return r.json()});if(verified.success)location.href='/thank-you.html?order_id='+encodeURIComponent(orderId)+'&product='+encodeURIComponent(PRODUCT.name)+'&amount='+orderData.total+(isCOD?'&cod=1':'');else alert('Payment received. Please WhatsApp us with Order ID: '+orderId)})}catch(error){alert('Could not start payment. Please order through WhatsApp.');button.disabled=false;render()}}
  (function(){var wrap=document.querySelector('.gallery-main'),zoom=wrap.querySelector('.zoom-window');wrap.addEventListener('mousemove',function(event){if(matchMedia('(max-width:760px)').matches)return;var img=wrap.querySelector('img.active'),rect=wrap.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*100,y=(event.clientY-rect.top)/rect.height*100;zoom.style.display='block';zoom.style.backgroundImage='url("'+img.src+'")';zoom.style.backgroundSize='220% 220%';zoom.style.backgroundPosition=x+'% '+y+'%'});wrap.addEventListener('mouseleave',function(){zoom.style.display='none'})})();
  </script>
</body>
</html>`;
}

for (const product of products) {
  const destination = path.join(root, product.slug);
  fs.rmSync(destination, {recursive: true, force: true});
  fs.mkdirSync(destination, {recursive: true});
  fs.writeFileSync(path.join(destination, 'index.html'), page(product), 'utf8');
  for (let index = 1; index <= product.imageCount; index += 1) {
    fs.copyFileSync(
      path.join(assetRoot, product.sourceFolder, `image-${index}.jpg`),
      path.join(destination, `image-${index}.jpg`)
    );
  }
}

fs.writeFileSync(path.join(root, 'marketplace-products.json'), JSON.stringify(products, null, 2), 'utf8');
console.log(`Generated ${products.length} marketplace products.`);
