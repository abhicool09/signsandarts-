(function () {
  var state = {
    token: window.localStorage.getItem('sa_admin_token') || '',
    products: [],
    selectedId: '',
    slugTouched: false,
  };

  var categoryLabels = {
    medical: 'Medical / Pharmacy',
    clinic: 'Clinic',
    xerox: 'Xerox / Stationery',
    dental: 'Dental Clinic',
    optical: 'Optical Clinic',
    bar: 'Bar & Restaurant',
    tattoo: 'Tattoo Studio',
    spa: 'Spa / Salon',
    decor: 'Home Decor',
    accessories: 'LED Accessories',
    retail: 'Retail / Pan Shop',
    custom: 'Custom / Any Shop',
  };

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

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90);
  }

  function money(value) {
    return 'Rs ' + Number(value || 0).toLocaleString('en-IN');
  }

  function lines(value) {
    return String(value || '')
      .split(/\r?\n/)
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function splitTags(value) {
    return String(value || '')
      .split(/\r?\n|,/)
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function parseSpecs(value) {
    return lines(value).map(function (line) {
      var index = line.indexOf(':');
      if (index === -1) return null;
      var label = line.slice(0, index).trim();
      var detail = line.slice(index + 1).trim();
      return label && detail ? [label, detail] : null;
    }).filter(Boolean);
  }

  function formatSpecs(specs) {
    return (Array.isArray(specs) ? specs : []).map(function (item) {
      if (Array.isArray(item)) return item[0] + ': ' + item[1];
      return (item.label || '') + ': ' + (item.value || '');
    }).filter(function (line) { return line.replace(':', '').trim(); }).join('\n');
  }

  function setNotice(target, message, type) {
    var node = el(target);
    node.textContent = message || '';
    node.className = 'notice' + (type ? ' ' + type : '');
  }

  async function adminFetch(options) {
    var response = await fetch('/api/admin-products', Object.assign({
      headers: {
        Authorization: 'Bearer ' + state.token,
        'Content-Type': 'application/json',
      },
    }, options || {}));
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || 'Admin request failed');
    return data;
  }

  function readFileBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var value = String(reader.result || '');
        resolve(value.replace(/^data:[^,]+,/, ''));
      };
      reader.onerror = function () { reject(reader.error || new Error('Could not read image')); };
      reader.readAsDataURL(file);
    });
  }

  function defaultProduct() {
    return {
      id: '',
      slug: '',
      status: 'draft',
      name: '',
      short_name: '',
      title: '',
      description: '',
      category_key: 'custom',
      category: 'Custom / Any Shop',
      price: 0,
      brand: 'Signs and Arts',
      badge: 'New',
      images: [],
      features: [],
      specs: [],
      tags: [],
    };
  }

  function activeProduct() {
    return state.products.find(function (product) { return product.id === state.selectedId; }) || defaultProduct();
  }

  function formToProduct() {
    return {
      id: el('productId').value.trim(),
      slug: slugify(el('slug').value || el('name').value),
      status: el('status').value,
      name: el('name').value.trim(),
      short_name: el('name').value.trim(),
      title: el('title').value.trim(),
      description: el('description').value.trim(),
      category_key: el('categoryKey').value,
      category: el('category').value.trim() || categoryLabels[el('categoryKey').value] || 'Custom / Any Shop',
      price: Number(el('price').value || 0),
      brand: el('brand').value.trim() || 'Signs and Arts',
      badge: el('badge').value.trim() || 'New',
      images: lines(el('images').value),
      features: lines(el('features').value),
      specs: parseSpecs(el('specs').value),
      tags: splitTags(el('tags').value),
    };
  }

  function productToForm(product) {
    state.slugTouched = Boolean(product.slug);
    el('productId').value = product.id || '';
    el('name').value = product.name || '';
    el('slug').value = product.slug || '';
    el('status').value = product.status || 'draft';
    el('price').value = Number(product.price || 0);
    el('categoryKey').value = product.category_key || product.categoryKey || 'custom';
    el('category').value = product.category || categoryLabels[el('categoryKey').value] || 'Custom / Any Shop';
    el('badge').value = product.badge || 'New';
    el('brand').value = product.brand || 'Signs and Arts';
    el('title').value = product.title || product.name || '';
    el('description').value = product.description || '';
    el('images').value = (product.images || []).join('\n');
    el('features').value = (product.features || []).join('\n');
    el('specs').value = formatSpecs(product.specs || []);
    el('tags').value = (product.tags || []).join(', ');
    updatePreview();
  }

  function renderList() {
    var query = el('searchInput').value.trim().toLowerCase();
    var products = state.products.filter(function (product) {
      return !query || [product.name, product.slug, product.category, product.status].join(' ').toLowerCase().includes(query);
    });
    var list = el('productList');
    list.innerHTML = products.map(function (product) {
      var status = product.status === 'published' ? 'published' : 'draft';
      return '<button class="product-item ' + (product.id === state.selectedId ? 'active' : '') + '" data-id="' + escapeHtml(product.id) + '" type="button">' +
        '<strong>' + escapeHtml(product.name || 'Untitled product') + '</strong>' +
        '<div class="product-meta"><span>' + escapeHtml(product.category || 'Custom') + '</span><span class="pill ' + status + '">' + status + '</span></div>' +
        '<div class="product-meta"><span>' + escapeHtml(product.slug || '') + '</span><span>' + money(product.price) + '</span></div>' +
      '</button>';
    }).join('');
    list.querySelectorAll('.product-item').forEach(function (button) {
      button.addEventListener('click', function () { selectProduct(button.dataset.id); });
    });

    var published = state.products.filter(function (product) { return product.status === 'published'; }).length;
    el('totalCount').textContent = state.products.length;
    el('publishedCount').textContent = published;
    el('draftCount').textContent = state.products.length - published;
  }

  function selectProduct(id) {
    state.selectedId = id || '';
    productToForm(activeProduct());
    renderList();
  }

  async function loadProducts() {
    setNotice('notice', 'Loading products...', '');
    var data = await adminFetch({ method: 'GET' });
    state.products = data.products || [];
    if (!state.selectedId && state.products.length) state.selectedId = state.products[0].id;
    if (state.selectedId && !state.products.some(function (product) { return product.id === state.selectedId; })) {
      state.selectedId = state.products[0] ? state.products[0].id : '';
    }
    productToForm(activeProduct());
    renderList();
    setNotice('notice', 'Products loaded.', 'success');
  }

  async function saveProduct(action) {
    var product = formToProduct();
    if (!product.name) {
      setNotice('notice', 'Product name is required.', 'error');
      return;
    }
    if (!product.slug) {
      setNotice('notice', 'URL slug is required.', 'error');
      return;
    }
    setNotice('notice', action === 'publish' ? 'Publishing product...' : 'Saving product...', '');
    var data = await adminFetch({
      method: 'POST',
      body: JSON.stringify({ action: action || 'save', product: product }),
    });
    var saved = data.product;
    var index = state.products.findIndex(function (item) { return item.id === saved.id; });
    if (index === -1) state.products.unshift(saved);
    else state.products[index] = saved;
    state.selectedId = saved.id;
    productToForm(saved);
    renderList();
    setNotice('notice', saved.status === 'published' ? 'Product published.' : 'Product saved.', 'success');
  }

  async function deleteCurrentProduct() {
    var product = formToProduct();
    if (!product.id) {
      selectProduct('');
      setNotice('notice', 'Draft cleared.', 'success');
      return;
    }
    if (!window.confirm('Delete this product?')) return;
    setNotice('notice', 'Deleting product...', '');
    await adminFetch({
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id: product.id }),
    });
    state.products = state.products.filter(function (item) { return item.id !== product.id; });
    state.selectedId = state.products[0] ? state.products[0].id : '';
    productToForm(activeProduct());
    renderList();
    setNotice('notice', 'Product deleted.', 'success');
  }

  async function uploadImages() {
    var files = Array.from(el('imageUpload').files || []);
    if (!files.length) {
      setNotice('notice', 'Choose one or more images to upload.', 'error');
      return;
    }
    var button = el('uploadImagesButton');
    button.disabled = true;
    setNotice('notice', 'Uploading images...', '');
    try {
      var uploaded = [];
      for (var index = 0; index < files.length; index += 1) {
        var file = files[index];
        if (file.size > 3 * 1024 * 1024) throw new Error(file.name + ' is larger than 3MB');
        var base64 = await readFileBase64(file);
        var data = await adminFetch({
          method: 'POST',
          body: JSON.stringify({
            action: 'upload-image',
            file: {
              name: file.name,
              type: file.type,
              base64: base64,
            },
          }),
        });
        uploaded.push(data.url);
      }
      var existing = lines(el('images').value);
      el('images').value = existing.concat(uploaded).join('\n');
      el('imageUpload').value = '';
      updatePreview();
      setNotice('notice', uploaded.length + ' image' + (uploaded.length === 1 ? '' : 's') + ' uploaded.', 'success');
    } finally {
      button.disabled = false;
    }
  }

  function updatePreview() {
    var product = formToProduct();
    var image = product.images[0] || '';
    el('editorStatus').textContent = product.status === 'published' ? 'Published' : 'Draft';
    el('editorTitle').textContent = product.name || 'New Product';
    el('previewButton').href = '/product/?slug=' + encodeURIComponent(product.slug || '');
    el('previewCategory').textContent = product.category;
    el('previewName').textContent = product.name || 'New Product';
    el('previewDescription').textContent = product.description || '';
    el('previewPrice').textContent = money(product.price);
    el('previewImage').innerHTML = image
      ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.name || 'Product image') + '">'
      : '';
  }

  function showWorkspace() {
    el('loginPanel').classList.add('is-hidden');
    el('workspace').classList.remove('is-hidden');
  }

  function showLogin() {
    el('workspace').classList.add('is-hidden');
    el('loginPanel').classList.remove('is-hidden');
  }

  async function login() {
    state.token = el('adminToken').value.trim();
    if (!state.token) {
      setNotice('loginNotice', 'Token is required.', 'error');
      return;
    }
    window.localStorage.setItem('sa_admin_token', state.token);
    showWorkspace();
    try {
      await loadProducts();
      setNotice('loginNotice', '', '');
    } catch (error) {
      showLogin();
      setNotice('loginNotice', error.message, 'error');
    }
  }

  function signOut() {
    state.token = '';
    state.products = [];
    state.selectedId = '';
    window.localStorage.removeItem('sa_admin_token');
    el('adminToken').value = '';
    showLogin();
  }

  function bind() {
    el('loginButton').addEventListener('click', login);
    el('adminToken').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') login();
    });
    el('refreshButton').addEventListener('click', function () {
      loadProducts().catch(function (error) { setNotice('notice', error.message, 'error'); });
    });
    el('newButton').addEventListener('click', function () {
      state.selectedId = '';
      productToForm(defaultProduct());
      state.slugTouched = false;
      renderList();
      setNotice('notice', 'New draft ready.', 'success');
    });
    el('saveButton').addEventListener('click', function () {
      saveProduct('save').catch(function (error) { setNotice('notice', error.message, 'error'); });
    });
    el('publishButton').addEventListener('click', function () {
      saveProduct('publish').catch(function (error) { setNotice('notice', error.message, 'error'); });
    });
    el('unpublishButton').addEventListener('click', function () {
      saveProduct('unpublish').catch(function (error) { setNotice('notice', error.message, 'error'); });
    });
    el('deleteButton').addEventListener('click', function () {
      deleteCurrentProduct().catch(function (error) { setNotice('notice', error.message, 'error'); });
    });
    el('uploadImagesButton').addEventListener('click', function () {
      uploadImages().catch(function (error) { setNotice('notice', error.message, 'error'); });
    });
    el('signOutButton').addEventListener('click', signOut);
    el('searchInput').addEventListener('input', renderList);
    el('slug').addEventListener('input', function () {
      state.slugTouched = true;
      el('slug').value = slugify(el('slug').value);
      updatePreview();
    });
    el('name').addEventListener('input', function () {
      if (!state.slugTouched) el('slug').value = slugify(el('name').value);
      if (!el('title').value.trim()) el('title').value = el('name').value;
      updatePreview();
    });
    el('categoryKey').addEventListener('change', function () {
      el('category').value = categoryLabels[el('categoryKey').value] || el('category').value;
      updatePreview();
    });
    el('productForm').addEventListener('input', updatePreview);
    el('productForm').addEventListener('change', updatePreview);
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    if (state.token) {
      el('adminToken').value = state.token;
      showWorkspace();
      loadProducts().catch(function (error) {
        showLogin();
        setNotice('loginNotice', error.message, 'error');
      });
    } else {
      productToForm(defaultProduct());
      showLogin();
    }
  });
}());
