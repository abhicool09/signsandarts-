const PRODUCT_TABLE = 'admin_products';
const PRODUCT_IMAGE_BUCKET = 'product-images';
const PRODUCT_STATUSES = new Set(['draft', 'published']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase product storage is not configured');
  return { url: url.replace(/\/$/, ''), key };
}

function headers(key, prefer) {
  const result = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
  if (prefer) result.Prefer = prefer;
  return result;
}

function request(url, options = {}) {
  return fetch(url, Object.assign({}, options, {
    signal: AbortSignal.timeout(8000),
  }));
}

async function responseJson(response, operation) {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }
  if (!response.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
    throw new Error(`${operation} failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return data;
}

async function supabase(pathname, options = {}, operation = 'Product request') {
  const { url, key } = config();
  const response = await request(`${url}/rest/v1/${pathname}`, Object.assign({}, options, {
    headers: Object.assign(headers(key, options.prefer), options.headers || {}),
  }));
  return responseJson(response, operation);
}

function storageHeaders(key, contentType) {
  const result = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
  if (contentType) result['Content-Type'] = contentType;
  return result;
}

function text(value, field, maxLength, required = false) {
  const result = String(value == null ? '' : value).trim();
  if (required && !result) throw new Error(`${field} is required`);
  if (result.length > maxLength) throw new Error(`${field} is too long`);
  return result;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function cleanId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 110);
}

function stringList(value, maxItems = 20, maxLength = 220) {
  const source = Array.isArray(value)
    ? value
    : String(value == null ? '' : value).split(/\r?\n|,/);
  return source
    .map(item => text(item, 'List item', maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function imageList(value) {
  const source = Array.isArray(value)
    ? value
    : String(value == null ? '' : value).split(/\r?\n/);
  return source
    .map(item => text(item, 'Image URL', 1200))
    .filter(Boolean)
    .slice(0, 12);
}

function specList(value) {
  const source = Array.isArray(value)
    ? value
    : String(value == null ? '' : value).split(/\r?\n/).map(line => {
        const index = line.indexOf(':');
        return index === -1
          ? [line, '']
          : [line.slice(0, index), line.slice(index + 1)];
      });

  return source.map(item => {
    const label = Array.isArray(item) ? item[0] : item && item.label;
    const detail = Array.isArray(item) ? item[1] : item && item.value;
    return [
      text(label, 'Specification label', 100),
      text(detail, 'Specification value', 400),
    ];
  }).filter(([label, detail]) => label && detail).slice(0, 30);
}

function normalizeProduct(input, forcedStatus) {
  const product = input && typeof input === 'object' ? input : {};
  const slug = slugify(product.slug || product.name);
  if (!slug) throw new Error('Product slug is required');

  let id = cleanId(product.id || `admin-${slug}`);
  if (!id) id = `admin-${slug}`;
  if (!id.startsWith('admin-')) id = `admin-${id}`;

  const status = forcedStatus || product.status || 'draft';
  if (!PRODUCT_STATUSES.has(status)) throw new Error('Product status is invalid');

  const price = Number(product.price || 0);
  if (!Number.isFinite(price) || price < 0) throw new Error('Product price is invalid');
  if (status === 'published' && price <= 0) throw new Error('Published products need a price');

  const now = new Date().toISOString();
  const name = text(product.name, 'Product name', 180, true);
  const description = text(product.description, 'Product description', 1200);
  if (status === 'published' && !description) throw new Error('Published products need a description');

  return {
    id,
    slug,
    status,
    name,
    short_name: text(product.short_name || product.shortName || name, 'Short name', 120),
    title: text(product.title || name, 'SEO title', 180),
    description,
    category_key: slugify(product.category_key || product.categoryKey || product.category || 'custom') || 'custom',
    category: text(product.category || product.categoryLabel || 'Custom / Any Shop', 'Category', 120),
    price: Math.round(price),
    brand: text(product.brand || 'Signs and Arts', 'Brand', 120),
    badge: text(product.badge || (status === 'published' ? 'New' : 'Draft'), 'Badge', 80),
    images: imageList(product.images),
    features: stringList(product.features, 18, 220),
    tags: stringList(product.tags, 12, 80),
    specs: specList(product.specs),
    published_at: status === 'published'
      ? (product.published_at || product.publishedAt || now)
      : null,
    updated_at: now,
  };
}

function publicProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    name: row.name,
    short_name: row.short_name || row.name,
    shortName: row.short_name || row.name,
    title: row.title || row.name,
    description: row.description || '',
    category_key: row.category_key || 'custom',
    categoryKey: row.category_key || 'custom',
    category: row.category || 'Custom / Any Shop',
    price: Number(row.price || 0),
    brand: row.brand || 'Signs and Arts',
    badge: row.badge || '',
    images: Array.isArray(row.images) ? row.images : [],
    features: Array.isArray(row.features) ? row.features : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    specs: Array.isArray(row.specs) ? row.specs : [],
    published_at: row.published_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

async function listProducts(includeDrafts = false) {
  const query = includeDrafts
    ? `${PRODUCT_TABLE}?select=*&order=updated_at.desc`
    : `${PRODUCT_TABLE}?select=*&status=eq.published&order=published_at.desc.nullslast`;
  const rows = await supabase(query, {}, 'List products');
  return Array.isArray(rows) ? rows.map(publicProduct) : [];
}

async function getProductBySlug(slug, includeDrafts = false) {
  const cleanSlug = slugify(slug);
  if (!cleanSlug) return null;
  let query = `${PRODUCT_TABLE}?select=*&slug=eq.${encodeURIComponent(cleanSlug)}&limit=1`;
  if (!includeDrafts) query += '&status=eq.published';
  const rows = await supabase(query, {}, 'Load product');
  return Array.isArray(rows) && rows.length ? publicProduct(rows[0]) : null;
}

async function loadPublishedProductsByIds(ids) {
  const cleanIds = Array.from(new Set((ids || []).map(cleanId).filter(Boolean)));
  if (!cleanIds.length) return new Map();
  const filter = cleanIds.join(',');
  const query = `${PRODUCT_TABLE}?select=*&status=eq.published&id=in.(${filter})`;
  const rows = await supabase(query, {}, 'Load checkout products');
  return new Map((Array.isArray(rows) ? rows : []).map(row => {
    const product = publicProduct(row);
    return [product.id, product];
  }));
}

async function saveProduct(input, forcedStatus) {
  const row = normalizeProduct(input, forcedStatus);
  const rows = await supabase(
    `${PRODUCT_TABLE}?on_conflict=id`,
    {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: JSON.stringify(row),
    },
    'Save product'
  );
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Product was not saved');
  return publicProduct(rows[0]);
}

async function deleteProduct(id) {
  const clean = cleanId(id);
  if (!clean) throw new Error('Product ID is required');
  await supabase(
    `${PRODUCT_TABLE}?id=eq.${encodeURIComponent(clean)}`,
    { method: 'DELETE', prefer: 'return=minimal' },
    'Delete product'
  );
}

function cleanFilename(value) {
  const original = String(value || 'product-image.webp').toLowerCase();
  const extensionMatch = original.match(/\.(jpe?g|png|webp)$/);
  const extension = extensionMatch ? extensionMatch[0] : '.webp';
  const stem = original
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'product-image';
  return `${stem}${extension}`;
}

async function ensureImageBucket() {
  const { url, key } = config();
  const bucketUrl = `${url}/storage/v1/bucket/${PRODUCT_IMAGE_BUCKET}`;
  const existing = await request(bucketUrl, { headers: storageHeaders(key) });
  if (existing.ok) {
    const bucket = await responseJson(existing, 'Check image bucket');
    if (bucket && bucket.public === false) {
      const updated = await request(bucketUrl, {
        method: 'PUT',
        headers: storageHeaders(key, 'application/json'),
        body: JSON.stringify({
          public: true,
          file_size_limit: MAX_IMAGE_BYTES,
          allowed_mime_types: Array.from(IMAGE_TYPES),
        }),
      });
      await responseJson(updated, 'Update image bucket');
    }
    return;
  }
  if (existing.status !== 404) {
    await responseJson(existing, 'Check image bucket');
    return;
  }
  const created = await request(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: storageHeaders(key, 'application/json'),
    body: JSON.stringify({
      id: PRODUCT_IMAGE_BUCKET,
      name: PRODUCT_IMAGE_BUCKET,
      public: true,
      file_size_limit: MAX_IMAGE_BYTES,
      allowed_mime_types: Array.from(IMAGE_TYPES),
    }),
  });
  await responseJson(created, 'Create image bucket');
}

async function uploadProductImage(file) {
  const input = file && typeof file === 'object' ? file : {};
  const contentType = text(input.contentType || input.type, 'Image type', 80, true).toLowerCase();
  if (!IMAGE_TYPES.has(contentType)) throw new Error('Only JPG, PNG and WebP images are supported');
  const base64 = text(input.base64 || input.data, 'Image data', MAX_IMAGE_BYTES * 2, true)
    .replace(/^data:[^,]+,/, '');
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) throw new Error('Image file is empty');
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error('Image must be 3MB or smaller');

  await ensureImageBucket();
  const { url, key } = config();
  const filename = `${Date.now()}-${cleanFilename(input.name)}`;
  const storagePath = `products/${filename}`;
  const uploaded = await request(`${url}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: Object.assign(storageHeaders(key, contentType), { 'x-upsert': 'true' }),
    body: buffer,
  });
  await responseJson(uploaded, 'Upload product image');
  return `${url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${storagePath}`;
}

module.exports = {
  deleteProduct,
  getProductBySlug,
  listProducts,
  loadPublishedProductsByIds,
  normalizeProduct,
  saveProduct,
  uploadProductImage,
};
