(function () {
  var knownCategories = {
    medical: true,
    xerox: true,
    dental: true,
    optical: true,
    bar: true,
    tattoo: true,
    spa: true,
    decor: true,
    accessories: true,
    retail: true,
    custom: true,
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'custom';
  }

  function money(value) {
    return Number(value || 0).toLocaleString('en-IN');
  }

  function ensureFilter(categoryKey, categoryLabel) {
    if (knownCategories[categoryKey]) return;
    var row = document.querySelector('#products .frow');
    if (!row || row.querySelector('[data-admin-category="' + categoryKey + '"]')) return;
    var button = document.createElement('button');
    button.className = 'fb';
    button.type = 'button';
    button.dataset.adminCategory = categoryKey;
    button.textContent = categoryLabel;
    button.addEventListener('click', function () {
      if (typeof window.fp === 'function') window.fp(categoryKey, button);
    });
    row.appendChild(button);
  }

  function createTags(product) {
    var tags = Array.isArray(product.tags) && product.tags.length
      ? product.tags
      : (product.features || []).slice(0, 4);
    return tags.slice(0, 5).map(function (tag) {
      return '<span class="stg">' + escapeHtml(tag) + '</span>';
    }).join('');
  }

  function createCard(product) {
    var categoryKey = product.category_key || product.categoryKey || slugify(product.category);
    var image = Array.isArray(product.images) && product.images.length ? product.images[0] : '';
    var detailUrl = '/product/?slug=' + encodeURIComponent(product.slug);
    var card = document.createElement('div');
    card.className = 'pc show';
    card.dataset.cat = categoryKey;
    card.id = 'prod-admin-' + product.slug;

    var visual = image
      ? '<a href="' + detailUrl + '" class="pgallery" style="display:block;">' +
          '<img loading="lazy" src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.name) + '" class="active">' +
          '<div class="bdg bnew" style="position:absolute;top:10px;left:10px;">' + escapeHtml(product.badge || 'New') + '</div>' +
        '</a>'
      : '<a href="' + detailUrl + '" class="pi"><div class="ico">+</div><b>' + escapeHtml(product.name) + '</b><div class="bdg bnew">' + escapeHtml(product.badge || 'New') + '</div></a>';

    card.innerHTML = visual +
      '<div class="pb">' +
        '<div class="pct">' + escapeHtml(product.category || 'Product') + '</div>' +
        '<a href="' + detailUrl + '" style="text-decoration:none;"><div class="pnm" style="color:#111;">' + escapeHtml(product.name) + '</div></a>' +
        '<div class="pds">' + escapeHtml(product.description || '') + '</div>' +
        '<div class="psps">' + createTags(product) + '</div>' +
      '</div>' +
      '<div style="padding:.5rem 1.1rem 0;">' +
        '<a href="' + detailUrl + '" style="display:block;text-align:center;font-size:.72rem;font-weight:700;color:#777;letter-spacing:1px;padding:.4rem;border:1px solid #e8e8e8;border-radius:3px;">View Full Details -&gt;</a>' +
      '</div>' +
      '<div class="pf">' +
        '<div class="ppr">&#8377;' + money(product.price) + '</div>' +
        '<div class="pbts"></div>' +
      '</div>';

    var buttons = card.querySelector('.pbts');
    var cartButton = document.createElement('button');
    cartButton.className = 'batc';
    cartButton.type = 'button';
    cartButton.innerHTML = '&#43; Add to Cart';
    cartButton.addEventListener('click', function () {
      if (typeof window.addToCart === 'function') {
        window.addToCart({
          id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          qty: 1,
        });
      } else {
        window.location.href = detailUrl;
      }
    });
    buttons.appendChild(cartButton);

    var whatsapp = document.createElement('a');
    whatsapp.className = 'bwa';
    whatsapp.href = 'https://wa.me/919392878946?text=' + encodeURIComponent('Hi, I want more info about ' + product.name);
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener';
    whatsapp.innerHTML = '&#128242;';
    buttons.appendChild(whatsapp);
    return card;
  }

  function render(products) {
    var grid = document.getElementById('pg');
    if (!grid || !Array.isArray(products) || !products.length) return;
    var marker = grid.querySelector('[data-cat="custom"]');
    products.forEach(function (product) {
      if (!product || !product.slug || document.getElementById('prod-admin-' + product.slug)) return;
      var categoryKey = product.category_key || product.categoryKey || slugify(product.category);
      ensureFilter(categoryKey, product.category || categoryKey);
      grid.insertBefore(createCard(product), marker || null);
    });
  }

  async function load() {
    try {
      var response = await fetch('/api/products');
      if (!response.ok) return;
      var data = await response.json();
      render(data.products || []);
    } catch (error) {
      return;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
}());
