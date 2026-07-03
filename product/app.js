(function () {
  var product = null;
  var qty = 1;
  var mode = 'online';
  var COD_CHARGE = 50;
  var LOW_PRICE_SHIPPING = 125;

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function money(value) {
    return 'Rs ' + Number(value || 0).toLocaleString('en-IN');
  }

  function currentSlug() {
    var params = new URLSearchParams(window.location.search);
    var querySlug = params.get('slug');
    if (querySlug) return querySlug;
    var parts = window.location.pathname.split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    return last === 'product' ? '' : last;
  }

  function setImage(src, index) {
    el('galleryMain').innerHTML = src
      ? '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(product.name) + ' image ' + (index + 1) + '">'
      : '<div class="empty-image">Image coming soon</div>';
    Array.from(el('thumbs').querySelectorAll('.thumb')).forEach(function (thumb, thumbIndex) {
      thumb.classList.toggle('active', thumbIndex === index);
    });
  }

  function renderImages(images) {
    if (!images.length) {
      setImage('', 0);
      el('thumbs').innerHTML = '';
      return;
    }
    el('thumbs').innerHTML = images.map(function (image, index) {
      return '<img src="' + escapeHtml(image) + '" class="thumb ' + (index === 0 ? 'active' : '') + '" alt="View ' + (index + 1) + '" data-index="' + index + '">';
    }).join('');
    el('thumbs').querySelectorAll('.thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        setImage(images[Number(thumb.dataset.index)], Number(thumb.dataset.index));
      });
    });
    setImage(images[0], 0);
  }

  function renderProduct() {
    var images = Array.isArray(product.images) ? product.images : [];
    document.title = (product.title || product.name) + ' | Signs and Arts';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', product.description || product.name);
    el('crumb').textContent = product.shortName || product.name;
    el('badge').textContent = product.badge || 'New';
    el('category').textContent = product.category || 'Product';
    el('name').textContent = product.name;
    el('description').textContent = product.description || '';
    el('price').textContent = money(product.price);
    el('features').innerHTML = (product.features || []).map(function (feature) {
      return '<li>' + escapeHtml(feature) + '</li>';
    }).join('');
    el('specs').innerHTML = (product.specs || []).map(function (spec) {
      var label = Array.isArray(spec) ? spec[0] : spec.label;
      var value = Array.isArray(spec) ? spec[1] : spec.value;
      return '<tr><td>' + escapeHtml(label) + '</td><td>' + escapeHtml(value) + '</td></tr>';
    }).join('');
    el('waButton').href = 'https://wa.me/919392878946?text=' + encodeURIComponent('Hi, I want more info about ' + product.name);
    renderImages(images);
    el('loading').classList.add('is-hidden');
    el('productView').classList.remove('is-hidden');
    if ((product.specs || []).length) el('details').classList.remove('is-hidden');
  }

  function totals() {
    var subtotal = Number(product.price || 0) * qty;
    var shipping = subtotal > 0 && subtotal < 300 ? LOW_PRICE_SHIPPING : 0;
    var online = subtotal + shipping;
    var cod = online + COD_CHARGE;
    var advance = Math.min(200, cod);
    return {
      subtotal: subtotal,
      shipping: shipping,
      online: online,
      cod: cod,
      advance: advance,
      remaining: cod - advance,
    };
  }

  function renderOrderSummary() {
    var total = totals();
    var html = '<div class="row"><span>' + escapeHtml(product.name) + ' x' + qty + '</span><span>' + money(total.subtotal) + '</span></div>';
    if (total.shipping) html += '<div class="row"><span>Shipping Charge</span><span>' + money(total.shipping) + '</span></div>';
    if (mode === 'cod') {
      html += '<div class="row"><span>COD Handling Charge</span><span>' + money(COD_CHARGE) + '</span></div>' +
        '<div class="row"><span>Advance payable now</span><span>' + money(total.advance) + '</span></div>' +
        '<div class="row"><span>Balance on delivery</span><span>' + money(total.remaining) + '</span></div>' +
        '<div class="row total"><span>Total Order Value</span><span>' + money(total.cod) + '</span></div>';
      el('payButton').textContent = 'Pay ' + money(total.advance) + ' Advance';
    } else {
      html += '<div class="row total"><span>Total Payable</span><span>' + money(total.online) + '</span></div>';
      el('payButton').textContent = 'Pay ' + money(total.online) + ' Securely';
    }
    el('orderSummary').innerHTML = html;
  }

  function setMode(nextMode) {
    mode = nextMode;
    el('onlineMode').classList.toggle('active', mode === 'online');
    el('codMode').classList.toggle('active', mode === 'cod');
    el('codNote').classList.toggle('show', mode === 'cod');
    el('payButton').style.background = mode === 'cod' ? '#e67e22' : '#111';
    renderOrderSummary();
  }

  function openCheckout() {
    setMode('online');
    el('checkout').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() {
    el('checkout').classList.remove('open');
    document.body.style.overflow = '';
  }

  function cleanQty() {
    qty = Math.max(1, Math.min(99, Number.parseInt(el('qty').value, 10) || 1));
    el('qty').value = qty;
  }

  function formData() {
    return {
      name: el('customerName').value.trim(),
      phone: el('customerPhone').value.trim(),
      email: el('customerEmail').value.trim(),
      address: el('customerAddress').value.trim(),
      city: el('customerCity').value.trim(),
      state: el('customerState').value.trim(),
      pincode: el('customerPin').value.trim(),
    };
  }

  function validate(data) {
    if (!data.name || !data.phone || !data.email || !data.address || !data.city || !data.state || !data.pincode) {
      alert('Please fill all fields.');
      return false;
    }
    if (!/^\d{10}$/.test(data.phone)) {
      alert('Enter a valid 10-digit phone number.');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      alert('Enter a valid email address.');
      return false;
    }
    if (!/^\d{6}$/.test(data.pincode)) {
      alert('Enter a valid 6-digit PIN code.');
      return false;
    }
    return true;
  }

  function loadCashfree() {
    if (window.Cashfree) return Promise.resolve(window.Cashfree);
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = function () { resolve(window.Cashfree); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function verifyPaymentWithRetry(orderId, attempts) {
    var lastData = null;
    for (var attempt = 0; attempt < attempts; attempt += 1) {
      var verifyRes = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId }),
      });
      var verifyData = await verifyRes.json();
      lastData = verifyData;
      if (verifyRes.ok && verifyData.success) return verifyData;
      var retryable = verifyRes.status === 400 && /not successful|verification failed/i.test(String(verifyData.error || ''));
      if (!retryable || attempt === attempts - 1) break;
      await new Promise(function (resolve) { setTimeout(resolve, 4000); });
    }
    return lastData || { error: 'Verification failed' };
  }

  async function placeOrder() {
    cleanQty();
    var customer = formData();
    if (!validate(customer)) return;

    var total = totals();
    var isCOD = mode === 'cod';
    var orderData = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      items: [{ id: product.id, name: product.name, price: product.price, qty: qty }],
      total: isCOD ? total.cod : total.online,
      productTotal: total.subtotal,
      shippingCharge: total.shipping,
      isCOD: isCOD,
      codAdvance: isCOD ? total.advance : 0,
      codCharge: isCOD ? COD_CHARGE : 0,
    };

    var button = el('payButton');
    button.disabled = true;
    button.textContent = 'Creating order...';
    try {
      var response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderData: orderData }),
      });
      var payment = await response.json();
      if (!response.ok || !payment.payment_session_id) {
        throw new Error(payment.error || 'Could not create order');
      }
      Object.assign(orderData, payment.order_data || {});
      var Cashfree = await loadCashfree();
      var cashfree = await Cashfree({ mode: 'production' });
      cashfree.checkout({
        paymentSessionId: payment.payment_session_id,
        redirectTarget: '_modal',
      }).then(async function (result) {
        if (result.error) {
          alert('Payment failed. Please try again.');
          button.disabled = false;
          renderOrderSummary();
          return;
        }
        var verified = await verifyPaymentWithRetry(payment.order_id, 8);
        if (verified.success) {
          window.location.href = '/thank-you.html?order_id=' + encodeURIComponent(payment.order_id) +
            '&product=' + encodeURIComponent(product.name) +
            '&amount=' + encodeURIComponent(orderData.total) +
            (isCOD ? '&cod=1' : '');
        } else {
          alert('Payment received. Please WhatsApp us with Order ID: ' + payment.order_id);
        }
      });
    } catch (error) {
      alert(error.message + '. Please order through WhatsApp.');
      button.disabled = false;
      renderOrderSummary();
    }
  }

  async function loadProduct() {
    var slug = currentSlug();
    if (!slug) {
      el('loading').textContent = 'Product not found.';
      return;
    }
    try {
      var response = await fetch('/api/products?slug=' + encodeURIComponent(slug));
      var data = await response.json();
      if (!response.ok || !data.product) throw new Error(data.error || 'Product not found');
      product = data.product;
      renderProduct();
    } catch (error) {
      el('loading').textContent = 'Product is unavailable.';
    }
  }

  function bind() {
    el('buyButton').addEventListener('click', openCheckout);
    el('closeCheckout').addEventListener('click', closeCheckout);
    el('onlineMode').addEventListener('click', function () { setMode('online'); });
    el('codMode').addEventListener('click', function () { setMode('cod'); });
    el('payButton').addEventListener('click', placeOrder);
    el('minusQty').addEventListener('click', function () {
      qty = Math.max(1, qty - 1);
      el('qty').value = qty;
    });
    el('plusQty').addEventListener('click', function () {
      qty = Math.min(99, qty + 1);
      el('qty').value = qty;
    });
    el('qty').addEventListener('input', cleanQty);
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    loadProduct();
  });
}());
