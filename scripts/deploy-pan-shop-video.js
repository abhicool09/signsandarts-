const fs = require('fs');
const path = require('path');

const targetRoot = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const filePath = path.join(targetRoot, 'pan-shop-led-sign-board', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

if (!html.includes('.video-modal{')) {
  html = html.replace(
    '.pay:disabled{opacity:.6}',
    '.pay:disabled{opacity:.6}.video-button{width:100%;margin-top:.65rem;border:1px solid #111;background:#fff;color:#111;padding:.8rem;border-radius:4px;font-weight:800;cursor:pointer}.video-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:110;align-items:center;justify-content:center;padding:1rem}.video-modal.open{display:flex}.video-box{width:min(820px,100%);position:relative}.video-box iframe{display:block;width:100%;aspect-ratio:16/9;border:0;background:#000}.video-close{position:absolute;right:0;top:-42px;border:0;background:transparent;color:#fff;font-size:1.8rem;cursor:pointer}'
  );
}

if (!html.includes('onclick="openProductVideo()"')) {
  html = html.replace(
    '<div class="buy"><button onclick="openCheckout()">Buy Now - &#8377;2,475</button><a href=',
    '<div class="buy"><button onclick="openCheckout()">Buy Now - &#8377;2,475</button><a href='
  );
  html = html.replace(
    '</a></div>\n      </div>\n    </section>',
    '</a></div><button class="video-button" type="button" onclick="openProductVideo()">&#9654; Watch Product Video</button>\n      </div>\n    </section>'
  );
}

if (!html.includes('id="productVideoModal"')) {
  html = html.replace(
    '  <div class="modal-bg" id="checkout">',
    '  <div class="video-modal" id="productVideoModal" onclick="closeProductVideo(event)"><div class="video-box"><button class="video-close" type="button" onclick="closeProductVideo()">&times;</button><iframe id="productVideoFrame" title="PAN Shop LED Sign Board product video" allow="autoplay; encrypted-media" allowfullscreen></iframe></div></div>\n  <div class="modal-bg" id="checkout">'
  );
}

if (!html.includes("function openProductVideo()")) {
  html = html.replace(
    "  function money(value){return Number(value).toLocaleString('en-IN')}",
    "  function money(value){return Number(value).toLocaleString('en-IN')}\n  function openProductVideo(){document.getElementById('productVideoFrame').src='https://www.youtube.com/embed/e16cSGi0CWs?autoplay=1&rel=0';document.getElementById('productVideoModal').classList.add('open');document.body.style.overflow='hidden'}\n  function closeProductVideo(event){if(event&&event.target!==document.getElementById('productVideoModal'))return;document.getElementById('productVideoFrame').src='';document.getElementById('productVideoModal').classList.remove('open');document.body.style.overflow=''}"
  );
}

fs.writeFileSync(filePath, html, 'utf8');
console.log(`Added PAN Shop video to ${filePath}`);
